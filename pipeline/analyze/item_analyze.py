"""逐帖 AI 打标：情绪 / 多空 / 质量 / 主题 / TL;DR / 多空论点 / 相关 ticker。

两种模式：
  - 真实：Claude Haiku（JSON 输出 + prompt caching；可选 Batch）。
  - --mock：确定性关键词启发式，无 API key 也能跑通全流程（用于离线 demo / 验证）。
"""
from __future__ import annotations

import datetime as dt
import re

import yaml
from sqlalchemy import select

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


# ----------------------------- 主流程 -----------------------------
def _sub_weights() -> dict[str, float]:
    with open(PKG_DATA_DIR / "subreddits.yml", "r", encoding="utf-8") as f:
        return {e["name"].lower(): float(e.get("weight", 1.0)) for e in yaml.safe_load(f)["subreddits"]}


def run_analyze(mock: bool = False, limit: int | None = None, only_new: bool = True) -> int:
    weights = _sub_weights()
    n = 0
    with session_scope() as s:
        done = set()
        if only_new:
            done = {iid for (iid,) in s.execute(
                select(ItemAnalysis.item_id).where(ItemAnalysis.item_type == "post")).all()}

        stmt = select(Post).order_by(Post.created_utc.desc())
        if limit:
            stmt = stmt.limit(limit)
        posts = s.execute(stmt).scalars().all()

        # 预取每帖的 ticker（按置信降序）
        ment: dict[str, list[dict]] = {}
        for m in s.execute(select(Mention).where(Mention.item_type == "post")).scalars().all():
            ment.setdefault(m.item_id, []).append({"ticker": m.ticker, "relevance": round(m.confidence, 2)})
        for v in ment.values():
            v.sort(key=lambda x: -x["relevance"])

        for p in posts:
            if only_new and p.id in done:
                continue
            tickers = ment.get(p.id, [])
            res = (analyze_mock(p, tickers, weights.get(p.subreddit_id, 1.0))
                   if mock else analyze_claude(p, tickers))
            s.merge(ItemAnalysis(
                item_id=p.id, item_type="post",
                sentiment_label=res["sentiment_label"], sentiment_score=res["sentiment_score"],
                stance=res["stance"], quality_score=res["quality_score"], themes=res["themes"],
                tldr=res["tldr"], bull_points=res["bull_points"], bear_points=res["bear_points"],
                tickers=res["tickers"], model=res["model"], analyzed_at=dt.datetime.utcnow(),
            ))
            n += 1
    print(f"[analyze] 打标 {n} 帖（mock={mock}）。")
    return n


if __name__ == "__main__":
    import sys
    run_analyze(mock="--mock" in sys.argv)
