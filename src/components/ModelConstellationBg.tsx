import { useEffect, useRef, useState } from 'react';

interface ModelNode {
  id: string;
  name: string;
  x: number;
  y: number;
  depth: number;
  duration: number;
  delay: number;
  accent: string;
  hasLimeRing?: boolean;
  glyph:
    | 'gemini'
    | 'openai'
    | 'claude'
    | 'meta'
    | 'deepseek'
    | 'mistral'
    | 'microsoft'
    | 'cohere'
    | 'groq'
    | 'qwen';
}

const MODEL_NODES: ModelNode[] = [
  { id: 'microsoft', name: 'Microsoft', x: 11, y: 8, depth: 16, duration: 21, delay: -2, accent: '#38bdf8', glyph: 'microsoft' },
  { id: 'cohere', name: 'Cohere', x: 69, y: 7, depth: 18, duration: 20, delay: -6, accent: '#fb7185', glyph: 'cohere' },
  { id: 'meta', name: 'Meta Llama', x: 14, y: 24, depth: 24, duration: 18, delay: -1, accent: '#3b82f6', glyph: 'meta' },
  { id: 'qwen', name: 'Qwen', x: 70, y: 23, depth: 20, duration: 19, delay: -8, accent: '#f5f5f4', glyph: 'qwen' },
  { id: 'gemini', name: 'Gemini', x: 12, y: 44, depth: 26, duration: 16, delay: 0, accent: '#38bdf8', glyph: 'gemini' },
  { id: 'mistral', name: 'Mistral', x: 87, y: 50, depth: 24, duration: 17, delay: -4, accent: '#f97316', glyph: 'mistral' },
  { id: 'openai', name: 'OpenAI', x: 19, y: 69, depth: 28, duration: 15, delay: -3, accent: '#f5f5f4', hasLimeRing: true, glyph: 'openai' },
  { id: 'claude', name: 'Anthropic', x: 56, y: 70, depth: 22, duration: 18, delay: -9, accent: '#f5f5f4', hasLimeRing: true, glyph: 'claude' },
  { id: 'deepseek', name: 'DeepSeek', x: 17, y: 83, depth: 18, duration: 22, delay: -5, accent: '#3b82f6', hasLimeRing: true, glyph: 'deepseek' },
  { id: 'groq', name: 'Groq', x: 76, y: 85, depth: 20, duration: 20, delay: -7, accent: '#34d399', glyph: 'groq' },
];

// Deterministic starburst rays matching the wide elliptical constellation clusters
const BURST_RAYS = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2;
  const rx = 58 + ((i * 19) % 44);
  const ry = 22 + ((i * 11) % 18);
  return {
    x2: Math.cos(angle) * rx,
    y2: Math.sin(angle) * ry,
    r: i % 5 === 0 ? 2.6 : i % 3 === 0 ? 1.8 : 1.1,
    lime: i === 4 || i === 15,
  };
});

function ModelGlyph({ glyph, accent }: { glyph: ModelNode['glyph']; accent: string }) {
  switch (glyph) {
    case 'gemini':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill={accent}>
          <path d="M12 2C12.6 7.4 16.6 11.4 22 12C16.6 12.6 12.6 16.6 12 22C11.4 16.6 7.4 12.6 2 12C7.4 11.4 11.4 7.4 12 2Z" />
        </svg>
      );
    case 'openai':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="1.8">
          <circle cx="12" cy="12" r="7.5" strokeDasharray="5 3" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'claude':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <path d="M5.5 18L10 6L14.5 18M7.5 14H12.5M18 6V18" />
        </svg>
      );
    case 'meta':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <path d="M4 13c0-3.5 2.2-6 4.5-6 2 0 3.5 2 3.5 5s1.5 5 3.5 5c2.3 0 4.5-2.5 4.5-6s-2.2-6-4.5-6c-2 0-3.5 2-3.5 5s-1.5 5-3.5 5C6.2 19 4 16.5 4 13z" />
        </svg>
      );
    case 'mistral':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill={accent}>
          <rect x="4" y="5" width="4" height="4" rx="0.8" />
          <rect x="16" y="5" width="4" height="4" rx="0.8" />
          <rect x="4" y="10" width="16" height="4" rx="0.8" />
          <rect x="4" y="15" width="4" height="4" rx="0.8" />
          <rect x="10" y="15" width="4" height="4" rx="0.8" />
          <rect x="16" y="15" width="4" height="4" rx="0.8" />
        </svg>
      );
    case 'deepseek':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <path d="M4 13c3-5 10-7 15-3-1.5 4-6 7-11 6-2-.4-3.2-1.5-4-3z" />
          <circle cx="14" cy="11" r="1" fill={accent} />
        </svg>
      );
    case 'microsoft':
      return (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
          <rect x="4" y="4" width="7" height="7" fill="#f25022" />
          <rect x="13" y="4" width="7" height="7" fill="#7fba00" />
          <rect x="4" y="13" width="7" height="7" fill="#00a4ef" />
          <rect x="13" y="13" width="7" height="7" fill="#ffb900" />
        </svg>
      );
    case 'cohere':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round">
          <path d="M5 14c1.5-5 3.5-5 5 0s3.5 5 5 0 3.5-5 4-1" />
        </svg>
      );
    case 'groq':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <rect x="5" y="11" width="3" height="7" rx="1" fill={accent} />
          <rect x="10.5" y="7" width="3" height="11" rx="1" fill={accent} />
          <rect x="16" y="9" width="3" height="9" rx="1" fill={accent} />
        </svg>
      );
    case 'qwen':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="10" r="4" />
          <path d="M7 19c1.5-3 8.5-3 10 0" />
        </svg>
      );
  }
}

