import { ArrowRight, Lock, Mail, Sparkles, User, X } from 'lucide-react';
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/75 border border-white text-xs font-medium text-indigo-950 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AgentVerse</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111113]">
                {mode === 'signin' ? 'Welcome back' : 'Create your workspace'}
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
              className="p-2 rounded-full bg-white/60 hover:bg-white text-[#4A4A58] hover:text-[#111113] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickOAuth('Google')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/80 hover:bg-white border border-white text-xs font-medium text-[#111113] shadow-2xs transition cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-500 via-emerald-400 to-amber-400 inline-block" />
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickOAuth('GitHub')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/80 hover:bg-white border border-white text-xs font-medium text-[#111113] shadow-2xs transition cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full bg-[#111113] text-white text-[10px] font-bold flex items-center justify-center">
                G
              </span>
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
              <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 border border-white px-4 py-2.5 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 transition">
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

            <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 border border-white px-4 py-2.5 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 transition">
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

            <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 border border-white px-4 py-2.5 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 transition">
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
