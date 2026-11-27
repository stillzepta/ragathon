interface ThinkingOrbProps {
  statusText?: string;
}

export function ThinkingOrb({ statusText = 'AgentVerse is thinking...' }: ThinkingOrbProps) {
  return (
    <div className="relative overflow-hidden rounded-[28px] py-8 px-6 flex flex-col items-center justify-center dia-glass">
      {/* Subtle lime & sky ambient mist */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45 blur-2xl animate-aurora"
        style={{
          background:
            'radial-gradient(circle at 35% 40%, rgba(163, 230, 53, 0.22), transparent 58%), radial-gradient(circle at 70% 45%, rgba(56, 189, 248, 0.24), transparent 58%)',
        }}
      />

      {/* Luminous Dark-Glass Eclipse Orb */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden animate-orb border border-white/25 bg-gradient-to-br from-lime-300/35 via-sky-400/25 to-neutral-900">
        <div
          className="absolute -inset-2 rounded-full blur-md animate-orb-core"
          style={{
            background:
              'radial-gradient(circle at 36% 48%, rgba(255, 255, 255, 0.9) 0%, rgba(163, 230, 53, 0.55) 36%, rgba(56, 189, 248, 0.25) 70%, transparent 100%)',
          }}
        />

        <div
          className="absolute -right-4 -top-3 w-24 h-24 sm:w-28 sm:h-28 rounded-full blur-md animate-orb-eclipse"
          style={{
            background:
              'radial-gradient(circle at 65% 40%, rgba(9, 10, 13, 0.94) 0%, rgba(17, 24, 39, 0.72) 52%, transparent 80%)',
          }}
        />

        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow:
              'inset 1.5px 1.5px 5px rgba(255, 255, 255, 0.65), inset -3px -3px 10px rgba(0, 0, 0, 0.6)',
          }}
        />
      </div>

      <p className="relative mt-4 text-xs sm:text-[13px] font-medium tracking-tight text-neutral-300 text-center max-w-md">
        {statusText}
      </p>
    </div>
  );
}
