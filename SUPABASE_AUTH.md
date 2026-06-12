# 账号系统配置（Supabase Auth）

redditalpha 是**静态站点**，账号系统用 **Supabase Auth**（客户端 SDK）实现，支持 **Google** 与**邮箱密码**注册/登录。本文是一次性配置步骤（约 10 分钟）。

> 不配也能跑：缺少环境变量时，登录/注册页会提示"未配置"，站点其余部分照常工作。

## 1. 建 Supabase 项目
1. 打开 https://supabase.com → 新建 project（免费层即可）。
2. 左下 **Project Settings → API**，复制：
   - **Project URL**（形如 `https://abcd.supabase.co`）
   - **anon public** key
3. 在 `web/` 下新建 `web/.env.local`（已被 git 忽略）：
   ```bash
   cp web/.env.local.example web/.env.local
   ```
   填入：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
   > anon key 是**公开可暴露**的前端 key，放前端是安全的。

## 2. 开启邮箱登录
**Authentication → Providers → Email**：默认已开。
- 想免邮箱验证、注册即登录：关闭 **Confirm email**（开发期方便）。
- 保持开启则用户注册后需点确认邮件里的链接。

## 3. 配置 Google 登录
### 3a. Google Cloud 创建 OAuth 凭证
1. https://console.cloud.google.com → 新建/选择项目。
2. **APIs & Services → OAuth consent screen**：External，填应用名/邮箱，保存。
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**：
   - 类型选 **Web application**。
   - **Authorized redirect URIs** 填 Supabase 的回调（**注意是 supabase.co，不是你的站点**）：
     ```
     https://<你的project-ref>.supabase.co/auth/v1/callback
     ```
   - 创建后得到 **Client ID** 与 **Client Secret**。
### 3b. 填回 Supabase
**Authentication → Providers → Google**：开启，粘贴 Client ID 与 Client Secret，保存。

## 4. 设置站点与回调白名单
**Authentication → URL Configuration**：
- **Site URL**：你的站点根地址。
  - 本地开发：`http://localhost:3000`
  - 本地静态部署(`make serve`)：`http://localhost:8080`
  - 线上：你的域名
- **Redirect URLs**（加入下面这些，**注意末尾斜杠**，因为站点开了 trailingSlash）：
  ```
  http://localhost:3000/auth/callback/
  http://localhost:3000/reset-password/
  http://localhost:8080/auth/callback/
  http://localhost:8080/reset-password/
  https://你的域名/auth/callback/
  https://你的域名/reset-password/
  ```
  （部署到 GitHub Pages 项目页等子路径时，URL 要带上 basePath，如 `https://用户名.github.io/reddit_alpha/auth/callback/`，并在 `web/.env.local` 设 `NEXT_PUBLIC_BASE_PATH=/reddit_alpha`。）

## 5. 运行
- 开发：`make web-dev` → http://localhost:3000 ，右上角点「登录」。
- 静态部署：改完 `.env.local` 后重新 `make site`（产物 `web/out/`），再 `make serve`。
  > 环境变量在**构建期**注入前端，改了 env 必须重新 build。

## 功能清单
- `/login`、`/signup`：Google 一键 + 邮箱密码；`/forgot-password`、`/reset-password`：邮件重置；`/account`：资料/改密/登出；`/auth/callback`：OAuth 回调。
- 顶栏用户菜单（头像/邮箱/登出），全局会话由 `AuthProvider` 维护。
- `/me`（个人主页·私密）：帖子/评论收藏、社区/标的/作者追踪；全站卡片上的书签/「追踪」按钮由 `FavoritesProvider` + `SaveButton` 驱动。
  数据存 Supabase 的 `user_collections`（RLS 仅本人可读写）。**需先在 SQL Editor 执行迁移
  `supabase/migrations/20260612000007_user_collections.sql`**，否则收藏/追踪会静默写入失败。

## 说明
- 密码哈希、会话、令牌刷新均由 Supabase 处理；静态站点用客户端会话（localStorage）。
- 用户数据存在 Supabase 的 Postgres（`auth.users`），与项目"生产用 Postgres"的方向一致。
- 当前**数据看板是公开的**（不强制登录）；如需"登录才可见"，可在页面加客户端门禁（已具备 `useAuth` 与 `/account` 的门禁范式）。
