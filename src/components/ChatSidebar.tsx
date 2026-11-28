import {
  Clock,
  LayoutGrid,
  LogIn,
  LogOut,
  Mail,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  SquarePen,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { DEMO_PRESETS } from '../data/presets';
import { ChatThread, DemoPreset } from '../types';
import { AuthUser } from './LoginModal';

interface ChatSidebarProps {
  open: boolean;
  threads: ChatThread[];
  activeThreadId: string | null;
  user: AuthUser | null;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onSelectPreset: (preset: DemoPreset) => void;
  onToggleDrawer: () => void;
  onCloseDrawer: () => void;
  onOpenLogin: () => void;
  onOpenEmail: () => void;
  onLogout: () => void;
}

export function ChatSidebar({
  open,
  threads,
  activeThreadId,
  user,
  onSelectThread,
  onNewChat,
  onSelectPreset,
  onToggleDrawer,
  onCloseDrawer,
  onOpenLogin,
  onOpenEmail,
  onLogout,
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
    <div className="relative z-40 flex lg:h-full shrink-0">
      {/* Expandable Glass Drawer */}
      {open && (
        <>
          <div
            onClick={onCloseDrawer}
            className="fixed inset-0 z-30 bg-black/15 backdrop-blur-[2px] lg:hidden"
          />
          <div className="fixed inset-x-3 bottom-20 top-16 lg:static lg:inset-auto lg:my-3 lg:mr-2 z-40 lg:w-64 rounded-[28px] bg-white/85 lg:bg-white/72 backdrop-blur-2xl border border-white/90 shadow-[0_24px_60px_rgba(30,34,90,0.18)] flex flex-col overflow-hidden animate-fade-slide">
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

      {/* Desktop: Floating Clear-Glass Icon Rail on Right */}
      <aside className="hidden lg:flex relative z-40 my-3 mr-3 w-[56px] shrink-0 rounded-full bg-white/38 backdrop-blur-2xl border border-white/60 shadow-[0_16px_40px_rgba(30,34,90,0.12)] flex-col items-center justify-between py-3.5">
        {/* Top Icons */}
        <div className="flex flex-col items-center gap-2.5">
          {/* Glowing Brand Sparkle Ring */}
          <button
            type="button"
            onClick={onNewChat}
            title="AgentVerse Home"
            className="w-9 h-9 rounded-full bg-white/85 border border-white shadow-[0_4px_14px_rgba(79,86,184,0.16)] flex items-center justify-center hover:scale-105 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </button>

          {/* New Chat */}
          <button
            type="button"
            onClick={onNewChat}
            title="New chat"
            className="w-9 h-9 rounded-full bg-white/60 hover:bg-white text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <SquarePen className="w-4 h-4" />
          </button>

          {/* Search */}
          <button
            type="button"
            onClick={() => openTab('history')}
            title="Search chats"
            className="w-9 h-9 rounded-full hover:bg-white/60 text-[#22243a] hover:text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick Presets Grid */}
          <button
            type="button"
            onClick={() => openTab('presets')}
            title="Quick Scenarios"
            className="w-9 h-9 rounded-full hover:bg-white/60 text-[#22243a] hover:text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Recent History */}
          <button
            type="button"
            onClick={() => openTab('history')}
            title="Recent Chats"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
              open && activeDrawerTab === 'history'
                ? 'bg-[#111113] text-white'
                : 'hover:bg-white/60 text-[#22243a] hover:text-[#111113]'
            }`}
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* AI Mail Composer */}
          <button
            type="button"
            onClick={onOpenEmail}
            title="AI Mail Composer"
            className="w-9 h-9 rounded-full hover:bg-white/60 text-[#22243a] hover:text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <Mail className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Settings & Sign In / Out */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => openTab('presets')}
            title="Workspace Settings"
            className="w-9 h-9 rounded-full hover:bg-white/70 text-[#111113]/80 hover:text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {user ? (
            <button
              type="button"
              onClick={onLogout}
              title={`Signed in as ${user.name} (Click to sign out)`}
              className="w-9 h-9 rounded-full bg-[#111113] text-white text-xs font-semibold flex items-center justify-center shadow-sm hover:bg-rose-600 transition cursor-pointer group"
            >
              <span className="group-hover:hidden">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <LogOut className="w-3.5 h-3.5 hidden group-hover:block" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              title="Sign in"
              className="w-9 h-9 rounded-full bg-white/75 hover:bg-white text-[#111113] border border-white flex items-center justify-center shadow-2xs transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile: Sleek Bottom Floating Dock */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/80 backdrop-blur-2xl border border-white shadow-[0_14px_36px_rgba(30,34,90,0.18)]"
      >
        <button
          type="button"
          onClick={onNewChat}
          title="New chat"
          className="w-9 h-9 rounded-full bg-[#F2F3FA] text-[#111113] flex items-center justify-center cursor-pointer"
        >
          <SquarePen className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => openTab('presets')}
          title="Quick Scenarios"
          className="w-9 h-9 rounded-full text-[#22243a] flex items-center justify-center cursor-pointer"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => openTab('history')}
          title="Recent Chats"
          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
            open && activeDrawerTab === 'history' ? 'bg-[#111113] text-white' : 'text-[#22243a]'
          }`}
        >
          <Clock className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onOpenEmail}
          title="AI Mail Composer"
          className="w-9 h-9 rounded-full text-[#22243a] flex items-center justify-center cursor-pointer"
        >
          <Mail className="w-4 h-4" />
        </button>
        {user ? (
          <button
            type="button"
            onClick={onLogout}
            title="Sign out"
            className="w-9 h-9 rounded-full bg-[#111113] text-white text-xs font-semibold flex items-center justify-center cursor-pointer"
          >
            {user.name.charAt(0).toUpperCase()}
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            title="Sign in"
            className="w-9 h-9 rounded-full bg-[#111113] text-white flex items-center justify-center cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
          </button>
        )}
      </nav>
    </div>
  );
}
