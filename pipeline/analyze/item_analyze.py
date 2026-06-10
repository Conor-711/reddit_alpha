"""逐帖 AI 打标：情绪 / 多空 / 质量 / 主题 / TL;DR / 多空论点 / 相关 ticker。

两种模式：
  - 真实：Claude Haiku（JSON 输出 + prompt caching；可选 Batch）。
  - --mock：确定性关键词启发式，无 API key 也能跑通全流程（用于离线 demo / 验证）。
"""
from __future__ import annotations

import datetime as dt
import re

import yaml
from sqlalchemy import select, update

from ..common.config import PKG_DATA_DIR, settings
from ..common.db import session_scope
from ..common.models import ItemAnalysis, Mention, Post

# ----------------------------- 关键词词表（mock 用） -----------------------------
BULL = ["bullish", "moon", "rip", "ripped", "beat", "beats", "growth", "long", "buy",
        "gain", "undervalued", "cheap", "squeeze", "printing", "strong", "upside",
        "rally", "bid", "outperform", "compounding", "quality", "secular", "discount"]
BEAR = ["bearish", "miss", "missed", "overvalued", "crash", "dump", "risk", "burning",
        "red flag", "derating", "decline", "declining", "melting", "uninvestable",
        "short", "bubble", "correct", "correction", "pressure", "warning", "rolling over",
        "cracking", "trouble", "loss", "cautious"]

THEME_MAP = {
    "AI 资本开支": ["ai capex", "datacenter", "data center", "hyperscaler", "accelerator", "capex", "gpu", "ai networking", "custom silicon"],
    "GLP-1 减肥药": ["glp-1", "glp1", "weight loss", "wegovy", "ozempic", "obesity"],
    "降息与宏观": ["rate cut", "rate cuts", "cpi", "inflation", "fed", "soft landing", "macro", "small caps", "small cap"],
    "AI 电力 / 核能": ["nuclear", "electricity", "power demand", "small modular", "reactor", "ai power", "ai electricity"],
    "比特币代理": ["bitcoin", "btc", "crypto", "sats", "etf inflows", "spot bitcoin"],
    "逼空 / Meme": ["short interest", "squeeze", "meme", "apes", "hodl", "unusual volume", "lotto"],
    "财报季": ["earnings", "deliveries", "guidance", "earnings call", "bookings", "print"],
    "半导体": ["semiconductor", "semi", "chip", "foundry", "mi300", "supply chain"],
    "红利收息": ["dividend", "income", "premium", "covered call", "wheel", "yield"],
    "电动车": ["robotaxi", "self driving", "electric vehicle", "rivian", "lucid", "ev startup", "ev names"],
    "价值 / 回购": ["buyback", "free cash flow", "value", "discount", "cash flow", "capital returns"],
}


def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+|\n+", text or "")
    return [p.strip() for p in parts if len(p.strip()) > 12]


def _count(words: list[str], low: str) -> int:
    return sum(low.count(w) for w in words)


def analyze_mock(post: Post, tickers: list[dict], sub_weight: float) -> dict:
    text = f"{post.title}\n{post.selftext or ''}"
    low = text.lower()

    nb, nr = _count(BULL, low), _count(BEAR, low)
    if nb + nr == 0:
        score, stance, label = 0.0, "neutral", "neutral"
    else:
        score = round((nb - nr) / (nb + nr), 2)
        stance = "bull" if score > 0.15 else "bear" if score < -0.15 else "neutral"
        label = "bullish" if score > 0.15 else "bearish" if score < -0.15 else "neutral"

    q = 0.35
    if (post.flair or "") in ("DD", "Analysis"):
        q += 0.25
    if len(post.selftext or "") > 250:
        q += 0.15
    q += 0.20 * (sub_weight - 1.0) if sub_weight > 1.0 else 0.0
    if (post.upvote_ratio or 0) > 0.85:
        q += 0.10
    quality = round(min(1.0, max(0.05, q)), 2)

    themes = [name for name, kws in THEME_MAP.items() if any(k in low for k in kws)]

    sents = _split_sentences(post.selftext or post.title)
    bull_pts = [s for s in sents if any(w in s.lower() for w in BULL)][:2]
    bear_pts = [s for s in sents if any(w in s.lower() for w in BEAR)][:2]

    tldr = (sents[0] if sents else post.title)[:160]

    return {
        "sentiment_label": label, "sentiment_score": score, "stance": stance,
        "quality_score": quality, "themes": themes[:4], "tldr": tldr,
        "bull_points": bull_pts, "bear_points": bear_pts,
        "tickers": [{"ticker": t["ticker"], "relevance": t["relevance"]} for t in tickers],
        "model": "mock-heuristic-0.1",
    }


