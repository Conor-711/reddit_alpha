"""调度器：按节奏自动跑数据 + AI 全流程（生产用，需 .env 凭证）。

  ingest+refresh 每 15 分钟 · analyze+rollup+mood+trending 每 20 分钟
  · narratives 每 2 小时 · brief 每日 00:10 UTC
"""
from __future__ import annotations

import datetime as dt

from apscheduler.schedulers.blocking import BlockingScheduler

from .analyze.brief import run_brief
from .analyze.item_analyze import run_analyze
from .analyze.market_mood import run_market_mood
from .analyze.narratives import run_narratives
from .analyze.rollups import run_rollups
from .analyze.trending import run_trending
from .common.config import settings
from .common.db import init_db
from .ingest.reddit_ingest import ingest_once
from .ingest.refresh import refresh_recent


def _safe(fn, *args, **kwargs):
    try:
        fn(*args, **kwargs)
    except Exception as e:  # noqa: BLE001
        print(f"[worker] {fn.__name__} 失败：{e}")


def cycle_data():
    _safe(ingest_once)
    _safe(refresh_recent)


def cycle_ai():
    _safe(run_analyze)
    _safe(run_rollups)
    _safe(run_market_mood)
    _safe(run_trending)


def main():
    init_db()
    if not settings.has_reddit:
        print("[worker] ⚠️ 缺 Reddit 凭证，ingest 将失败——请先在 .env 配置。")
    if not settings.has_anthropic:
        print("[worker] ⚠️ 缺 ANTHROPIC_API_KEY，analyze/narratives/brief 将失败。")

    now = dt.datetime.now()
    sched = BlockingScheduler(timezone="UTC")
    sched.add_job(cycle_data, "interval", minutes=15, next_run_time=now)
    sched.add_job(cycle_ai, "interval", minutes=20, next_run_time=now + dt.timedelta(seconds=30))
    sched.add_job(lambda: _safe(run_narratives), "interval", hours=2)
    sched.add_job(lambda: _safe(run_brief), "cron", hour=0, minute=10)
    print("[worker] 调度启动：ingest/refresh 15m · analyze/rollup 20m · narratives 2h · brief 每日 00:10 UTC")
    try:
        sched.start()
    except (KeyboardInterrupt, SystemExit):
        print("[worker] 已停止。")


if __name__ == "__main__":
    main()
