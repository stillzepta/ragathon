import {
  Clock,
  GraduationCap,
  LayoutGrid,
  MessageSquare,
  Search,
  Settings,
  Shield,
  Sparkles,
  SquarePen,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { DEMO_PRESETS } from '../data/presets';
import { ChatThread, DemoPreset } from '../types';

interface ChatSidebarProps {
  open: boolean;
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onSelectPreset: (preset: DemoPreset) => void;
  onToggleDrawer: () => void;
  onCloseDrawer: () => void;
}

export function ChatSidebar({
  open,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onSelectPreset,
  onToggleDrawer,
  onCloseDrawer,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDrawerTab, setActiveDrawerTab] = useState<'history' | 'presets'>('history');

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openTab = (tab: 'history' | 'presets') => {
    setActiveDrawerTab(tab);
    if (!open) onToggleDrawer();
  };

  return (
    <div className="relative z-40 flex h-full shrink-0">
      {/* Expandable Glass Drawer (slides out to the left of the right rail) */}
      {open && (
        <>
          <div
            onClick={onCloseDrawer}
            className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[1px] md:hidden"
          />
          <div className="fixed md:static inset-y-0 right-[62px] z-40 w-64 bg-white/80 backdrop-blur-2xl border-l border-black/[0.06] flex flex-col animate-fade-slide">
            <div className="p-3.5 flex items-center justify-between border-b border-black/[0.05]">
              <span className="text-xs font-semibold text-[#111113]">
                {activeDrawerTab === 'history' ? 'Recent Chats' : 'Quick Launch'}
              </span>
              <button
                type="button"
                onClick={onCloseDrawer}
                className="p-1.5 rounded-full hover:bg-black/[0.05] text-[#6E6E77] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeDrawerTab === 'history' ? (
              <>
                <div className="p-2.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3F4FA] border border-black/[0.05]">
                    <Search className="w-3.5 h-3.5 text-[#7A7A85]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search chats..."
                      className="w-full bg-transparent text-xs text-[#111113] placeholder:text-[#8E8E99] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-1">
                  {filteredThreads.length === 0 ? (
                    <p className="text-xs text-[#8E8E99] px-3 py-2">
                      No chats yet
                    </p>
                  ) : (
                    filteredThreads.map((thread) => {
                      const active = thread.id === activeThreadId;
                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => {
                            onSelectThread(thread.id);
                            onCloseDrawer();
                          }}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                            active
                              ? 'bg-white text-[#111113] font-medium shadow-2xs border border-black/[0.06]'
                              : 'text-[#4A4A58] hover:bg-white/70 hover:text-[#111113]'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                          <span className="truncate">{thread.title}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                {DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      onCloseDrawer();
                    }}
                    className="w-full text-left p-3 rounded-2xl bg-white/70 hover:bg-white border border-black/[0.05] transition cursor-pointer"
                  >
                    <p className="text-xs font-medium text-[#111113]">
                      {preset.label}
                    </p>
                    <p className="text-[11px] text-[#6E6E77] mt-0.5 line-clamp-2">
                      {preset.prompt}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Gemini-Style Slim Right Icon Rail */}
      <aside className="relative z-40 w-[62px] shrink-0 bg-white/75 backdrop-blur-2xl border-l border-black/[0.06] flex flex-col items-center justify-between py-4">
        {/* Top Icons */}
        <div className="flex flex-col items-center gap-3">
          {/* Glowing Brand Sparkle Ring */}
          <button
            type="button"
            onClick={onNewChat}
            title="AgentVerse Home"
            className="w-10 h-10 rounded-full bg-white border border-indigo-200/80 shadow-[0_4px_16px_rgba(79,86,184,0.18)] flex items-center justify-center hover:scale-105 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </button>

          {/* New Chat */}
          <button
            type="button"
            onClick={onNewChat}
            title="New chat"
            className="w-10 h-10 rounded-full bg-[#F2F3FA] hover:bg-indigo-100/80 text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <SquarePen className="w-4 h-4" />
          </button>

          {/* Search */}
          <button
            type="button"
            onClick={() => openTab('history')}
            title="Search chats"
            className="w-9 h-9 rounded-full hover:bg-black/[0.05] text-[#4A4A58] hover:text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick Presets Grid */}
          <button
            type="button"
            onClick={() => openTab('presets')}
            title="Quick Scenarios"
            className="w-9 h-9 rounded-full hover:bg-black/[0.05] text-[#4A4A58] hover:text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Security Quick Run */}
          <button
            type="button"
            onClick={() => onSelectPreset(DEMO_PRESETS[0])}
            title="Security Audit"
            className="w-9 h-9 rounded-full hover:bg-black/[0.05] text-[#4A4A58] hover:text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Recent History */}
          <button
            type="button"
            onClick={() => openTab('history')}
            title="Recent Chats"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
              open && activeDrawerTab === 'history'
                ? 'bg-[#111113] text-white'
                : 'hover:bg-black/[0.05] text-[#4A4A58] hover:text-[#111113]'
            }`}
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Career / Campus Quick Run */}
          <button
            type="button"
            onClick={() => onSelectPreset(DEMO_PRESETS[2])}
            title="Career & Campus"
            className="w-9 h-9 rounded-full hover:bg-black/[0.05] text-[#4A4A58] hover:text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Settings & Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => openTab('presets')}
            title="Workspace Settings"
            className="w-9 h-9 rounded-full hover:bg-black/[0.05] text-[#4A4A58] hover:text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onNewChat}
            title="Profile"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold flex items-center justify-center shadow-sm cursor-pointer"
          >
            D
          </button>
        </div>
      </aside>
    </div>
  );
}
