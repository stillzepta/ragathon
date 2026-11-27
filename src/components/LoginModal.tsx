import { ArrowRight, Lock, Mail, User, X } from 'lucide-react';
import { FormEvent, useState } from 'react';

export interface AuthUser {
  name: string;
  email: string;
}

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

function GitHubLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-[#111113]" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const displayName =
      name.trim() || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') || 'User';
    onLogin({ name: displayName, email: email.trim() });
    onClose();
  };

  const handleQuickOAuth = (provider: 'Google' | 'GitHub') => {
    onLogin({
      name: `${provider} User`,
      email: `demo@${provider.toLowerCase()}.com`,
    });
    onClose();
  };

  return (
    <div className="min-h-screen w-screen kraft-bg flex items-center justify-center p-4 animate-backdrop-fade relative overflow-hidden">
      {/* Soft ambient indigo halo behind card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[520px] h-[520px] rounded-full opacity-50 blur-3xl animate-pulse"
        style={{
          background:
            'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(129, 140, 248, 0.2) 55%, transparent 75%)',
        }}
      />

      {/* Solid Crisp White Login Card */}
      <div className="relative w-full max-w-md bg-white rounded-[34px] border border-black/[0.07] shadow-[0_32px_80px_rgba(20,24,60,0.2)] overflow-hidden animate-modal-pop">
        <div className="h-[1.5px] w-full indigo-top-glow" />

        <div className="p-7 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111113]">
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </h2>
              <p className="text-xs sm:text-sm text-[#4A4A58] mt-1">
                {mode === 'signin'
                  ? 'Sign in to sync your chats and agent memory.'
                  : 'Get started with five specialized AI agents.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close login"
              className="p-2 rounded-full bg-[#F5F6FA] hover:bg-[#ECEEF5] text-[#4A4A58] hover:text-[#111113] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickOAuth('Google')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#F8F9FC] hover:bg-[#F0F2F9] border border-black/[0.08] text-xs font-medium text-[#111113] transition cursor-pointer"
            >
              <GoogleLogo />
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickOAuth('GitHub')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#F8F9FC] hover:bg-[#F0F2F9] border border-black/[0.08] text-xs font-medium text-[#111113] transition cursor-pointer"
            >
              <GitHubLogo />
              <span>GitHub</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-black/[0.08]" />
            <span className="text-[11px] uppercase tracking-wider text-[#6E6E7C]">
              or continue with email
            </span>
            <div className="h-px flex-1 bg-black/[0.08]" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-[#F8F9FC] border border-black/[0.08] px-4 py-2.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 transition">
                <User className="w-4 h-4 text-[#6E6E7C] shrink-0" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full bg-transparent text-sm text-[#111113] placeholder:text-[#7A7A8C] focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center gap-2.5 rounded-2xl bg-[#F8F9FC] border border-black/[0.08] px-4 py-2.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 transition">
              <Mail className="w-4 h-4 text-[#6E6E7C] shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent text-sm text-[#111113] placeholder:text-[#7A7A8C] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl bg-[#F8F9FC] border border-black/[0.08] px-4 py-2.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 transition">
              <Lock className="w-4 h-4 text-[#6E6E7C] shrink-0" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent text-sm text-[#111113] placeholder:text-[#7A7A8C] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#111113] hover:bg-indigo-600 text-white text-sm font-medium shadow-[0_12px_28px_rgba(17,17,19,0.2)] transition cursor-pointer"
            >
              <span>{mode === 'signin' ? 'Sign in' : 'Create account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Toggle */}
          <div className="flex items-center justify-between text-xs text-[#4A4A58] pt-1">
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="hover:text-[#111113] font-medium transition cursor-pointer"
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-[#6E6E7C] hover:text-[#111113] transition cursor-pointer"
            >
              Continue as guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
