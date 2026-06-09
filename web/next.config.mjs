/** @type {import('next').NextConfig} */
// 部署到 GitHub Pages 项目页（子路径）时设 NEXT_PUBLIC_BASE_PATH=/<repo>；
// 部署到根域名（Netlify/Cloudflare/Vercel/自定义域名）留空即可。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  // 静态导出：构建期读 DB 生成快照，产物在 out/，可部署到任何静态托管。
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
