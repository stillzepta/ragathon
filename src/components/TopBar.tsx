import { PanelLeft, Plus, Sparkles } from 'lucide-react';

interface TopBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  isLiveBackend: boolean;
}

export function TopBar({
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
  isLiveBackend,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 px-5 sm:px-8 pt-4 pb-3 flex items-center justify-between">
      {/* Left Brand Pill */}
      <button
        type="button"
        onClick={onNewChat}
        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#111414] border border-white/10 hover:border-white/20 transition cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs sm:text-sm font-medium tracking-tight text-white">
          AgentVerse
        </span>
        {isLiveBackend && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        )}
      </button>

      {/* Right Action Pills */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-[#111414] border border-white/10 text-neutral-200 hover:text-white hover:border-white/20 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New chat</span>
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className="p-2.5 rounded-full bg-[#111414] border border-white/10 text-neutral-300 hover:text-white hover:border-white/20 transition cursor-pointer"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
