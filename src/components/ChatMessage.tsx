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
      <div className="flex justify-end animate-fade-slide">
        <div className="max-w-[82%] sm:max-w-[70%] rounded-full bg-white/80 backdrop-blur-2xl text-[#111113] px-5 py-3 text-sm leading-relaxed border border-white/90 shadow-[0_10px_30px_rgba(38,43,102,0.1)]">
          {message.attachedFileName && (
            <div className="mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50/80 text-[11px] text-indigo-900">
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
      <div className="w-8 h-8 rounded-full dia-glass-subtle flex items-center justify-center shrink-0 mt-1.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {message.isStreaming && <ThinkingOrb statusText={orbStatusText} />}

        {result && (
          <div className="dia-glass-blend rounded-[36px] p-5 sm:p-7 space-y-5 animate-fade-slide transition-all duration-500">
            {/* Soft Header without hard divider cuts */}
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.55)]" />
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#4A4A58]">
                      Verified by 5 Agents
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium tracking-tight text-[#111113] mt-1">
                    {result.briefTitle}
                  </h3>
                </div>

                <div className="px-3.5 py-1 rounded-full bg-white/65 backdrop-blur-md border border-white/80 text-xs font-medium text-indigo-950 shrink-0 shadow-2xs">
                  Critic {result.criticInitialScore} → {result.criticFinalScore}/100
                </div>
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/50 backdrop-blur-md border border-white/70 self-start">
                <button
                  type="button"
                  onClick={() => setActiveTab('brief')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                    activeTab === 'brief'
                      ? 'bg-[#111113] text-white shadow-sm'
                      : 'text-[#4A4A58] hover:text-[#111113]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Brief</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pipeline')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                    activeTab === 'pipeline'
                      ? 'bg-[#111113] text-white shadow-sm'
                      : 'text-[#4A4A58] hover:text-[#111113]'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Agent Trace</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('memory')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                    activeTab === 'memory'
                      ? 'bg-[#111113] text-white shadow-sm'
                      : 'text-[#4A4A58] hover:text-[#111113]'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Shared Memory</span>
                </button>
              </div>
            </div>

            {/* Tab Content with smooth fade-slide transition */}
            <div key={activeTab} className="animate-fade-slide">
              {activeTab === 'brief' && (
                <div className="space-y-4">
                  <div className="rounded-3xl bg-white/55 backdrop-blur-md border border-white/75 px-4 py-3 text-xs text-indigo-950 leading-relaxed">
                    <span className="font-semibold">Self-Correction: </span>
                    {result.criticNote}
                  </div>

                  <div className="space-y-4 px-1">
                    {result.briefSections.map((sec) => (
                      <div key={sec.heading}>
                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#555565]">
                          {sec.heading}
                        </h4>
                        <p className="mt-1 text-sm text-[#1E1E26] leading-relaxed">
                          {sec.body}
                        </p>
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
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] transition-all duration-200 cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#111113] text-white border-[#111113]'
                                  : 'bg-white/60 hover:bg-white/85 text-[#2A2A35] border-white/80'
                              }`}
                            >
                              <span className="font-semibold">[{cite.id}]</span>
                              <span>{cite.title}</span>
                            </button>
                          );
                        })}
                      </div>

                      {selectedCitation && (
                        <div className="rounded-3xl bg-white/65 backdrop-blur-md border border-white/85 p-3.5 text-xs text-[#2A2A35] animate-fade-slide">
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

              {activeTab === 'pipeline' && message.agents && (
                <AgentPipeline
                  agents={message.agents}
                  criticInitialScore={result.criticInitialScore}
                  criticFinalScore={result.criticFinalScore}
                />
              )}

              {activeTab === 'memory' && (
                <div className="rounded-3xl bg-white/60 backdrop-blur-md border border-white/80 p-4 overflow-x-auto">
                  <span className="text-[10px] uppercase tracking-wider text-[#555565] block mb-2">
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

            {/* Blended Rule #6 Approval Pod (no hard horizontal cut) */}
            {action && (
              <div className="rounded-[28px] bg-white/48 backdrop-blur-xl border border-white/75 p-4 sm:p-5 space-y-3 transition-all duration-300">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-950">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Approval Required (Rule #6): {action.title}</span>
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
                    className="w-full rounded-3xl bg-white/85 border border-white p-3.5 font-mono-code text-xs text-[#111113] focus:outline-none"
                  />
                ) : (
                  <pre className="rounded-3xl bg-white/65 border border-white/85 text-[#22222A] p-3.5 font-mono-code text-[11px] whitespace-pre-wrap overflow-x-auto">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-white/75 hover:bg-white border border-white text-[#111113] transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectAction(message.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-rose-700 hover:bg-rose-50/80 transition cursor-pointer ml-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                ) : (
                  <div
                    className={`px-4 py-2.5 rounded-full text-xs font-medium animate-fade-slide ${
                      action.status === 'approved'
                        ? 'bg-emerald-50/85 text-emerald-950 border border-emerald-200/80'
                        : 'bg-rose-50/85 text-rose-950 border border-rose-200/80'
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
