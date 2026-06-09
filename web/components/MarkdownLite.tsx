// 极简 markdown 渲染（覆盖简报用到的子集：# ## ###、- 列表、> 引用、**粗体**、[链接]、`代码`）。
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  let h = esc(s);
  h = h.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-white/8 text-amber text-[0.9em]">$1</code>');
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-cream font-semibold">$1</strong>');
  h = h.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-amber hover:underline">$1</a>');
  return h;
}

export function MarkdownLite({ md }: { md: string }) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  let key = 0;

  const flush = () => {
    if (list.length) {
      out.push(
        <ul key={key++} className="my-2 space-y-1.5 pl-1">
          {list.map((l, i) => (
            <li key={i} className="flex gap-2 text-sm text-neutral-300 leading-relaxed">
              <span className="mt-2 w-1 h-1 rounded-full bg-amber shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: inline(l) }} />
            </li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) {
      flush();
      out.push(<h3 key={key++} className="font-display font-bold text-cream text-base mt-4 mb-1" dangerouslySetInnerHTML={{ __html: inline(line.replace(/^###\s+/, "")) }} />);
    } else if (/^##\s+/.test(line)) {
      flush();
      out.push(<h2 key={key++} className="font-display font-bold text-cream text-lg mt-5 mb-2 pb-1 border-b border-line" dangerouslySetInnerHTML={{ __html: inline(line.replace(/^##\s+/, "")) }} />);
    } else if (/^#\s+/.test(line)) {
      flush();
      out.push(<h1 key={key++} className="font-display font-extrabold text-cream text-2xl mb-2" dangerouslySetInnerHTML={{ __html: inline(line.replace(/^#\s+/, "")) }} />);
    } else if (/^>\s?/.test(line)) {
      flush();
      out.push(<blockquote key={key++} className="my-3 pl-3 border-l-2 border-line text-sm text-neutral-500 italic" dangerouslySetInnerHTML={{ __html: inline(line.replace(/^>\s?/, "")) }} />);
    } else if (/^[-*]\s+/.test(line)) {
      list.push(line.replace(/^[-*]\s+/, ""));
    } else if (line.trim() === "") {
      flush();
    } else {
      flush();
      out.push(<p key={key++} className="my-2 text-sm text-neutral-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: inline(line) }} />);
    }
  }
  flush();
  return <div>{out}</div>;
}
