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
        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/85 backdrop-blur-md border border-black/[0.07] hover:border-black/[0.14] shadow-2xs transition cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
        <span className="text-xs sm:text-sm font-medium tracking-tight text-[#111113]">
          AgentVerse
        </span>
        {isLiveBackend && (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        )}
      </button>

      {/* Right Action Pills */}
      <div className="flex items-center gap-2">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-white/85 backdrop-blur-md border border-black/[0.07] text-[#111113] hover:bg-white shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New chat</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className="p-2.5 rounded-full bg-white/85 backdrop-blur-md border border-black/[0.07] text-[#4A4A55] hover:text-[#111113] hover:bg-white shadow-2xs transition cursor-pointer"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
