import { PanelLeft, Plus } from 'lucide-react';

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
    <header className="sticky top-0 z-20 px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between">
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full dia-glass-subtle">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-300 transition cursor-pointer"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pr-2">
          <span className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.75)]" />
          <span className="text-sm font-medium tracking-tight text-white">
            AgentVerse
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-neutral-300">
            {isLiveBackend ? 'Live API' : 'Multi-Agent'}
          </span>
        </div>
      </div>

      {!sidebarOpen && (
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium dia-glass-subtle text-white hover:bg-white/15 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New chat</span>
        </button>
      )}
    </header>
  );
}
