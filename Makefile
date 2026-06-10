PY := pipeline/.venv/bin/python
PIP := pipeline/.venv/bin/pip
MANAGE := $(PY) -m pipeline.manage

.PHONY: install venv db-init seed sample ingest refresh extract analyze analyze-mock \
        rollup narratives brief worker daily daily-build demo stats test web-install web-dev clean help

help:
	@echo "Reddit 版 Kaito Pro — 常用命令"
	@echo "  make install       建 venv 并装 Python 依赖"
	@echo "  make demo          一键离线全流程（样本数据 + mock AI），最快体验"
	@echo "  make stats         打印库内统计 / top mindshare"
	@echo "  --- 真实数据（需 .env 凭证，在你本机跑）---"
	@echo "  make seed          从 SEC 拉取并 seed ticker 字典"
	@echo "  make ingest        用 PRAW 拉取 Reddit 帖子并抽取 ticker"
	@echo "  make analyze       用 Claude 逐帖打标"
	@echo "  make rollup        计算 mindshare / 情绪 / 异动"
	@echo "  make narratives    AI 叙事聚类     make brief  每日 AI 简报"
	@echo "  make daily         分析过去 24 小时（一天一次；UTC+8 08:00 跑）"
	@echo "  make daily-build   分析过去 24h 并重建静态站点（web/out）"
	@echo "  make worker        启动调度：每天 UTC+8 08:00 自动跑 daily-build"
	@echo "  --- Web ---"
	@echo "  make web-install   安装前端依赖    make web-dev  启动 Next.js"

# ---------- 环境 ----------
venv:
	python3 -m venv pipeline/.venv

install: venv
	$(PIP) install -U pip
	$(PIP) install -r pipeline/requirements.txt

# ---------- 数据库 / 数据 ----------
db-init:
	$(MANAGE) db-init

seed:
	$(MANAGE) seed-tickers

sample:
	$(MANAGE) load-sample

# ---------- 数据系统（真实）----------
ingest:
	$(MANAGE) ingest --once

refresh:
	$(MANAGE) refresh

extract:
	$(MANAGE) extract --reextract

scrape:
	$(MANAGE) scrape --days 3 --limit 300

# ---------- 每日一次（不再实时；以 UTC+8 24h 为界，08:00 跑一次）----------
# 分析过去 24 小时：拉取 1 天的帖子/评论 + AI 打标 + 聚合。需要真实 Claude 则设 ANTHROPIC_API_KEY。
daily:
	$(MANAGE) daily

# 同上，并重建静态站点（web/out），让部署页面反映最新一天
daily-build:
	$(MANAGE) daily --rebuild
	@echo "" && echo "✅ 每日分析 + 站点重建完成。本地部署见 make serve 或 server.mjs"

# 真实数据全流程（Arctic Shift 实时 Reddit 数据 + mock AI；真实 Claude 需 ANTHROPIC_API_KEY）
real:
	rm -f data/dev.db data/dev.db-wal data/dev.db-shm
	$(MANAGE) db-init
	$(MANAGE) seed-tickers
	$(MANAGE) scrape --days 3 --limit 300
	$(MANAGE) analyze --mock
	$(MANAGE) rollup
	$(MANAGE) mood
	$(MANAGE) trending
	$(MANAGE) narratives --mock
	$(MANAGE) brief --mock
	@echo "" && echo "==== 真实数据导入完成 ====" && $(MANAGE) stats

# ---------- AI 分析 ----------
analyze:
	$(MANAGE) analyze

analyze-mock:
	$(MANAGE) analyze --mock

# 真实 AI 打标（通义千问 qwen3.7-plus，双语英文+中文，并发、可断点续跑，需 .env 里 QWEN_API_KEY）。
# 跑完建议接 rollup/mood/trending/narratives 让聚合对齐新情绪。
analyze-qwen:
	$(MANAGE) analyze --qwen --workers 10
	$(MANAGE) rollup
	$(MANAGE) mood
	$(MANAGE) trending
	$(MANAGE) narratives --mock

rollup:
	$(MANAGE) rollup
	$(MANAGE) mood
	$(MANAGE) trending

narratives:
	$(MANAGE) narratives

brief:
	$(MANAGE) brief

# 把帖子/AI 摘要/评论翻译成中文 → *_zh 列（增量、幂等，需 ANTHROPIC_API_KEY）。
translate:
	$(PY) -m pipeline.analyze.translate

# 仅给 demo 数据灌入一批中文译文（无需 API key，用于演示「看广告解锁翻译」）。
translate-demo:
	$(PY) -m pipeline.analyze.seed_demo_zh

# 让 AI 读懂帖子后重排版正文 → posts.selftext_fmt（提升可读性，需 ANTHROPIC_API_KEY）。
format:
	$(PY) -m pipeline.analyze.format_posts

worker:
	$(PY) -m pipeline.worker

# ---------- 一键离线全流程（无需凭证）----------
demo:
	rm -f data/dev.db data/dev.db-wal data/dev.db-shm
	$(MANAGE) db-init
	$(MANAGE) seed-tickers --fallback
	$(MANAGE) load-sample
	$(MANAGE) analyze --mock
	$(MANAGE) rollup
	$(MANAGE) mood
	$(MANAGE) trending
	$(MANAGE) narratives --mock
	$(MANAGE) brief --mock
	@echo "" && echo "==== DEMO 完成，库内统计： ====" && $(MANAGE) stats

stats:
	$(MANAGE) stats

test:
	$(PY) -m pytest -q

# ---------- Web ----------
web-install:
	cd web && npm install

web-dev:
	cd web && npm run dev

# 构建静态产物（web/out/），可部署到任意静态托管。见 DEPLOY.md
site:
	cd web && npm run build
	@echo "" && echo "✅ 静态产物已生成：web/out/  —— 见 DEPLOY.md"

# 本地部署：把静态产物跑在 http://localhost:8080（如无产物会先构建）
serve:
	@[ -d web/out ] || $(MAKE) site
	@echo "🌐 本地部署： http://localhost:8080   (Ctrl+C 退出)"
	@python3 -m http.server 8080 --bind 0.0.0.0 --directory web/out

clean:
	rm -f data/dev.db