# ----------------------------- 真实 Claude -----------------------------
SYSTEM = """你是美股社媒舆情分析师，分析 Reddit 财经帖子。只输出一个 JSON 对象，字段：
- sentiment_label: "bullish" | "bearish" | "neutral"
- sentiment_score: -1.0~1.0 的数字
- stance: "bull" | "bear" | "neutral"
- quality_score: 0~1，判断"有信息量的 DD/分析"还是"情绪噪音/meme"
- themes: 中文主题标签数组（如 "AI 资本开支"、"降息与宏观"、"GLP-1 减肥药"、"逼空/Meme"、"财报季"），0~4 个
- tldr: 一句话中文摘要（<=60 字）
- bull_points: 看多论点数组（原文要点，最多 3 条，可空）
- bear_points: 看空论点数组（最多 3 条，可空）
- tickers: [{"ticker": 大写代码, "relevance": 0~1}]，只保留与本帖真正相关的
注意 WSB 黑话与反讽：moon/tendies/printing=看多，bag/rope/guh/drilling=看空，YOLO=高风险投机。
只输出 JSON，不要多余文字。"""


def build_user(post: Post, tickers: list[dict]) -> str:
    cand = ", ".join(t["ticker"] for t in tickers) or "（未抽到）"
    return (f"板块: r/{post.subreddit_id}\nflair: {post.flair or '-'}\n"
            f"候选 tickers: {cand}\n标题: {post.title}\n正文: {(post.selftext or '')[:2000]}")


def analyze_claude(post: Post, tickers: list[dict]) -> dict:
    from ..common.claude import messages_json

    data, _raw = messages_json(SYSTEM, build_user(post, tickers), settings.model_tag, max_tokens=700)
    data = data or {}
    return {
        "sentiment_label": data.get("sentiment_label", "neutral"),
        "sentiment_score": float(data.get("sentiment_score", 0) or 0),
        "stance": data.get("stance", "neutral"),
        "quality_score": float(data.get("quality_score", 0.4) or 0.4),
        "themes": data.get("themes") or [],
        "tldr": data.get("tldr", "")[:200],
        "bull_points": data.get("bull_points") or [],
        "bear_points": data.get("bear_points") or [],
        "tickers": data.get("tickers") or [{"ticker": t["ticker"], "relevance": t["relevance"]} for t in tickers],
        "model": settings.model_tag,
    }


# ----------------------------- 真实 通义千问（双语：英文 + 中文） -----------------------------
SYSTEM_QWEN = """你是专业的美股社媒舆情分析师。仔细阅读一条 Reddit 财经帖子，给出严谨的结构化分析。只输出一个 JSON 对象（不要任何额外文字），字段如下，全部必填：
- sentiment_label: "bullish" | "bearish" | "neutral"
- sentiment_score: -1.0~1.0 的数字（作者整体情绪方向与强度）
- stance: "bull" | "bear" | "neutral"
- quality_score: 0~1（有数据/逻辑的深度 DD = 高；情绪宣泄 / meme / 段子 / 钓鱼 = 低）
- themes: 从下列固定列表里挑 0~4 个最贴切的标签，原样照抄："AI 资本开支","GLP-1 减肥药","降息与宏观","AI 电力 / 核能","比特币代理","逼空 / Meme","财报季","半导体","红利收息","电动车","价值 / 回购"
- title_zh: 帖子标题的简体中文翻译（通顺自然，保留 ticker/$代码/专有名词）
- tldr: 一句英文摘要，<=140 字符，概括帖子主旨
- tldr_zh: tldr 的简体中文
- bull_points: 英文字符串数组，最多 3 条。**用你自己的话提炼真正站得住脚的看多论据**（不是摘抄原句；若帖子没有看多理由就给 []）
- bear_points: 英文字符串数组，最多 3 条，看空论据（同上）
- bull_points_zh: 与 bull_points 一一对应的简体中文（长度必须相同）
- bear_points_zh: 与 bear_points 一一对应的简体中文（长度必须相同）
- tickers: [{"ticker": 大写股票代码, "relevance": 0~1}]，仅保留与本帖真正相关的标的
分析要点：① 读懂 WSB 黑话与反讽——moon/tendies/printing/rip=看多；bag/rope/guh/drilling=看空；用调侃语气说"某股要暴涨/IPO 稳赚/人人都在买"往往是在反讽=看空。② bull/bear 必须是真实、可成立的投资逻辑，玩笑或纯情绪帖应给低 quality_score 且对应方向可为空数组。③ 严格只输出 JSON。"""


def analyze_qwen(post: Post, tickers: list[dict]) -> dict:
    from ..common.qwen import messages_json

    # 投资分析：开启思考模式（更强推理）。
    data = messages_json(SYSTEM_QWEN, build_user(post, tickers), max_tokens=2200, enable_thinking=True) or {}

    def _arr(k: str) -> list:
        v = data.get(k)
        return [str(x) for x in v] if isinstance(v, list) else []

    return {
        "title_zh": str(data.get("title_zh", "") or "")[:400],
        "sentiment_label": data.get("sentiment_label", "neutral") or "neutral",
        "sentiment_score": float(data.get("sentiment_score", 0) or 0),
        "stance": data.get("stance", "neutral") or "neutral",
        "quality_score": float(data.get("quality_score", 0.4) or 0.4),
        "themes": _arr("themes")[:4],
        "tldr": str(data.get("tldr", "") or "")[:200],
        "tldr_zh": str(data.get("tldr_zh", "") or "")[:200],
        "bull_points": _arr("bull_points")[:3],
        "bear_points": _arr("bear_points")[:3],
        "bull_points_zh": _arr("bull_points_zh")[:3],
        "bear_points_zh": _arr("bear_points_zh")[:3],
        "tickers": data.get("tickers") or [{"ticker": t["ticker"], "relevance": t["relevance"]} for t in tickers],
        "model": "qwen:" + settings.qwen_model,
    }


