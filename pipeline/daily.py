"""每日一次的全量流程（不再实时爬取）。

以 UTC+8 时区的 24 小时为界线，分析「过去 24 小时」的 Reddit 信息：
每天只需在 UTC+8 早上 08:00（= UTC 00:00）跑一次即可。

  run_daily()           只跑数据 + AI 分析（更新 data/dev.db）
  run_daily(rebuild=1)  分析完再构建静态站点（web/out），供本地/静态托管部署

被 `pipeline.worker`（调度器）与 `pipeline.manage daily` 复用。
"""
from __future__ import annotations

import datetime as dt
import os
import subprocess

from .common.config import ROOT, settings
from .common.db import init_db

# 过去 24 小时 → 爬 1 天即可覆盖窗口
WINDOW_DAYS = 1
SCRAPE_LIMIT_PER = 400  # 单板块单日上限，足以覆盖一天的活跃帖


def _safe(label: str, fn, *args, **kwargs):
    try:
        fn(*args, **kwargs)
        return True
    except Exception as e:  # noqa: BLE001
        print(f"[daily] {label} 失败：{e}")
        return False


def _post_count() -> int:
    from sqlalchemy import func, select

    from .common.db import session_scope
    from .common.models import Post

    with session_scope() as s:
        return int(s.execute(select(func.count()).select_from(Post)).scalar_one())


def run_daily(rebuild: bool = False) -> None:
    from .analyze.brief import run_brief
    from .analyze.item_analyze import run_analyze
    from .analyze.market_mood import run_market_mood
    from .analyze.narratives import run_narratives
    from .analyze.rollups import run_rollups
    from .analyze.trending import run_trending
    from .ingest.arctic_scrape import scrape, scrape_comments
    from .ingest.sample_loader import load_sample

    started = dt.datetime.now()
    mock = not settings.has_anthropic
    print(f"[daily] 开始：过去 {WINDOW_DAYS*24} 小时分析（{'mock AI' if mock else '真实 Claude'}）— {started:%Y-%m-%d %H:%M %z}")

    init_db()

    # 1) 拉取过去 24 小时的帖子与高赞评论（Arctic Shift）
    _safe("scrape", scrape, days=WINDOW_DAYS, limit_per=SCRAPE_LIMIT_PER)
    _safe("scrape-comments", scrape_comments, top_n=400, per_post=15, min_comments=4)

    # 2) 若库内仍为空（如网络受限爬取失败），用样本兜底，保证站点不空
    if _post_count() == 0:
        print("[daily] 库内无帖子，载入样本兜底。")
        _safe("load-sample", load_sample)

    # 3) AI 逐帖打标 + 聚合
    _safe("analyze", run_analyze, mock=mock)
    _safe("rollup", run_rollups)
    _safe("mood", run_market_mood)
    _safe("trending", run_trending)
    _safe("narratives", run_narratives, mock=mock)
    _safe("brief", run_brief, mock=mock)

    # 4) 可选：重建静态站点，让部署的页面反映最新一天的数据
    if rebuild:
        _build_site()

    took = (dt.datetime.now() - started).total_seconds()
    print(f"[daily] 完成，用时 {took:.0f}s。")


def _build_site() -> None:
    web = ROOT / "web"
    if not (web / "package.json").exists():
        print("[daily] 跳过站点构建：未找到 web/package.json。")
        return
    env = {**os.environ, "NODE_OPTIONS": "--experimental-sqlite"}
    print("[daily] 构建静态站点 web/out …")
    try:
        subprocess.run(["npm", "run", "build"], cwd=str(web), env=env, check=True)
        print("[daily] ✅ 站点已重建：web/out/")
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"[daily] 站点构建失败：{e}")


if __name__ == "__main__":
    import sys

    run_daily(rebuild="--rebuild" in sys.argv)
