/* =========================================================
   链桥 Crossover — frontend prototype logic & content
   ========================================================= */

/* ---------- 1. 概念对照数据 (Translator) ---------- */
const CONCEPTS = [
  {
    crypto: '加密钱包 / 私钥', cryptoSub: '资产的自托管入口',
    stock: '券商账户', stockSub: '受监管的托管账户', tag: '账户',
    same: '都是你持有和操作资产的总入口,账户安全永远是第一位的。',
    diff: 'crypto 自托管,私钥/助记词丢了没人能帮你找回;券商是托管制,忘记密码能找回,且受监管、有保险兜底。',
    tip: '把"死守私钥"的谨慎,换成"守好账户密码 + 身份信息 + 二次验证(2FA)"。',
  },
  {
    crypto: '代币 Token', cryptoSub: '链上的价值凭证',
    stock: '股票 Stock / Share', stockSub: '公司所有权的一份', tag: '资产',
    same: '都是可在市场买卖、价格波动的标准化资产,有代码(Ticker)、有市值。',
    diff: '股票代表对一家真实公司的所有权,背后有营收、利润、分红;多数代币更接近"网络使用权"或叙事,基本面差异很大。',
    tip: '买股票时多问一句:"这家公司靠什么赚钱?" 这是 crypto 里常被忽略的视角。',
  },
  {
    crypto: '中心化交易所 CEX', cryptoSub: 'Binance / Coinbase / OKX',
    stock: '券商 Broker', stockSub: 'IBKR / Schwab / Robinhood', tag: '平台',
    same: '都是你下单买卖的场所,提供 App、行情、订单簿和资金账户。',
    diff: '券商本身不"上币",它帮你把单子送到交易所(NYSE/Nasdaq)撮合;受 SEC/FINRA 强监管,合规要求高得多。',
    tip: '选券商像选交易所:看费率、出入金、支持地区和资产托管,而不只是看 App 好不好看。',
  },
  {
    crypto: 'Gas 费 / 交易手续费', cryptoSub: '链上 + 交易所抽成',
    stock: '佣金 & 买卖价差', stockSub: 'Commission & Spread', tag: '成本',
    same: '都是交易的摩擦成本,频繁交易会被一点点磨掉收益。',
    diff: '美股多数券商已"零佣金",但成本藏在买卖价差、订单流回扣(PFOF)和汇率里;没有按笔波动的 Gas。',
    tip: '别被"0 佣金"迷惑——用限价单、避免频繁交易,才是真正省成本的方式。',
  },
  {
    crypto: '稳定币 USDT / USDC', cryptoSub: '锚定美元的避风港',
    stock: '现金 / 货币市场基金', stockSub: 'Cash / Money Market Fund', tag: '现金',
    same: '都是你"离场观望"时停泊资金的地方,价值稳定、随时可再入场。',
    diff: '券商里的闲置现金常能自动买入货币基金,拿到接近无风险利率(4%+)的利息;稳定币本身通常不自动生息。',
    tip: '把"换成 USDT 避险"的习惯,升级为"闲钱放货币基金吃利息",不浪费时间价值。',
  },
  {
    crypto: '质押 Staking / 挖矿', cryptoSub: '锁仓产生被动收益',
    stock: '分红 Dividend', stockSub: '公司利润分给股东', tag: '收益',
    same: '都是"持有就有"的被动现金流,会按周期发放。',
    diff: '分红来自公司真实利润,可持续性看经营;质押收益常来自代币增发(通胀),高 APR 未必是真收益。',
    tip: '看美股分红别只看股息率,要看"派息是否来自利润、能否持续"——和判断质押 APR 一个道理。',
  },
  {
    crypto: '白皮书 Whitepaper', cryptoSub: '项目的愿景与机制',
    stock: '招股书 S-1 / 财报 10-K', stockSub: 'SEC 强制披露文件', tag: '信息',
    same: '都是了解一个标的"到底是什么"的第一手官方资料。',
    diff: '10-K / S-1 是法律强制、需审计的事实披露(财务、风险、竞争);白皮书多为自述愿景,无强制约束。',
    tip: '读财报先翻"风险因素(Risk Factors)"和"管理层讨论(MD&A)"——比白皮书的路线图实在得多。',
  },
  {
    crypto: '市值 Market Cap', cryptoSub: '价格 × 流通量',
    stock: '市值 Market Cap', stockSub: '股价 × 总股本', tag: '估值',
    same: '概念几乎一致:衡量整个标的的总规模,用来横向比较大小。',
    diff: '股票还看"自由流通市值"和稀释后股本;crypto 要警惕"全流通市值(FDV)"和实际流通的巨大差距。',
    tip: '你已经懂 FDV 的坑——在美股里对应留意"增发/可转债稀释",看摊薄后每股收益。',
  },
  {
    crypto: '空投 Airdrop', cryptoSub: '免费发币获客',
    stock: '打新 IPO / 股权激励 RSU', stockSub: '新股申购 / 员工持股', tag: '机会',
    same: '都是"早期参与可能有超额回报"的获取方式,也都伴随不确定性。',
    diff: '打新需要券商资格、可能要抽签或排队,且上市后常有锁定期;不像空投那样满足条件就发。',
    tip: '别把打新当无风险套利——很多热门 IPO 上市即高点,和"空投即砸盘"的体感类似。',
  },
  {
    crypto: '代币经济学 Tokenomics', cryptoSub: '总量 / 解锁 / 通胀',
    stock: '股本结构 & 稀释', stockSub: '总股本 / 增发 / 回购', tag: '结构',
    same: '都关心"未来会不会有更多份额砸下来稀释我"。',
    diff: '公司可以"回购注销"股票(类似通缩),也可能增发融资(稀释);节奏由董事会和市场决定,披露更透明。',
    tip: '看到"大额回购"约等于利好筹码面;看到"频繁增发/解锁"就提高警惕——和盯解锁表一样。',
  },
  {
    crypto: '去中心化交易所 DEX', cryptoSub: 'Uniswap 等链上撮合',
    stock: '证券交易所', stockSub: 'NYSE / Nasdaq', tag: '平台',
    same: '都是订单最终成交的"场子",决定流动性和价格发现。',
    diff: '美股交易所是中心化、有做市商和开收盘集合竞价的机构;有休市时间,没有 7×24 的链上池子。',
    tip: '理解"流动性好坏影响滑点"这件事可以直接平移——大盘股像深池子,小盘股像浅池子。',
  },
  {
    crypto: '链上数据 On-chain', cryptoSub: '地址 / 资金流 / 持仓',
    stock: '财报 & 基本面数据', stockSub: '营收 / 利润 / 现金流', tag: '信息',
    same: '都是绕过情绪、用数据判断"真实健康度"的硬核分析。',
    diff: '财报每季度发布、有会计准则和审计;不像链上那样实时透明,但更结构化、可比性强。',
    tip: '你爱看链上数据,那你会喜欢财报——三张表(利润表/资产负债表/现金流量表)就是公司的"链上面板"。',
  },
  {
    crypto: '7×24 全天候', cryptoSub: '永不休市',
    stock: '开盘时间 + 盘前盘后', stockSub: '9:30–16:00 美东', tag: '规则',
    same: '都有"流动性高低时段"——主力时段成交活跃,冷门时段价差大。',
    diff: '美股周末、节假日休市,盘前盘后流动性差、波动大;消息常在盘后/盘前发酵,开盘集中反应。',
    tip: '把"半夜盯盘"改成"看美东时间";财报多在盘后发布,学会看盘后异动。',
  },
  {
    crypto: '永续合约 / 杠杆 Perp', cryptoSub: '高倍做多做空',
    stock: '期权 Options / 保证金', stockSub: '杠杆与对冲工具', tag: '进阶',
    same: '都能放大收益、做空、对冲,也都能让你快速归零。',
    diff: '期权有到期日和行权价,定价更复杂(时间价值、隐含波动率);美股个股无"涨跌停",但有市场级熔断。',
    tip: '别把炒合约的仓位习惯直接搬来——先用小仓位搞懂期权的"时间损耗",再谈杠杆。',
  },
  {
    crypto: '巨鲸 Whale', cryptoSub: '大额持仓地址',
    stock: '机构持仓 13F', stockSub: '基金季度持仓披露', tag: '资金',
    same: '都想知道"大钱在买什么、在跑还是在进"。',
    diff: '机构每季度通过 13F 披露持仓(有滞后);不像链上地址能实时追踪,但身份明确、可信度高。',
    tip: '"跟着聪明钱"的思路能平移——看桥水、伯克希尔的 13F,就像盯巨鲸地址。',
  },
  {
    crypto: 'Rug Pull / 归零', cryptoSub: '项目方跑路',
    stock: '退市 / 破产 / 财务造假', stockSub: 'Delisting / Fraud', tag: '风险',
    same: '都是"本金永久损失"的极端风险,事前往往有蛛丝马迹。',
    diff: '上市公司造假门槛和代价高得多(法律、审计、做空机构盯着),但仍会发生(如某些中概);监管事后追责更强。',
    tip: '你对 rug 的嗅觉很有用:财务异常、频繁更换审计、内部人疯狂减持,都是危险信号。',
  },
];

