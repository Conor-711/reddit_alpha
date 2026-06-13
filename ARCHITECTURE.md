# 项目架构与结构（ARCHITECTURE）

> **维护约定**：本文件是项目的「活地图」。**每次对项目结构或功能有实质改动后，必须同步更新本文件对应章节**
> （新增/删除模块、改数据流、改命令、改部署方式、改 schema 等）。详见根目录 `CLAUDE.md`。
> 最近更新：2026-06-12。

---

## 1. 这是什么

**redditalpha** —— 一个双语（中文默认 / English）的 **Reddit 美股 + 中概股舆情情报看板**。
抓取 Reddit 财经社区的真实帖子，用大模型逐帖做投资打标（情绪 / 多空 / 质量 / 主题 / 双语摘要 /
按标的归属的多空论据），再聚合成声量榜、情绪、异动、主导叙事、每日简报，最终渲染成一个**纯静态网站**。

- 线上地址：**https://www.redditalpha.xyz**（根域名，静态托管）
- 两个市场（market）：`us`（美股）、`cn`（中概股 + 港股 + A 股），互不污染，各出一套聚合。

---

## 2. 三大系统

```
┌─────────────────┐   写入    ┌──────────────────────┐   拉快照   ┌─────────────────────┐
│ ① Python 数据管线 │ ───────▶ │ ② Supabase 云端(Postgres) │ ───────▶ │ ③ Next.js 静态网站   │
│  抓取 + AI 分析   │          │   数据的「家」(唯一真源)    │          │  构建期读快照→出 HTML │
└─────────────────┘          └──────────────────────┘          └─────────────────────┘
                                        ▲  Supabase 还存：登录账号(Auth)、埋点(app_events)、搜索榜(ticker_searches)、收藏/追踪(user_collections)
```

### ① Python 数据管线（`pipeline/`）
抓 Reddit → 抽取 ticker → 大模型逐帖打标 → 聚合（榜单/情绪/异动/叙事/简报）→ 翻译。
**写入 `DATABASE_URL`**（现已指向 Supabase 云端）。

### ② Supabase（云端 Postgres）—— 数据的家
- **管线数据**（14 张表，见第 5 节）：帖子/评论/作者/AI 分析/提及/字典 + 派生聚合表。
- **网站后端**（独立小表，RLS 保护）：`app_events`（埋点）、`ticker_searches`（搜索榜）、`user_collections`（账户收藏/追踪，仅本人可读写）、Auth（登录）。
- 项目 ref：`wimipsiwtrqhizgmbxas`。迁移与用法见 `CLOUD_DB.md`。

### ③ Next.js 静态网站（`web/`）
Next 14 App Router，**静态导出**（`output:"export"` 仅生产）。构建期用 `node:sqlite` 读**本地快照**
`data/dev.db`（由 `make cloud-pull` 从云端拉下），生成 ~6500 个静态页面到 `web/out/`，可部署到任意静态托管。
**网站运行时不连数据库**（纯静态，无服务端攻击面）。

---

## 3. 端到端数据流

```
Arctic Shift / PRAW ──▶ posts/comments ──▶ ticker 抽取(正则) ──▶ mentions
                                                                   │
                                          大模型逐帖打标(qwen 思考模式) ──▶ item_analysis
                                                                   │
        ┌──────────────┬──────────────┬──────────────┬────────────┘
     rollups        market_mood     trending      narratives(deepseek) + brief(deepseek)
   (声量/情绪榜)     (市场情绪)      (异动z-score)   (主导叙事 / 每日简报)
        └──────────────┴──────────────┴──────────────┴──────────── translate(deepseek, 增量补中文)
                                       │
                              全部写入 Supabase 云端
                                       │  make cloud-pull
                              本地 data/dev.db 快照
                                       │  make site  (Node 22)
                                  web/out/ 静态站
```

**关键：分析是增量的** —— 逐帖打标按 `item_analysis.item_id` 持久化，只分析新帖；聚合表每次全量重算（纯 SQL，0 token）。

---

## 4. 目录结构（带注释）

