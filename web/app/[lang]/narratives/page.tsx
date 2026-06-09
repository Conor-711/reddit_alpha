import { PageHeader, HeaderStat } from "@/components/ui";
import { NarrativeCard } from "@/components/NarrativeCard";
import { AdSlot } from "@/components/AdSlot";
import { getNarratives } from "@/lib/queries";
import { getDictionary, isLocale, defaultLocale, type Locale } from "@/lib/i18n";

export default function NarrativesPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const t = getDictionary(lang).narratives;
  const narratives = getNarratives(24);
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t.eyebrow}
        eyebrowColor="text-gold"
        title={t.title}
        subtitle={t.subtitle}
        right={<HeaderStat label={t.stat} value={String(narratives.length)} tone="text-gold" />}
      />
      <AdSlot variant="banner" slot="narratives-top" />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {narratives.map((n) => (
          <NarrativeCard key={n.id} n={n} />
        ))}
        {narratives.length === 0 && <div className="text-sm text-neutral-600">{t.empty}</div>}
      </div>
    </div>
  );
}