/* ---------- 2. 两个世界对照 (Compare) ---------- */
const COMPARE = [
  { dim: '交易时间', crypto: '7×24 全年无休', stock: '周一至五 9:30–16:00 美东(含盘前/盘后)' },
  { dim: '监管', crypto: '多数地区规则模糊、平台自律为主', stock: 'SEC / FINRA 强监管,信息披露强制且完善' },
  { dim: '资产托管', crypto: '可自托管,私钥即一切', stock: '券商托管,SIPC 最高 50 万美元保护' },
  { dim: '入金方式', crypto: '链上转账 / 法币通道', stock: '电汇 / ACH / Wise,1–3 个工作日' },
  { dim: '交易成本', crypto: 'Gas + 交易所费率', stock: '多数 0 佣金,成本在价差/汇率/利息' },
  { dim: '波动性', crypto: '极高,单日 ±20% 是常态', stock: '个股可剧烈,但大盘指数温和得多' },
  { dim: '收益来源', crypto: '价格 + 质押/挖矿收益', stock: '价格 + 分红 + 公司回购' },
  { dim: '信息来源', crypto: 'Twitter / 链上 / 社区叙事', stock: '财报 / SEC 文件 / 分析师覆盖' },
  { dim: '涨跌限制', crypto: '无涨跌停', stock: '个股无涨跌停,但有市场级熔断机制' },
];

