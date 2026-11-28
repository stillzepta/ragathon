import { Check, Copy, ExternalLink, Mail, Sparkles, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { api, API_URL } from '../api';

interface EmailModalProps {
  open: boolean;
  token: string;
  senderName?: string;
  onClose: () => void;
}

const TONES = ['Professional', 'Friendly', 'Concise', 'Follow-up'] as const;

function parseDraft(raw: string, fallbackPrompt: string): { subject: string; body: string } {
  const cleaned = raw.trim();
  const subjectMatch = cleaned.match(/^Subject:\s*(.+)$/im);
  if (subjectMatch) {
    const subject = subjectMatch[1].trim();
    const body = cleaned
      .replace(/^Subject:\s*.+$/im, '')
      .trim();
    return { subject, body };
  }
  const firstLine = fallbackPrompt.trim().slice(0, 60);
  return {
    subject: firstLine ? firstLine.charAt(0).toUpperCase() + firstLine.slice(1) : 'Quick Note',
    body: cleaned,
  };
}

function buildLocalDraft(prompt: string, tone: string, senderName?: string): { subject: string; body: string } {
  const topic = prompt.trim();
  const signOff = senderName ? `Best regards,\n${senderName}` : 'Best regards,';
  const greeting = tone === 'Friendly' ? 'Hi there,' : 'Hello,';
  const subjectBase = topic.replace(/^(write|draft|send|mail|email)\s+(an?\s+)?(email|mail)?\s*(about|to|for)?\s*/i, '').trim();
  const subject = subjectBase
    ? subjectBase.charAt(0).toUpperCase() + subjectBase.slice(1, 64)
    : 'Following up';

  if (tone === 'Concise') {
    return {
      subject,
      body: `${greeting}\n\n${topic.charAt(0).toUpperCase() + topic.slice(1)}.\n\nPlease let me know your thoughts.\n\n${signOff}`,
    };
  }
  return {
    subject,
    body: `${greeting}\n\nI wanted to reach out regarding ${topic}.\n\nPlease let me know if you have any questions or if we can discuss this further.\n\n${signOff}`,
  };
}

export function EmailModal({ open, token, senderName, onClose }: EmailModalProps) {
  const [to, setTo] = useState('');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<(typeof TONES)[number]>('Professional');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleDraft = async (e?: FormEvent) => {
    e?.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isDrafting) return;

    setIsDrafting(true);
    setError('');

    if (API_URL) {
      try {
        const formData = new FormData();
        formData.append(
          'prompt',
          `Write an email with a ${tone.toLowerCase()} tone based on this request: "${cleanPrompt}".` +
            (to.trim() ? ` Recipient: ${to.trim()}.` : '') +
            (senderName ? ` Sign off as ${senderName}.` : '') +
            ' Format your response strictly as:\nSubject: <subject line>\n\n<email body>'
        );
        formData.append('history', '[]');
        const res = await api('/api/chat', token, { method: 'POST', body: formData });
        const data = (await res.json()) as { reply: string };
        const parsed = parseDraft(data.reply, cleanPrompt);
        setSubject(parsed.subject);
        setBody(parsed.body);
        setIsDrafting(false);
        return;
      } catch (err) {
        setError(err instanceof Error ? `${err.message} Generated a local draft instead.` : '');
      }
    }

    const fallback = buildLocalDraft(cleanPrompt, tone, senderName);
    setSubject(fallback.subject);
    setBody(fallback.body);
    setIsDrafting(false);
  };

  const mailtoHref = `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to.trim())}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore clipboard errors */
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm animate-[backdrop-fade_0.2s_ease-out]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-[28px] dia-glass p-6 sm:p-7 space-y-4 animate-[modal-pop_0.28s_cubic-bezier(0.22,1,0.36,1)] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Mail className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#111113]">AI Mail Composer</h2>
              <p className="text-xs text-[#6E6E77]">Tell Diablo what to write and send directly</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close mail composer"
            className="p-2 rounded-full hover:bg-black/[0.05] text-[#6E6E77] hover:text-[#111113] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleDraft(e)} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#4A4A58] mb-1">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3.5 py-2 rounded-xl bg-white/85 border border-black/[0.08] text-sm text-[#111113] placeholder:text-[#8E8E99] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#4A4A58]">What should Diablo write?</label>
              <div className="flex items-center gap-1">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition cursor-pointer ${
                      tone === t
                        ? 'bg-[#111113] text-white'
                        : 'bg-white/70 text-[#555562] hover:bg-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Follow up on seed round deck & ask for Q3 metrics"
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/85 border border-black/[0.08] text-sm text-[#111113] placeholder:text-[#8E8E99] focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isDrafting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-medium transition cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isDrafting ? 'Writing...' : 'Draft'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-2.5 pt-1 border-t border-black/[0.06]">
          <div>
            <label className="block text-xs font-medium text-[#4A4A58] mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full px-3.5 py-2 rounded-xl bg-white/85 border border-black/[0.08] text-sm text-[#111113] placeholder:text-[#8E8E99] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A4A58] mb-1">Message</label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your AI-written email will appear here..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/85 border border-black/[0.08] text-sm text-[#111113] placeholder:text-[#8E8E99] focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            disabled={!subject && !body}
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#F3F4FA] disabled:opacity-40 border border-black/[0.08] text-xs font-medium text-[#111113] transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <div className="flex items-center gap-2">
            <a
              href={gmailHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#F3F4FA] border border-black/[0.08] text-xs font-medium text-[#111113] transition"
            >
              Open in Gmail
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111113] hover:bg-indigo-600 text-white text-xs font-medium transition"
            >
              <Mail className="w-3.5 h-3.5" />
              Send Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
