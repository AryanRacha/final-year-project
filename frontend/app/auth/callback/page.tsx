'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || error || 'Authentication was rejected by GitHub');
        return;
      }

      if (!token) {
        const savedToken = localStorage.getItem('sentinel_auth_token');
        if (savedToken) {
          const ok = await setSession(savedToken);
          if (ok) {
            setStatus('success');
            setTimeout(() => router.push('/dashboard'), 400);
            return;
          }
        }

        setStatus('error');
        setErrorMessage('No authentication token found in callback URL.');
        return;
      }

      try {
        const ok = await setSession(token);
        if (ok) {
          setStatus('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
        } else {
          setStatus('error');
          setErrorMessage('Session token validation failed. Please try again.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to authenticate session.');
      }
    };

    processCallback();
  }, [searchParams, setSession, router]);

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-950/90 border border-zinc-800 text-center space-y-5 shadow-2xl backdrop-blur-xl">
      <div className="w-10 h-10 rounded-xl bg-white text-black font-mono font-bold text-lg flex items-center justify-center mx-auto shadow-md">
        S
      </div>

      {status === 'loading' && (
        <div className="space-y-3">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
          <h2 className="text-base font-bold text-white">Authenticating Session...</h2>
          <p className="text-xs text-zinc-400 font-mono">
            Verifying GitHub OAuth JWT and syncing profile permissions
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-3 animate-fade-in">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
          <h2 className="text-base font-bold text-white">Authentication Verified</h2>
          <p className="text-xs text-zinc-400">Redirecting you to the Sentinel Dashboard...</p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-all"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-3 animate-fade-in">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-white">Authentication Failed</h2>
          <p className="text-xs text-rose-400/90 font-mono bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/50">
            {errorMessage}
          </p>
          <div className="pt-3 flex items-center justify-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all"
            >
              Try Again
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-all"
            >
              Continue to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-zinc-800 selection:text-white">
      <Suspense
        fallback={
          <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-4 shadow-2xl">
            <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
            <h2 className="text-base font-bold text-white">Loading session...</h2>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
