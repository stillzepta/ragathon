interface ThinkingOrbProps {
  statusText?: string;
}

export function ThinkingOrb({ statusText = 'AgentVerse is thinking...' }: ThinkingOrbProps) {
  return (
    <div className="relative overflow-hidden rounded-[28px] py-8 px-6 flex flex-col items-center justify-center dia-glass">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-75 blur-2xl"
        style={{
          background:
            'radial-gradient(circle at 30% 35%, rgba(167, 243, 208, 0.48), transparent 58%), radial-gradient(circle at 72% 40%, rgba(186, 230, 253, 0.52), transparent 58%), radial-gradient(circle at 50% 85%, rgba(224, 231, 255, 0.45), transparent 60%)',
        }}
      />

      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden animate-orb border border-white/90 bg-gradient-to-br from-indigo-100/90 via-sky-100/85 to-emerald-100/90">
        <div
          className="absolute -inset-2 rounded-full blur-md animate-orb-core"
          style={{
            background:
              'radial-gradient(circle at 36% 48%, rgba(255, 255, 255, 0.98) 0%, rgba(165, 180, 252, 0.72) 38%, rgba(167, 243, 208, 0.35) 70%, transparent 100%)',
          }}
        />

        <div
          className="absolute -right-4 -top-3 w-24 h-24 sm:w-28 sm:h-28 rounded-full blur-md animate-orb-eclipse"
          style={{
            background:
              'radial-gradient(circle at 65% 40%, rgba(30, 41, 59, 0.24) 0%, rgba(79, 70, 229, 0.2) 48%, transparent 78%)',
          }}
        />

        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow:
              'inset 1.5px 1.5px 5px rgba(255, 255, 255, 0.95), inset -3px -3px 10px rgba(15, 23, 42, 0.1)',
          }}
        />
      </div>

      <p className="relative mt-4 text-xs sm:text-[13px] font-medium tracking-tight text-[#4A4A46] text-center max-w-md">
        {statusText}
      </p>
    </div>
  );
}
