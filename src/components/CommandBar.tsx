import { ArrowRight, Paperclip, X } from 'lucide-react';
import { ChangeEvent, useRef } from 'react';
import { DEMO_PRESETS, DOMAIN_PACKS } from '../data/presets';
import { DemoPreset, DomainId } from '../types';

interface CommandBarProps {
  prompt: string;
  onChangePrompt: (val: string) => void;
  selectedDomain: DomainId;
  attachedFile: File | null;
  onAttachFile: (file: File | null) => void;
  onRun: () => void;
  onSelectPreset: (preset: DemoPreset) => void;
  isRunning: boolean;
  compact: boolean;
}

export function CommandBar({
  prompt,
  onChangePrompt,
  selectedDomain,
  attachedFile,
  onAttachFile,
  onRun,
  onSelectPreset,
  isRunning,
  compact,
}: CommandBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentPack = DOMAIN_PACKS.find((d) => d.id === selectedDomain) ?? DOMAIN_PACKS[0];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onAttachFile(file);
  };

  return (
    <section className={`relative mx-auto w-full transition-all duration-500 ${compact ? 'max-w-7xl' : 'max-w-3xl pt-8 sm:pt-14'}`}>
      {/* Signature Dia Aurora Watercolor Glow */}
      {!compact && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-10 top-4 h-72 rounded-full opacity-75 blur-3xl animate-aurora"
          style={{
            background:
              'radial-gradient(circle at 25% 40%, rgba(167, 243, 208, 0.55), transparent 55%), radial-gradient(circle at 75% 35%, rgba(186, 230, 253, 0.6), transparent 55%), radial-gradient(circle at 50% 80%, rgba(254, 243, 199, 0.5), transparent 60%)',
          }}
        />
      )}

      {/* Editorial Headline (only on hero) */}
      {!compact && (
        <div className="relative text-center mb-8 px-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#6E6E6A] mb-3">
            Multi-Agent Operating System
          </p>
          <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-[#141413] leading-[1.08]">
            One problem. Multiple agents.
            <br />
            One{' '}
            <span className="font-serif-accent italic font-normal text-[1.08em]">
              calm
            </span>{' '}
            solution.
          </h1>
          <p className="mt-3 text-sm text-[#6E6E6A] max-w-xl mx-auto">
            {currentPack.tagline}
          </p>
        </div>
      )}

      {/* Floating Glass Command Omnibox */}
      <div className="relative dia-glass rounded-3xl p-3 sm:p-4 transition-all">
        <textarea
          value={prompt}
          onChange={(e) => onChangePrompt(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && prompt.trim() && !isRunning) {
              onRun();
            }
          }}
          rows={compact ? 2 : 3}
          placeholder="Describe any task, paste a suspicious link or error log, or attach a PDF..."
          className="w-full resize-none bg-transparent text-sm sm:text-[15px] text-[#141413] placeholder:text-[#9A9A94] focus:outline-none px-1"
        />

        <div className="mt-2 pt-2.5 border-t border-black/[0.05] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.csv,.log,.json,.eml"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-black/[0.04] hover:bg-black/[0.08] text-[#3A3A37] transition cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach PDF / Log / CSV</span>
            </button>

            {attachedFile && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-900 border border-emerald-200">
                <span className="truncate max-w-[160px]">{attachedFile.name}</span>
                <button
                  type="button"
                  onClick={() => onAttachFile(null)}
                  className="hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="hidden sm:inline text-[11px] text-[#8E8E88]">
              ⌘ + Enter
            </span>
            <button
              type="button"
              disabled={!prompt.trim() || isRunning}
              onClick={onRun}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-[#141413] text-white hover:bg-[#2A2A28] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-sm"
            >
              <span>{isRunning ? 'Agents Working...' : 'Run Mission'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* One-Click Demo Presets */}
      {!compact && (
        <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] text-[#8E8E88] mr-1">Try a live scenario:</span>
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className="px-3 py-1.5 rounded-full text-xs font-medium dia-glass-subtle text-[#3A3A37] hover:bg-white transition cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
