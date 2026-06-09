"""SQLAlchemy 数据模型 = schema 单一真源（SQLite 开发 / Postgres 生产通用）。

JSON 字段统一用 JSONText（Text 存 JSON 字符串），保证跨方言一致，
也便于 Web 侧 Prisma 以 String 读取后再解析。
"""
from __future__ import annotations

import datetime as dt
import json
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import TypeDecorator


class Base(DeclarativeBase):
    pass


class JSONText(TypeDecorator):
    """可移植 JSON 列：以 Text 存储 JSON 字符串。"""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return json.dumps(value, ensure_ascii=False)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        try:
            return json.loads(value)
        except (ValueError, TypeError):
            return None


def utcnow() -> dt.datetime:
    return dt.datetime.utcnow()


# ----------------------------- 原始数据 -----------------------------
class Subreddit(Base):
    __tablename__ = "subreddits"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # 小写名
    display_name: Mapped[str] = mapped_column(String(128), default="")
    subscribers: Mapped[int] = mapped_column(Integer, default=0)
    fetched_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)


class Author(Base):
    __tablename__ = "authors"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)  # 用户名
    created_utc: Mapped[Optional[dt.datetime]] = mapped_column(DateTime, nullable=True)
    comment_karma: Mapped[int] = mapped_column(Integer, default=0)
    link_karma: Mapped[int] = mapped_column(Integer, default=0)
    first_seen: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    last_seen: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    post_count: Mapped[int] = mapped_column(Integer, default=0)
    influence_score: Mapped[float] = mapped_column(Float, default=0.0)


class Post(Base):
    __tablename__ = "posts"
    id: Mapped[str] = mapped_column(String(16), primary_key=True)  # reddit base36 id
    subreddit_id: Mapped[str] = mapped_column(String(64), ForeignKey("subreddits.id"), index=True)
    author_id: Mapped[Optional[str]] = mapped_column(String(80), ForeignKey("authors.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(Text, default="")
    selftext: Mapped[str] = mapped_column(Text, default="")
    url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    permalink: Mapped[str] = mapped_column(Text, default="")
    flair: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    is_self: Mapped[bool] = mapped_column(Boolean, default=True)
    created_utc: Mapped[dt.datetime] = mapped_column(DateTime, index=True)
    score: Mapped[int] = mapped_column(Integer, default=0)
    upvote_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    num_comments: Mapped[int] = mapped_column(Integer, default=0)
    total_awards: Mapped[int] = mapped_column(Integer, default=0)
    fetched_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    last_refreshed_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)


class Comment(Base):
    __tablename__ = "comments"
    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    post_id: Mapped[str] = mapped_column(String(16), ForeignKey("posts.id"), index=True)
    author_id: Mapped[Optional[str]] = mapped_column(String(80), ForeignKey("authors.id"), nullable=True)
    body: Mapped[str] = mapped_column(Text, default="")
    score: Mapped[int] = mapped_column(Integer, default=0)
    created_utc: Mapped[dt.datetime] = mapped_column(DateTime, index=True)
    parent_id: Mapped[Optional[str]] = mapped_column(String(24), nullable=True)
    fetched_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)


# ----------------------------- 字典 / 抽取 -----------------------------
class TickerMeta(Base):
    __tablename__ = "ticker_meta"
    ticker: Mapped[str] = mapped_column(String(8), primary_key=True)  # 大写
    company_name: Mapped[str] = mapped_column(String(256), default="")
    cik: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    exchange: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    sector: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    aliases: Mapped[Optional[list]] = mapped_column(JSONText, nullable=True)


class Mention(Base):
    __tablename__ = "mentions"
    # 复合主键 = 一条 item 对一个 ticker 唯一；让 merge() 能正确幂等 upsert。
    ticker: Mapped[str] = mapped_column(String(8), ForeignKey("ticker_meta.ticker"), primary_key=True, index=True)
    item_id: Mapped[str] = mapped_column(String(16), primary_key=True, index=True)
    item_type: Mapped[str] = mapped_column(String(8), primary_key=True)  # post | comment
    subreddit_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    author_id: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    context_snippet: Mapped[str] = mapped_column(Text, default="")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    method: Mapped[str] = mapped_column(String(16), default="")  # cashtag|dict|company|context
    created_utc: Mapped[dt.datetime] = mapped_column(DateTime, index=True)
    fetched_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)


# ----------------------------- AI 分析 -----------------------------
class ItemAnalysis(Base):
    __tablename__ = "item_analysis"
    item_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    item_type: Mapped[str] = mapped_column(String(8), primary_key=True)  # post|comment
    sentiment_label: Mapped[str] = mapped_column(String(16), default="neutral")
    sentiment_score: Mapped[float] = mapped_column(Float, default=0.0)  # -1..1
    stance: Mapped[str] = mapped_column(String(16), default="neutral")  # bull|bear|neutral
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)  # 0..1 干货 vs 噪音
    themes: Mapped[Optional[list]] = mapped_column(JSONText, nullable=True)
    tldr: Mapped[str] = mapped_column(Text, default="")
    bull_points: Mapped[Optional[list]] = mapped_column(JSONText, nullable=True)
    bear_points: Mapped[Optional[list]] = mapped_column(JSONText, nullable=True)
    tickers: Mapped[Optional[list]] = mapped_column(JSONText, nullable=True)  # [{ticker,relevance}]
    model: Mapped[str] = mapped_column(String(48), default="")
    analyzed_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)


