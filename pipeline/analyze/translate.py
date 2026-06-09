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
from ..common.claude import messages_text, extract_json


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
    out = messages_text(SYSTEM, user, model, max_tokens=max_tokens, cache=True)
    data = extract_json(out) or {}
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


def translate_posts(c: sqlite3.Connection, model: str, limit: int | None):
    rows = c.execute(
        "SELECT id, title, selftext FROM posts "
        "WHERE (title_zh IS NULL OR (selftext<>'' AND selftext_zh IS NULL)) "
        + (f"LIMIT {int(limit)}" if limit else "")
    ).fetchall()
    # 标题：短，批量
    titles = [(r[0], r[1]) for r in rows if r[1]]
    for batch in _chunks(titles, 18):
        zhs = translate_texts([t for _, t in batch], model, max_tokens=2500)
        for (pid, _), zh in zip(batch, zhs):
            if zh:
                c.execute("UPDATE posts SET title_zh=? WHERE id=?", (zh, pid))
        c.commit()
    # 正文：可能很长，逐条
    for pid, _title, selftext in rows:
        if selftext:
            zh = translate_texts([selftext], model, max_tokens=6000)[0]
            if zh:
                c.execute("UPDATE posts SET selftext_zh=? WHERE id=?", (zh, pid))
                c.commit()
    print(f"posts: {len(rows)} 条处理")


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
        "SELECT id, body FROM comments WHERE body<>'' AND body_zh IS NULL "
        + (f"LIMIT {int(limit)}" if limit else "")
    ).fetchall()
    for batch in _chunks(rows, 12):
        zhs = translate_texts([b for _, b in batch], model, max_tokens=4000)
        for (cid, _), zh in zip(batch, zhs):
            if zh:
                c.execute("UPDATE comments SET body_zh=? WHERE id=?", (zh, cid))
        c.commit()
    print(f"comments: {len(rows)} 条处理")


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
