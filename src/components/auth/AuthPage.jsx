import React, { useState } from 'react';
import { TrendingUp, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

function formatAuthError(err, activeTab) {
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code.includes('invalid-credential') || code.includes('user-not-found') || code.includes('wrong-password')) {
    if (activeTab === 'signin') {
      return 'Invalid email or password. If you do not have an account yet, please switch to the "Sign Up" tab to create one.';
    }
    return 'Invalid email or password.';
  }
  if (code.includes('email-already-in-use')) {
    return 'An account with this email already exists. Please switch to the "Sign In" tab to log in.';
  }
  if (code.includes('weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code.includes('network-request-failed')) {
    return 'Network error. Please check your internet connection.';
  }

  return msg.replace(/^Firebase:\s*/, '') || 'Authentication failed. Please try again.';
}

export default function AuthPage({ onSignIn, onSignUp, onResetPassword }) {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      return setError('Email is required.');
    }

    if (activeTab === 'forgot') {
      setLoading(true);
      try {
        await onResetPassword?.(email);
        setSuccessMsg('Password reset email sent! Check your inbox (and spam folder).');
      } catch (err) {
        setError(formatAuthError(err, activeTab));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (activeTab === 'signup' && password !== confirmPassword) {
      return setError('Passwords must match.');
    }

    setLoading(true);
    try {
      if (activeTab === 'signin') {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password);
      }
    } catch (err) {
      setError(formatAuthError(err, activeTab));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15 transition-all";

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-15%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none" />

      {/* Auth Card */}
      <div className="relative w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl z-10 animate-scaleIn">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
            <TrendingUp size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {activeTab === 'forgot' ? 'Reset Password' : 'Trading Journal'}
          </h1>
          <p className="text-slate-400 text-sm mt-1 text-center">
            {activeTab === 'forgot'
              ? 'Enter your email address and we will send you a reset link'
              : 'Track your performance & discipline'}
          </p>
        </div>

        {/* Tabs (Hidden in forgot password mode) */}
        {activeTab !== 'forgot' && (
          <div className="flex p-1 bg-black/30 rounded-xl mb-6">
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'signin' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => { setActiveTab('signin'); setError(''); setSuccessMsg(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'signup' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => { setActiveTab('signup'); setError(''); setSuccessMsg(''); }}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Mail size={18} />
            </div>
            <input
              type="email"
              placeholder="Email address"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password (only in signin and signup mode) */}
          {activeTab !== 'forgot' && (
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className={`${inputClass} !pr-11`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {/* Forgot Password Link (in signin mode) */}
          {activeTab === 'signin' && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => { setActiveTab('forgot'); setError(''); setSuccessMsg(''); }}
                className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Confirm Password (only in signup mode) */}
          {activeTab === 'signup' && (
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                className={inputClass}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-medium transition-all flex items-center justify-center disabled:opacity-70 shadow-lg shadow-blue-600/20"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : activeTab === 'forgot' ? (
              'Send Reset Link'
            ) : activeTab === 'signin' ? (
              'Sign In'
            ) : (
              'Sign Up'
            )}
          </button>

          {/* Back to Sign In (in forgot mode) */}
          {activeTab === 'forgot' && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setError(''); setSuccessMsg(''); }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
