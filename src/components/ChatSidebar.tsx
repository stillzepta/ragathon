import {
  ArrowUpRight,
  Bug,
  Clock,
  LifeBuoy,
  Lightbulb,
  LayoutGrid,
  LogIn,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  SquarePen,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { ChatThread } from '../types';
import { AuthUser } from './LoginModal';

const issueForm = 'https://github.com/stillzepta/ragathon/issues/new';
const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim();
const feedbackLinks = [
  {
    icon: Bug,
    label: 'Report a bug',
    description: 'Describe the issue and optionally attach a screenshot.',
    href: `${issueForm}?title=${encodeURIComponent('Bug: ')}&body=${encodeURIComponent(
      'What went wrong?\n\nSteps to reproduce\n\nWhat did you expect?\n\nScreenshot (optional)\n',
    )}`,
  },
  {
    icon: Lightbulb,
    label: 'Suggest a feature',
    description: 'Tell us what you’d like Diablo to do next.',
    href: `${issueForm}?title=${encodeURIComponent('Feature: ')}&body=${encodeURIComponent(
      'What would you like Diablo to do?\n\nHow would it help?\n',
    )}`,
  },
  {
    icon: LifeBuoy,
    label: 'Contact us',
    description: 'Get help with your account or sign-in.',
    href: supportEmail
      ? `mailto:${supportEmail}?subject=Diablo%20support`
      : `${issueForm}?title=${encodeURIComponent('Support: ')}`,
  },
];

interface ChatSidebarProps {
  open: boolean;
  threads: ChatThread[];
  activeThreadId: string | null;
  user: AuthUser | null;
  promptMode: 'chat' | 'diligence';
  onPromptModeChange: (mode: 'chat' | 'diligence') => void;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onHome: () => void;
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
  promptMode,
  onPromptModeChange,
  onSelectThread,
  onNewChat,
  onHome,
  onToggleDrawer,
  onCloseDrawer,
  onOpenLogin,
  onOpenEmail,
  onLogout,
}: ChatSidebarProps) {
  const searchDialog = useRef<HTMLDialogElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDrawerTab, setActiveDrawerTab] = useState<'history' | 'apps' | 'settings'>('history');

  const drawerTitles = { history: 'Recent Chats', apps: 'Apps', settings: 'Workspace Settings' };

  const query = searchQuery.trim().toLowerCase();
  const searchResults = threads.filter((thread) =>
    thread.title.toLowerCase().includes(query) ||
    thread.messages.some((message) => message.text.toLowerCase().includes(query))
  );

  const openSearch = () => {
    setSearchQuery('');
    searchDialog.current?.showModal();
  };

  const startChat = () => {
    setActiveDrawerTab('history');
    onNewChat();
  };

  const selectChat = (id: string) => {
    setActiveDrawerTab('history');
    onSelectThread(id);
    if (!window.matchMedia('(min-width: 1024px)').matches) onCloseDrawer();
  };

  const openTab = (tab: 'history' | 'apps' | 'settings') => {
    setActiveDrawerTab(tab);
    if (!open) onToggleDrawer();
  };

  return (
    <div className="relative z-40 flex lg:h-full shrink-0">
      <dialog
        ref={searchDialog}
        aria-label="Search chat history"
        className="fixed inset-0 m-auto max-h-[min(36rem,85vh)] w-[min(34rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-indigo-100 bg-[#F9F9FE] text-[#111113] shadow-xl backdrop:bg-indigo-950/35 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 border-b border-indigo-100 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" />
          <input
            type="search"
            autoFocus
            aria-label="Search chats"
            placeholder="Search chat titles and messages"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
          />
          <button type="button" aria-label="Close search" onClick={() => searchDialog.current?.close()}
            className="rounded-full p-2 text-zinc-600 hover:bg-indigo-50">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[min(28rem,65vh)] space-y-1 overflow-y-auto p-3">
          <h2 className="px-2 pb-1 text-xs font-semibold text-zinc-600">{query ? 'Search results' : 'Recent chats'}</h2>
          {searchResults.length === 0 && (
            <p className="px-2 py-3 text-sm text-zinc-600">{query ? 'No matching chats' : 'No chats yet'}</p>
          )}
          {searchResults.map((thread) => (
            <button key={thread.id} type="button"
              onClick={() => { searchDialog.current?.close(); selectChat(thread.id); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm hover:bg-indigo-50 focus-visible:bg-indigo-50">
              <MessageSquare className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
              <span className="truncate">{thread.title}</span>
            </button>
          ))}
        </div>
      </dialog>
      {/* Expandable Glass Drawer */}
      {open && (
        <>
          <div
            onClick={onCloseDrawer}
            className="fixed inset-0 z-30 bg-black/15 backdrop-blur-[2px] lg:hidden"
          />
          <div className="fixed inset-x-3 bottom-20 top-16 lg:static lg:inset-auto lg:my-3 lg:mr-2 z-40 lg:w-80 rounded-[28px] bg-white/85 lg:bg-white/72 backdrop-blur-2xl border border-white/90 shadow-[0_24px_60px_rgba(30,34,90,0.18)] flex flex-col overflow-hidden animate-fade-slide">
            <div className="p-3.5 flex items-center justify-between border-b border-black/[0.05]">
              <span className="text-xs font-semibold text-[#111113]">
                {drawerTitles[activeDrawerTab]}
              </span>
              <button
                type="button"
                onClick={onCloseDrawer}
                aria-label="Close drawer"
                className="p-1.5 rounded-full hover:bg-black/[0.05] text-[#6E6E77] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeDrawerTab === 'settings' ? (
              <div className="space-y-4 overflow-y-auto p-3.5">
                <label className="block space-y-2 text-xs font-medium">
                  <span>Prompt mode</span>
                  <select
                    value={promptMode}
                    onChange={(event) => onPromptModeChange(event.target.value === 'diligence' ? 'diligence' : 'chat')}
                    className="w-full rounded-xl border border-black/10 bg-white/85 px-3 py-2"
                  >
                    <option value="chat">Chat</option>
                    <option value="diligence">Due diligence</option>
                  </select>
                </label>
                <div className="space-y-2 border-t border-black/[0.06] pt-3 text-xs">
                  <p className="font-medium">Account</p>
                  {user ? <p className="break-words text-[#4A4A58]">Signed in as {user.name}</p> : (
                    <button
                      type="button"
                      onClick={() => {
                        onCloseDrawer();
                        onOpenLogin();
                      }}
                      className="rounded-xl border border-black/10 bg-white/85 px-3 py-2 font-medium"
                    >
                      Sign in
                    </button>
                  )}
                </div>
                <section aria-labelledby="feedback-heading" className="space-y-2 border-t border-black/[0.06] pt-3">
                  <h2 id="feedback-heading" className="text-xs font-semibold">Help & feedback</h2>
                  {feedbackLinks.map(({ icon: Icon, label, description, href }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith('https:') ? '_blank' : undefined}
                      rel={href.startsWith('https:') ? 'noopener noreferrer' : undefined}
                      className="flex items-start gap-2.5 rounded-xl border border-black/[0.06] bg-white/65 p-2.5 hover:bg-white"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium">{label}</span>
                        <span className="mt-0.5 block text-[11px] text-[#4A4A58]">{description}</span>
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#6E6E77]" aria-hidden="true" />
                    </a>
                  ))}
                  <p className="text-[11px] leading-relaxed text-[#4A4A58]">
                    GitHub issues are public. Keep account details and private information out of reports and screenshots.
                  </p>
                </section>
              </div>
            ) : activeDrawerTab === 'history' ? (
              <>
                <nav aria-label="Chat shortcuts" className="space-y-1.5 border-b border-indigo-950/[0.06] p-3">
                  <button type="button" onClick={startChat}
                    className="flex min-h-10 w-full items-center gap-2.5 rounded-xl bg-indigo-50 px-3 text-sm font-semibold text-indigo-950 hover:bg-indigo-100">
                    <SquarePen className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                    New chat
                  </button>
                  <div className="space-y-0.5">
                    <button type="button" onClick={openSearch}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#4A4A58] hover:bg-white">
                      <Search className="h-3.5 w-3.5" aria-hidden="true" /> Search
                    </button>
                    <button type="button" onClick={() => openTab('apps')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#4A4A58] hover:bg-white">
                      <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" /> Apps
                    </button>
                    <button type="button" onClick={() => openTab('settings')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#4A4A58] hover:bg-white">
                      <Settings className="h-3.5 w-3.5" aria-hidden="true" /> Settings
                    </button>
                  </div>
                </nav>
                <h2 className="px-4 pb-2 pt-4 text-xs font-semibold text-[#4A4A58]">Chats</h2>

                <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
                  {threads.length === 0 ? (
                    <p className="text-xs text-[#8E8E99] px-3 py-2">
                      No chats yet
                    </p>
                  ) : (
                    threads.map((thread) => {
                      const active = thread.id === activeThreadId;
                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => selectChat(thread.id)}
                          aria-current={active ? 'true' : undefined}
                          title={thread.title}
                          className={`flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition cursor-pointer ${
                            active
                              ? 'bg-indigo-50 text-indigo-950 font-medium ring-1 ring-inset ring-indigo-100'
                              : 'text-[#4A4A58] hover:bg-white/70 hover:text-[#111113]'
                          }`}
                        >
                          <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-indigo-600' : 'text-zinc-500'}`} aria-hidden="true" />
                          <span className="truncate">{thread.title}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onCloseDrawer();
                    onOpenEmail();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-black/[0.05] bg-white/70 p-3 text-left transition hover:bg-white"
                >
                  <img src={`${import.meta.env.BASE_URL}gmail.png`} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
                  <span>
                    <span className="block text-xs font-medium text-[#111113]">Gmail</span>
                    <span className="mt-0.5 block text-[11px] text-[#6E6E77]">Compose an email</span>
                  </span>
                </button>
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
            onClick={onHome}
            title="Diablo Home"
            className="w-9 h-9 rounded-full bg-white/85 border border-white shadow-[0_4px_14px_rgba(79,86,184,0.16)] flex items-center justify-center hover:scale-105 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </button>

          {/* New Chat */}
          <button
            type="button"
            onClick={startChat}
            title="New chat"
            className="w-9 h-9 rounded-full bg-white/60 hover:bg-white text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <SquarePen className="w-4 h-4" />
          </button>

          {/* Search */}
          <button
            type="button"
            onClick={openSearch}
            title="Search chats"
            className="w-9 h-9 rounded-full hover:bg-white/60 text-[#22243a] hover:text-[#111113] flex items-center justify-center transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Apps */}
          <button
            type="button"
            onClick={() => openTab('apps')}
            title="Apps"
            aria-label="Apps"
            aria-expanded={open && activeDrawerTab === 'apps'}
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

        </div>

        {/* Bottom Settings & Sign In / Out */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => openTab('settings')}
            title="Workspace Settings"
            aria-label="Workspace Settings"
            aria-expanded={open && activeDrawerTab === 'settings'}
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
          onClick={startChat}
          title="New chat"
          className="w-9 h-9 rounded-full bg-[#F2F3FA] text-[#111113] flex items-center justify-center cursor-pointer"
        >
          <SquarePen className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => openTab('apps')}
          title="Apps"
          aria-label="Apps"
          aria-expanded={open && activeDrawerTab === 'apps'}
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
