PY := pipeline/.venv/bin/python
PIP := pipeline/.venv/bin/pip
MANAGE := $(PY) -m pipeline.manage

.PHONY: install venv db-init seed sample ingest refresh extract analyze analyze-mock \
        rollup narratives brief worker demo stats test web-install web-dev clean help

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
	@echo "  make worker        启动 APScheduler 调度全部 job"
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

rollup:
	$(MANAGE) rollup
	$(MANAGE) mood
	$(MANAGE) trending

narratives:
	$(MANAGE) narratives

brief:
	$(MANAGE) brief

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
