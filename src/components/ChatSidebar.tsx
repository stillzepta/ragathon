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
        className="fixed inset-0 z-30 bg-black/15 backdrop-blur-[1px] md:hidden"
      />

      <aside className="fixed md:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-[#F2F2F0] border-r border-black/[0.06] flex flex-col">
        <div className="p-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onNewChat}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 hover:bg-white border border-black/[0.06] text-xs font-medium text-[#141413] transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New chat</span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden ml-2 p-2 rounded-lg hover:bg-black/[0.05] text-[#6E6E6A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pt-2 pb-1">
          <span className="text-[10px] uppercase tracking-wider text-[#8E8E88] px-2">
            Recent Chats
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {threads.length === 0 ? (
            <p className="text-xs text-[#8E8E88] px-3 py-2">
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
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                    active
                      ? 'bg-white text-[#141413] font-medium shadow-2xs border border-black/[0.05]'
                      : 'text-[#5A5A55] hover:bg-black/[0.04]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#8E8E88]" />
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
