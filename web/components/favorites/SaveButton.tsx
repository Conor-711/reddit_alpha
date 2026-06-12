"use client";

// 通用收藏/追踪按钮。两种形态：
//   variant="bookmark" → 图标书签（帖子/评论收藏）
//   variant="follow"   → 带标签的胶囊（社区/标的/作者追踪）
// 未配置 Supabase → 不渲染（静默降级）；未登录 → 点击跳 /login。
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { withLang } from "@/lib/i18n";
import { useFavorites } from "./FavoritesProvider";
import type { CollectionKind, Snapshot } from "@/lib/favorites";

export function SaveButton({
  kind,
  refId,
  snapshot,
  variant = "bookmark",
  size = "sm",
  className = "",
}: {
  kind: CollectionKind;
  refId: string;
  snapshot?: Snapshot;
  variant?: "bookmark" | "follow";
  size?: "sm" | "xs";
  className?: string;
}) {
  const { lang, dict } = useLocale();
  const t = dict.favorites;
  const router = useRouter();
  const { configured, signedIn, isSaved, toggle } = useFavorites();

  if (!configured) return null;

  const saved = isSaved(kind, refId);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      router.push(withLang(lang, "/login"));
      return;
    }
    void toggle(kind, refId, snapshot);
  };

  if (variant === "follow") {
    const pad = size === "xs" ? "text-[11px] px-1.5 py-0.5 gap-0.5" : "text-xs px-2 py-1 gap-1";
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        title={saved ? t.following : t.follow}
        className={`inline-flex items-center rounded-md font-medium ring-1 ring-inset transition ${pad} ${
          saved
            ? "bg-reddit/12 text-reddit ring-reddit/25"
            : "text-neutral-400 ring-white/10 hover:text-reddit hover:ring-reddit/30"
        } ${className}`}
      >
        {saved ? <IconCheck className="w-3 h-3" /> : <IconPlus className="w-3 h-3" />}
        {saved ? t.following : t.follow}
      </button>
    );
  }

  // bookmark
  const box = size === "xs" ? "w-6 h-6" : "w-7 h-7";
  const ic = size === "xs" ? "w-4 h-4" : "w-[18px] h-[18px]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      title={saved ? t.saved : t.save}
      className={`inline-flex items-center justify-center rounded-md transition hover:bg-white/5 ${box} ${
        saved ? "text-reddit" : "text-neutral-500 hover:text-reddit"
      } ${className}`}
    >
      <IconBookmark filled={saved} className={ic} />
    </button>
  );
}

function IconBookmark({ filled, className = "" }: { filled?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
    </svg>
  );
}
function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
