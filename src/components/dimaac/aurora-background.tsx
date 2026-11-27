"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

// Soft colour blobs that rise from an edge and drift slowly behind your content, with an optional
// giant faded word in the glow. It is the DiMaac footer aurora, made into a component.
// It stays cheap: every blob is one div with a gradient and a blur, and the drift only moves
// transforms, so the browser's GPU does the work. It pauses when it scrolls out of view.

export type AuroraPalette = "dimaac" | "sunset" | "ocean" | "ember" | "mono";

export type AuroraBackgroundProps = {
  /** Four CSS colours for the four blobs, left to right. Overrides `palette`. Fewer than four repeat. */
  colors?: string[];
  /** A ready-made set of four colours. "dimaac" is teal, mint, violet and pink. */
  palette?: AuroraPalette;
  /** How strong the whole glow is, from 0 (gone) to 1 (full). */
  intensity?: number;
  /** How soft the blobs are, as a blur in pixels. More blur melts the colours together. */
  blur?: number;
  /** How fast the blobs drift. 1 is slow and calm, 0 holds them still, 3 is lively. */
  speed?: number;
  /** The edge the glow rises from. */
  position?: "bottom" | "top" | "center";
  /** A giant faded word sitting in the glow. Leave it out (or null) for none. */
  wordmark?: string | null;
  /** Film grain over the glow, from 0 (none) to 0.2 (heavy). It hides colour banding. */
  grain?: number;
  /** Which tuning to use. "auto" follows the page: data-theme, a dark class, or the system setting. */
  theme?: "auto" | "light" | "dark";
  /** Extra classes for the outer box. Give it a size, or let your content size it. */
  className?: string;
  /** Your content. It sits above the glow. */
  children?: ReactNode;
};

// ---------- colours, tuned once for light and once for dark ----------
// On paper the glow can be strong and the colours deep. On near black the same colours would
// glare, so the mint is turned down and the teal and violet carry the light instead.

const palettes: Record<AuroraPalette, { light: string[]; dark: string[] }> = {
  dimaac: { light: ["#0f766e", "#99f6e4", "#7c3aed", "#f9a8d4"], dark: ["#14b8a6", "#99f6e4", "#7c3aed", "#f9a8d4"] },
  sunset: { light: ["#f97316", "#fde68a", "#e11d48", "#a855f7"], dark: ["#fb923c", "#fde68a", "#e11d48", "#a855f7"] },
  ocean: { light: ["#0284c7", "#a5f3fc", "#4f46e5", "#67e8f9"], dark: ["#38bdf8", "#a5f3fc", "#4f46e5", "#67e8f9"] },
  ember: { light: ["#dc2626", "#fdba74", "#9f1239", "#fb7185"], dark: ["#ef4444", "#fdba74", "#be123c", "#fb7185"] },
  mono: { light: ["#525252", "#d4d4d4", "#262626", "#a3a3a3"], dark: ["#d4d4d4", "#737373", "#a3a3a3", "#525252"] },
};

// How strong each of the four blobs is
const strength = {
  light: [0.55, 0.9, 0.45, 0.55],
  dark: [0.8, 0.38, 0.62, 0.34],
};

const wordmarkInk = {
  light: ["rgba(10,10,10,0.16)", "rgba(10,10,10,0.06)", "rgba(255,255,255,0.35)"],
  dark: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.04)", "rgba(255,255,255,0.22)"],
};

// Each blob: where it sits across the width (%), how wide and tall it is (% of the glow layer),
// and how it drifts: sideways and up/down in % of its own size, the scale it breathes between,
// the seconds one swing takes, and how far into the swing it starts so they never move together.
const blobs = [
  { x: 18, width: 80, height: 120, driftX: 10, driftY: 9, scale: 1.12, seconds: 9, start: 0 },
  { x: 42, width: 84, height: 140, driftX: -8, driftY: 12, scale: 1.08, seconds: 12, start: 0.35 },
  { x: 66, width: 80, height: 130, driftX: 9, driftY: 8, scale: 1.14, seconds: 10, start: 0.7 },
  { x: 88, width: 60, height: 100, driftX: -11, driftY: 11, scale: 1.1, seconds: 14, start: 0.15 },
] as const;

// Grain: a small tile of grey noise, drawn once as an SVG. Overlay blending keeps it neutral on
// both light and dark pages.
const noise =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 1.6 -0.3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

// ---------- "is the page dark?" without any site context ----------

function pageIsDark(): boolean {
  const root = document.documentElement;
  const picked = root.getAttribute("data-theme");
  if (picked === "dark") return true;
  if (picked === "light") return false;
  if (root.classList.contains("dark")) return true;
  if (root.classList.contains("light")) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function watchPageTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    query.removeEventListener("change", onChange);
  };
}

