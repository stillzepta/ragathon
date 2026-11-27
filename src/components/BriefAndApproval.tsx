import { Check, Edit3, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { MissionResult } from '../types';

interface BriefAndApprovalProps {
  result: MissionResult | null;
  compareMode: boolean;
  isRunning: boolean;
  onApprove: (editedPayload?: string) => void;
  onReject: () => void;
}

export function BriefAndApproval({
  result,
  compareMode,
  isRunning,
  onApprove,
  onReject,
}: BriefAndApprovalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPayload, setEditedPayload] = useState('');

  if (isRunning && !result) {
    return (
      <div className="dia-glass rounded-3xl p-6 h-full min-h-[380px] flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-100/80 flex items-center justify-center mb-3 animate-pulse">
          <Sparkles className="w-5 h-5 text-emerald-700" />
        </div>
        <p className="text-sm font-medium text-[#141413]">
          Synthesizing verified brief...
        </p>
        <p className="text-xs text-[#6E6E6A] mt-1 max-w-xs">
          Waiting for parallel RAG + Tool forensics and Critic evaluation.
        </p>
      </div>
    );
  }

  if (!result) return null;

  const action = result.proposedAction;

  return (
    <div className="space-y-4">
      {/* Editorial Brief Card */}
      <div className="dia-glass rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#8E8E88]">
              Verified Agent Brief
            </span>
            <h2 className="text-xl font-medium tracking-tight text-[#141413] mt-1">
              {result.briefTitle}
            </h2>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            {result.criticFinalScore}/100
          </span>
        </div>

        {/* Critic Self-Improvement Note */}
        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/70 px-3.5 py-2.5 text-xs text-amber-950 leading-relaxed">
          <span className="font-medium">Self-Correction: </span>
          {result.criticNote}
        </div>

        {/* Compare vs Single LLM Split */}
        {compareMode && (
          <div className="rounded-2xl bg-[#141413]/[0.03] border border-black/[0.07] p-3.5 space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-medium text-[#6E6E6A]">
              Single-LLM Baseline (No Tools / No Critic)
            </span>
            <pre className="whitespace-pre-wrap font-sans text-xs text-[#4A4A46] leading-relaxed">
              {result.singleLlmComparison}
            </pre>
          </div>
        )}

        {/* Brief Sections */}
        <div className="space-y-4">
          {result.briefSections.map((sec) => (
            <div key={sec.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E6A] mb-1">
                {sec.heading}
              </h3>
              <p className="text-sm text-[#2A2A27] leading-relaxed">{sec.body}</p>
            </div>
          ))}
        </div>

        {/* Source Citations */}
        {result.citations.length > 0 && (
          <div className="pt-3 border-t border-black/[0.06] space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-[#8E8E88]">
              Grounded Citations
            </span>
            <div className="space-y-2">
              {result.citations.map((cite) => (
                <div
                  key={cite.id}
                  className="rounded-xl bg-black/[0.025] px-3 py-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 font-medium text-[#141413]">
                    <span>
                      [{cite.id}] {cite.title}
                    </span>
                    <span className="font-mono-code text-[10px] text-[#6E6E6A]">
                      {cite.source}
                    </span>
                  </div>
                  <p className="mt-1 text-[#5A5A55]">{cite.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rule #6: Human-in-the-Loop Approval Gate */}
      <div className="dia-glass rounded-3xl p-5 border border-amber-300/60 bg-gradient-to-br from-white/90 to-amber-50/40">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
              Human Approval Required (Rule #6)
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              action.riskLevel === 'High'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {action.riskLevel} Risk
          </span>
        </div>

        <h3 className="mt-2 text-sm font-medium text-[#141413]">{action.title}</h3>
        <p className="text-xs text-[#6E6E6A] mt-0.5">{action.description}</p>

        {isEditing ? (
          <textarea
            value={editedPayload}
            onChange={(e) => setEditedPayload(e.target.value)}
            rows={4}
            className="mt-3 w-full rounded-xl bg-white border border-black/15 p-2.5 font-mono-code text-xs text-[#141413] focus:outline-none"
          />
        ) : (
          <pre className="mt-3 rounded-xl bg-[#141413] text-neutral-100 p-3 font-mono-code text-[11px] whitespace-pre-wrap overflow-x-auto">
            {action.payloadPreview}
          </pre>
        )}

        {action.status === 'pending' ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onApprove(isEditing ? editedPayload : undefined);
                setIsEditing(false);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-[#141413] text-white hover:bg-[#2A2A28] transition cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-black/[0.05] hover:bg-black/[0.09] text-[#141413] transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
            </button>

            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-rose-700 hover:bg-rose-50 transition cursor-pointer ml-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
          </div>
        ) : (
          <div
            className={`mt-3 px-3.5 py-2 rounded-xl text-xs font-medium ${
              action.status === 'approved'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {action.executionNote}
          </div>
        )}
      </div>
    </div>
  );
}