# ----------------------------- 主流程 -----------------------------
def _sub_weights() -> dict[str, float]:
    with open(PKG_DATA_DIR / "subreddits.yml", "r", encoding="utf-8") as f:
        return {e["name"].lower(): float(e.get("weight", 1.0)) for e in yaml.safe_load(f)["subreddits"]}


def run_analyze(mock: bool = False, qwen: bool = False, limit: int | None = None,
                only_new: bool = True, workers: int = 8, force: bool = False) -> int:
    weights = _sub_weights()

    # 1) 一次性读出待分析帖 + 候选 ticker，detach 后并发分析（sqlite 写仍串行）。
    with session_scope() as s:
        if force:
            done = set()  # 强制全量重跑（如开启思考模式重新分析）
        elif qwen:
            # qwen 模式可断点续跑：跳过已用 qwen 分析过的帖（其余 mock 结果会被覆盖）。
            done = {iid for (iid,) in s.execute(select(ItemAnalysis.item_id).where(
                ItemAnalysis.item_type == "post", ItemAnalysis.model.like("qwen%"))).all()}
        elif only_new:
            done = {iid for (iid,) in s.execute(select(ItemAnalysis.item_id).where(
                ItemAnalysis.item_type == "post")).all()}
        else:
            done = set()

        stmt = select(Post).order_by(Post.created_utc.desc())
        if limit:
            stmt = stmt.limit(limit)
        posts = s.execute(stmt).scalars().all()

        ment: dict[str, list[dict]] = {}
        for m in s.execute(select(Mention).where(Mention.item_type == "post")).scalars().all():
            ment.setdefault(m.item_id, []).append({"ticker": m.ticker, "relevance": round(m.confidence, 2)})
        for v in ment.values():
            v.sort(key=lambda x: -x["relevance"])

        work = []
        for p in posts:
            if p.id in done:
                continue
            work.append((p, ment.get(p.id, [])))
            s.expunge(p)  # detach：线程内可读取已加载列

    total = len(work)
    print(f"[analyze] 待分析 {total} 帖（mock={mock} qwen={qwen} workers={workers}）。", flush=True)

    def one(item):
        p, tickers = item
        try:
            if mock:
                return p, analyze_mock(p, tickers, weights.get(p.subreddit_id, 1.0))
            if qwen:
                return p, analyze_qwen(p, tickers)
            return p, analyze_claude(p, tickers)
        except Exception as e:  # noqa: BLE001
            r = analyze_mock(p, tickers, weights.get(p.subreddit_id, 1.0))
            r["model"] = "qwen-fallback-mock"
            print(f"[analyze] {p.id} 失败回退 mock：{e}", flush=True)
            return p, r

    def _write(batch):
        with session_scope() as s:
            for p, res in batch:
                s.merge(ItemAnalysis(
                    item_id=p.id, item_type="post",
                    sentiment_label=res["sentiment_label"], sentiment_score=res["sentiment_score"],
                    stance=res["stance"], quality_score=res["quality_score"], themes=res["themes"],
                    tldr=res["tldr"], tldr_zh=res.get("tldr_zh", ""),
                    bull_points=res["bull_points"], bear_points=res["bear_points"],
                    bull_points_zh=res.get("bull_points_zh") or [], bear_points_zh=res.get("bear_points_zh") or [],
                    tickers=res["tickers"], model=res["model"], analyzed_at=dt.datetime.utcnow(),
                ))
                if res.get("title_zh"):
                    s.execute(update(Post).where(Post.id == p.id).values(title_zh=res["title_zh"]))

    n = 0
    buf: list = []
    if qwen and workers > 1 and total:
        from concurrent.futures import ThreadPoolExecutor, as_completed
        with ThreadPoolExecutor(max_workers=workers) as ex:
            futs = [ex.submit(one, w) for w in work]
            for i, fut in enumerate(as_completed(futs), 1):
                buf.append(fut.result()); n += 1
                if len(buf) >= 40:
                    _write(buf); buf = []
                if i % 25 == 0 or i == total:
                    print(f"[analyze] {i}/{total}", flush=True)
    else:
        for w in work:
            buf.append(one(w)); n += 1
            if len(buf) >= 40:
                _write(buf); buf = []
    if buf:
        _write(buf)
    print(f"[analyze] 完成 {n} 帖（mock={mock} qwen={qwen}）。", flush=True)
    return n


if __name__ == "__main__":
    import sys
    run_analyze(mock="--mock" in sys.argv, qwen="--qwen" in sys.argv)
