/** @type {import('next').NextConfig} */
// 部署到 GitHub Pages 项目页（子路径）时设 NEXT_PUBLIC_BASE_PATH=/<repo>；
// 部署到根域名（Netlify/Cloudflare/Vercel/自定义域名）留空即可。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  // 静态导出：构建期读 DB 生成快照，产物在 out/，可部署到任何静态托管。
  // 静态导出仅用于生产构建(make site/make serve)；dev 用普通服务端模式，
  // 否则 output:export + 动态路由(/ticker/[symbol]) 在 next dev 下会误报缺 generateStaticParams。
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
