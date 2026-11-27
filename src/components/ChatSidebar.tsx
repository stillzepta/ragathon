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
        className="fixed inset-0 z-30 bg-black/15 backdrop-blur-[2px] md:hidden"
      />

      <aside className="fixed md:static inset-y-0 left-0 z-40 w-60 shrink-0 bg-white/55 backdrop-blur-2xl border-r border-black/[0.06] flex flex-col transition-all duration-200">
        {/* Top New Chat */}
        <div className="p-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/80 hover:bg-white border border-black/[0.06] text-xs font-medium text-[#141413] transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New chat</span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg hover:bg-black/[0.05] text-[#6E6E6A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recent Chats */}
        <div className="px-3.5 pt-2 pb-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8E8E88]">
            Chats
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {threads.length === 0 ? (
            <p className="text-xs text-[#8E8E88] px-2.5 py-2">
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
                      ? 'bg-white/90 text-[#141413] font-medium shadow-2xs border border-black/[0.05]'
                      : 'text-[#5A5A55] hover:bg-white/55'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#8E8E88]" />
                  <span className="truncate">{thread.title}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Status Footer */}
        <div className="p-3 border-t border-black/[0.05]">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/55 border border-white/80 text-[11px] text-[#4A4A46]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">5 Agents · Human Approval On</span>
          </div>
        </div>
      </aside>
    </>
  );
}
