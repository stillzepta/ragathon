import {
  Check,
  Database,
  Edit3,
  FileText,
  GitBranch,
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

type ResponseTab = 'brief' | 'pipeline' | 'memory';

export function ChatMessage({
  message,
  onApproveAction,
  onRejectAction,
}: ChatMessageProps) {
  const [activeTab, setActiveTab] = useState<ResponseTab>('brief');
  const [selectedCitationId, setSelectedCitationId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPayload, setEditedPayload] = useState('');

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] sm:max-w-[70%] rounded-[24px] bg-white/12 backdrop-blur-xl text-white px-4 py-3 text-sm leading-relaxed border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
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

  const sharedMemory = (message.agents ?? []).reduce<Record<string, unknown>>((acc, a) => {
    if (a.memorySnapshot) acc[a.id] = a.memorySnapshot;
    return acc;
  }, {});

  const selectedCitation = result?.citations.find((c) => c.id === selectedCitationId);

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full dia-glass-subtle flex items-center justify-center shrink-0 mt-1">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {message.isStreaming && <ThinkingOrb statusText={orbStatusText} />}

        {result && (
          <div className="dia-glass rounded-[28px] overflow-hidden transition-all duration-300">
            <div className="px-5 sm:px-6 pt-5 pb-3.5 border-b border-white/[0.08] flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                      Verified by 5 Agents
                    </span>
                  </div>
                  <h3 className="text-lg font-medium tracking-tight text-white mt-1">
                    {result.briefTitle}
                  </h3>
                </div>

                <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-xs font-medium text-emerald-300 shrink-0">
                  Critic {result.criticInitialScore} → {result.criticFinalScore}/100
                </div>
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.06] self-start">
                <button
                  type="button"
                  onClick={() => setActiveTab('brief')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                    activeTab === 'brief'
                      ? 'bg-white text-[#030303] shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Brief</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pipeline')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                    activeTab === 'pipeline'
                      ? 'bg-white text-[#030303] shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Agent Trace</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('memory')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                    activeTab === 'memory'
                      ? 'bg-white text-[#030303] shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Shared Memory</span>
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {activeTab === 'brief' && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5 text-xs text-neutral-300 leading-relaxed">
                    <span className="font-semibold text-white">Self-Correction: </span>
                    {result.criticNote}
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
                    <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-500 mr-1">
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
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] transition cursor-pointer border ${
                                isSelected
                                  ? 'bg-white text-[#030303] border-white'
                                  : 'bg-white/[0.07] hover:bg-white/[0.12] text-neutral-300 border-white/10'
                              }`}
                            >
                              <span className="font-semibold">[{cite.id}]</span>
                              <span>{cite.title}</span>
                            </button>
                          );
                        })}
                      </div>

                      {selectedCitation && (
                        <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 text-xs text-neutral-300">
                          <div className="flex items-center justify-between text-[11px] font-medium text-white mb-1">
                            <span>{selectedCitation.title}</span>
                            <span className="font-mono-code text-neutral-400">
                              {selectedCitation.source}
                            </span>
                          </div>
                          <p className="text-neutral-300">{selectedCitation.snippet}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'pipeline' && message.agents && (
                <AgentPipeline
                  agents={message.agents}
                  criticInitialScore={result.criticInitialScore}
                  criticFinalScore={result.criticFinalScore}
                />
              )}

              {activeTab === 'memory' && (
                <div className="rounded-2xl bg-black/40 border border-white/10 p-4 overflow-x-auto">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-2">
                    Live Shared State Across Agents
                  </span>
                  <pre className="font-mono-code text-xs text-neutral-200 leading-relaxed">
                    {JSON.stringify(
                      Object.keys(sharedMemory).length > 0
                        ? sharedMemory
                        : { domain: result.domain, critic_score: result.criticFinalScore },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>

            {action && (
              <div className="px-5 sm:px-6 py-4 bg-white/[0.03] border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-200">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Approval Required (Rule #6): {action.title}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-400/15 border border-amber-400/25 text-amber-200">
                    {action.riskLevel} Risk
                  </span>
                </div>

                {isEditing ? (
                  <textarea
                    value={editedPayload}
                    onChange={(e) => setEditedPayload(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl bg-black/50 border border-white/20 p-3 font-mono-code text-xs text-white focus:outline-none"
                  />
                ) : (
                  <pre className="rounded-2xl bg-black/40 border border-white/10 text-neutral-300 p-3 font-mono-code text-[11px] whitespace-pre-wrap overflow-x-auto">
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-white text-[#030303] hover:bg-neutral-200 transition cursor-pointer shadow-sm"
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
                        ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/25'
                        : 'bg-rose-500/15 text-rose-200 border border-rose-400/25'
                    }`}
                  >
                    {action.executionNote}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