/* ---------- 3. 学习路径 (Path) ---------- */
const PATH = [
  { n: 1, title: '认知迁移', desc: '用概念翻译器,把你已知的 crypto 概念映射到美股。建立"我其实已经会一半"的信心。', time: '约 15 分钟', level: '入门', color: 'crypto' },
  { n: 2, title: '选券商 & 开户', desc: '挑一家支持你所在地区的券商,完成 KYC,填好 W-8BEN(降低股息预扣税)。', time: '约 1 天(含审核)', level: '入门', color: 'crypto' },
  { n: 3, title: '入金到账', desc: '了解电汇 / Wise / ACH 的到账时间与手续费,做第一笔小额入金试水。', time: '1–3 个工作日', level: '入门', color: 'crypto' },
  { n: 4, title: '第一笔交易', desc: '认识 Ticker,搞懂市价单 vs 限价单,买入一手你看得懂的公司(或碎股)。', time: '约 10 分钟', level: '入门', color: 'stock' },
  { n: 5, title: '读懂一支股票', desc: 'K 线只是表象。学会看三张财务报表、PE/PS 估值,判断"贵不贵、好不好"。', time: '约 1 小时', level: '进阶', color: 'stock' },
  { n: 6, title: '组合与 ETF', desc: '认识 SPY / QQQ / VTI,理解分散与定投——美股版的"屯主流、别 all in 土狗"。', time: '约 30 分钟', level: '进阶', color: 'stock' },
  { n: 7, title: '风险与税务', desc: '仓位管理、止损纪律,以及资本利得税与股息税的基本规则(非美居民必看)。', time: '约 30 分钟', level: '进阶', color: 'gold' },
  { n: 8, title: '进阶玩法', desc: '期权对冲、打新申购,以及最难的一课:把"短炒手感"换成"长期持有心态"。', time: '持续修炼', level: '高级', color: 'gold' },
];

