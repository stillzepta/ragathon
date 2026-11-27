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
        <div className="max-w-[82%] sm:max-w-[70%] rounded-[24px] bg-white/90 backdrop-blur-md text-[#111113] px-4 py-3 text-sm leading-relaxed border border-white shadow-[0_8px_24px_rgba(38,43,102,0.1)]">
          {message.attachedFileName && (
            <div className="mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-[11px] text-indigo-900">
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
        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {message.isStreaming && <ThinkingOrb statusText={orbStatusText} />}

        {result && (
          <div className="dia-glass rounded-[28px] overflow-hidden transition-all duration-300">
            <div className="px-5 sm:px-6 pt-5 pb-3.5 border-b border-black/[0.06] flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6E6E77]">
                      Verified by 5 Agents
                    </span>
                  </div>
                  <h3 className="text-lg font-medium tracking-tight text-[#111113] mt-1">
                    {result.briefTitle}
                  </h3>
                </div>

                <div className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-medium text-indigo-900 shrink-0">
                  Critic {result.criticInitialScore} → {result.criticFinalScore}/100
                </div>
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#F1F2F8] self-start">
                <button
                  type="button"
                  onClick={() => setActiveTab('brief')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                    activeTab === 'brief'
                      ? 'bg-[#111113] text-white shadow-2xs'
                      : 'text-[#555562] hover:text-[#111113]'
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
                      ? 'bg-[#111113] text-white shadow-2xs'
                      : 'text-[#555562] hover:text-[#111113]'
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
                      ? 'bg-[#111113] text-white shadow-2xs'
                      : 'text-[#555562] hover:text-[#111113]'
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
                  <div className="rounded-2xl bg-indigo-50/80 border border-indigo-200/70 px-3.5 py-2.5 text-xs text-indigo-950 leading-relaxed">
                    <span className="font-semibold">Self-Correction: </span>
                    {result.criticNote}
                  </div>

                  <div className="space-y-3.5">
                    {result.briefSections.map((sec) => (
                      <div key={sec.heading}>
                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E77]">
                          {sec.heading}
                        </h4>
                        <p className="mt-1 text-sm text-[#2A2A32] leading-relaxed">
                          {sec.body}
                        </p>
                      </div>
                    ))}
                  </div>

                  {result.citations.length > 0 && (
                    <div className="pt-3 border-t border-black/[0.06] space-y-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-[#7A7A85] mr-1">
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
                                  ? 'bg-[#111113] text-white border-[#111113]'
                                  : 'bg-[#F5F6FA] hover:bg-indigo-50 text-[#3A3A45] border-black/[0.06]'
                              }`}
                            >
                              <span className="font-semibold">[{cite.id}]</span>
                              <span>{cite.title}</span>
                            </button>
                          );
                        })}
                      </div>

                      {selectedCitation && (
                        <div className="rounded-2xl bg-[#F7F8FC] border border-indigo-100 p-3 text-xs text-[#3A3A45]">
                          <div className="flex items-center justify-between text-[11px] font-medium text-[#111113] mb-1">
                            <span>{selectedCitation.title}</span>
                            <span className="font-mono-code text-[#6E6E77]">
                              {selectedCitation.source}
                            </span>
                          </div>
                          <p className="text-[#4A4A55]">{selectedCitation.snippet}</p>
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
                <div className="rounded-2xl bg-[#F7F8FC] border border-indigo-100 p-4 overflow-x-auto">
                  <span className="text-[10px] uppercase tracking-wider text-[#6E6E77] block mb-2">
                    Live Shared State Across Agents
                  </span>
                  <pre className="font-mono-code text-xs text-[#111113] leading-relaxed">
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
              <div className="px-5 sm:px-6 py-4 bg-[#F7F8FC]/90 border-t border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Approval Required (Rule #6): {action.title}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 border border-amber-200 text-amber-900">
                    {action.riskLevel} Risk
                  </span>
                </div>

                {isEditing ? (
                  <textarea
                    value={editedPayload}
                    onChange={(e) => setEditedPayload(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl bg-white border border-black/15 p-3 font-mono-code text-xs text-[#111113] focus:outline-none"
                  />
                ) : (
                  <pre className="rounded-2xl bg-white border border-black/[0.07] text-[#2A2A32] p-3 font-mono-code text-[11px] whitespace-pre-wrap overflow-x-auto">
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-[#111113] text-white hover:bg-[#2A2A32] transition cursor-pointer shadow-sm"
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-white hover:bg-indigo-50 border border-black/[0.08] text-[#111113] transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectAction(message.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-rose-700 hover:bg-rose-50 transition cursor-pointer ml-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                ) : (
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-xs font-medium ${
                      action.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border border-rose-200'
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
