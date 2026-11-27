interface ThinkingOrbProps {
  statusText?: string;
}

export function ThinkingOrb({ statusText = 'AgentVerse is thinking...' }: ThinkingOrbProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl py-8 px-6 flex flex-col items-center justify-center dia-glass">
      {/* Subtle Dia Aurora mist matching the site palette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-75 blur-2xl animate-aurora"
        style={{
          background:
            'radial-gradient(circle at 30% 35%, rgba(167, 243, 208, 0.48), transparent 58%), radial-gradient(circle at 72% 40%, rgba(186, 230, 253, 0.52), transparent 58%), radial-gradient(circle at 50% 85%, rgba(254, 243, 199, 0.42), transparent 60%)',
        }}
      />

      {/* Luminous Frosted-Glass Aurora Orb */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden animate-orb border border-white/80 bg-gradient-to-br from-emerald-100/90 via-sky-100/85 to-stone-200/90">
        {/* Soft pearlescent inner light */}
        <div
          className="absolute -inset-2 rounded-full blur-md animate-orb-core"
          style={{
            background:
              'radial-gradient(circle at 36% 48%, rgba(255, 255, 255, 0.98) 0%, rgba(167, 243, 208, 0.72) 38%, rgba(186, 230, 253, 0.35) 70%, transparent 100%)',
          }}
        />

        {/* Moving soft slate-emerald eclipse shadow */}
        <div
          className="absolute -right-4 -top-3 w-24 h-24 sm:w-28 sm:h-28 rounded-full blur-md animate-orb-eclipse"
          style={{
            background:
              'radial-gradient(circle at 65% 40%, rgba(20, 20, 19, 0.28) 0%, rgba(15, 118, 110, 0.22) 48%, transparent 78%)',
          }}
        />

        {/* Crisp glass rim highlight */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow:
              'inset 1.5px 1.5px 5px rgba(255, 255, 255, 0.95), inset -3px -3px 10px rgba(20, 20, 19, 0.12)',
          }}
        />
      </div>

      {/* Live Agent Status Text */}
      <p className="relative mt-4 text-xs sm:text-[13px] font-medium tracking-tight text-[#4A4A46] text-center max-w-md">
        {statusText}
      </p>
    </div>
  );
}
