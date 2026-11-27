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
      {/* Mobile backdrop */}
      <div
        onClick={onCloseMobile}
        className="fixed inset-0 z-30 bg-black/15 backdrop-blur-[2px] md:hidden"
      />

      <aside className="fixed md:static inset-y-3 left-3 md:my-3 md:ml-3 z-40 w-64 shrink-0 rounded-[28px] dia-glass flex flex-col overflow-hidden transition-all duration-300">
        <div className="p-3.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full bg-white/75 hover:bg-white border border-white/90 text-xs font-medium text-[#141413] transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New chat</span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-2 rounded-full hover:bg-white/60 text-[#6E6E6A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-1 pb-1.5">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#7A7A74]">
            Recent Chats
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-1">
          {threads.length === 0 ? (
            <p className="text-xs text-[#7A7A74] px-3 py-2">
              Your conversations will appear here.
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
                  className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs transition-all cursor-pointer ${
                    active
                      ? 'bg-white/85 text-[#141413] font-medium shadow-2xs border border-white'
                      : 'text-[#5A5A55] hover:bg-white/50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#7A7A74]" />
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
