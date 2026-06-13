"""统一 CLI 入口（被 Makefile 调用）。各子命令惰性导入，便于增量开发。

用法： python -m pipeline.manage <command> [options]
"""
from __future__ import annotations

import argparse


def cmd_db_init(args):
    from .common.db import init_db
    init_db()
    print("[db-init] 建表完成。")


def cmd_migrate(args):
    """把已有库迁移到带 market 维度的新 schema（幂等）。"""
    from .common.db import migrate_market
    migrate_market()


def cmd_seed(args):
    from .ingest.seed_tickers import seed_tickers
    seed_tickers(use_fallback=args.fallback)


def cmd_seed_cn_hk(args):
    from .ingest.seed_tickers import seed_cn_hk
    seed_cn_hk()


def cmd_load_sample(args):
    from .ingest.sample_loader import load_sample
    load_sample()


def cmd_ensure_sample(args):
    """若库内无帖子（如真实爬取失败），用样本兜底，保证站点不空。"""
    from sqlalchemy import func, select
    from .common.db import session_scope
    from .common.models import Post
    with session_scope() as s:
        n = s.execute(select(func.count()).select_from(Post)).scalar_one()
    if n == 0:
        print("[ensure-sample] 库内无帖子，载入样本兜底。")
        from .ingest.sample_loader import load_sample
        load_sample()
    else:
        print(f"[ensure-sample] 已有 {n} 帖，跳过。")


def cmd_ingest(args):
    from .ingest.reddit_ingest import ingest_once
    ingest_once(with_comments=not args.no_comments)


def cmd_refresh(args):
    from .ingest.refresh import refresh_recent
    refresh_recent()


def cmd_scrape(args):
    from .ingest.arctic_scrape import scrape
    markets = {m.strip() for m in args.markets.split(",")} if getattr(args, "markets", None) else None
    scrape(days=args.days, limit_per=args.limit, markets=markets)


def cmd_scrape_china(args):
    """关键词/ticker 过滤扫描综合中国社区，引入 A 股(沪深)等中国股市内容。"""
    from .ingest.arctic_scrape import scrape_china_filtered
    subs = [x.strip() for x in args.subs.split(",")] if getattr(args, "subs", None) else None
    scrape_china_filtered(days=args.days, limit_per=args.limit, subs=subs)


def cmd_scrape_comments(args):
    from .ingest.arctic_scrape import scrape_comments
    scrape_comments(top_n=args.top, per_post=args.per_post, min_comments=args.min_comments)


def cmd_crawl_authors(args):
    """作者库：爬「实力榜」Top 作者历史帖（两级漏斗：DeepSeek 粗筛 → 千问深析）。"""
    from .ingest.author_crawl import crawl_top_authors
    crawl_top_authors(limit=args.limit, per_author_cap=args.per_author, refresh_days=args.refresh_days)


def cmd_extract(args):
    from .ingest.ticker_extract import extract_for_posts
    extract_for_posts(reextract=args.reextract)


def cmd_analyze(args):
    from .analyze.item_analyze import run_analyze
    run_analyze(mock=args.mock, qwen=getattr(args, "qwen", False), limit=args.limit,
                workers=getattr(args, "workers", 8), force=getattr(args, "force", False))


def _markets_arg(args) -> list[str]:
    """--market us|cn|all（默认 all = 美股 + 中概港股各跑一次）。"""
    mk = getattr(args, "market", "all") or "all"
    return ["us", "cn"] if mk == "all" else [mk]


def cmd_rollup(args):
    from .analyze.rollups import run_rollups
    for mk in _markets_arg(args):
        run_rollups(market=mk)


def cmd_mood(args):
    from .analyze.market_mood import run_market_mood
    for mk in _markets_arg(args):
        run_market_mood(market=mk)


def cmd_trending(args):
    from .analyze.trending import run_trending
    for mk in _markets_arg(args):
        run_trending(market=mk)


def cmd_narratives(args):
    from .analyze.narratives import run_narratives
    for mk in _markets_arg(args):
        run_narratives(mock=args.mock, market=mk)


def cmd_brief(args):
    from .analyze.brief import run_brief
    run_brief(mock=args.mock)


def cmd_daily(args):
    """每日一次：分析过去 24 小时（UTC+8 08:00 跑）。--rebuild 同时重建静态站点。"""
    from .daily import run_daily
    run_daily(rebuild=args.rebuild)


