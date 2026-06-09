import { all, get, parseJSON } from "./db";

export interface MoodRow {
  mood_score: number; label: string; bull_pct: number; bear_pct: number;
  neutral_pct: number; total_mentions: number; total_posts: number; bucket_ts: string;
}
export interface MindRow {
  ticker: string; name: string; sector: string | null; mindshare: number;
  sentiment: number; mentions: number; posts: number; authors: number;
  bull: number; bear: number; neutral: number;
}
export interface TrendRow {
  ticker: string; name: string; rank: number; mentions: number; zscore: number;
  sentiment: number; spike: number; baseline: number;
}
export interface FeedRow {
  id: string; title: string; selftext: string; permalink: string; subreddit: string;
  flair: string | null; score: number; comments: number; created: string; author: string | null;
  stance: string; sentiment: number; quality: number; tldr: string;
  themes: string[]; tickers: { ticker: string; relevance: number }[];
}
export interface NarrativeRow {
  id: number; slug: string; name: string; summary: string; post_count: number;
  ticker_count: number; heat: number; tickers: { ticker: string; weight: number }[];
}

export function getMeta() {
  const m = get<{ ts: string }>(
    "SELECT bucket_ts AS ts FROM market_mood WHERE bucket='window' LIMIT 1"
  );
  const counts = get<{ posts: number; mentions: number; tickers: number }>(
    `SELECT (SELECT COUNT(*) FROM posts) AS posts,
            (SELECT COUNT(*) FROM mentions) AS mentions,
            (SELECT COUNT(DISTINCT ticker) FROM ticker_rollup WHERE bucket='window') AS tickers`
  );
  return { lastUpdated: m?.ts ?? null, ...(counts ?? { posts: 0, mentions: 0, tickers: 0 }) };
}

export function getMarketMood(): MoodRow | undefined {
  return get<MoodRow>("SELECT * FROM market_mood WHERE bucket='window' LIMIT 1");
}

export function getMindshare(limit = 24): MindRow[] {
  return all<MindRow>(
    `SELECT r.ticker, COALESCE(tm.company_name,'') AS name, tm.sector AS sector,
            r.mindshare_pct AS mindshare, r.sentiment_avg AS sentiment,
            r.mention_count AS mentions, r.post_count AS posts, r.unique_authors AS authors,
            r.bull_count AS bull, r.bear_count AS bear, r.neutral_count AS neutral
       FROM ticker_rollup r LEFT JOIN ticker_meta tm ON tm.ticker = r.ticker
      WHERE r.bucket='window'
      ORDER BY r.mindshare_pct DESC LIMIT ?`,
    limit
  );
}

export function getTreemap(limit = 30) {
  return getMindshare(limit).map((r) => ({
    ticker: r.ticker, name: r.name, value: r.mindshare,
    sentiment: r.sentiment, sector: r.sector ?? "其他", mentions: r.mentions,
  }));
}

export function getTrending(limit = 12, onlySpikes = false): TrendRow[] {
  return all<TrendRow>(
    `SELECT t.ticker, COALESCE(tm.company_name,'') AS name, t.rank, t.mention_count AS mentions,
            t.zscore, t.sentiment_avg AS sentiment, t.is_spike AS spike, t.baseline_mean AS baseline
       FROM trending t LEFT JOIN ticker_meta tm ON tm.ticker = t.ticker
      WHERE t.window='24h' ${onlySpikes ? "AND t.is_spike=1" : ""}
      ORDER BY t.rank LIMIT ?`,
    limit
  );
}

export function getNarratives(limit = 12): NarrativeRow[] {
  const narrs = all<Omit<NarrativeRow, "tickers">>(
    `SELECT id, slug, name, summary, post_count, ticker_count, heat
       FROM narratives ORDER BY heat DESC LIMIT ?`,
    limit
  );
  const links = all<{ narrative_id: number; ticker: string; weight: number }>(
    "SELECT narrative_id, ticker, weight FROM narrative_tickers ORDER BY weight DESC"
  );
  return narrs.map((n) => ({
    ...n,
    tickers: links.filter((l) => l.narrative_id === n.id).map((l) => ({ ticker: l.ticker, weight: l.weight })),
  }));
}