# ----------------------------- 聚合 / rollup -----------------------------
class TickerRollup(Base):
    __tablename__ = "ticker_rollup"
    __table_args__ = (
        UniqueConstraint("ticker", "bucket", "bucket_ts", name="uq_ticker_rollup"),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(8), index=True)
    bucket: Mapped[str] = mapped_column(String(8))  # hour | day
    bucket_ts: Mapped[dt.datetime] = mapped_column(DateTime, index=True)
    mention_count: Mapped[int] = mapped_column(Integer, default=0)
    weighted_mentions: Mapped[float] = mapped_column(Float, default=0.0)
    engagement_sum: Mapped[int] = mapped_column(Integer, default=0)
    unique_authors: Mapped[int] = mapped_column(Integer, default=0)
    post_count: Mapped[int] = mapped_column(Integer, default=0)
    mindshare_pct: Mapped[float] = mapped_column(Float, default=0.0)
    sentiment_avg: Mapped[float] = mapped_column(Float, default=0.0)
    bull_count: Mapped[int] = mapped_column(Integer, default=0)
    bear_count: Mapped[int] = mapped_column(Integer, default=0)
    neutral_count: Mapped[int] = mapped_column(Integer, default=0)


class MarketMood(Base):
    __tablename__ = "market_mood"
    __table_args__ = (UniqueConstraint("bucket", "bucket_ts", name="uq_market_mood"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    bucket: Mapped[str] = mapped_column(String(8))  # hour | day
    bucket_ts: Mapped[dt.datetime] = mapped_column(DateTime, index=True)
    mood_score: Mapped[float] = mapped_column(Float, default=0.0)  # -1..1
    bull_pct: Mapped[float] = mapped_column(Float, default=0.0)
    bear_pct: Mapped[float] = mapped_column(Float, default=0.0)
    neutral_pct: Mapped[float] = mapped_column(Float, default=0.0)
    total_mentions: Mapped[int] = mapped_column(Integer, default=0)
    total_posts: Mapped[int] = mapped_column(Integer, default=0)
    label: Mapped[str] = mapped_column(String(24), default="")  # 极度恐惧..极度贪婪


class Trending(Base):
    __tablename__ = "trending"
    __table_args__ = (UniqueConstraint("ticker", "window", "as_of", name="uq_trending"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(8), index=True)
    window: Mapped[str] = mapped_column(String(8))  # 24h
    as_of: Mapped[dt.datetime] = mapped_column(DateTime, index=True)
    mention_count: Mapped[int] = mapped_column(Integer, default=0)
    baseline_mean: Mapped[float] = mapped_column(Float, default=0.0)
    baseline_std: Mapped[float] = mapped_column(Float, default=0.0)
    zscore: Mapped[float] = mapped_column(Float, default=0.0)
    sentiment_avg: Mapped[float] = mapped_column(Float, default=0.0)
    sentiment_delta: Mapped[float] = mapped_column(Float, default=0.0)
    is_spike: Mapped[bool] = mapped_column(Boolean, default=False)
    rank: Mapped[int] = mapped_column(Integer, default=0)


# ----------------------------- 叙事 / 简报 -----------------------------
class Narrative(Base):
    __tablename__ = "narratives"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(96), index=True)
    name: Mapped[str] = mapped_column(String(160), default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    period_start: Mapped[dt.datetime] = mapped_column(DateTime)
    period_end: Mapped[dt.datetime] = mapped_column(DateTime)
    post_count: Mapped[int] = mapped_column(Integer, default=0)
    ticker_count: Mapped[int] = mapped_column(Integer, default=0)
    heat: Mapped[float] = mapped_column(Float, default=0.0)
    model: Mapped[str] = mapped_column(String(48), default="")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow, index=True)


class NarrativeTicker(Base):
    __tablename__ = "narrative_tickers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    narrative_id: Mapped[int] = mapped_column(Integer, ForeignKey("narratives.id"), index=True)
    ticker: Mapped[str] = mapped_column(String(8), index=True)
    weight: Mapped[float] = mapped_column(Float, default=0.0)


class NarrativePost(Base):
    __tablename__ = "narrative_posts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    narrative_id: Mapped[int] = mapped_column(Integer, ForeignKey("narratives.id"), index=True)
    post_id: Mapped[str] = mapped_column(String(16), index=True)


class DailyBrief(Base):
    __tablename__ = "daily_briefs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    brief_date: Mapped[str] = mapped_column(String(10), unique=True, index=True)  # YYYY-MM-DD
    title: Mapped[str] = mapped_column(String(200), default="")
    markdown: Mapped[str] = mapped_column(Text, default="")
    highlights: Mapped[Optional[list]] = mapped_column(JSONText, nullable=True)
    model: Mapped[str] = mapped_column(String(48), default="")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)


ALL_TABLES = [
    Subreddit, Author, Post, Comment, TickerMeta, Mention, ItemAnalysis,
    TickerRollup, MarketMood, Trending, Narrative, NarrativeTicker,
    NarrativePost, DailyBrief,
]
