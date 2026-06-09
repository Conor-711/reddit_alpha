import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { TickerTape } from "@/components/TickerTape";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookmarkHint } from "@/components/BookmarkHint";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { getDictionary, locales, defaultLocale, isLocale, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const d = getDictionary(params.lang);
  return { title: d.meta.title, description: d.meta.description };
}

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const dict = getDictionary(lang);

  return (
    <LocaleProvider lang={lang} dict={dict}>
      <Sidebar lang={lang} dict={dict} />
      <div className="app-main lg:pl-[232px]">
        <Topbar lang={lang} dict={dict} />
        <TickerTape />
        <main className="px-4 sm:px-6 lg:px-8 py-5 max-w-[1480px] mx-auto">{children}</main>
      </div>
      <ThemeToggle />
      <BookmarkHint />
    </LocaleProvider>
  );
}
