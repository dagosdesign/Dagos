import { Fragment, ReactNode } from 'react';

/* Minimal Markdown renderer for the grammar lessons: supports ##/### headings,
   **bold**, *italic*, `code`, bullet & numbered lists, pipe tables and blockquotes,
   styled for the dark/gold design system. */

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Split on **bold**, *italic*, `code`
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;
  let last = 0, m: RegExpExecArray | null, key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith('**')) out.push(<strong key={key++} className="font-semibold text-[#ffd978]">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={key++} className="px-1 py-0.5 rounded bg-white/[0.06] text-[#e3b553] font-mono text-[0.85em]">{tok.slice(1, -1)}</code>);
    else out.push(<em key={key++} className="italic text-white/80">{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return out;
}

function splitRow(row: string): string[] {
  return row.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());
}

export default function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0, key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // Tables
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={key++} className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-left text-[13px] border-collapse min-w-[340px]">
            <thead>
              <tr>
                {header.map((h, hi) => (
                  <th key={hi} className="border-b border-[#e3b553]/40 text-[#e3b553] font-semibold px-2.5 py-2 whitespace-nowrap">{inline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className={ri % 2 ? 'bg-white/[0.015]' : ''}>
                  {r.map((c, ci) => (
                    <td key={ci} className="border-b border-white/[0.05] text-white/75 font-light px-2.5 py-2 align-top">{inline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    const h = line.match(/^(#{2,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      if (level === 2) blocks.push(<h2 key={key++} className="text-xl font-serif text-[#e3b553] pt-2">{inline(h[2])}</h2>);
      else if (level === 3) blocks.push(<h3 key={key++} className="text-[15px] font-semibold text-white tracking-wide pt-1.5">{inline(h[2])}</h3>);
      else blocks.push(<h4 key={key++} className="text-[13px] font-semibold text-white/90 uppercase tracking-wider">{inline(h[2])}</h4>);
      i++;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote key={key++} className="border-l-2 border-[#e3b553]/50 pl-3.5 text-white/60 italic text-[13px] leading-relaxed">
          {inline(quote.join(' '))}
        </blockquote>
      );
      continue;
    }

    // Lists (bullet or numbered)
    if (/^\s*([-*]|\d+[.)])\s+/.test(line)) {
      const items: string[] = [];
      const ordered = /^\s*\d/.test(line);
      while (i < lines.length && /^\s*([-*]|\d+[.)])\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*]|\d+[.)])\s+/, ''));
        i++;
      }
      const List = ordered ? 'ol' : 'ul';
      blocks.push(
        <List key={key++} className={`space-y-1.5 pl-1 ${ordered ? 'list-decimal list-inside' : ''}`}>
          {items.map((it, ii) => (
            <li key={ii} className="text-[13.5px] text-white/75 font-light leading-relaxed flex gap-2">
              {!ordered && <span className="text-[#e3b553] mt-[1px] shrink-0">•</span>}
              <span>{inline(it)}</span>
            </li>
          ))}
        </List>
      );
      continue;
    }

    // Paragraph (merge consecutive plain lines)
    const para: string[] = [line];
    i++;
    while (
      i < lines.length && lines[i].trim() &&
      !/^(#{2,4})\s/.test(lines[i]) && !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('>') && !/^\s*([-*]|\d+[.)])\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="text-[13.5px] text-white/75 font-light leading-relaxed">
        {inline(para.join(' '))}
      </p>
    );
  }

  return <div className="space-y-3.5">{blocks}</div>;
}
