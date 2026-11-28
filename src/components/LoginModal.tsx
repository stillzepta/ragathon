import { ArrowRight, Lock, Mail, User, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() || email.split('@')[0] } },
        });
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (mode === 'signup' && !result.data.session) {
      setSuccess('Account created. Please sign in.');
      setMode('signin');
      setPassword('');
      return;
    }
    if (result.data.user && (mode === 'signin' || result.data.session)) {
      const profileName = result.data.user.user_metadata?.full_name || name.trim() || result.data.user.email?.split('@')[0] || 'User';
      await supabase.from('profiles').upsert({ id: result.data.user.id, full_name: profileName }, { onConflict: 'id' });
      onLogin({
        name: profileName,
        email: result.data.user.email ?? email.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-fade">
      {/* Blurred backdrop over workspace */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#141738]/28 backdrop-blur-md"
      />

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
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#111113] hover:bg-indigo-600 text-white text-sm font-medium shadow-[0_12px_28px_rgba(17,17,19,0.2)] transition cursor-pointer"
            >
              <span>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>}
          {success && <p role="status" className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{success}</p>}

          {/* Footer Toggle */}
          <div className="flex items-center justify-between text-xs text-[#4A4A58] pt-1">
            <button
              type="button"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}
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
