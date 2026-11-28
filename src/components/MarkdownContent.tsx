import { ReactNode } from 'react';

function inlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-black/[0.06] px-1 py-0.5 text-[0.9em]">{part.slice(1, -1)}</code>;
    return <span key={index}>{part}</span>;
  });
}

const cells = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());

export function MarkdownContent({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const next = lines[index + 1] ?? '';
    if (line.includes('|') && /^\s*\|?\s*:?-{3,}/.test(next)) {
      const headers = cells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(cells(lines[index]));
        index += 1;
      }
      blocks.push(<div key={`table-${index}`} className="my-3 overflow-x-auto rounded-xl border border-black/10"><table className="w-full min-w-[420px] border-collapse text-left text-sm"><thead className="bg-black/[0.04]"><tr>{headers.map((cell, i) => <th key={i} className="border-b border-black/10 px-3 py-2 font-semibold">{inlineMarkdown(cell)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="even:bg-black/[0.02]">{headers.map((_, i) => <td key={i} className="border-b border-black/[0.06] px-3 py-2 align-top">{inlineMarkdown(row[i] ?? '')}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (!line.trim()) { index += 1; continue; }
    if (line.startsWith('### ')) blocks.push(<h5 key={index} className="mt-3 font-semibold">{inlineMarkdown(line.slice(4))}</h5>);
    else if (line.startsWith('## ')) blocks.push(<h4 key={index} className="mt-3 font-semibold">{inlineMarkdown(line.slice(3))}</h4>);
    else if (line.startsWith('- ')) blocks.push(<li key={index} className="ml-5 list-disc">{inlineMarkdown(line.slice(2))}</li>);
    else blocks.push(<p key={index}>{inlineMarkdown(line.replace(/^>\s?/, ''))}</p>);
    index += 1;
  }
  return <div className="space-y-2">{blocks}</div>;
}
