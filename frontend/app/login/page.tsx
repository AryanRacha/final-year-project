'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Github from '@/app/components/GithubIcon';
import {
  ShieldCheck,
  Zap,
  ArrowLeft,
  Sparkles,
  GitBranch,
  Layers,
  Lock,
} from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, loginWithGithub, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="relative min-h-screen bg-black text-zinc-100 flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* Subtle Background Grid & Glows */}
      <div className="absolute inset-0 bg-dot-grid opacity-25 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-zinc-700/20 via-zinc-800/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Top Header Navigation */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl w-full mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-zinc-300 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 transition-colors">
            <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-transform group-hover:-translate-x-0.5" />
          </div>
          <span className="text-xs font-medium tracking-tight">Back to overview</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-bold text-xs font-mono">
            S
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">Sentinel AI</span>
        </div>
      </header>

      {/* Central Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card Wrapper */}
          <div className="relative rounded-2xl bg-zinc-950/80 border border-zinc-800 p-8 shadow-2xl backdrop-blur-xl transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              GitHub OAuth Ready
            </div>

            {/* Header / Brand Icon */}
            <div className="flex flex-col items-center text-center space-y-3 mb-8 pt-2">
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/60 shadow-inner">
                <Github className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Log in to Sentinel
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
                Access your multi-repo intelligence workspace, autonomous fix agents, and AI code guardrails.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={loginWithGithub}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Github className="w-4 h-4 fill-black" />
                <span>Continue with GitHub</span>
              </button>

              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <span className="relative px-3 bg-zinc-950 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  Secure Enterprise Authentication
                </span>
              </div>

              {/* Security Features Bullet Points */}
              <div className="space-y-2.5 text-xs text-zinc-400 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Read-only repo indexing & graph extraction</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <GitBranch className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Multi-repository cross-service dependency tracing</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>JWT-authenticated session tokens (api-service)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-zinc-500 mt-6 leading-relaxed">
            By logging in, you agree to our Terms of Service & Privacy Policy.<br />
            Protected by Sentinel AI Intelligence Layer.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-zinc-600 border-t border-zinc-900">
        Sentinel AI Platform • Built for multi-repo safety & AI code verification
      </footer>
    </div>
  );
}