```
crypto_us/
├── pipeline/                  # ① Python 数据管线
│   ├── manage.py              #   统一 CLI 入口（被 Makefile 调用的所有子命令）
│   ├── daily.py               #   每日一次的全量编排（抓取→分析→聚合→翻译）
│   ├── sync.py                #   ★本地 SQLite ⇄ 云端 Supabase 同步（cloud-push / cloud-pull）
│   ├── worker.py              #   调度器（APScheduler，定时跑 daily）
│   ├── common/
│   │   ├── config.py          #   配置/环境变量（含 normalize_db_url：Supabase 串自动转 psycopg+SSL）
│   │   ├── db.py              #   SQLAlchemy 引擎/会话（sqlite 开发 / postgres 生产通用）
│   │   ├── models.py          #   ★数据模型 = schema 单一真源（14 张表）
│   │   ├── llm.py             #   ★大模型「档位路由」：LOW/MID/HIGH → 具体 provider
│   │   ├── qwen.py            #   通义千问（HIGH：逐帖打标，思考模式）
│   │   ├── deepseek.py        #   DeepSeek（MID：叙事/简报；LOW：翻译）
│   │   └── claude.py / reddit.py
│   ├── ingest/                #   抓取 + 抽取
│   │   ├── arctic_scrape.py   #   Arctic Shift 拉历史帖/评论（主力）
│   │   ├── reddit_ingest.py   #   PRAW 实时拉取
│   │   ├── ticker_extract.py  #   ★ticker 抽取器（cashtag/裸大写/公司名别名 + 停用表）
│   │   └── seed_tickers.py    #   seed ticker 字典 → ticker_meta（含中概/港股 cn_hk_tickers.json）
│   ├── analyze/              #   分析 + 聚合
│   │   ├── item_analyze.py    #   ★逐帖 AI 打标（analyze_qwen 是全站分析大脑；增量，跳过已分析）
│   │   ├── rollups.py         #   声量/情绪聚合（mindshare 归一化）
│   │   ├── market_mood.py     #   市场情绪（恐惧贪婪）
│   │   ├── trending.py        #   异动（z-score / spike）
│   │   ├── narratives.py      #   叙事聚类（deepseek 语义聚类，失败回退主题分组）
│   │   ├── brief.py           #   每日简报（deepseek 润色）
│   │   └── translate.py       #   翻译成中文 *_zh 列（增量、幂等）
│   └── data/                  #   随仓库的字典/样本（ticker_stoplist.txt, cn_hk_tickers.json, subreddits.yml…）
│
├── web/                       # ③ Next.js 14 静态站
│   ├── app/
│   │   ├── layout.tsx         #   根布局（主题防闪烁 + 默认 OG/metadataBase）
│   │   ├── [lang]/            #   语言段（zh|en）：generateStaticParams
│   │   │   ├── page.tsx       #     落地页（股神轮播）
│   │   │   ├── dashboard/     #     美股看板    cn/ 中概看板
│   │   │   ├── ticker/[symbol]/  个股页   cn/ticker/[symbol]/
│   │   │   ├── post/[id]/     #     帖子详情（AI 摘要 + 多空 + 评论 + 翻译切换）
│   │   │   ├── search/ leaderboard/ insights(管理员看板) account/ me(个人主页·私密) login/ signup/ …
│   │   ├── sitemap.ts / robots.ts / not-found.tsx   # SEO + 404
│   │   └── icon.png           #   favicon
│   ├── lib/
│   │   ├── db.ts              #   ★构建期用 node:sqlite 读 ../data/dev.db
│   │   ├── queries.ts         #   ★所有取数 SQL（getMindshare/getTrending/getPostDetail…）
│   │   ├── i18n.ts + dictionaries/{zh,en}.ts   # 双语（zh 为源，en 必须镜像同样的 key）
│   │   ├── supabase.ts / auth.ts / admin.ts    # Supabase 客户端 + 登录 + 管理员判定
│   │   ├── analytics.ts / searchCounts.ts      # 埋点 + 搜索榜（写 Supabase）
│   │   ├── favorites.ts                         # ★账户收藏/追踪：客户端读写 user_collections（RLS）
│   │   └── site.ts            #   SITE_URL（https://www.redditalpha.xyz）+ OG
│   ├── components/            #   UI 组件（Sidebar/Topbar/FeedCard/MarkdownLite… + auth/ favorites/ profile/）
│   ├── next.config.mjs        #   output:export(仅生产) + cpus:1 串行导出 + images:unoptimized
│   └── public/               #   logo/og/avatars/communities（图片已压缩）
│
├── supabase/migrations/       # ② Supabase SQL 迁移（ticker_searches / analytics / user_collections 的表+RLS+RPC）
├── data/dev.db                # 本地 SQLite 快照（gitignore；由 cloud-pull 从云端拉取）
├── Makefile                   # ★所有常用命令入口
├── .env / .env.example        # 凭据与配置（.env gitignore：QWEN/DEEPSEEK/DATABASE_URL…）
└── 文档：README / DEPLOY / CLOUD_DB / SUPABASE_AUTH / STRATEGY / ARCHITECTURE(本文)
```