/* ---------- 4. 行情(演示数据) ---------- */
const INDICES = [
  { name: 'S&P 500', tk: 'SPX', price: '5,432.10', chg: '+0.62%', up: true, note: '美国大盘 500 强' },
  { name: 'Nasdaq 100', tk: 'NDX', price: '19,210.4', chg: '+0.94%', up: true, note: '科技股为主' },
  { name: 'Dow Jones', tk: 'DJI', price: '40,118.7', chg: '-0.18%', up: false, note: '30 家蓝筹' },
];
const STOCKS = [
  { tk: 'AAPL', name: '苹果', price: '214.32', chg: '-0.81%', up: false, cap: '3.3T' },
  { tk: 'NVDA', name: '英伟达', price: '128.74', chg: '+3.12%', up: true, cap: '3.2T' },
  { tk: 'MSFT', name: '微软', price: '449.10', chg: '+0.46%', up: true, cap: '3.3T' },
  { tk: 'TSLA', name: '特斯拉', price: '182.05', chg: '+1.74%', up: true, cap: '580B' },
  { tk: 'COIN', name: 'Coinbase', price: '241.66', chg: '+4.20%', up: true, cap: '60B' },
  { tk: 'MSTR', name: 'MicroStrategy', price: '1,512.9', chg: '+5.83%', up: true, cap: '28B' },
];
const CRYPTOS = [
  { tk: 'BTC', name: '比特币', price: '68,420', chg: '+2.41%', up: true, sym: '₿', bg: '#F7931A' },
  { tk: 'ETH', name: '以太坊', price: '3,712', chg: '+1.08%', up: true, sym: 'Ξ', bg: '#627EEA' },
  { tk: 'SOL', name: 'Solana', price: '162.4', chg: '-1.93%', up: false, sym: '◎', bg: '#14F195' },
  { tk: 'USDC', name: 'USD Coin', price: '1.000', chg: '+0.01%', up: true, sym: '$', bg: '#2775CA' },
];
const CROSSMAP = [
  { hold: 'BTC 信仰者', icon: '₿', bg: '#F7931A', look: ['MSTR', 'COIN', 'IBIT'], why: '比特币的"上市公司代理":囤币大户、交易所、现货 ETF。' },
  { hold: 'DeFi 玩家', icon: 'Ξ', bg: '#627EEA', look: ['SOFI', 'HOOD', 'PYPL'], why: '链下的金融科技:数字券商、支付与新型银行。' },
  { hold: '算力 / GPU 党', icon: '◎', bg: '#14F195', look: ['NVDA', 'TSM', 'AMD'], why: '挖矿与 AI 共用的"卖铲人":芯片与代工龙头。' },
];

/* ---------- 5. 券商横评 ---------- */
const BROKERS = [
  { name: 'Interactive Brokers', zh: '盈透证券 IBKR', fit: '进阶 / 全球用户', min: '无硬性最低', fee: '低佣金 / 专业', cn: true, nonus: true, hot: true,
    pros: ['全球市场最全', '费率与汇率优', '工具专业强大'], cons: ['界面对新手偏复杂'] },
  { name: 'Charles Schwab', zh: '嘉信理财', fit: '稳健长期持有', min: '部分国际账户有门槛', fee: '0 佣金', cn: false, nonus: true, hot: false,
    pros: ['老牌大行、稳', '研究资源丰富', '客服成熟'], cons: ['国际开户流程较繁'] },
  { name: 'Firstrade', zh: '第一证券', fit: '华人新手友好', min: '$0', fee: '0 佣金', cn: true, nonus: true, hot: true,
    pros: ['全中文、好上手', '0 门槛 0 佣金', '出入金对华人友好'], cons: ['高阶工具较少'] },
  { name: 'moomoo / Futu', zh: '富途 moomoo', fit: '从港美股入门', min: '较低', fee: '低佣金', cn: true, nonus: true, hot: false,
    pros: ['App 体验一流', '中文 + 社区活跃', '数据可视化好'], cons: ['账户实体需留意'] },
  { name: 'Tiger Brokers', zh: '老虎证券', fit: '新手到进阶', min: '较低', fee: '低佣金', cn: true, nonus: true, hot: false,
    pros: ['中文、App 友好', '功能覆盖全面', '打新参与方便'], cons: ['费率结构需细看'] },
  { name: 'Robinhood', zh: 'Robinhood', fit: '在美用户 / 极简', min: '$0', fee: '0 佣金', cn: false, nonus: false, hot: false,
    pros: ['极简、上手快', '支持碎股 & 期权', '0 佣金'], cons: ['基本仅限美国居民', '研究工具弱'] },
];

/* ---------- 6. 精选短文 ---------- */
const ARTICLES = [
  { tag: '心态', color: 'crypto', title: '从"私钥焦虑"到"托管信任"', desc: '自托管让你睡不着?了解 SIPC、监管与券商破产时你的资产会怎样——也许该松口气了。', read: '6 分钟' },
  { tag: '基本面', color: 'stock', title: '把财报当成项目的"链上面板"', desc: '看不懂 10-K?用你读链上数据的思路,三张表 + 两个比率,5 分钟体检一家公司。', read: '8 分钟' },
  { tag: '规则', color: 'gold', title: '美股没有 7×24:重新理解"休市"', desc: '盘前盘后是什么?为什么财报总在盘后炸?一篇讲清美股的时间节奏。', read: '5 分钟' },
];

