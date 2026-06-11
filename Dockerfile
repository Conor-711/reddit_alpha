# Railway 部署：一镜像内跑完整管线(真实数据+样本兜底)→ 构建静态站 → 在 $PORT 提供服务。
# 用明确的 Dockerfile，避免 Railway Nixpacks 对 Python+Node 混合仓库识别失败。
FROM node:22-slim

# Python（管线用）
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-venv python3-pip ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV DATABASE_URL=sqlite:///./data/dev.db \
    REDDIT_USER_AGENT="redditalpha/0.1 (railway build)"

# ---- 依赖层（利于缓存）----
COPY pipeline/requirements.txt pipeline/requirements.txt
RUN python3 -m venv /venv && /venv/bin/pip install --no-cache-dir -r pipeline/requirements.txt

COPY web/package.json web/package-lock.json* web/
RUN cd web && npm install --no-audit --no-fund

# ---- 源码 ----
COPY . .

# ---- 生成数据集：真实(Arctic Shift) + 样本兜底，mock AI 打标 ----
# seed-cn-hk 必须执行：灌入「中概/港股/A 股」字典(ticker_meta.market='cn')，保证 /cn/ticker 的
# generateStaticParams 非空（否则 output:export 会以「缺 generateStaticParams」构建失败）。
# rollup/mood/trending/narratives 默认按 us + cn 双市场各跑一遍。
RUN /venv/bin/python -m pipeline.manage db-init \
 && /venv/bin/python -m pipeline.manage seed-tickers \
 && /venv/bin/python -m pipeline.manage seed-cn-hk \
 && ( /venv/bin/python -m pipeline.manage scrape --days 3 --limit 250 || true ) \
 && ( /venv/bin/python -m pipeline.manage scrape-china --days 30 --limit 200 || true ) \
 && /venv/bin/python -m pipeline.manage ensure-sample \
 && /venv/bin/python -m pipeline.manage analyze --mock \
 && /venv/bin/python -m pipeline.manage rollup \
 && /venv/bin/python -m pipeline.manage mood \
 && /venv/bin/python -m pipeline.manage trending \
 && /venv/bin/python -m pipeline.manage narratives --mock \
 && /venv/bin/python -m pipeline.manage brief --mock

# ---- 构建静态站（build 脚本已含 NODE_OPTIONS=--experimental-sqlite）----
RUN cd web && npm run build

ENV PORT=8080
EXPOSE 8080
# 用 Node 静态服务托管 web/out（原生读 process.env.PORT，不依赖 shell 展开）
CMD ["node", "server.mjs"]