---

## 5. 数据库 schema（14 张表，`pipeline/common/models.py` 为单一真源）

| 类别 | 表 | 说明 |
|---|---|---|
| 原始 | `subreddits` `authors` `posts` `comments` | 抓来的原始内容（含 `*_zh` 中文译文列、`market`） |
| 字典/抽取 | `ticker_meta` `mentions` | ticker 字典 + 帖子↔ticker 提及（含 confidence/method） |
| AI 分析 | `item_analysis` | ★逐帖打标结果（情绪/多空/质量/主题/双语摘要/per-ticker 论据），按 item_id 持久化 |
| 派生聚合 | `ticker_rollup` `market_mood` `trending` | 声量榜 / 市场情绪 / 异动（每次全量重算，可弃） |
| 叙事/简报 | `narratives` `narrative_tickers` `narrative_posts` `daily_briefs` | 主导叙事 + 每日简报 |

> 迁移只搬「原始+字典+AI 分析」这 7 张源表（贵、需长期保存）；派生表在云端用 `make rollup` 等重算。

---

## 6. 大模型档位（`pipeline/common/llm.py` 为路由真源）

| 档位 | 用途 | 当前 provider |
|---|---|---|
| **HIGH** | 逐帖投资打标（思考模式，全站分析大脑，token 大头） | 通义千问 `qwen3.7-plus` |
| **MID** | 叙事聚类 / 每日简报 / 正文重排版 | DeepSeek `deepseek-v4-pro` |
| **LOW** | 翻译（标题/正文/摘要/评论） | DeepSeek `deepseek-v4-flash` |

改模型只动 `llm.py` 路由表。缺 key 时各环节回退 mock 启发式，不崩。

---

## 7. 常用命令（Makefile）

| 命令 | 作用 |
|---|---|
| `make daily` | 分析过去 24h（抓取+AI 打标+聚合+翻译），直接写 `DATABASE_URL`（云端） |
| `make analyze-qwen` | 真实千问逐帖打标 + 重算聚合 |
| `make rollup / mood / trending / narratives / brief` | 单独重算各聚合 |
| `make cloud-init` | 一次性迁移：建表 + 上传本地源数据 + 云端重算派生表 |
| `make cloud-push` | 把本地源数据增量上传到云端 |
| `make cloud-pull` | 从云端拉快照覆盖本地 `data/dev.db`（构建前用） |
| `make site` | 构建静态站 `web/out/`（需 **Node 22**） |
| `make site-cloud` | `cloud-pull` + 构建（部署前用这个） |
| `make stats` | 打印库内统计 |
| `make demo` | 一键离线全流程（样本+mock，无需 key） |

---

## 8. 构建 & 部署

1. `nvm use 22`（**必须 Node 22**；Node 23 + 实验 SQLite 会让构建被系统 SIGKILL）。
2. `make site-cloud`（从云端拉数据 + `next build` → `web/out/`，~6500 页、cpus:1 串行 ~2–3 分钟）。
3. 部署 `web/out/` 到静态托管（自定义根域名 www.redditalpha.xyz）。详见 `DEPLOY.md`。

---

## 9. 重要约定 / 易踩坑

- **构建用 Node 22**（见上）。若构建报 `Cannot find module for page /_not-found`：先 `rm -rf web/.next web/out` 再构建（残留进程会锁住 .next）。
- **双语字典**：`dictionaries/zh.ts` 是源，`en.ts` 必须镜像完全相同的 key。
- **密钥不入库**：`.env` / `web/.env.local` 已 gitignore；含 `QWEN_API_KEY`/`DEEPSEEK_API_KEY`/`DATABASE_URL`(含密码)/Supabase anon key 等，切勿提交或泄露。
- **回到纯本地**：`.env` 的 `DATABASE_URL` 改回 `sqlite:///./data/dev.db` 即可。
- **管理员看板**（`/insights`）：前端只是 UX 门槛，真正鉴权在 Supabase 端（`is_admin()` 校验 JWT 邮箱）。
- **待办（省 token）**：千问/DeepSeek 的系统提示词每次逐帖重发，未确认是否走缓存计费；可启用上下文缓存。
