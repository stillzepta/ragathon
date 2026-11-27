import { useEffect, useRef } from 'react';

export function DotFieldBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = { x: -9999, y: -9999, active: false };
    const pulses: { x: number; y: number; r: number; alpha: number }[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active =
        mouse.x >= 0 && mouse.x <= width && mouse.y >= 0 && mouse.y <= height;
    };

    const onLeave = () => {
      mouse.active = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pulses.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        r: 0,
        alpha: 0.9,
      });
    };

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('click', onClick);

    const spacing = 28;
    let t = 0;

    const draw = () => {
      t += 0.022;
      ctx.clearRect(0, 0, width, height);

      // Update click pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].r += 6.5;
        pulses[i].alpha *= 0.965;
        if (pulses[i].alpha < 0.02) pulses.splice(i, 1);
      }

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const offsetX = (width - (cols - 1) * spacing) / 2;
      const offsetY = (height - (rows - 1) * spacing) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = offsetX + c * spacing;
          const baseY = offsetY + r * spacing;

          // Smooth diagonal wave shimmer
          const wave =
            Math.sin(c * 0.28 + t) * 0.5 + Math.cos(r * 0.25 - t * 0.85) * 0.5;

          let size = 1.15 + (wave + 1) * 0.28;
          let alpha = 0.14 + (wave + 1) * 0.09;
          let glowMix = 0;

          // Interactive cursor proximity boost
          if (mouse.active) {
            const dx = mouse.x - baseX;
            const dy = mouse.y - baseY;
            const dist = Math.hypot(dx, dy);
            if (dist < 150) {
              const factor = 1 - dist / 150;
              const smooth = factor * factor;
              size += smooth * 1.65;
              alpha += smooth * 0.65;
              glowMix = Math.max(glowMix, smooth);
            }
          }

          // Click wave ring boost (no circle stroke, pure dot illumination)
          for (let p = 0; p < pulses.length; p++) {
            const pulse = pulses[p];
            const dist = Math.hypot(pulse.x - baseX, pulse.y - baseY);
            const band = Math.abs(dist - pulse.r);
            if (band < 48) {
              const pFactor = (1 - band / 48) * pulse.alpha;
              size += pFactor * 1.4;
              alpha += pFactor * 0.55;
              glowMix = Math.max(glowMix, pFactor);
            }
          }

          if (glowMix > 0.05) {
            // Luminous emerald-to-cyan-white glow near cursor/pulse
            const rCol = Math.round(255 - glowMix * 160);
            const gCol = Math.round(255 - glowMix * 20);
            const bCol = Math.round(255 - glowMix * 45);
            ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${Math.min(1, alpha)})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          }

          ctx.beginPath();
          ctx.arc(baseX, baseY, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-[#030303] pointer-events-none select-none"
    >
      {/* Subtle center vignette glow */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(16, 185, 129, 0.09) 0%, rgba(56, 189, 248, 0.05) 35%, transparent 70%)',
        }}
      />
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