export function AuroraBackground({
  colors,
  palette = "dimaac",
  intensity = 0.85,
  blur = 48,
  speed = 1,
  position = "bottom",
  wordmark = null,
  grain = 0,
  theme = "auto",
  className = "",
  children,
}: AuroraBackgroundProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const swings = useRef<gsap.core.Tween[]>([]);
  // Read by the drift so a new speed never rebuilds it
  const speedRef = useRef(speed);
  speedRef.current = speed;

  // On a narrow box (a phone) the blobs would shrink into thin streaks, so they are drawn wider
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const watch = new ResizeObserver(([entry]) => setCompact((entry?.contentRect.width ?? 1000) < 640));
    watch.observe(box);
    return () => watch.disconnect();
  }, []);

  // The server renders the light tuning; the browser switches to dark right after if it should
  const pageDark = useSyncExternalStore(watchPageTheme, pageIsDark, () => false);
  const mode = theme === "auto" ? (pageDark ? "dark" : "light") : theme;

  // ---------- the drift ----------
  useGSAP(
    () => {
      const box = boxRef.current;
      const elements = blobRefs.current.filter((el): el is HTMLDivElement => el !== null);
      if (!box || elements.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // One endless back-and-forth swing per blob; yoyo makes it ease out and back with no jump
        swings.current = elements.map((el, i) => {
          const blob = blobs[i]!;
          return gsap.to(el, {
            xPercent: blob.driftX,
            yPercent: -blob.driftY,
            scale: blob.scale,
            duration: blob.seconds,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            force3D: true,
          });
        });
        swings.current.forEach((swing, i) => {
          swing.progress(blobs[i]!.start);
          swing.timeScale(speedRef.current);
        });

        // Nothing moves while the glow is off screen
        const visibility = new IntersectionObserver(([entry]) => {
          const on = entry?.isIntersecting ?? true;
          swings.current.forEach((swing) => (on ? swing.resume() : swing.pause()));
        });
        visibility.observe(box);

        return () => {
          visibility.disconnect();
          swings.current = [];
        };
      });

      return () => mm.revert();
    },
    { scope: boxRef, dependencies: [position], revertOnUpdate: true },
  );

  // A new speed only changes how fast the swings play
  useEffect(() => {
    swings.current.forEach((swing) => swing.timeScale(Math.max(0, speed)));
  }, [speed]);

  // ---------- what to draw ----------
  const picked = colors && colors.length > 0 ? colors : palettes[palette][mode];
  const colourFor = (i: number) => picked[i % picked.length]!;
  const alphas = strength[mode];
  // Where the blobs are centred, up and down the glow layer
  const centreY = position === "bottom" ? 100 : position === "top" ? 0 : 50;
  // The glow layer runs 30% past the edge it rises from, so the blobs' round bottoms stay off screen
  const layer: CSSProperties =
    position === "bottom" ? { top: 0, height: "130%" } : position === "top" ? { top: "-30%", height: "130%" } : { top: "-15%", height: "130%" };

  const ink = wordmarkInk[mode];
  const wordPlace: CSSProperties =
    position === "bottom"
      ? { bottom: "-0.2em", backgroundImage: `linear-gradient(180deg, ${ink[0]} 0%, ${ink[1]} 55%, ${ink[2]} 100%)` }
      : position === "top"
        ? { top: "-0.2em", backgroundImage: `linear-gradient(0deg, ${ink[0]} 0%, ${ink[1]} 55%, ${ink[2]} 100%)` }
        : { top: "50%", transform: "translateY(-50%)", backgroundImage: `linear-gradient(180deg, ${ink[1]} 0%, ${ink[0]} 50%, ${ink[1]} 100%)` };

  const widen = compact ? 1.7 : 1;
  const safeBlur = Math.max(0, blur);

  return (
    <div ref={boxRef} className={`relative h-full w-full overflow-hidden ${className}`} style={{ containerType: "inline-size" }}>
      <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: "-10%", right: "-10%", opacity: Math.min(1, Math.max(0, intensity)), ...layer }}>
        {blobs.map((blob, i) => (
          <div
            key={i}
            ref={(el) => {
              blobRefs.current[i] = el;
            }}
            className="absolute"
            style={{
              left: `${blob.x - (blob.width * widen) / 2}%`,
              top: `${centreY - blob.height / 2}%`,
              width: `${blob.width * widen}%`,
              height: `${blob.height}%`,
              // Fades from the colour at the heart to nothing at 70% of the way out, like the footer
              backgroundImage: `radial-gradient(closest-side, color-mix(in srgb, ${colourFor(i)} ${alphas[i]! * 100}%, transparent), transparent 70%)`,
              filter: safeBlur > 0 ? `blur(${safeBlur}px)` : undefined,
              willChange: "transform",
            }}
          />
        ))}
      </div>

      {wordmark ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 left-0 text-center leading-none font-medium whitespace-nowrap select-none"
          style={{
            fontSize: "clamp(96px, 25cqw, 380px)",
            letterSpacing: "-0.07em",
            color: "transparent",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            ...wordPlace,
          }}
        >
          {wordmark}
        </div>
      ) : null}

      {grain > 0 ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: noise, backgroundSize: "160px 160px", mixBlendMode: "overlay", opacity: Math.min(1, grain * 5) }}
        />
      ) : null}

      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}
