interface ThinkingOrbProps {
  statusText?: string;
}

export function ThinkingOrb({ statusText = 'AgentVerse is thinking...' }: ThinkingOrbProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl py-8 px-6 flex flex-col items-center justify-center bg-gradient-to-b from-[#d97706] via-[#b91c1c] to-[#450a0a] shadow-[0_14px_45px_rgba(185,28,28,0.28)] border border-amber-400/30">
      {/* Ambient backdrop glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(251, 191, 36, 0.45), transparent 65%)',
        }}
      />

      {/* Glowing 3D Eclipse Orb */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden animate-orb border border-amber-200/45 bg-gradient-to-br from-[#fb923c] via-[#ea580c] to-[#7c2d12]">
        {/* Warm bright inner core */}
        <div
          className="absolute -inset-2 rounded-full blur-md animate-orb-core"
          style={{
            background:
              'radial-gradient(circle at 38% 52%, rgba(255, 247, 237, 0.96) 0%, rgba(253, 186, 116, 0.85) 32%, rgba(234, 88, 12, 0.15) 68%, transparent 100%)',
          }}
        />

        {/* Moving dark eclipse shadow */}
        <div
          className="absolute -right-5 -top-3 w-28 h-28 sm:w-32 sm:h-32 rounded-full blur-md animate-orb-eclipse"
          style={{
            background:
              'radial-gradient(circle at 65% 40%, rgba(24, 6, 2, 0.94) 0%, rgba(69, 10, 10, 0.82) 48%, transparent 78%)',
          }}
        />

        {/* Crisp rim highlight */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow:
              'inset 1.5px 1px 4px rgba(255, 237, 213, 0.75), inset -3px -2px 8px rgba(40, 8, 4, 0.7)',
          }}
        />
      </div>

      {/* Live Agent Status Text */}
      <p className="relative mt-5 text-xs sm:text-sm font-normal tracking-wide text-amber-50/85">
        {statusText}
      </p>
    </div>
  );
}