function mapFeed(rows: any[]): FeedRow[] {
  return rows.map((r) => ({
    id: r.id, title: r.title, selftext: r.selftext ?? "", permalink: r.permalink,
    subreddit: r.subreddit_id, flair: r.flair, score: r.score, comments: r.num_comments,
    created: r.created_utc, author: r.author_id, stance: r.stance ?? "neutral",
    sentiment: r.sentiment_score ?? 0, quality: r.quality_score ?? 0, tldr: r.tldr ?? "",
    themes: parseJSON<string[]>(r.themes, []),
    tickers: parseJSON<{ ticker: string; relevance: number }[]>(r.tickers, []),
  }));
}

export function getFeed(opts: { limit?: number; ticker?: string; subreddit?: string; stance?: string } = {}): FeedRow[] {
  const { limit = 30, ticker, subreddit, stance } = opts;
  const where: string[] = ["ia.item_type='post'"];
  const params: unknown[] = [];
  if (subreddit) { where.push("p.subreddit_id = ?"); params.push(subreddit); }
  if (stance) { where.push("ia.stance = ?"); params.push(stance); }
  if (ticker) {
    where.push("p.id IN (SELECT item_id FROM mentions WHERE item_type='post' AND ticker = ?)");
    params.push(ticker);
  }
  params.push(limit);
  const rows = all(
    `SELECT p.id, p.title, p.selftext, p.permalink, p.subreddit_id, p.flair, p.score,
            p.num_comments, p.created_utc, p.author_id,
            ia.stance, ia.sentiment_score, ia.quality_score, ia.tldr, ia.themes, ia.tickers
       FROM posts p JOIN item_analysis ia ON ia.item_id=p.id AND ia.item_type='post'
      WHERE ${where.join(" AND ")}
      ORDER BY ia.quality_score DESC, p.score DESC LIMIT ?`,
    ...params
  );
  return mapFeed(rows);
}

export function getAllTickerSymbols(): string[] {
  return all<{ ticker: string }>("SELECT ticker FROM ticker_meta").map((r) => r.ticker);
}

export interface CommentRow {
  id: string; author: string | null; body: string; score: number; created: string; parent: string | null;
}

export function getAllPostIds(): string[] {
  return all<{ id: string }>("SELECT id FROM posts").map((r) => r.id);
}

// 站内帖子详情：正文 + AI 摘要 + 评论（按分数排，含父子关系）。供 /post/[id] 渲染，不跳 Reddit。
export function getPostDetail(id: string) {
  const post = get<{
    id: string; title: string; selftext: string; permalink: string; subreddit: string;
    author: string | null; score: number; comments: number; created: string; flair: string | null; upvote_ratio: number;
  }>(
    `SELECT p.id, p.title, p.selftext, p.permalink, p.subreddit_id AS subreddit, p.author_id AS author,
            p.score, p.num_comments AS comments, p.created_utc AS created, p.flair, p.upvote_ratio
       FROM posts p WHERE p.id = ?`,
    id
  );
  if (!post) return null;

  const a = get<{
    stance: string; sentiment_score: number; quality_score: number; tldr: string;
    themes: string; tickers: string; bull_points: string; bear_points: string;
  }>(
    `SELECT stance, sentiment_score, quality_score, tldr, themes, tickers, bull_points, bear_points
       FROM item_analysis WHERE item_id = ? AND item_type='post'`,
    id
  );
  const analysis = a
    ? {
        stance: a.stance ?? "neutral",
        sentiment: a.sentiment_score ?? 0,
        quality: a.quality_score ?? 0,
        tldr: a.tldr ?? "",
        themes: parseJSON<string[]>(a.themes, []),
        tickers: parseJSON<{ ticker: string; relevance: number }[]>(a.tickers, []),
        bull: parseJSON<string[]>(a.bull_points, []),
        bear: parseJSON<string[]>(a.bear_points, []),
      }
    : null;

  const comments = all<CommentRow>(
    `SELECT id, author_id AS author, body, score, created_utc AS created, parent_id AS parent
       FROM comments WHERE post_id = ? ORDER BY score DESC`,
    id
  );

  return { post, analysis, comments };
}

export function getTickerList(): { ticker: string; name: string; mindshare: number }[] {
  return all(
    `SELECT r.ticker, COALESCE(tm.company_name,'') AS name, r.mindshare_pct AS mindshare
       FROM ticker_rollup r LEFT JOIN ticker_meta tm ON tm.ticker=r.ticker
      WHERE r.bucket='window' ORDER BY r.mindshare_pct DESC`
  );
}

