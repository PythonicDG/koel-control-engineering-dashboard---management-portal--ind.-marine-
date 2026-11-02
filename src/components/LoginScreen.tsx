import React, { useState } from 'react';
import { User } from '../types/index.ts';
import { api, errorMessage } from '../api/client.ts';
import { BrandLogo } from './BrandLogo.tsx';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // Empty inputs by default as requested (no pre-filled credentials)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredGuide, setShowCredGuide] = useState(false);

  // Authentication is performed by the Django API (hashed passwords, token session)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('User ID is required.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Password is required. Password protection is strictly enabled.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await api.auth.login(username.trim(), password.trim());
      onLoginSuccess(user);
    } catch (err) {
      setErrorMsg(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white selection:bg-[#064e3b] selection:text-white">
      {/* ================= LEFT SIDE: DARK GREEN & TEAL GRADIENT WITH INDUSTRIAL & MARINE MOTIFS ================= */}
      <div className="lg:w-1/2 w-full min-h-[420px] lg:min-h-screen relative overflow-hidden bg-gradient-to-b from-[#022c22] via-[#064e3b] to-[#0f766e] flex flex-col justify-between p-8 sm:p-12 lg:p-16 text-white shrink-0">
        {/* Subtle Decorative Background Vector Elements: Ships, Gears, Waves, Charts */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
          {/* Top Gear / Cogs Motif */}
          <svg
            className="absolute top-12 left-12 w-48 h-48 text-emerald-300 stroke-current fill-none stroke-[1.2]"
            viewBox="0 0 100 100"
          >
            <circle cx="40" cy="40" r="16" strokeDasharray="3 3" />
            <circle cx="40" cy="40" r="8" />
            <path d="M40 18v6 M40 56v6 M18 40h6 M56 40h6 M25 25l4 4 M51 51l4 4 M25 55l4-4 M51 29l4-4" />
            <circle cx="70" cy="65" r="14" strokeDasharray="2 2" />
            <circle cx="70" cy="65" r="6" />
          </svg>

          {/* Faint Wave Curves */}
          <svg
            className="absolute top-44 left-0 w-full h-32 text-teal-200 stroke-current fill-none stroke-[1.5]"
            viewBox="0 0 600 100"
            preserveAspectRatio="none"
          >
            <path d="M0 40 Q 75 10, 150 40 T 300 40 T 450 40 T 600 40" opacity="0.6" />
            <path d="M0 60 Q 90 25, 180 60 T 360 60 T 540 60 T 720 60" opacity="0.4" />
          </svg>

          {/* Cargo Container Ship Outline Motif (Right Center) */}
          <svg
            className="absolute top-28 right-4 w-72 h-44 text-teal-300 stroke-current fill-none stroke-[1.4]"
            viewBox="0 0 240 120"
          >
            <rect x="70" y="35" width="20" height="15" />
            <rect x="92" y="35" width="20" height="15" />
            <rect x="114" y="35" width="20" height="15" />
            <rect x="136" y="35" width="20" height="15" />
            <rect x="80" y="20" width="20" height="15" />
            <rect x="102" y="20" width="20" height="15" />
            <rect x="124" y="20" width="20" height="15" />
            <path d="M165 50 V15 H185 V50" />
            <rect x="170" y="22" width="10" height="6" />
            <path d="M20 50 L50 85 H200 L225 50 Z" />
            <path d="M10 65 Q 60 70, 110 65 T 210 65" strokeDasharray="4 4" />
            <circle cx="175" cy="5" r="4" />
            <path d="M171 5 A 8 8 0 0 1 179 5" />
          </svg>

          {/* Vessel Bow Silhouette (Left Lower) */}
          <svg
            className="absolute bottom-20 left-6 w-36 h-48 text-emerald-400 stroke-current fill-none stroke-[1.5]"
            viewBox="0 0 100 130"
          >
            <path d="M20 10 H80 L90 35 L50 115 L10 35 Z" />
            <line x1="50" y1="10" x2="50" y2="115" />
            <line x1="20" y1="35" x2="80" y2="35" />
            <line x1="28" y1="55" x2="72" y2="55" />
            <rect x="35" y="0" width="30" height="10" />
          </svg>

          {/* Bottom Analytics & Telemetry Grid (Bottom Center) */}
          <svg
            className="absolute bottom-6 left-36 right-10 h-36 text-emerald-200 stroke-current fill-none stroke-[1.2]"
            viewBox="0 0 400 120"
          >
            <rect x="10" y="60" width="10" height="50" fill="currentColor" fillOpacity="0.15" />
            <rect x="25" y="45" width="10" height="65" fill="currentColor" fillOpacity="0.15" />
            <rect x="40" y="30" width="10" height="80" fill="currentColor" fillOpacity="0.15" />
            <rect x="55" y="50" width="10" height="60" fill="currentColor" fillOpacity="0.15" />
            <rect x="70" y="20" width="10" height="90" fill="currentColor" fillOpacity="0.15" />
            <path d="M100 100 C 140 90, 180 30, 240 50 S 300 10, 380 40" strokeWidth="2" />
            <path
              d="M100 100 C 140 90, 180 30, 240 50 S 300 10, 380 40 L 380 110 L 100 110 Z"
              fill="currentColor"
              fillOpacity="0.08"
            />
            <rect x="220" y="65" width="90" height="45" rx="4" />
            <line x1="220" y1="80" x2="310" y2="80" />
            <circle cx="240" cy="98" r="8" />
            <line x1="260" y1="92" x2="300" y2="92" />
            <line x1="260" y1="102" x2="290" y2="102" />
          </svg>
        </div>

        {/* Top-Left: Brand Logo (Clean Kirloskar Logo without side KOEL MARINE badge) */}
        <div className="relative z-10 flex items-center">
          <div className="bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-xl shadow-md inline-flex items-center gap-2 border border-white/20">
            <BrandLogo size="md" variant="login" />
          </div>
        </div>

        {/* Center: Hero Statement with No Extra Subtitle */}
        <div className="relative z-10 max-w-xl my-auto py-12">
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            PLM Marine Engineering Suite
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            Welcome to <br />
            Control Engg. Dashboard <br />
            <span className="text-emerald-300 font-bold text-2xl sm:text-3xl lg:text-4xl">(Ind.Marine)</span>
          </h1>
        </div>

        {/* Bottom Area: Clean & Uncluttered (Text Removed as Requested) */}
        <div className="relative z-10" />
      </div>

      {/* ================= RIGHT SIDE: CLEAN WHITE BACKGROUND WITH SOFTLY SHADOWED SIGN IN CARD ================= */}
      <div className="lg:w-1/2 w-full bg-slate-50/60 lg:bg-white flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative">
        <div className="w-full max-w-[430px] bg-white rounded-2xl shadow-xl border border-slate-100/90 p-8 sm:p-10 relative z-10">
          {/* Card Header with Brand Logo at top */}
          <div className="text-center mb-7">
            <div className="flex justify-center mb-5">
              <BrandLogo size="md" variant="login" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#064e3b] tracking-tight">
              Sign In
            </h2>
            <div className="w-10 h-1 bg-[#0d9488] mx-auto mt-2.5 rounded-full" />
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-3">
              Enter your credentials to continue
            </p>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2 animate-in fade-in"
            >
              <i className="fa-solid fa-circle-exclamation text-rose-600 text-sm mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form with Clean Un-filled Input Fields */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Field 1: Username / ID * with Person Icon */}
            <div className="relative">
              <label
                htmlFor="input-username"
                className="absolute -top-2.5 left-3 bg-white px-1.5 text-xs font-semibold text-slate-600 z-10"
              >
                Username / ID *
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                  <i className="fa-solid fa-user text-sm" />
                </span>
                <input
                  id="input-username"
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-[#064e3b] transition-all font-medium"
                  placeholder="Enter Username or ID"
                />
              </div>
            </div>

            {/* Field 2: Password * with Lock Icon and Eye Visibility Toggle */}
            <div className="relative">
              <label
                htmlFor="input-password"
                className="absolute -top-2.5 left-3 bg-white px-1.5 text-xs font-semibold text-slate-600 z-10"
              >
                Password *
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                  <i className="fa-solid fa-lock text-sm" />
                </span>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-[#064e3b] transition-all font-medium tracking-wider"
                  placeholder="Enter Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                </button>
              </div>
            </div>

            {/* Solid Dark Green "Sign In" Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-[#064e3b] hover:bg-[#043d2e] active:bg-[#022c22] text-white font-bold text-base rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 ring-1 ring-emerald-600/30"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin text-sm" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            {/* Password Protection Security Badge & Helper */}
            <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <i className="fa-solid fa-shield-halved text-emerald-600" />
              <span>Password Protection Active</span>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => setShowCredGuide(prev => !prev)}
                className="text-[#064e3b] hover:text-[#0d9488] hover:underline cursor-pointer font-semibold"
              >
                {showCredGuide ? 'Hide Credentials' : 'View Authorized Credentials'}
              </button>
            </div>

            {showCredGuide && (
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/80 text-[11px] text-slate-600 space-y-2 animate-in fade-in">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-key text-amber-500" />
                    <span>Authorized Accounts</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Click to quick-fill</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                  <span className="text-slate-700"><strong>Admin:</strong> <code className="bg-white px-1 py-0.5 rounded text-slate-800 font-mono border border-slate-200">admin</code></span>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin');
                      setPassword('admin123');
                    }}
                    className="text-[10px] bg-[#064e3b] hover:bg-[#043d2e] text-white px-2 py-0.5 rounded font-semibold cursor-pointer shadow-xs"
                  >
                    Quick Fill
                  </button>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-700"><strong>Engineer:</strong> <code className="bg-white px-1 py-0.5 rounded text-slate-800 font-mono border border-slate-200">engineer</code></span>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('engineer');
                      setPassword('user123');
                    }}
                    className="text-[10px] bg-[#0d9488] hover:bg-[#0f766e] text-white px-2 py-0.5 rounded font-semibold cursor-pointer shadow-xs"
                  >
                    Quick Fill
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Footer Text Directly at the Bottom of Card */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-normal">
              Copyright © 2026 Kirloskar Oil Engines Ltd. All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
