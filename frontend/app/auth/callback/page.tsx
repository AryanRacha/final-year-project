'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

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

      if (error) {
        setStatus('error');
        setErrorMessage(error || 'Authentication rejected by GitHub');
        return;
      }

      if (!token) {
        setStatus('error');
        setErrorMessage('Missing authorization token in callback response');
        return;
      }

      try {
        await setSession(token);
        setStatus('success');
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to authenticate session');
      }
    };

    processCallback();
  }, [searchParams, setSession, router]);

  return (
    <div className="w-full max-w-sm p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-4 shadow-2xl">
      {status === 'loading' && (
        <>
          <Loader2 className="w-10 h-10 text-white animate-spin mx-auto" />
          <h2 className="text-lg font-bold">Authenticating with GitHub...</h2>
          <p className="text-xs text-zinc-400">Verifying session token and establishing secure context.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
          <h2 className="text-lg font-bold text-white">Login Successful</h2>
          <p className="text-xs text-zinc-400">Redirecting to Sentinel Dashboard...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Authentication Failed</h2>
          <p className="text-xs text-rose-400 font-mono">{errorMessage}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white"
          >
            Try Again
          </button>
        </>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-4 shadow-2xl">
            <Loader2 className="w-10 h-10 text-white animate-spin mx-auto" />
            <h2 className="text-lg font-bold">Loading...</h2>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
