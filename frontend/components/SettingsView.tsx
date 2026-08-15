'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Database, Shield, Server, Key, LogOut } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, token, logout } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl">
        <h2 className="text-lg font-bold text-white tracking-tight">System Configuration & Infrastructure</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Manage API connectivity, authentication sessions, and database endpoints.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
          Connected User Profile
        </h3>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
          <img
            src={user?.avatar_url || user?.avatarUrl || 'https://github.com/ghost.png'}
            alt={user?.username || 'User'}
            className="w-12 h-12 rounded-full border border-zinc-700"
          />
          <div>
            <h4 className="text-sm font-bold text-white">{user?.name || user?.username}</h4>
            <p className="text-xs text-zinc-400 font-mono">{user?.email || 'GitHub OAuth Verified'}</p>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">User ID: {user?.id}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Session</span>
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-xl text-xs">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
          Infrastructure Endpoints
        </h3>
        <div className="space-y-2 font-mono text-[11px]">
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 flex justify-between">
            <span className="text-zinc-400">API Control Plane (Bun/Hono):</span>
            <span className="text-white">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 flex justify-between">
            <span className="text-zinc-400">AI Service (FastAPI / UV):</span>
            <span className="text-white">{process.env.NEXT_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000'}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 flex justify-between">
            <span className="text-zinc-400">Neo4j Graph Database:</span>
            <span className="text-emerald-400">bolt://localhost:7687 (Active)</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 flex justify-between">
            <span className="text-zinc-400">ChromaDB Vector KB:</span>
            <span className="text-emerald-400">./chroma_db (Active)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