export function ModelConstellationBg() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        setPointer({ x: nx, y: ny });
      });
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{
        background:
          'radial-gradient(circle at 50% 42%, #191c22 0%, #0f1115 58%, #090a0d 100%)',
      }}
    >
      {/* Curved Orbital Rings */}
      <svg
        className="absolute inset-0 w-full h-full opacity-55 transition-transform duration-500 ease-out"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{
          transform: `translate3d(${pointer.x * -12}px, ${pointer.y * -10}px, 0)`,
        }}
      >
        <ellipse cx="720" cy="430" rx="880" ry="340" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <ellipse cx="720" cy="430" rx="700" ry="260" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <ellipse cx="720" cy="430" rx="520" ry="185" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <ellipse cx="720" cy="430" rx="340" ry="115" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      </svg>

      {/* Roaming AI Model Nodes + Starburst Constellations */}
      {MODEL_NODES.map((node) => {
        const isHovered = hoveredId === node.id;
        return (
          <div
            key={node.id}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="absolute pointer-events-auto"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: `translate3d(${pointer.x * node.depth}px, ${pointer.y * node.depth}px, 0)`,
              transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div
              className="relative flex items-center justify-center animate-aurora"
              style={{
                animationDuration: `${node.duration}s`,
                animationDelay: `${node.delay}s`,
              }}
            >
              {/* Wide Starburst Dot Cluster */}
              <svg
                viewBox="-115 -50 230 100"
                className={`w-56 h-24 -mx-24 -my-8 transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-70'
                }`}
              >
                {BURST_RAYS.map((ray, idx) => (
                  <g key={idx}>
                    <line
                      x1="0"
                      y1="0"
                      x2={ray.x2}
                      y2={ray.y2}
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="0.6"
                    />
                    <circle
                      cx={ray.x2}
                      cy={ray.y2}
                      r={ray.r}
                      fill={ray.lime && node.hasLimeRing ? '#a3e635' : 'rgba(229,231,235,0.55)'}
                    />
                  </g>
                ))}

                {/* Signature Lime Hollow Ring Accent */}
                {node.hasLimeRing && (
                  <circle
                    cx="38"
                    cy="-8"
                    r="11"
                    fill="none"
                    stroke="rgba(163, 230, 53, 0.45)"
                    strokeWidth="1.1"
                  />
                )}
              </svg>

              {/* Dark Circular Model Badge */}
              <div
                className={`absolute flex items-center justify-center w-9 h-9 rounded-full bg-[#121418] border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.7)] transition-all duration-300 ${
                  isHovered ? 'scale-125 border-white/50 shadow-[0_0_24px_rgba(163,230,53,0.28)]' : 'scale-100'
                }`}
              >
                <ModelGlyph glyph={node.glyph} accent={node.accent} />
              </div>

              {/* Hover Label */}
              {isHovered && (
                <span className="absolute top-7 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10 backdrop-blur-md border border-white/20 text-white whitespace-nowrap">
                  {node.name}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
