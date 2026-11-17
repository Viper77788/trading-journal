import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;
const LOCKOUT_UNTIL_KEY = 'apexflow_login_lockout_until';
const FAILED_ATTEMPTS_KEY = 'apexflow_login_failed_count';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    const saved = window.sessionStorage.getItem(FAILED_ATTEMPTS_KEY);
    return saved ? Number(saved) || 0 : 0;
  });
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(() => {
    const until = Number(window.sessionStorage.getItem(LOCKOUT_UNTIL_KEY) || 0);
    const diff = Math.ceil((until - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = window.setInterval(() => {
      const until = Number(window.sessionStorage.getItem(LOCKOUT_UNTIL_KEY) || 0);
      const diff = Math.ceil((until - Date.now()) / 1000);
      if (diff <= 0) {
        setLockoutRemaining(0);
        setFailedAttempts(0);
        window.sessionStorage.removeItem(LOCKOUT_UNTIL_KEY);
        window.sessionStorage.removeItem(FAILED_ATTEMPTS_KEY);
        setErrorMessage(null);
      } else {
        setLockoutRemaining(diff);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lockoutRemaining]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0 || isLoading) return;

    setErrorMessage(null);
    setInfoMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage(
        'Supabase URL is not configured yet. Please add VITE_SUPABASE_URL to your .env file.'
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        const nextCount = failedAttempts + 1;
        setFailedAttempts(nextCount);
        window.sessionStorage.setItem(FAILED_ATTEMPTS_KEY, String(nextCount));

        if (nextCount >= MAX_FAILED_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_SECONDS * 1000;
          window.sessionStorage.setItem(LOCKOUT_UNTIL_KEY, String(until));
          setLockoutRemaining(LOCKOUT_SECONDS);
          setErrorMessage(
            `Too many wrong attempts. Please wait ${LOCKOUT_SECONDS} seconds before trying again.`
          );
        } else {
          setErrorMessage('Wrong email or password');
        }
      } else {
        window.sessionStorage.removeItem(LOCKOUT_UNTIL_KEY);
        window.sessionStorage.removeItem(FAILED_ATTEMPTS_KEY);
        setFailedAttempts(0);
        setLockoutRemaining(0);
      }
    } catch {
      setErrorMessage('Unable to reach server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage(
        'Supabase URL is not configured yet. Please add VITE_SUPABASE_URL to your .env file.'
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Enter your email address above first, then click Forgot password?');
      return;
    }

    setIsResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: window.location.origin,
      });
      if (error) {
        setErrorMessage('Could not send password reset email. Please try again.');
      } else {
        setInfoMessage('Password reset email sent! Please check your inbox.');
      }
    } catch {
      setErrorMessage('Could not send password reset email. Please check your connection.');
    } finally {
      setIsResetLoading(false);
    }
  };

  const isLocked = lockoutRemaining > 0;

  return (
    <div className="min-h-screen w-full bg-[#FFFBF2] flex items-center justify-center p-4">
      <div className="paper-sheet w-full max-w-[460px] p-6 sm:p-8 space-y-5">
        {/* Chunky Brown Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] text-[#5C3D2E] mb-1">
            <Lock className="w-6 h-6 stroke-[2.4]" />
          </div>
          <h1 className="font-heading text-[28px] sm:text-[32px] font-bold uppercase text-[#8B5E3C] leading-tight m-0">
            DAILY TRADING TRACKER
          </h1>
          <p className="text-[17px] font-bold text-[#5C3D2E] m-0">
            Private journal. Please sign in.
          </p>
        </div>

        {/* Status / Error Banner */}
        {isLocked ? (
          <div className="p-3.5 rounded-xl bg-[#F5B8B0] border-2 border-[#8B5E3C] flex items-center gap-2.5 text-[#9B2C20] font-bold text-[16px]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>
              Too many wrong attempts. Try again in {lockoutRemaining}s.
            </span>
          </div>
        ) : errorMessage ? (
          <div className="p-3.5 rounded-xl bg-[#F5B8B0] border-2 border-[#8B5E3C] flex items-center gap-2.5 text-[#9B2C20] font-bold text-[16px]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] flex items-center gap-2.5 text-[#2F6B3A] font-bold text-[16px]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Email Box */}
          <div className="p-3.5 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] space-y-1.5">
            <label
              htmlFor="login-email"
              className="flex items-center gap-2 text-[16px] font-extrabold text-[#5C3D2E]"
            >
              <Mail className="w-4 h-4 text-[#8B5E3C]" />
              <span>Email</span>
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              disabled={isLocked || isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-[46px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] placeholder:text-[#8B5E3C]/50 outline-none disabled:opacity-60"
            />
          </div>

          {/* Password Box with Show/Hide Eye Icon */}
          <div className="p-3.5 rounded-xl bg-[#E2DCEB] border-2 border-[#8B5E3C] space-y-1.5">
            <label
              htmlFor="login-password"
              className="flex items-center justify-between text-[16px] font-extrabold text-[#5C3D2E]"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#8B5E3C]" />
                <span>Password</span>
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={isLocked || isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-[46px] pl-3.5 pr-12 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] placeholder:text-[#8B5E3C]/50 outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLocked || isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 p-1.5 rounded-lg text-[#8B5E3C] hover:bg-[#F0DED4]/60 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Big Pastel SIGN IN Button */}
          <button
            type="submit"
            disabled={isLocked || isLoading}
            className="w-full h-[52px] rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] disabled:bg-[#E8E0A9] border-2 border-[#8B5E3C] font-heading text-[20px] font-bold tracking-wide text-[#2F6B3A] disabled:text-[#8B5E3C] transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLocked
              ? `LOCKED (${lockoutRemaining}s)`
              : isLoading
                ? 'SIGNING IN...'
                : 'SIGN IN'}
          </button>
        </form>

        {/* Forgot Password Link */}
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isResetLoading || isLocked}
            className="text-[16px] font-bold text-[#8B5E3C] hover:text-[#5C3D2E] underline underline-offset-4 cursor-pointer disabled:opacity-50"
          >
            {isResetLoading ? 'Sending reset link...' : 'Forgot password?'}
          </button>
        </div>
      </div>
    </div>
  );
};
