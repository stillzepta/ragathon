import {
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  Loader2,
  Paperclip,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { ChatMessageItem } from '../types';
import { AgentPipeline } from './AgentPipeline';
import { ThinkingOrb } from './ThinkingOrb';

interface ChatMessageProps {
  message: ChatMessageItem;
  onApproveAction: (messageId: string, editedPayload?: string) => void;
  onRejectAction: (messageId: string) => void;
}

export function ChatMessage({
  message,
  onApproveAction,
  onRejectAction,
}: ChatMessageProps) {
  const [traceOpen, setTraceOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPayload, setEditedPayload] = useState('');

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] sm:max-w-[70%] rounded-[24px] bg-white/14 backdrop-blur-xl text-white px-4 py-3 text-sm leading-relaxed border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
          {message.attachedFileName && (
            <div className="mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] text-neutral-100">
              <Paperclip className="w-3 h-3" />
              <span>{message.attachedFileName}</span>
            </div>
          )}
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    );
  }

  const result = message.result;
  const action = result?.proposedAction;
  const activeAgent = message.agents?.find(
    (a) => a.status === 'running' || a.status === 'rejected'
  );
  const orbStatusText = activeAgent
    ? `${activeAgent.name} — ${activeAgent.summary}`
    : 'AgentVerse is thinking...';

  return (
    <div className="flex items-start gap-3">
      {/* Assistant Avatar */}
      <div className="w-8 h-8 rounded-full dia-glass-subtle flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-lime-400" />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Glowing Eclipse Orb while thinking */}
        {message.isStreaming && <ThinkingOrb statusText={orbStatusText} />}

        {/* Collapsible Multi-Agent Trace Pill */}
        {message.agents && (
          <div className="dia-glass-subtle rounded-[22px] overflow-hidden transition-all duration-300">
            <button
              type="button"
              onClick={() => setTraceOpen((v) => !v)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-neutral-300 hover:bg-white/5 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {message.isStreaming ? (
                  <Loader2 className="w-3.5 h-3.5 text-lime-400 animate-spin" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.7)]" />
                )}
                <span className="font-medium text-white">
                  {message.isStreaming
                    ? 'Inspect live agent pipeline'
                    : `Solved by 5 Agents · Critic ${result?.criticInitialScore ?? 64} → ${result?.criticFinalScore ?? 94}/100`}
                </span>
              </div>
              {traceOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              )}
            </button>

            {traceOpen && (
              <div className="p-3.5 pt-1 border-t border-white/10">
                <AgentPipeline
                  agents={message.agents}
                  criticInitialScore={result?.criticInitialScore}
                  criticFinalScore={result?.criticFinalScore}
                />
              </div>
            )}
          </div>
        )}

        {/* Assistant Answer */}
        {result && (
          <div className="dia-glass rounded-[28px] p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-base font-medium text-white">
                {result.briefTitle}
              </h3>
              <p className="mt-2 text-xs text-amber-200 bg-amber-500/10 border border-amber-400/25 rounded-2xl px-3.5 py-2">
                {result.criticNote}
              </p>
            </div>

            <div className="space-y-3.5">
              {result.briefSections.map((sec) => (
                <div key={sec.heading}>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    {sec.heading}
                  </h4>
                  <p className="mt-1 text-sm text-neutral-200 leading-relaxed">
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>

            {result.citations.length > 0 && (
              <div className="pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
                {result.citations.map((cite) => (
                  <span
                    key={cite.id}
                    title={cite.snippet}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/12 text-[11px] text-neutral-300"
                  >
                    <span className="font-semibold text-white">[{cite.id}]</span>
                    <span>{cite.title}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rule #6 Inline Human Approval Card */}
        {action && (
          <div className="dia-glass rounded-[28px] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Approval Required (Rule #6): {action.title}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-400/15 border border-amber-400/30 text-amber-200">
                {action.riskLevel} Risk
              </span>
            </div>

            {isEditing ? (
              <textarea
                value={editedPayload}
                onChange={(e) => setEditedPayload(e.target.value)}
                rows={3}
                className="w-full rounded-2xl bg-white/10 border border-white/20 p-3 font-mono-code text-xs text-white focus:outline-none"
              />
            ) : (
              <pre className="rounded-2xl bg-black/35 border border-white/10 text-neutral-200 p-3.5 font-mono-code text-[11px] whitespace-pre-wrap overflow-x-auto">
                {action.payloadPreview}
              </pre>
            )}

            {action.status === 'pending' ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onApproveAction(message.id, isEditing ? editedPayload : undefined);
                    setIsEditing(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-white text-[#0d0f12] hover:bg-neutral-200 transition cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Save & Approve' : 'Approve & Execute'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditing) setEditedPayload(action.payloadPreview);
                    setIsEditing(!isEditing);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-white/10 hover:bg-white/15 border border-white/15 text-white transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRejectAction(message.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-rose-300 hover:bg-rose-500/15 transition cursor-pointer ml-auto"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            ) : (
              <div
                className={`px-3.5 py-2 rounded-2xl text-xs font-medium ${
                  action.status === 'approved'
                    ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30'
                    : 'bg-rose-500/15 text-rose-200 border border-rose-400/30'
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
