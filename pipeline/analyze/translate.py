"""把帖子/AI 摘要/评论翻译成简体中文，写入 `*_zh` 列（增量、幂等）。
站点为「每日一次分析过去 24h」的批处理模式，故译文可预先生成、按需(看广告)展示。

用法（需 .env 里有 ANTHROPIC_API_KEY）：
    python -m pipeline.analyze.translate            # 翻译所有缺失译文的内容
    python -m pipeline.analyze.translate --limit 200
    python -m pipeline.analyze.translate --only posts,analysis,comments

专有名词（ticker 如 NVDA、人名、$现金标、URL、Markdown 结构）保持原样，仅翻译自然语言。
"""
from __future__ import annotations

import argparse
import json
import os
import sqlite3
from typing import Iterable

from ..common.config import settings
from ..common.qwen import messages_json


def _db_path() -> str:
    url = getattr(settings, "database_url", "") or ""
    if url.startswith("sqlite:///"):
        return url[len("sqlite:///"):]
    return os.environ.get("SQLITE_PATH", "data/dev.db")


def _model() -> str:
    # 复用配置里的轻量模型；没有就用 Haiku 默认值。
    return (
        getattr(settings, "haiku_model", None)
        or getattr(settings, "model_haiku", None)
        or os.environ.get("TRANSLATE_MODEL", "claude-haiku-4-5")
    )


SYSTEM = (
    "你是专业的金融与 Reddit 社区内容译者。把英文逐条翻译成自然、地道的简体中文。"
    "要求：① 保留股票代码(如 NVDA、$TSLA)、人名、公司专有名词、URL、Markdown 结构(**粗体**、[链接](url)、列表符号)原样；"
    "② 金额/百分比/倍数照常翻译为中文表达；③ 保留原意与语气(含调侃/反讽)；④ 不要添加解释或多余内容。"
    "只输出 JSON：{\"items\":[{\"i\":<编号>,\"z\":\"<中文>\"}]}，逐条对应输入编号。"
)


def translate_texts(texts: list[str], model: str, max_tokens: int = 4000) -> list[str]:
    """把一批英文翻成中文，返回等长列表（失败的保持空串）。"""
    if not texts:
        return []
    payload = {"items": [{"i": i, "t": t} for i, t in enumerate(texts)]}
    user = "翻译下面 JSON 中 items 的每个 t 为简体中文：\n" + json.dumps(payload, ensure_ascii=False)
    # 普通翻译 → 不开思考模式（更快更省）。
    data = messages_json(SYSTEM, user, max_tokens=max_tokens, enable_thinking=False) or {}
    res = [""] * len(texts)
    for it in data.get("items", []):
        try:
            idx = int(it["i"])
            if 0 <= idx < len(res):
                res[idx] = (it.get("z") or "").strip()
        except (KeyError, ValueError, TypeError):
            continue
    return res


def _chunks(seq: list, n: int) -> Iterable[list]:
    for i in range(0, len(seq), n):
        yield seq[i : i + n]


from concurrent.futures import ThreadPoolExecutor, as_completed  # noqa: E402


WORKERS = 10


