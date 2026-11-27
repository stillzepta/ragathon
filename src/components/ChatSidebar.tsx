import { MessageSquare, Plus, ShieldCheck, X } from 'lucide-react';
import { ChatThread } from '../types';

interface ChatSidebarProps {
  open: boolean;
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onCloseMobile: () => void;
}

export function ChatSidebar({
  open,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onCloseMobile,
}: ChatSidebarProps) {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onCloseMobile}
        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] md:hidden"
      />

      <aside className="fixed md:static inset-y-0 left-0 z-40 w-60 shrink-0 bg-[#0b0d0d] border-r border-white/[0.07] flex flex-col transition-all duration-200">
        <div className="p-3.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-[#141818] hover:bg-[#1a1f1f] border border-white/10 text-xs font-medium text-white transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>New chat</span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-full hover:bg-white/10 text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-2 pb-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500">
            Workspace
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-0.5">
          {threads.length === 0 ? (
            <p className="text-xs text-neutral-600 px-2.5 py-2">
              No sessions yet
            </p>
          ) : (
            threads.map((thread) => {
              const active = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    onSelectThread(thread.id);
                    onCloseMobile();
                  }}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                    active
                      ? 'bg-white/[0.08] text-white font-medium border border-white/10'
                      : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-emerald-400/75" />
                  <span className="truncate">{thread.title}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111414] border border-white/[0.07] text-[11px] text-neutral-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">5 Agents · Rule #6 Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}
