import {
  Check,
  Code2,
  Copy,
  Edit3,
  FileText,
  GitBranch,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ReactNode, useState } from 'react';
import { ChatMessageItem } from '../types';
import { AgentPipeline } from './AgentPipeline';

interface ArtifactPanelProps {
  message: ChatMessageItem;
  onApproveAction: (messageId: string, editedPayload?: string) => void;
  onRejectAction: (messageId: string) => void;
  onDownloadReport: (runId: string, format: 'md' | 'pdf') => Promise<void>;
  onClose?: () => void;
}

type PanelTab = 'document' | 'trace' | 'code';

function inlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-black/[0.06] px-1 py-0.5 text-[0.9em]">{part.slice(1, -1)}</code>;
    }
    return <span key={index}>{part}</span>;
  });
}

function MarkdownContent({ text }: { text: string }) {
  const lines = text.replace(/\\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (line.includes('|') && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) {
      const parseRow = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
      const headers = parseRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(parseRow(lines[index]));
        index += 1;
      }
      blocks.push(
        <div key={`table-${index}`} className="my-3 overflow-x-auto rounded-xl border border-black/10">
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <thead className="bg-black/[0.04]"><tr>{headers.map((cell, cellIndex) => <th key={cellIndex} className="border-b border-black/10 px-3 py-2 font-semibold">{inlineMarkdown(cell)}</th>)}</tr></thead>
            <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="even:bg-black/[0.02]">{headers.map((_, cellIndex) => <td key={cellIndex} className="border-b border-black/[0.06] px-3 py-2 align-top">{inlineMarkdown(row[cellIndex] ?? '')}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
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

export function ArtifactPanel({
  message,
  onApproveAction,
  onRejectAction,
  onDownloadReport,
  onClose,
}: ArtifactPanelProps) {
  const [tab, setTab] = useState<PanelTab>('document');
  const [selectedCitationId, setSelectedCitationId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPayload, setEditedPayload] = useState('');

  const result = message.result;
  if (!result) return null;
  const taskStatuses = result.taskStatuses ?? {};

  const action = result.proposedAction;
  const simulation = !result.mode || result.mode === 'simulation';
  const sharedMemory = (message.agents ?? []).reduce<Record<string, unknown>>((acc, a) => {
    if (a.memorySnapshot) acc[a.id] = a.memorySnapshot;
    return acc;
  }, {});

  const codePayload = JSON.stringify(
    {
      mission_id: result.id,
      domain: result.domain,
      critic_score: `${result.criticInitialScore} -> ${result.criticFinalScore}`,
      shared_memory: Object.keys(sharedMemory).length > 0 ? sharedMemory : {},
      proposed_action: action.payloadPreview,
    },
    null,
    2
  );

  const handleCopy = () => {
    void navigator.clipboard.writeText(codePayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const selectedCitation = result.citations.find((c) => c.id === selectedCitationId);

  return (
    <div className="h-full flex flex-col dia-glass-blend rounded-[34px] overflow-hidden animate-fade-slide">
      {/* Subtle indigo top-edge highlight */}
      <div className="h-[1.5px] w-full indigo-top-glow shrink-0" />

      {message.actionError && <p role="alert" className="px-5 pt-3 text-xs text-rose-800">{message.actionError}</p>}
      {/* Panel Header */}
      <div className="px-5 sm:px-6 pt-5 pb-3.5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.55)]" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#4A4A58]">
                {simulation ? 'Studio simulation' : result.mode === 'fallback'
                  ? 'Local fallback · model unavailable' : result.mode === 'local'
                    ? 'Local due-diligence run' : `${result.mode === 'groq' ? 'Groq' : 'Gemini'}-assisted run`}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#111113] mt-1 truncate">
              {result.briefTitle}
            </h2>
            {!simulation && (
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-indigo-900">
                {(['md', 'pdf'] as const).map((format) => (
                  <button key={format} type="button" className="underline" onClick={() => {
                    setDownloadError('');
                    void onDownloadReport(result.id, format).catch((error: Error) => setDownloadError(error.message));
                  }}>Download {format === 'md' ? 'Markdown' : 'PDF'}</button>
                ))}
                {downloadError && <span role="alert">{downloadError}</span>}
              </div>
            )}
            {result.drafts && result.drafts.length > 1 && (
              <details className="mt-2 text-xs text-indigo-950">
                <summary className="cursor-pointer">Review earlier drafts</summary>
                {result.drafts.slice(0, -1).map((draft, index) => (
                  <div key={index} className="mt-2 max-h-40 overflow-auto rounded-xl bg-white/70 p-3">
                    <p className="font-semibold">Draft {index + 1} · {draft.score}/100</p>
                    <p>{draft.feedback}</p>
                    <div className="mt-2 break-words"><MarkdownContent text={draft.body} /></div>
                  </div>
                ))}
              </details>
            )}

          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-white/75 border border-white text-[11px] font-medium text-indigo-950">
              Critic {result.criticInitialScore} → {result.criticFinalScore}/100
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="p-1.5 rounded-full hover:bg-white/70 text-[#555565] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Document / Trace / Code Tabs */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/55 border border-white/80">
            <button
              type="button"
              onClick={() => setTab('document')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                tab === 'document'
                  ? 'bg-[#111113] text-white shadow-sm'
                  : 'text-[#4A4A58] hover:text-[#111113]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Document</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('trace')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                tab === 'trace'
                  ? 'bg-[#111113] text-white shadow-sm'
                  : 'text-[#4A4A58] hover:text-[#111113]'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Agent Trace</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('code')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                tab === 'code'
                  ? 'bg-[#111113] text-white shadow-sm'
                  : 'text-[#4A4A58] hover:text-[#111113]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code / JSON</span>
            </button>
          </div>

          {tab === 'code' && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/75 hover:bg-white border border-white text-[#111113] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
        <div key={tab} className="animate-fade-slide">
          {tab === 'document' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-white/75 border border-white/90 shadow-[0_6px_20px_rgba(38,43,102,0.06)] px-4 py-3 text-xs text-indigo-950 leading-relaxed">
                <span className="font-semibold">Self-Correction: </span>
                {result.criticNote}
              </div>

              {result.plan && result.plan.length > 0 && (
                <details open className="rounded-3xl bg-white/65 border border-white/90 px-4 py-3 text-xs text-[#2A2A35]">
                  <summary className="cursor-pointer font-semibold">Task plan and agent assignments</summary>
                  <div className="mt-3 space-y-2">
                    {result.plan.map((task) => (
                      <div key={task.id} className="rounded-xl bg-white/75 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">{task.id}</span>
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-indigo-800">{taskStatuses?.[task.id] ?? 'queued'} · {task.owner}</span>
                        </div>
                        <p className="mt-1 text-[#555565]">{task.instruction}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              <div className="space-y-4 px-1">
                {result.briefSections.map((sec) => (
                  <div key={sec.heading}>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#555565]">
                      {sec.heading}
                    </h4>
                    <div className="mt-1 break-words text-sm text-[#1E1E26] leading-relaxed">
                      <MarkdownContent text={sec.body} />
                    </div>
                  </div>
                ))}
              </div>

              {result.citations.length > 0 && (
                <div className="pt-2 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-[#5A5A6B] mr-1">
                      Sources:
                    </span>
                    {result.citations.map((cite) => {
                      const isSelected = selectedCitationId === cite.id;
                      return (
                        <button
                          key={cite.id}
                          type="button"
                          onClick={() =>
                            setSelectedCitationId(isSelected ? null : cite.id)
                          }
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] transition cursor-pointer border ${
                            isSelected
                              ? 'bg-[#111113] text-white border-[#111113]'
                              : 'bg-white/65 hover:bg-white text-[#2A2A35] border-white/85'
                          }`}
                        >
                          <span className="font-semibold">[{cite.id}]</span>
                          <span>{cite.title}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedCitation && (
                    <div className="rounded-3xl bg-white/70 border border-white/90 p-3.5 text-xs text-[#2A2A35] animate-fade-slide">
                      <div className="flex items-center justify-between text-[11px] font-medium text-[#111113] mb-1">
                        <span>{selectedCitation.title}</span>
                        <span className="font-mono-code text-[#555565]">
                          {selectedCitation.source}
                        </span>
                      </div>
                      <p className="text-[#3A3A48]">{selectedCitation.snippet}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'trace' && message.agents && (
            <AgentPipeline
              agents={message.agents}
                isSimulation={simulation}
              criticInitialScore={result.criticInitialScore}
              criticFinalScore={result.criticFinalScore}
            />
          )}

          {tab === 'code' && (
            <div className="rounded-3xl bg-[#11141c] text-neutral-100 p-4 sm:p-5 overflow-x-auto border border-white/10 shadow-inner">
              <pre className="font-mono-code text-xs leading-relaxed">
                {codePayload}
              </pre>
            </div>
          )}
        </div>

        {/* Docked Action Approval Pod */}
        {action && (
          <div className="rounded-[28px] bg-white/75 border border-white/90 shadow-[0_10px_28px_rgba(38,43,102,0.08)] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Approval Required: {action.title}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100/80 border border-amber-200/80 text-amber-900">
                {action.riskLevel} Risk
              </span>
            </div>

            {isEditing ? (
              <textarea
                value={editedPayload}
                onChange={(e) => setEditedPayload(e.target.value)}
                rows={3}
                className="w-full rounded-2xl bg-white/90 border border-white p-3 font-mono-code text-xs text-[#111113] focus:outline-none"
              />
            ) : (
              <pre className="rounded-2xl bg-white/70 border border-white/90 text-[#22222A] p-3 font-mono-code text-[11px] whitespace-pre-wrap overflow-x-auto">
                {action.payloadPreview}
              </pre>
            )}

            {action.status === 'pending' ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={message.actionPending}
                  onClick={() => {
                    onApproveAction(message.id, isEditing ? editedPayload : undefined);
                    setIsEditing(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-[#111113] text-white hover:bg-[#2A2A32] transition cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Save & Approve' : 'Approve'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditing) setEditedPayload(action.payloadPreview);
                    setIsEditing(!isEditing);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-white/80 hover:bg-white border border-white text-[#111113] transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </button>
                <button
                  type="button"
                  disabled={message.actionPending}
                      onClick={() => onRejectAction(message.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-rose-700 hover:bg-rose-50/80 transition cursor-pointer ml-auto"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            ) : (
              <div
                className={`px-4 py-2 rounded-full text-xs font-medium ${
                  action.status === 'approved'
                    ? 'bg-emerald-50/90 text-emerald-950 border border-emerald-200/80'
                    : 'bg-rose-50/90 text-rose-950 border border-rose-200/80'
                }`}
              >
                {action.executionNote}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
