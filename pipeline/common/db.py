"""数据库引擎与会话。DATABASE_URL 驱动：sqlite（开发）/ postgresql（生产）。"""
from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from .config import settings
from .models import Base

_DB_URL = settings.database_url


def _make_engine(url: str) -> Engine:
    is_sqlite = url.startswith("sqlite")
    kwargs: dict = {"future": True, "pool_pre_ping": True}
    if is_sqlite:
        # 确保父目录存在（sqlite:///./data/dev.db）
        path = url.split("sqlite:///")[-1]
        if path and path not in (":memory:",):
            Path(path).resolve().parent.mkdir(parents=True, exist_ok=True)
        kwargs["connect_args"] = {"check_same_thread": False}
    return create_engine(url, **kwargs)


engine = _make_engine(_DB_URL)
# autoflush=True：保证同一会话内对相同主键的 merge 能正确 upsert（先 flush 再 SELECT）。
SessionLocal = sessionmaker(bind=engine, autoflush=True, expire_on_commit=False, future=True)


if engine.dialect.name == "sqlite":

    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_conn, _record):  # noqa: ANN001
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.execute("PRAGMA journal_mode=WAL")
        cur.close()


def init_db() -> None:
    """创建所有表（幂等）。"""
    Base.metadata.create_all(engine)


def drop_all() -> None:
    Base.metadata.drop_all(engine)


@contextmanager
def session_scope() -> Session:
    """事务会话上下文：正常提交，异常回滚。"""
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def dialect() -> str:
    return engine.dialect.name


def data_now():
    """窗口锚点：取库内最新帖的时间，让「过去 24h」窗口对齐数据本身，
    而非脚本运行时刻（静态数据集 / 离线分析也能正确出聚合）。无数据则退回 utcnow()。"""
    import datetime as _dt
    from sqlalchemy import select, func
    from .models import Post
    with session_scope() as s:
        mx = s.execute(select(func.max(Post.created_utc))).scalar()
    return mx or _dt.datetime.utcnow()