def cmd_stats(args):
    from sqlalchemy import func, select
    from .common.db import session_scope
    from .common import models as M

    with session_scope() as s:
        def count(model):
            return s.execute(select(func.count()).select_from(model)).scalar_one()

        print("==== 表行数 ====")
        for model in M.ALL_TABLES:
            print(f"  {model.__tablename__:18s} {count(model):>6d}")

        print("\n==== 提及最多的 ticker（原始计数 / 加权置信） ====")
        rows = s.execute(
            select(M.Mention.ticker, func.count().label("n"), func.sum(M.Mention.confidence).label("w"))
            .group_by(M.Mention.ticker).order_by(func.count().desc()).limit(15)
        ).all()
        for tk, n, w in rows:
            print(f"  {tk:8s} n={n:<4d} weighted={float(w or 0):.2f}")

        ms = s.execute(
            select(M.TickerRollup.ticker, M.TickerRollup.mindshare_pct, M.TickerRollup.sentiment_avg)
            .where(M.TickerRollup.bucket == "window").order_by(M.TickerRollup.mindshare_pct.desc()).limit(12)
        ).all()
        if ms:
            total = 0.0
            print("\n==== Mindshare（window，应≈100%） ====")
            for tk, share, sent in ms:
                total += share or 0
                print(f"  {tk:8s} mindshare={share:5.1f}%  sentiment={sent:+.2f}")
            allrows = s.execute(select(func.sum(M.TickerRollup.mindshare_pct)).where(M.TickerRollup.bucket == "window")).scalar()
            print(f"  --- 全部 mindshare 合计 = {float(allrows or 0):.1f}% ---")

        mood = s.execute(select(M.MarketMood).where(M.MarketMood.bucket == "window").limit(1)).scalars().first()
        if mood:
            print(f"\n==== 市场情绪 ====\n  {mood.label}  mood={mood.mood_score:+.2f}  "
                  f"多{mood.bull_pct:.0f}% / 空{mood.bear_pct:.0f}% / 中{mood.neutral_pct:.0f}%")


def cmd_cloud_push(args):
    from .sync import push
    push()


def cmd_cloud_pull(args):
    from .sync import pull
    pull()


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="pipeline.manage")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("db-init").set_defaults(func=cmd_db_init)
    sub.add_parser("migrate").set_defaults(func=cmd_migrate)

    sp = sub.add_parser("seed-tickers"); sp.add_argument("--fallback", action="store_true"); sp.set_defaults(func=cmd_seed)
    sub.add_parser("seed-cn-hk").set_defaults(func=cmd_seed_cn_hk)
    sub.add_parser("load-sample").set_defaults(func=cmd_load_sample)
    sub.add_parser("ensure-sample").set_defaults(func=cmd_ensure_sample)

    sp = sub.add_parser("ingest"); sp.add_argument("--once", action="store_true"); sp.add_argument("--no-comments", action="store_true"); sp.set_defaults(func=cmd_ingest)
    sub.add_parser("refresh").set_defaults(func=cmd_refresh)
    sp = sub.add_parser("scrape"); sp.add_argument("--days", type=int, default=3); sp.add_argument("--limit", type=int, default=300); sp.add_argument("--markets", type=str, default=None, help="逗号分隔，如 us,cn；省略=全部"); sp.set_defaults(func=cmd_scrape)
    sp = sub.add_parser("scrape-china"); sp.add_argument("--days", type=int, default=30); sp.add_argument("--limit", type=int, default=300); sp.add_argument("--subs", type=str, default=None, help="逗号分隔的来源版块；省略=默认综合中国社区"); sp.set_defaults(func=cmd_scrape_china)
    sp = sub.add_parser("scrape-comments"); sp.add_argument("--top", type=int, default=400); sp.add_argument("--per-post", type=int, default=15); sp.add_argument("--min-comments", type=int, default=4); sp.set_defaults(func=cmd_scrape_comments)
    sp = sub.add_parser("crawl-authors"); sp.add_argument("--limit", type=int, default=50, help="爬实力榜 Top N 作者"); sp.add_argument("--per-author", type=int, default=20, help="每位作者最多并入作者库篇数"); sp.add_argument("--refresh-days", type=int, default=7, help="距上次爬取超过几天才重爬"); sp.set_defaults(func=cmd_crawl_authors)
    sp = sub.add_parser("extract"); sp.add_argument("--reextract", action="store_true"); sp.set_defaults(func=cmd_extract)

    sp = sub.add_parser("analyze"); sp.add_argument("--mock", action="store_true"); sp.add_argument("--qwen", action="store_true"); sp.add_argument("--force", action="store_true"); sp.add_argument("--workers", type=int, default=8); sp.add_argument("--limit", type=int, default=None); sp.set_defaults(func=cmd_analyze)
    sp = sub.add_parser("rollup"); sp.add_argument("--market", type=str, default="all", help="us|cn|all"); sp.set_defaults(func=cmd_rollup)
    sp = sub.add_parser("mood"); sp.add_argument("--market", type=str, default="all"); sp.set_defaults(func=cmd_mood)
    sp = sub.add_parser("trending"); sp.add_argument("--market", type=str, default="all"); sp.set_defaults(func=cmd_trending)
    sp = sub.add_parser("narratives"); sp.add_argument("--mock", action="store_true"); sp.add_argument("--market", type=str, default="all"); sp.set_defaults(func=cmd_narratives)
    sp = sub.add_parser("brief"); sp.add_argument("--mock", action="store_true"); sp.set_defaults(func=cmd_brief)
    sp = sub.add_parser("daily"); sp.add_argument("--rebuild", action="store_true"); sp.set_defaults(func=cmd_daily)
    sub.add_parser("stats").set_defaults(func=cmd_stats)
    sub.add_parser("cloud-push").set_defaults(func=cmd_cloud_push)
    sub.add_parser("cloud-pull").set_defaults(func=cmd_cloud_pull)
    return p


def main():
    args = build_parser().parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