export function getTickerDetail(symbol: string) {
  const ticker = symbol.toUpperCase();
  const meta = get<{ ticker: string; company_name: string; sector: string; exchange: string }>(
    "SELECT ticker, company_name, sector, exchange FROM ticker_meta WHERE ticker = ?",
    ticker
  );
  const roll = get<MindRow & { weighted: number; engagement: number }>(
    `SELECT r.ticker, COALESCE(tm.company_name,'') AS name, tm.sector,
            r.mindshare_pct AS mindshare, r.sentiment_avg AS sentiment, r.mention_count AS mentions,
            r.post_count AS posts, r.unique_authors AS authors, r.bull_count AS bull,
            r.bear_count AS bear, r.neutral_count AS neutral, r.weighted_mentions AS weighted,
            r.engagement_sum AS engagement
       FROM ticker_rollup r LEFT JOIN ticker_meta tm ON tm.ticker=r.ticker
      WHERE r.bucket='window' AND r.ticker = ?`,
    ticker
  );
  const series = all<{ ts: string; mentions: number; sentiment: number }>(
    `SELECT bucket_ts AS ts, mention_count AS mentions, sentiment_avg AS sentiment
       FROM ticker_rollup WHERE bucket='hour' AND ticker = ? ORDER BY bucket_ts ASC`,
    ticker
  );
  const bySub = all<{ subreddit: string; n: number }>(
    `SELECT subreddit_id AS subreddit, COUNT(*) AS n FROM mentions
      WHERE item_type='post' AND ticker = ? GROUP BY subreddit_id ORDER BY n DESC`,
    ticker
  );
  const posts = mapFeed(
    all(
      `SELECT p.id, p.title, p.selftext, p.permalink, p.subreddit_id, p.flair, p.score,
              p.num_comments, p.created_utc, p.author_id,
              ia.stance, ia.sentiment_score, ia.quality_score, ia.tldr, ia.themes, ia.tickers
         FROM posts p JOIN mentions m ON m.item_id=p.id AND m.item_type='post'
         LEFT JOIN item_analysis ia ON ia.item_id=p.id AND ia.item_type='post'
        WHERE m.ticker = ? ORDER BY p.score DESC LIMIT 12`,
      ticker
    )
  );
  // 多空论点：从相关帖的 bull/bear_points 汇集
  const bull: { id: string; point: string; permalink: string; title: string }[] = [];
  const bear: { id: string; point: string; permalink: string; title: string }[] = [];
  for (const p of posts) {
    const a = get<{ bull_points: string; bear_points: string }>(
      "SELECT bull_points, bear_points FROM item_analysis WHERE item_id=? AND item_type='post'",
      p.id
    );
    for (const pt of parseJSON<string[]>(a?.bull_points, [])) bull.push({ id: p.id, point: pt, permalink: p.permalink, title: p.title });
    for (const pt of parseJSON<string[]>(a?.bear_points, [])) bear.push({ id: p.id, point: pt, permalink: p.permalink, title: p.title });
  }
  const narrs = all<NarrativeRow>(
    `SELECT n.id, n.slug, n.name, n.summary, n.post_count, n.ticker_count, n.heat
       FROM narratives n JOIN narrative_tickers nt ON nt.narrative_id=n.id
      WHERE nt.ticker = ? ORDER BY n.heat DESC`,
    ticker
  ).map((n) => ({ ...n, tickers: [] as { ticker: string; weight: number }[] }));

  // 可信声音：讨论该标的的作者，按内容质量 × 影响力排（类比 TipRanks 排分析师）
  const voices = all<{ author: string; posts: number; score: number; quality: number; sentiment: number }>(
    `SELECT p.author_id AS author, COUNT(*) AS posts, COALESCE(SUM(p.score),0) AS score,
            AVG(ia.quality_score) AS quality, AVG(ia.sentiment_score) AS sentiment
       FROM posts p JOIN mentions m ON m.item_id=p.id AND m.item_type='post' AND m.ticker = ?
       LEFT JOIN item_analysis ia ON ia.item_id=p.id AND ia.item_type='post'
      WHERE p.author_id IS NOT NULL
      GROUP BY p.author_id
      ORDER BY AVG(ia.quality_score) DESC, SUM(p.score) DESC
      LIMIT 6`,
    ticker
  ).map((v) => ({ ...v, quality: v.quality ?? 0, sentiment: v.sentiment ?? 0 }));

  // 催化剂 / 主题：从相关帖聚合（社区在盯什么）
  const themeCount = new Map<string, number>();
  for (const p of posts) for (const t of p.themes) themeCount.set(t, (themeCount.get(t) || 0) + 1);
  const themes = [...themeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  return { ticker, meta, roll, series, bySub, posts, bull: bull.slice(0, 6), bear: bear.slice(0, 6), narratives: narrs, voices, themes };
}

export function getDailyBrief() {
  const b = get<{ brief_date: string; title: string; markdown: string; highlights: string; model: string }>(
    "SELECT brief_date, title, markdown, highlights, model FROM daily_briefs ORDER BY brief_date DESC LIMIT 1"
  );
  if (!b) return undefined;
  return { ...b, highlights: parseJSON<string[]>(b.highlights, []) };
}

export function getLeaderboard(limit = 20) {
  return all<{ author: string; posts: number; score: number; sentiment: number; quality: number }>(
    `SELECT p.author_id AS author, COUNT(*) AS posts, SUM(p.score) AS score,
            AVG(ia.sentiment_score) AS sentiment, AVG(ia.quality_score) AS quality
       FROM posts p LEFT JOIN item_analysis ia ON ia.item_id=p.id AND ia.item_type='post'
      WHERE p.author_id IS NOT NULL
      GROUP BY p.author_id ORDER BY score DESC LIMIT ?`,
    limit
  );
}

export function getSubreddits() {
  return all<{ id: string; subscribers: number }>("SELECT id, subscribers FROM subreddits ORDER BY subscribers DESC");
}

export function getCommunities() {
  return all<{ id: string; subscribers: number; posts: number }>(
    `SELECT s.id, s.subscribers,
            (SELECT COUNT(*) FROM posts p WHERE p.subreddit_id = s.id) AS posts
       FROM subreddits s ORDER BY posts DESC`
  );
}

// 个性化看板用：所有在窗口内的标的(轻量字段) + 叙事，序列化给客户端按 onboarding 选择筛选。
export interface TickerLite {
  ticker: string; name: string; sector: string | null;
  mindshare: number; sentiment: number; mentions: number;
}
export function getDashboardBundle() {
  const tickers = all<TickerLite>(
    `SELECT r.ticker, COALESCE(tm.company_name,'') AS name, tm.sector,
            r.mindshare_pct AS mindshare, r.sentiment_avg AS sentiment, r.mention_count AS mentions
       FROM ticker_rollup r LEFT JOIN ticker_meta tm ON tm.ticker = r.ticker
      WHERE r.bucket='window' ORDER BY r.mindshare_pct DESC`
  );
  return { tickers, narratives: getNarratives(12) };
}

// Onboarding 用：可选「领域」(有数据的 sector) + 热门标的(供选持仓)，均为真实数据。
export function getOnboardingData() {
  const sectors = all<{ key: string; count: number }>(
    `SELECT tm.sector AS key, COUNT(DISTINCT r.ticker) AS count
       FROM ticker_rollup r JOIN ticker_meta tm ON tm.ticker = r.ticker
      WHERE r.bucket='window' AND tm.sector IS NOT NULL AND tm.sector <> ''
      GROUP BY tm.sector ORDER BY count DESC`
  );
  const tickers = all<{ ticker: string; name: string; sector: string | null }>(
    `SELECT r.ticker, COALESCE(tm.company_name,'') AS name, tm.sector
       FROM ticker_rollup r LEFT JOIN ticker_meta tm ON tm.ticker = r.ticker
      WHERE r.bucket='window' ORDER BY r.mindshare_pct DESC LIMIT 30`
  );
  return { sectors, tickers };
}

// Landing page 用：聚合真实数据做信任背书（社区数、总订阅、帖子、标的、作者）。
export function getLandingStats() {
  const subs = all<{ id: string; subscribers: number }>(
    "SELECT id, subscribers FROM subreddits ORDER BY subscribers DESC"
  );
  const meta = getMeta();
  const authors =
    get<{ n: number }>(
      "SELECT COUNT(DISTINCT author_id) AS n FROM posts WHERE author_id IS NOT NULL"
    )?.n ?? 0;
  const totalSubscribers = subs.reduce((s, c) => s + (c.subscribers || 0), 0);
  return { subs, totalSubscribers, posts: meta.posts, tickers: meta.tickers, authors };
}
