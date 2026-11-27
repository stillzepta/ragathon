import { useEffect, useRef, useState } from 'react';

interface RouteNode {
  id: string;
  name: string;
  x: number; // SVG 0..1440
  y: number; // SVG 0..900
  color: string;
  delay: number;
  glyph:
    | 'gemini'
    | 'openai'
    | 'claude'
    | 'meta'
    | 'deepseek'
    | 'mistral'
    | 'groq'
    | 'cohere';
}

const HUB = { x: 720, y: 760 };

const ROUTE_NODES: RouteNode[] = [
  { id: 'gemini', name: 'Gemini 2.5', x: 220, y: 210, color: '#3b82f6', delay: 0, glyph: 'gemini' },
  { id: 'openai', name: 'OpenAI', x: 450, y: 145, color: '#10b981', delay: -0.8, glyph: 'openai' },
  { id: 'claude', name: 'Anthropic', x: 720, y: 120, color: '#f59e0b', delay: -1.6, glyph: 'claude' },
  { id: 'meta', name: 'Meta Llama', x: 990, y: 145, color: '#6366f1', delay: -2.2, glyph: 'meta' },
  { id: 'mistral', name: 'Mistral', x: 1220, y: 210, color: '#f97316', delay: -0.4, glyph: 'mistral' },
  { id: 'deepseek', name: 'DeepSeek', x: 270, y: 420, color: '#0ea5e9', delay: -1.2, glyph: 'deepseek' },
  { id: 'groq', name: 'Groq', x: 1170, y: 420, color: '#ec4899', delay: -2.0, glyph: 'groq' },
  { id: 'cohere', name: 'Cohere', x: 720, y: 310, color: '#8b5cf6', delay: -2.7, glyph: 'cohere' },
];

function buildCurvePath(node: RouteNode) {
  const c1x = HUB.x + (node.x - HUB.x) * 0.25;
  const c1y = HUB.y - 220;
  const c2x = node.x;
  const c2y = node.y + 160;
  return `M ${HUB.x} ${HUB.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${node.x} ${node.y}`;
}

function ModelGlyph({ glyph, color }: { glyph: RouteNode['glyph']; color: string }) {
  switch (glyph) {
    case 'gemini':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill={color}>
          <path d="M12 2C12.6 7.4 16.6 11.4 22 12C16.6 12.6 12.6 16.6 12 22C11.4 16.6 7.4 12.6 2 12C7.4 11.4 11.4 7.4 12 2Z" />
        </svg>
      );
    case 'openai':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="1.9">
          <circle cx="12" cy="12" r="7.5" strokeDasharray="5 3" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'claude':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <path d="M5.5 18L10 6L14.5 18M7.5 14H12.5M18 6V18" />
        </svg>
      );
    case 'meta':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <path d="M4 13c0-3.5 2.2-6 4.5-6 2 0 3.5 2 3.5 5s1.5 5 3.5 5c2.3 0 4.5-2.5 4.5-6s-2.2-6-4.5-6c-2 0-3.5 2-3.5 5s-1.5 5-3.5 5C6.2 19 4 16.5 4 13z" />
        </svg>
      );
    case 'mistral':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill={color}>
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
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <path d="M4 13c3-5 10-7 15-3-1.5 4-6 7-11 6-2-.4-3.2-1.5-4-3z" />
          <circle cx="14" cy="11" r="1" fill={color} />
        </svg>
      );
    case 'groq':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <rect x="5" y="11" width="3" height="7" rx="1" fill={color} />
          <rect x="10.5" y="7" width="3" height="11" rx="1" fill={color} />
          <rect x="16" y="9" width="3" height="9" rx="1" fill={color} />
        </svg>
      );
    case 'cohere':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round">
          <path d="M5 14c1.5-5 3.5-5 5 0s3.5 5 5 0 3.5-5 4-1" />
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
      className="fixed inset-0 overflow-hidden pointer-events-none select-none bg-[#F8F9FB]"
    >
      {/* Subtle dot grid like OpenRouter */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />

      {/* Soft top-center ambient tint */}
      <div
        className="absolute inset-x-0 -top-24 h-96 opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(99, 102, 241, 0.12), rgba(56, 189, 248, 0.1) 45%, transparent 72%)',
        }}
      />

      {/* OpenRouter-style Animated Bezier Routing Curves */}
      <svg
        className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{
          transform: `translate3d(${pointer.x * -8}px, ${pointer.y * -6}px, 0)`,
        }}
      >
        {ROUTE_NODES.map((node) => {
          const d = buildCurvePath(node);
          const isHovered = hoveredId === node.id;
          return (
            <g key={node.id}>
              {/* Base hairline track */}
              <path
                d={d}
                fill="none"
                stroke={isHovered ? node.color : 'rgba(15, 23, 42, 0.09)'}
                strokeOpacity={isHovered ? 0.35 : 1}
                strokeWidth={isHovered ? 2 : 1.2}
                className="transition-all duration-300"
              />
              {/* Animated glowing data pulse */}
              <path
                d={d}
                fill="none"
                stroke={node.color}
                strokeOpacity={isHovered ? 0.95 : 0.45}
                strokeWidth={isHovered ? 2.6 : 1.8}
                strokeLinecap="round"
                className="animate-route-flow"
                style={{ animationDelay: `${node.delay}s` }}
              />
            </g>
          );
        })}
      </svg>

      {/* Interactive Model Nodes */}
      {ROUTE_NODES.map((node) => {
        const isHovered = hoveredId === node.id;
        const leftPct = (node.x / 1440) * 100;
        const topPct = (node.y / 900) * 100;

        return (
          <div
            key={node.id}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: `translate(calc(-50% + ${pointer.x * 10}px), calc(-50% + ${pointer.y * 8}px))`,
              transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div
              className="animate-float-gentle flex flex-col items-center"
              style={{ animationDelay: `${node.delay}s` }}
            >
              <div
                className={`w-11 h-11 rounded-2xl dia-glass flex items-center justify-center transition-all duration-300 ${
                  isHovered ? 'scale-115 shadow-lg' : 'scale-100'
                }`}
                style={{
                  borderColor: isHovered ? node.color : undefined,
                }}
              >
                <ModelGlyph glyph={node.glyph} color={node.color} />
              </div>
              <span
                className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium dia-glass-subtle text-[#3A3A37] transition-opacity duration-200 ${
                  isHovered ? 'opacity-100' : 'opacity-65'
                }`}
              >
                {node.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