/* ---------- 7. FAQ ---------- */
const FAQ = [
  { q: '我不是美国人、也不在美国,能投美股吗?', a: '可以。很多券商(如盈透、第一证券、老虎、富途)支持非美居民开户,通常在线完成 KYC、填一份 W-8BEN 表即可。具体可开通地区以券商为准。' },
  { q: '能直接用 USDT / USDC 入金证券账户吗?', a: '通常不能直接入金。主流路径是:把稳定币在交易所出金到你的银行账户,再通过电汇 / Wise / ACH 转入券商。部分平台在探索合规通道,但目前以"出金到银行→入金券商"为主。' },
  { q: '我的美股资产安全吗?券商跑路怎么办?', a: '美国券商受 SEC / FINRA 监管,客户证券与公司自有资产隔离。SIPC 对证券提供最高 50 万美元(其中现金 25 万)的保护。这和 crypto 的"自托管自负盈亏"是两套逻辑。' },
  { q: '赚了钱 / 拿了分红,要交税吗?', a: '非美居民的股息通常预扣 30%,填好 W-8BEN 并依据所在国与美国的税收协定,可能降低税率。资本利得(买卖差价)对多数非美居民通常不在美国征税,但要遵守你所在地的税务规定。具体请咨询税务专业人士。' },
  { q: '美股会像 crypto 一样剧烈波动吗?', a: '个股可以很疯(尤其小盘、meme、财报日),但美股个股没有涨跌停;市场级别有熔断机制。整体大盘指数(如 S&P 500)的波动比主流币温和不少。' },
  { q: '是不是要很多钱才能开始?', a: '不用。许多券商支持碎股(fractional shares),几美元就能买入苹果、英伟达的一小块。建议先小额跑通"入金→下单→出金"全流程再加码。' },
];

/* =========================================================
   渲染逻辑
   ========================================================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const colorMap = {
  crypto: { text: 'text-crypto', bg: 'bg-crypto/15', ring: 'border-crypto/30', dot: 'bg-crypto' },
  stock: { text: 'text-stock', bg: 'bg-stock/15', ring: 'border-stock/30', dot: 'bg-stock' },
  gold: { text: 'text-gold', bg: 'bg-gold/15', ring: 'border-gold/30', dot: 'bg-gold' },
};

/* ---- Translator ---- */
let activeConcept = 0;
function renderChips(filter = '') {
  const list = $('#chipList');
  const f = filter.trim().toLowerCase();
  list.innerHTML = '';
  CONCEPTS.forEach((c, i) => {
    if (f && !(`${c.crypto}${c.stock}${c.tag}`.toLowerCase().includes(f))) return;
    const btn = document.createElement('button');
    btn.className = `chip text-sm px-3 py-2 rounded-xl border border-white/10 bg-ink/40 text-slate-300 hover:border-crypto/40 hover:text-white transition ${i === activeConcept ? 'chip-active' : ''}`;
    btn.dataset.i = i;
    btn.textContent = c.crypto;
    btn.addEventListener('click', () => { activeConcept = i; renderChips(filter); renderDetail(); });
    list.appendChild(btn);
  });
  if (!list.children.length) {
    list.innerHTML = '<div class="text-sm text-slate-500 py-6 px-2">没有匹配的概念,换个关键词试试 🔍</div>';
  }
}
function renderDetail() {
  const c = CONCEPTS[activeConcept];
  $('#translateDetail').innerHTML = `
    <div class="flex flex-col h-full">
      <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div class="rounded-2xl border border-crypto/30 bg-crypto/10 p-4">
          <div class="text-[11px] font-semibold text-crypto mb-1">CRYPTO · 你熟悉的</div>
          <div class="font-display font-bold text-xl text-white leading-tight">${c.crypto}</div>
          <div class="text-xs text-slate-400 mt-1">${c.cryptoSub}</div>
        </div>
        <div class="hidden sm:grid place-items-center text-slate-500">
          <svg viewBox="0 0 24 24" class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3l4 4-4 4M20 7H8M8 21l-4-4 4-4M4 17h12"/></svg>
        </div>
        <div class="rounded-2xl border border-stock/30 bg-stock/10 p-4">
          <div class="text-[11px] font-semibold text-stock mb-1">US STOCKS · 对应的</div>
          <div class="font-display font-bold text-xl text-white leading-tight">${c.stock}</div>
          <div class="text-xs text-slate-400 mt-1">${c.stockSub}</div>
        </div>
      </div>

      <div class="mt-6 space-y-4 flex-1">
        <div class="flex gap-3">
          <div class="mt-0.5 shrink-0 grid place-items-center w-7 h-7 rounded-lg bg-stock/15 text-stock"><svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
          <div><div class="text-sm font-semibold text-stock">相同点</div><p class="text-sm text-slate-300 leading-relaxed mt-0.5">${c.same}</p></div>
        </div>
        <div class="flex gap-3">
          <div class="mt-0.5 shrink-0 grid place-items-center w-7 h-7 rounded-lg bg-gold/15 text-gold"><svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg></div>
          <div><div class="text-sm font-semibold text-gold">不同点 · 别踩坑</div><p class="text-sm text-slate-300 leading-relaxed mt-0.5">${c.diff}</p></div>
        </div>
        <div class="flex gap-3">
          <div class="mt-0.5 shrink-0 grid place-items-center w-7 h-7 rounded-lg bg-crypto/15 text-crypto"><svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2zM9 21h6"/></svg></div>
          <div><div class="text-sm font-semibold text-crypto">迁移提示</div><p class="text-sm text-slate-300 leading-relaxed mt-0.5">${c.tip}</p></div>
        </div>
      </div>

      <div class="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <span class="text-xs px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10">#${c.tag}</span>
        <div class="flex items-center gap-2">
          <button id="prevConcept" class="grid place-items-center w-8 h-8 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition"><svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
          <span class="text-xs text-slate-600 font-mono tabular-nums">${activeConcept + 1} / ${CONCEPTS.length}</span>
          <button id="nextConcept" class="grid place-items-center w-8 h-8 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition"><svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
        </div>
      </div>
    </div>`;
  $('#prevConcept').addEventListener('click', () => { activeConcept = (activeConcept - 1 + CONCEPTS.length) % CONCEPTS.length; renderChips($('#translateSearch').value); renderDetail(); });
  $('#nextConcept').addEventListener('click', () => { activeConcept = (activeConcept + 1) % CONCEPTS.length; renderChips($('#translateSearch').value); renderDetail(); });
}

