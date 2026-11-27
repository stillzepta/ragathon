import { AgentNode } from '../types';

interface ThinkingOrbProps {
  statusText?: string;
  agents?: AgentNode[];
}

export function ThinkingOrb({
  statusText = 'AgentVerse is thinking...',
  agents = [],
}: ThinkingOrbProps) {
  return (
    <div className="relative overflow-hidden rounded-[28px] py-7 px-6 flex flex-col items-center justify-center dia-glass">
      {/* Soft ambient iridescent wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 blur-2xl"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.18), transparent 55%), radial-gradient(circle at 72% 35%, rgba(56, 189, 248, 0.22), transparent 55%), radial-gradient(circle at 50% 85%, rgba(16, 185, 129, 0.16), transparent 60%)',
        }}
      />

      {/* Multi-Ring Orbital Liquid Plasma Core */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Outer rotating conic halo */}
        <div
          className="absolute inset-0 rounded-full animate-spin-slow opacity-70"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgba(99, 102, 241, 0.45) 90deg, rgba(56, 189, 248, 0.55) 180deg, rgba(16, 185, 129, 0.4) 260deg, transparent 360deg)',
            maskImage: 'radial-gradient(circle, transparent 58%, black 60%, black 64%, transparent 66%)',
            WebkitMaskImage:
              'radial-gradient(circle, transparent 58%, black 60%, black 64%, transparent 66%)',
          }}
        />

        {/* Counter-rotating dashed telemetry ring */}
        <svg
          viewBox="0 0 120 120"
          className="absolute inset-1.5 w-[calc(100%-12px)] h-[calc(100%-12px)] animate-spin-reverse opacity-45"
        >
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="rgba(79, 70, 229, 0.5)"
            strokeWidth="1"
            strokeDasharray="4 8 14 8"
          />
        </svg>

        {/* Glass sphere housing */}
        <div className="relative w-20 h-20 rounded-full overflow-hidden border border-white/95 bg-white/45 shadow-[0_10px_30px_rgba(99,102,241,0.22),inset_0_2px_6px_rgba(255,255,255,0.95)] flex items-center justify-center">
          {/* Morphing liquid plasma core */}
          <div
            className="w-16 h-16 animate-plasma blur-[3px] opacity-90"
            style={{
              background:
                'linear-gradient(135deg, #6366f1 0%, #38bdf8 45%, #34d399 85%, #a78bfa 100%)',
            }}
          />
          {/* Inner white pearl highlight */}
          <div
            className="absolute inset-2 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.15) 45%, transparent 72%)',
            }}
          />
        </div>
      </div>

      {/* Live status text */}
      <p className="relative mt-4 text-xs sm:text-[13px] font-medium tracking-tight text-[#141413] text-center max-w-md">
        {statusText}
      </p>

      {/* Mini live agent progress pills */}
      {agents.length > 0 && (
        <div className="relative mt-3.5 flex flex-wrap items-center justify-center gap-1.5">
          {agents.map((a) => {
            const isActive = a.status === 'running' || a.status === 'rejected';
            const isDone = a.status === 'done';
            return (
              <span
                key={a.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-[#141413] text-white shadow-sm scale-105'
                    : isDone
                    ? 'bg-emerald-50/90 text-emerald-800 border border-emerald-200/80'
                    : 'bg-white/60 text-[#7A7A74] border border-white/80'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive
                      ? 'bg-sky-400 animate-ping'
                      : isDone
                      ? 'bg-emerald-500'
                      : 'bg-black/20'
                  }`}
                />
                {a.name.replace(' Agent', '')}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
