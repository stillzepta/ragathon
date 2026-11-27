interface ThinkingOrbProps {
  statusText?: string;
}

export function ThinkingOrb({ statusText = 'Thinking...' }: ThinkingOrbProps) {
  return (
    <div className="dia-glass rounded-[28px] px-6 py-6 flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-sm h-14 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]">
        <svg
          viewBox="0 0 800 60"
          preserveAspectRatio="none"
          className="absolute inset-0 w-[200%] h-full animate-wave-slow opacity-80"
        >
          <path
            d="M0 30 Q 50 10, 100 30 T 200 30 T 300 30 T 400 30 T 500 30 T 600 30 T 700 30 T 800 30"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <svg
          viewBox="0 0 800 60"
          preserveAspectRatio="none"
          className="absolute inset-0 w-[200%] h-full animate-wave-mid opacity-65"
        >
          <path
            d="M0 30 Q 50 48, 100 30 T 200 30 T 300 30 T 400 30 T 500 30 T 600 30 T 700 30 T 800 30"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <svg
          viewBox="0 0 800 60"
          preserveAspectRatio="none"
          className="absolute inset-0 w-[200%] h-full animate-wave-fast opacity-55"
        >
          <path
            d="M0 30 Q 40 16, 80 30 T 160 30 T 240 30 T 320 30 T 400 30 T 480 30 T 560 30 T 640 30 T 720 30 T 800 30"
            fill="none"
            stroke="#34d399"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p className="mt-2 text-xs font-medium text-neutral-300 tracking-tight text-center">
        {statusText}
      </p>
    </div>
  );
}
