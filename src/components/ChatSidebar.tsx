import { MessageSquare, Plus, X } from 'lucide-react';
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
        className="fixed inset-0 z-30 bg-black/15 backdrop-blur-[2px] md:hidden"
      />

      <aside className="fixed md:static inset-y-0 left-0 z-40 w-60 shrink-0 bg-white/75 backdrop-blur-2xl border-r border-black/[0.06] flex flex-col transition-all duration-200">
        <div className="p-3.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-white hover:bg-indigo-50/60 border border-black/[0.07] text-xs font-medium text-[#111113] transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>New chat</span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-full hover:bg-black/[0.05] text-[#6E6E77]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-2 pb-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#7A7A85]">
            Workspace
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-0.5">
          {threads.length === 0 ? (
            <p className="text-xs text-[#8E8E99] px-2.5 py-2">
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
                      ? 'bg-white text-[#111113] font-medium shadow-2xs border border-black/[0.06]'
                      : 'text-[#555562] hover:bg-white/60 hover:text-[#111113]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                  <span className="truncate">{thread.title}</span>
                </button>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
