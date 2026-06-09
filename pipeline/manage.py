"""统一 CLI 入口（被 Makefile 调用）。各子命令惰性导入，便于增量开发。

用法： python -m pipeline.manage <command> [options]
"""
from __future__ import annotations

import argparse


def cmd_db_init(args):
    from .common.db import init_db
    init_db()
    print("[db-init] 建表完成。")


def cmd_seed(args):
    from .ingest.seed_tickers import seed_tickers
    seed_tickers(use_fallback=args.fallback)


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
    scrape(days=args.days, limit_per=args.limit)


def cmd_extract(args):
    from .ingest.ticker_extract import extract_for_posts
    extract_for_posts(reextract=args.reextract)


def cmd_analyze(args):
    from .analyze.item_analyze import run_analyze
    run_analyze(mock=args.mock, limit=args.limit)


def cmd_rollup(args):
    from .analyze.rollups import run_rollups
    run_rollups()


def cmd_mood(args):
    from .analyze.market_mood import run_market_mood
    run_market_mood()


def cmd_trending(args):
    from .analyze.trending import run_trending
    run_trending()


def cmd_narratives(args):
    from .analyze.narratives import run_narratives
    run_narratives(mock=args.mock)


def cmd_brief(args):
    from .analyze.brief import run_brief
    run_brief(mock=args.mock)


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


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="pipeline.manage")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("db-init").set_defaults(func=cmd_db_init)

    sp = sub.add_parser("seed-tickers"); sp.add_argument("--fallback", action="store_true"); sp.set_defaults(func=cmd_seed)
    sub.add_parser("load-sample").set_defaults(func=cmd_load_sample)
    sub.add_parser("ensure-sample").set_defaults(func=cmd_ensure_sample)

    sp = sub.add_parser("ingest"); sp.add_argument("--once", action="store_true"); sp.add_argument("--no-comments", action="store_true"); sp.set_defaults(func=cmd_ingest)
    sub.add_parser("refresh").set_defaults(func=cmd_refresh)
    sp = sub.add_parser("scrape"); sp.add_argument("--days", type=int, default=3); sp.add_argument("--limit", type=int, default=300); sp.set_defaults(func=cmd_scrape)
    sp = sub.add_parser("extract"); sp.add_argument("--reextract", action="store_true"); sp.set_defaults(func=cmd_extract)

    sp = sub.add_parser("analyze"); sp.add_argument("--mock", action="store_true"); sp.add_argument("--limit", type=int, default=None); sp.set_defaults(func=cmd_analyze)
    sub.add_parser("rollup").set_defaults(func=cmd_rollup)
    sub.add_parser("mood").set_defaults(func=cmd_mood)
    sub.add_parser("trending").set_defaults(func=cmd_trending)
    sp = sub.add_parser("narratives"); sp.add_argument("--mock", action="store_true"); sp.set_defaults(func=cmd_narratives)
    sp = sub.add_parser("brief"); sp.add_argument("--mock", action="store_true"); sp.set_defaults(func=cmd_brief)
    sub.add_parser("stats").set_defaults(func=cmd_stats)
    return p


def main():
    args = build_parser().parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
