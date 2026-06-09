"""真实数据爬虫：从 Arctic Shift（Reddit 数据镜像，含当天数据）拉取主流财经板块帖子。

沙箱出口 IP 被 Reddit 直连屏蔽，Arctic Shift 托管在别处可达，提供真实、当前的 Reddit 帖子。
生产环境推荐用官方 PRAW（reddit_ingest.py）；此爬虫便于无凭证快速取真实数据。
"""
from __future__ import annotations

import datetime as dt
import time

import requests

from ..common.config import settings
from ..common.db import session_scope
from .reddit_ingest import (
    load_subreddit_config, store_mentions, upsert_author, upsert_post, upsert_subreddit,
)
from .ticker_extract import load_ticker_dict

BASE = "https://arctic-shift.photon-reddit.com/api/posts/search"
UA = settings.reddit_user_agent or "RedditAlpha/0.1 (research)"


def fetch_subreddit(name: str, days: int, max_count: int) -> list[dict]:
    """按时间倒序分页拉取近 `days` 天、至多 `max_count` 条提交。"""
    cutoff = dt.datetime.utcnow().timestamp() - days * 86400
    out: list[dict] = []
    before: int | None = None
    sess = requests.Session()
    sess.headers["User-Agent"] = UA

    while len(out) < max_count:
        params = {"subreddit": name, "limit": 100, "sort": "desc"}
        if before:
            params["before"] = int(before)
        try:
            r = sess.get(BASE, params=params, timeout=30)
        except requests.RequestException as e:
            print(f"  [scrape] r/{name} 网络错误：{e}")
            break
        if r.status_code != 200:
            print(f"  [scrape] r/{name} HTTP {r.status_code}，停止该板块。")
            break
        items = r.json().get("data", [])
        if not items:
            break
        stop = False
        for it in items:
            cu = it.get("created_utc")
            if cu is None:
                continue
            if cu < cutoff:
                stop = True
                break
            out.append(it)
        if stop or len(items) < 100:
            break
        before = items[-1]["created_utc"]
        time.sleep(0.6)
    return out[:max_count]


def scrape(days: int = 3, limit_per: int = 300) -> dict:
    subs = load_subreddit_config()
    stats = {"posts": 0, "mentions": 0, "subreddits": 0}

    with session_scope() as s:
        tdict = load_ticker_dict(s)
        if not tdict.tickers:
            raise RuntimeError("ticker_meta 为空，请先 `make seed`。")

        for entry in subs:
            name = entry["name"]
            items = fetch_subreddit(name, days, limit_per)
            subscribers = int((items[0].get("subreddit_subscribers") if items else 0) or 0)
            sid = upsert_subreddit(s, name, display_name=name, subscribers=subscribers)
            stats["subreddits"] += 1

            for it in items:
                author = it.get("author")
                aid = upsert_author(s, author if author not in (None, "[deleted]") else None)
                created = dt.datetime.utcfromtimestamp(it["created_utc"])
                is_self = bool(it.get("is_self", True))
                title = it.get("title") or ""
                selftext = it.get("selftext") or ""
                if selftext in ("[removed]", "[deleted]"):
                    selftext = ""
                upsert_post(
                    s, id=it["id"], subreddit_id=sid, author_id=aid, title=title, selftext=selftext,
                    url=None if is_self else it.get("url"), permalink=it.get("permalink", ""),
                    flair=it.get("link_flair_text"), is_self=is_self, created_utc=created,
                    score=int(it.get("score", 0) or 0), upvote_ratio=float(it.get("upvote_ratio", 0) or 0),
                    num_comments=int(it.get("num_comments", 0) or 0),
                    total_awards=int(it.get("total_awards_received", 0) or 0),
                )
                stats["posts"] += 1
                stats["mentions"] += store_mentions(
                    s, tdict, item_id=it["id"], item_type="post",
                    text=f"{title}\n{selftext}", subreddit_id=sid, author_id=aid, created_utc=created,
                )
            print(f"  r/{name}: {len(items)} 帖")

    print(f"[scrape] 完成 {stats}")
    return stats


if __name__ == "__main__":
    scrape()
