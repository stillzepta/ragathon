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
        className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] md:hidden"
      />

      <aside className="fixed md:static inset-y-0 left-0 z-40 w-60 shrink-0 bg-[#0a0a0c]/75 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col transition-all duration-200 pointer-events-auto">
        <div className="p-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-xs font-medium text-white transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New chat</span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3.5 pt-2 pb-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500">
            Chats
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {threads.length === 0 ? (
            <p className="text-xs text-neutral-500 px-2.5 py-2">
              No chats yet
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
                  className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                    active
                      ? 'bg-white/[0.12] text-white font-medium border border-white/10'
                      : 'text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                  <span className="truncate">{thread.title}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-white/[0.08]">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[11px] text-neutral-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">5 Agents · Human Approval On</span>
          </div>
        </div>
      </aside>
    </>
  );
}
