import { ArrowUpRight, CheckCircle2, Paperclip, Sparkles } from 'lucide-react';
import { ChatMessageItem } from '../types';
import { ThinkingOrb } from './ThinkingOrb';

interface ChatMessageProps {
  message: ChatMessageItem;
  isSelected?: boolean;
  locked?: boolean;
  onUnlock?: () => void;
  onSelectArtifact?: (messageId: string) => void;
}

export function ChatMessage({
  message,
  isSelected,
  locked,
  onUnlock,
  onSelectArtifact,
}: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-fade-slide">
        <div className="max-w-[85%] rounded-full bg-white/85 backdrop-blur-2xl text-[#111113] px-4 py-2.5 text-sm leading-relaxed border border-white shadow-[0_8px_24px_rgba(38,43,102,0.08)]">
          {message.attachedFileName && (
            <div className="mb-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-[11px] text-indigo-900">
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
  const activeAgent = message.agents?.find(
    (a) => a.status === 'running' || a.status === 'rejected'
  );
  const orbStatusText = activeAgent
    ? `${activeAgent.name} — ${activeAgent.summary}`
    : 'AgentVerse is thinking...';

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full dia-glass-subtle flex items-center justify-center shrink-0 mt-1">
        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
      </div>

      <div className="flex-1 min-w-0 space-y-2.5">
        {message.isStreaming && <ThinkingOrb statusText={orbStatusText} />}
        {message.error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{message.error}</p>}

        {locked && ((!result && message.text) || result) ? (
          <button
            type="button"
            onClick={onUnlock}
            className="w-full text-left dia-glass-blend rounded-[26px] p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/85 transition animate-fade-slide"
          >
            <span className="text-sm text-[#4A4A58]">
              Answer ready — sign in to view
            </span>
            <span className="px-3 py-1 rounded-full bg-[#111113] text-white text-xs font-medium shrink-0">
              Sign in
            </span>
          </button>
        ) : (
          <>
            {!result && message.text && (
              <p className="dia-glass-blend rounded-[26px] p-4 whitespace-pre-wrap break-words text-sm leading-relaxed">
                {message.text}
              </p>
            )}

            {result && (
              <div className="dia-glass-blend rounded-[26px] p-4 space-y-2.5 animate-fade-slide">
                <p className="whitespace-pre-wrap break-words text-sm text-[#1E1E26] leading-relaxed">
                  {result.briefSections[0]?.body ?? result.criticNote}
                </p>

                {onSelectArtifact && (
                  <button
                    type="button"
                    onClick={() => onSelectArtifact(message.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition cursor-pointer border ${
                      isSelected
                        ? 'bg-[#111113] text-white border-[#111113]'
                        : 'bg-white/65 hover:bg-white text-[#111113] border-white/85'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-indigo-300' : 'text-indigo-600'
                        }`}
                      />
                      <span className="truncate">{result.briefTitle}</span>
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-75" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