def translate_posts(c: sqlite3.Connection, model: str, limit: int | None):
    # 标题（短）：批量、并发
    titles = c.execute(
        "SELECT id, title FROM posts WHERE title<>'' AND (title_zh IS NULL OR title_zh='') "
        + (f"LIMIT {int(limit)}" if limit else "")
    ).fetchall()
    tbatches = list(_chunks(titles, 24))

    def _title_batch(batch):
        try:
            zhs = translate_texts([t for _, t in batch], model, max_tokens=3000)
        except Exception:  # noqa: BLE001
            zhs = [""] * len(batch)
        return [(pid, zh) for (pid, _), zh in zip(batch, zhs)]

    if tbatches:
        with ThreadPoolExecutor(WORKERS) as ex:
            for i, fut in enumerate(as_completed([ex.submit(_title_batch, b) for b in tbatches]), 1):
                for pid, zh in fut.result():
                    if zh:
                        c.execute("UPDATE posts SET title_zh=? WHERE id=?", (zh, pid))
                if i % 10 == 0 or i == len(tbatches):
                    c.commit(); print(f"posts.title {i}/{len(tbatches)} 批", flush=True)
        c.commit()

    # 正文（长）：逐条、并发（API 在线程里，写库在主线程）
    rows = c.execute(
        "SELECT id, selftext FROM posts WHERE selftext<>'' AND (selftext_zh IS NULL OR selftext_zh='') "
        + (f"LIMIT {int(limit)}" if limit else "")
    ).fetchall()

    def _one(row):
        pid, selftext = row
        try:
            zh = translate_texts([selftext], model, max_tokens=6000)
            return pid, (zh[0] if zh else "")
        except Exception:  # noqa: BLE001
            return pid, ""

    if rows:
        with ThreadPoolExecutor(WORKERS) as ex:
            for i, fut in enumerate(as_completed([ex.submit(_one, r) for r in rows]), 1):
                pid, zh = fut.result()
                if zh:
                    c.execute("UPDATE posts SET selftext_zh=? WHERE id=?", (zh, pid))
                if i % 20 == 0 or i == len(rows):
                    c.commit(); print(f"posts.selftext {i}/{len(rows)}", flush=True)
        c.commit()
    print(f"posts: 标题 {len(titles)} + 正文 {len(rows)} 处理完", flush=True)


def translate_analysis(c: sqlite3.Connection, model: str, limit: int | None):
    rows = c.execute(
        "SELECT item_id, tldr, bull_points, bear_points FROM item_analysis "
        "WHERE item_type='post' AND tldr<>'' AND tldr_zh IS NULL "
        + (f"LIMIT {int(limit)}" if limit else "")
    ).fetchall()
    for item_id, tldr, bull_json, bear_json in rows:
        bull = json.loads(bull_json or "[]")
        bear = json.loads(bear_json or "[]")
        units = [tldr] + bull + bear
        zhs = translate_texts(units, model, max_tokens=4000)
        tldr_zh = zhs[0] if zhs else ""
        bull_zh = zhs[1 : 1 + len(bull)]
        bear_zh = zhs[1 + len(bull) : 1 + len(bull) + len(bear)]
        c.execute(
            "UPDATE item_analysis SET tldr_zh=?, bull_points_zh=?, bear_points_zh=? WHERE item_id=? AND item_type='post'",
            (tldr_zh, json.dumps(bull_zh, ensure_ascii=False), json.dumps(bear_zh, ensure_ascii=False), item_id),
        )
        c.commit()
    print(f"analysis: {len(rows)} 条处理")


def translate_comments(c: sqlite3.Connection, model: str, limit: int | None):
    rows = c.execute(
        "SELECT id, body FROM comments WHERE body<>'' AND (body_zh IS NULL OR body_zh='') "
        + (f"LIMIT {int(limit)}" if limit else "")
    ).fetchall()
    batches = list(_chunks(rows, 12))

    def _batch(batch):
        try:
            zhs = translate_texts([b for _, b in batch], model, max_tokens=4000)
        except Exception:  # noqa: BLE001
            zhs = [""] * len(batch)
        return [(cid, zh) for (cid, _), zh in zip(batch, zhs)]

    done = 0
    if batches:
        with ThreadPoolExecutor(WORKERS) as ex:
            for i, fut in enumerate(as_completed([ex.submit(_batch, b) for b in batches]), 1):
                for cid, zh in fut.result():
                    if zh:
                        c.execute("UPDATE comments SET body_zh=? WHERE id=?", (zh, cid)); done += 1
                if i % 10 == 0 or i == len(batches):
                    c.commit(); print(f"comments {i}/{len(batches)} 批 · {done} 条", flush=True)
        c.commit()
    print(f"comments: {len(rows)} 条处理（成功 {done}）", flush=True)


def run(only: set[str], limit: int | None):
    c = sqlite3.connect(_db_path())
    model = _model()
    if "posts" in only:
        translate_posts(c, model, limit)
    if "analysis" in only:
        translate_analysis(c, model, limit)
    if "comments" in only:
        translate_comments(c, model, limit)
    c.close()
    print("翻译完成。")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="posts,analysis,comments", help="逗号分隔：posts,analysis,comments")
    ap.add_argument("--limit", type=int, default=None)
    args = ap.parse_args()
    run({s.strip() for s in args.only.split(",") if s.strip()}, args.limit)


if __name__ == "__main__":
    main()
