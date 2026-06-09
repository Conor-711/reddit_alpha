import { Panel, Eyebrow } from "@/components/ui";
import { MarkdownLite } from "@/components/MarkdownLite";
import { getDailyBrief } from "@/lib/queries";

export default function BriefPage() {
  const b = getDailyBrief();
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <Eyebrow color="text-gold">每日 AI 简报</Eyebrow>
        <h1 className="mt-1 font-display font-extrabold text-cream text-2xl">Reddit 在说什么</h1>
      </div>

      {!b ? (
        <Panel className="p-8 text-center text-sm text-neutral-500">
          暂无简报，请先运行 <code className="text-amber">make brief</code>（或 <code className="text-amber">make demo</code>）。
        </Panel>
      ) : (
        <>
          {b.highlights.length > 0 && (
            <Panel className="p-5">
              <div className="text-xs text-neutral-500 mb-2">今日要点</div>
              <div className="flex flex-wrap gap-2">
                {b.highlights.map((h, i) => (
                  <span key={i} className="text-sm px-3 py-1.5 rounded-lg bg-amber/10 text-amber ring-1 ring-inset ring-amber/15">
                    {h}
                  </span>
                ))}
              </div>
            </Panel>
          )}
          <Panel className="p-6 sm:p-8">
            <MarkdownLite md={b.markdown} />
            <div className="mt-6 pt-4 border-t border-line text-xs text-neutral-600">
              模型：{b.model} · 日期：{b.brief_date}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