/* ---- Compare ---- */
function renderCompare() {
  $('#compareBody').innerHTML = COMPARE.map((r, i) => `
    <div class="grid grid-cols-12 text-sm ${i % 2 ? 'bg-white/[.015]' : ''}">
      <div class="col-span-12 sm:col-span-3 px-5 py-4 font-medium text-slate-300 border-t border-white/5 flex items-center gap-2">
        <span class="sm:hidden text-[11px] text-slate-600">维度·</span>${r.dim}
      </div>
      <div class="col-span-6 sm:col-span-4 px-5 py-4 text-slate-400 border-t border-white/5">${r.crypto}</div>
      <div class="col-span-6 sm:col-span-5 px-5 py-4 text-slate-200 border-t border-white/5 bg-stock/[.03]">${r.stock}</div>
    </div>`).join('');
}

/* ---- Path ---- */
function renderPath() {
  $('#pathList').innerHTML = PATH.map((p) => {
    const c = colorMap[p.color];
    return `
    <div class="reveal group relative card-grad ring-line rounded-2xl p-5 hover-lift border border-transparent flex gap-4">
      <div class="shrink-0 flex flex-col items-center">
        <div class="grid place-items-center w-10 h-10 rounded-xl ${c.bg} ${c.text} font-display font-bold">${p.n}</div>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="font-display font-bold text-white text-lg">${p.title}</h3>
          <span class="text-[11px] px-2 py-0.5 rounded-full ${c.bg} ${c.text} font-medium">${p.level}</span>
        </div>
        <p class="mt-1.5 text-sm text-slate-400 leading-relaxed">${p.desc}</p>
        <div class="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          ${p.time}
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ---- Markets ---- */
function tickerColor(up) { return up ? 'text-stock' : 'text-rose'; }
function arrow(up) { return up
  ? '<svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>'
  : '<svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>'; }

function renderMarkets() {
  $('#indexRow').innerHTML = INDICES.map((x) => `
    <div class="card-grad ring-line rounded-2xl p-5 hover-lift border border-transparent">
      <div class="flex items-center justify-between">
        <div><div class="font-display font-bold text-white">${x.name}</div><div class="text-xs text-slate-500 font-mono">${x.tk} · ${x.note}</div></div>
        <span class="inline-flex items-center gap-1 text-sm font-mono font-semibold ${tickerColor(x.up)}">${arrow(x.up)}${x.chg}</span>
      </div>
      <div class="mt-3 font-mono text-2xl font-semibold text-white tabular-nums">${x.price}</div>
    </div>`).join('');

  $('#stockGrid').innerHTML = STOCKS.map((s) => `
    <div class="card-grad ring-line rounded-xl p-4 hover-lift border border-transparent flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="grid place-items-center w-9 h-9 rounded-lg bg-white/8 font-mono font-bold text-xs text-slate-200">${s.tk.slice(0,2)}</div>
        <div><div class="font-mono font-semibold text-white text-sm">${s.tk}</div><div class="text-xs text-slate-500">${s.name} · ${s.cap}</div></div>
      </div>
      <div class="text-right"><div class="font-mono text-sm text-slate-200 tabular-nums">${s.price}</div><div class="inline-flex items-center gap-0.5 text-xs font-mono ${tickerColor(s.up)}">${arrow(s.up)}${s.chg}</div></div>
    </div>`).join('');

  $('#cryptoGrid').innerHTML = CRYPTOS.map((c) => `
    <div class="card-grad ring-line rounded-xl p-4 hover-lift border border-transparent flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="grid place-items-center w-9 h-9 rounded-lg text-white font-bold" style="background:${c.bg}">${c.sym}</div>
        <div><div class="font-mono font-semibold text-white text-sm">${c.tk}</div><div class="text-xs text-slate-500">${c.name}</div></div>
      </div>
      <div class="text-right"><div class="font-mono text-sm text-slate-200 tabular-nums">$${c.price}</div><div class="inline-flex items-center gap-0.5 text-xs font-mono ${tickerColor(c.up)}">${arrow(c.up)}${c.chg}</div></div>
    </div>`).join('');

  $('#crossMap').innerHTML = CROSSMAP.map((m) => `
    <div class="rounded-xl bg-ink/40 border border-white/8 p-4">
      <div class="flex items-center gap-2 mb-3">
        <div class="grid place-items-center w-7 h-7 rounded-lg text-white font-bold text-sm" style="background:${m.bg}">${m.icon}</div>
        <span class="text-sm font-semibold text-white">${m.hold}</span>
      </div>
      <div class="flex flex-wrap gap-1.5 mb-2.5">
        ${m.look.map((t) => `<span class="font-mono text-xs px-2 py-1 rounded-md bg-stock/10 text-stock border border-stock/20">${t}</span>`).join('')}
      </div>
      <p class="text-xs text-slate-400 leading-relaxed">${m.why}</p>
    </div>`).join('');
}

/* ---- Brokers ---- */
function badge(ok, label) {
  return ok
    ? `<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-stock/12 text-stock border border-stock/20"><svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>${label}</span>`
    : `<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 border border-white/10">${label}</span>`;
}
function renderBrokers() {
  $('#brokerGrid').innerHTML = BROKERS.map((b) => `
    <div class="card-grad ring-line rounded-2xl p-6 hover-lift border ${b.hot ? 'border-crypto/30' : 'border-transparent'} relative flex flex-col">
      ${b.hot ? '<span class="absolute -top-2.5 right-5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-crypto text-ink">华人热门</span>' : ''}
      <div class="flex items-start justify-between">
        <div>
          <div class="font-display font-bold text-white text-lg leading-tight">${b.zh}</div>
          <div class="text-xs text-slate-500 font-mono mt-0.5">${b.name}</div>
        </div>
      </div>
      <div class="mt-3 inline-flex w-fit items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10">
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
        适合:${b.fit}
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><div class="text-xs text-slate-500">最低入金</div><div class="text-slate-200 font-medium mt-0.5">${b.min}</div></div>
        <div><div class="text-xs text-slate-500">佣金</div><div class="text-slate-200 font-medium mt-0.5">${b.fee}</div></div>
      </div>
      <div class="mt-4 flex flex-wrap gap-1.5">
        ${badge(b.cn, '中文支持')} ${badge(b.nonus, '非美居民')}
      </div>
      <div class="mt-4 pt-4 border-t border-white/5 space-y-1.5 flex-1">
        ${b.pros.map((p) => `<div class="flex items-start gap-2 text-xs text-slate-300"><svg viewBox="0 0 24 24" class="w-3.5 h-3.5 text-stock mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>${p}</div>`).join('')}
        ${b.cons.map((p) => `<div class="flex items-start gap-2 text-xs text-slate-500"><svg viewBox="0 0 24 24" class="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>${p}</div>`).join('')}
      </div>
    </div>`).join('');
}

/* ---- Articles ---- */
function renderArticles() {
  $('#articleGrid').innerHTML = ARTICLES.map((a) => {
    const c = colorMap[a.color];
    return `
    <a href="#" class="group card-grad ring-line rounded-2xl p-6 hover-lift border border-transparent block">
      <div class="flex items-center justify-between mb-4">
        <span class="text-xs px-2.5 py-1 rounded-full ${c.bg} ${c.text} font-medium">${a.tag}</span>
        <span class="text-xs text-slate-600 font-mono">${a.read}</span>
      </div>
      <h3 class="font-display font-bold text-white text-lg leading-snug group-hover:text-gradient transition">${a.title}</h3>
      <p class="mt-2 text-sm text-slate-400 leading-relaxed">${a.desc}</p>
      <div class="mt-4 inline-flex items-center gap-1 text-sm font-medium ${c.text}">阅读 <svg viewBox="0 0 24 24" class="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
    </a>`;
  }).join('');
}

/* ---- FAQ ---- */
function renderFaq() {
  $('#faqList').innerHTML = FAQ.map((f) => `
    <details class="card-grad ring-line rounded-2xl border border-transparent overflow-hidden">
      <summary class="flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[.02] transition">
        <span class="font-medium text-slate-100 text-[15px]">${f.q}</span>
        <span class="faq-ico shrink-0 grid place-items-center w-7 h-7 rounded-lg bg-white/5 text-slate-400 transition-transform"><svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
      </summary>
      <div class="px-5 pb-5 -mt-1 text-sm text-slate-400 leading-relaxed">${f.a}</div>
    </details>`).join('');
}

/* ---- Hero flip auto-cycle ---- */
function startHeroFlip() {
  const flip = $('#heroFlip');
  if (!flip) return;
  let i = 0, showingBack = false;
  const set = (c) => {
    $('#flipCryptoTitle').textContent = c.crypto;
    $('#flipCryptoSub').textContent = c.cryptoSub;
    $('#flipStockTitle').textContent = c.stock;
    $('#flipStockSub').textContent = c.stockSub;
  };
  set(CONCEPTS[0]);
  setInterval(() => {
    showingBack = !showingBack;
    flip.classList.toggle('flipped', showingBack);
    if (!showingBack) {
      // after flipping back to front, advance to next concept
      i = (i + 1) % CONCEPTS.length;
      setTimeout(() => set(CONCEPTS[i]), 120);
    }
  }, 2600);
}

/* ---- Marquee ---- */
function renderMarquee() {
  const items = [
    '钱包 → 券商账户', '代币 → 股票', 'Gas → 佣金', '质押 → 分红', '稳定币 → 货币基金',
    '白皮书 → 财报 10-K', '空投 → 打新 IPO', 'DEX → 纳斯达克', '巨鲸 → 13F 机构持仓', '永续合约 → 期权',
  ];
  const row = items.map((t) => `<span class="inline-flex items-center gap-2"><span class="text-crypto">◆</span>${t}</span>`).join('');
  $('#marquee').innerHTML = row + row; // duplicate for seamless loop
}

/* ---- Count up ---- */
function countUp() {
  $$('[data-count]').forEach((el) => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '';
    let cur = 0; const step = Math.max(1, Math.ceil(target / 28));
    const tick = () => { cur = Math.min(target, cur + step); el.textContent = cur + suffix; if (cur < target) requestAnimationFrame(tick); };
    tick();
  });
}

/* ---- Reveal on scroll ---- */
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));
}

/* ---- Mobile nav + active link ---- */
function initNav() {
  const t = $('#navToggle'), m = $('#mobileMenu');
  t?.addEventListener('click', () => m.classList.toggle('hidden'));
  $$('#mobileMenu a').forEach((a) => a.addEventListener('click', () => m.classList.add('hidden')));
}

/* ---- Boot ---- */
document.addEventListener('DOMContentLoaded', () => {
  renderChips(); renderDetail();
  renderCompare(); renderPath(); renderMarkets(); renderBrokers(); renderArticles(); renderFaq();
  renderMarquee(); startHeroFlip();
  $('#translateSearch').addEventListener('input', (e) => renderChips(e.target.value));
  initReveal(); initNav();
  // count up once hero in view
  setTimeout(countUp, 350);
});
