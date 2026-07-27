import React, { useState } from 'react';
import { TrendingUp, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AuthPage({ onSignIn, onSignUp }) {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      return setError('Email is required.');
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
      setError(err.message || 'Authentication failed. Please try again.');
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
          <h1 className="text-2xl font-bold text-white">Trading Journal</h1>
          <p className="text-slate-400 text-sm mt-1">Track your performance & discipline</p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-black/30 rounded-xl mb-6">
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'signin' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => { setActiveTab('signin'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'signup' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => { setActiveTab('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
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

          {/* Password */}
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

          {/* Confirm Password */}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-medium transition-all flex items-center justify-center disabled:opacity-70 shadow-lg shadow-blue-600/20"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (activeTab === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
}
