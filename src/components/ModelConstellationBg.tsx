import { useEffect, useRef, useState } from 'react';

interface ModelNode {
  id: string;
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  depth: number; // parallax factor
  duration: number;
  delay: number;
  accent: string;
  glyph: 'gemini' | 'openai' | 'claude' | 'meta' | 'deepseek' | 'mistral' | 'groq' | 'qwen';
}

const MODEL_NODES: ModelNode[] = [
  { id: 'gemini', name: 'Gemini', x: 18, y: 26, depth: 24, duration: 16, delay: 0, accent: '#38bdf8', glyph: 'gemini' },
  { id: 'openai', name: 'OpenAI', x: 76, y: 22, depth: 18, duration: 19, delay: -4, accent: '#10b981', glyph: 'openai' },
  { id: 'claude', name: 'Claude', x: 64, y: 66, depth: 28, duration: 17, delay: -7, accent: '#f59e0b', glyph: 'claude' },
  { id: 'meta', name: 'Llama', x: 26, y: 68, depth: 20, duration: 21, delay: -2, accent: '#3b82f6', glyph: 'meta' },
  { id: 'deepseek', name: 'DeepSeek', x: 46, y: 18, depth: 15, duration: 22, delay: -9, accent: '#6366f1', glyph: 'deepseek' },
  { id: 'mistral', name: 'Mistral', x: 84, y: 54, depth: 26, duration: 18, delay: -5, accent: '#f97316', glyph: 'mistral' },
  { id: 'groq', name: 'Groq', x: 14, y: 48, depth: 22, duration: 20, delay: -11, accent: '#ec4899', glyph: 'groq' },
  { id: 'qwen', name: 'Qwen', x: 48, y: 78, depth: 16, duration: 23, delay: -6, accent: '#8b5cf6', glyph: 'qwen' },
];

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
          <circle cx="12" cy="12" r="7.5" strokeDasharray="6 3" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'claude':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <path d="M7 18L11.5 6L16 18M9 14H14M18 6V18" />
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
          <rect x="4" y="5" width="4" height="4" rx="1" />
          <rect x="16" y="5" width="4" height="4" rx="1" />
          <rect x="4" y="10" width="16" height="4" rx="1" />
          <rect x="4" y="15" width="4" height="4" rx="1" />
          <rect x="10" y="15" width="4" height="4" rx="1" />
          <rect x="16" y="15" width="4" height="4" rx="1" />
        </svg>
      );
    case 'deepseek':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <path d="M4 13c3-5 10-7 15-3-1.5 4-6 7-11 6-2-.4-3.2-1.5-4-3z" />
          <circle cx="14" cy="11" r="1" fill={accent} />
        </svg>
      );
    case 'groq':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="7" />
          <path d="M12 12h5v4" />
        </svg>
      );
    case 'qwen':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="1.9">
          <polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" />
          <circle cx="12" cy="12" r="2.2" fill={accent} />
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
    >
      {/* Subtle orbital rings */}
      <svg
        className="absolute inset-0 w-full h-full opacity-35 transition-transform duration-500 ease-out"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{
          transform: `translate3d(${pointer.x * -10}px, ${pointer.y * -10}px, 0)`,
        }}
      >
        <ellipse cx="720" cy="450" rx="680" ry="250" fill="none" stroke="rgba(20,20,19,0.09)" strokeWidth="1" />
        <ellipse cx="720" cy="450" rx="520" ry="185" fill="none" stroke="rgba(20,20,19,0.08)" strokeWidth="1" />
        <ellipse cx="720" cy="450" rx="840" ry="330" fill="none" stroke="rgba(20,20,19,0.06)" strokeWidth="1" />
      </svg>

      {/* Roaming AI Model Nodes with constellation bursts */}
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
              {/* Constellation rays & dots */}
              <svg
                viewBox="-50 -50 100 100"
                className={`w-28 h-28 -m-10 transition-opacity duration-300 ${
                  isHovered ? 'opacity-90' : 'opacity-45'
                }`}
              >
                {[0, 35, 75, 120, 165, 210, 255, 310].map((deg, idx) => {
                  const rad = (deg * Math.PI) / 180;
                  const len = idx % 2 === 0 ? 40 : 28;
                  const x2 = Math.cos(rad) * len;
                  const y2 = Math.sin(rad) * len;
                  return (
                    <g key={deg}>
                      <line
                        x1="0"
                        y1="0"
                        x2={x2}
                        y2={y2}
                        stroke="rgba(20,20,19,0.16)"
                        strokeWidth="0.7"
                      />
                      <circle
                        cx={x2}
                        cy={y2}
                        r={idx % 3 === 0 ? 2.1 : 1.3}
                        fill={idx % 2 === 0 ? node.accent : 'rgba(20,20,19,0.28)'}
                        fillOpacity="0.65"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Frosted Glass Model Icon Pill */}
              <div
                className={`absolute flex items-center justify-center w-10 h-10 rounded-full dia-glass transition-all duration-300 ${
                  isHovered ? 'scale-125 shadow-lg' : 'scale-100'
                }`}
              >
                <ModelGlyph glyph={node.glyph} accent={node.accent} />
              </div>

              {/* Hover Label */}
              {isHovered && (
                <span className="absolute top-8 px-2.5 py-0.5 rounded-full text-[10px] font-medium dia-glass text-[#141413] whitespace-nowrap shadow-sm">
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
