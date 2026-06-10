// 管理员判定：数据看板仅该固定账号可见。
// 邮箱在前端不是机密（仅作标识）；真正的访问控制在 Supabase 端——
// 分析聚合函数内用 is_admin() 校验 JWT 邮箱，非管理员即便绕过前端也读不到数据。
// 如需更换管理员邮箱：同时改这里的 NEXT_PUBLIC_ADMIN_EMAIL 与迁移里 is_admin() 的字面量。
export const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@redditalpha.xyz")
  .trim()
  .toLowerCase();

export function isAdminEmail(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL;
}
