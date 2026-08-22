'use client';

import React from 'react';
import { Settings, Shield, Github, Database, Cpu, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col">
      <header className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-zinc-300" />
          <h1 className="text-sm font-semibold text-white">Workspace Settings</h1>
        </div>
      </header>

      <div className="flex-1 p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
        {/* User Account */}
        <div className="rounded-xl bg-[#0a0a0a] border border-zinc-800/80 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Account Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-zinc-500 block mb-1">User Identifier</span>
              <span className="text-zinc-200 font-mono">{user?.id || 'Local Developer'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-1">Username / Name</span>
              <span className="text-zinc-200">{user?.name || user?.username || 'aryan'}</span>
            </div>
          </div>
        </div>

        {/* Backend Engine Connections */}
        <div className="rounded-xl bg-[#0a0a0a] border border-zinc-800/80 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Engine Configuration</h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-zinc-200">AI Service (FastAPI / UV)</div>
                  <div className="text-zinc-500">http://localhost:8000</div>
                </div>
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-semibold text-zinc-200">API Gateway (Bun Control Plane)</div>
                  <div className="text-zinc-500">http://localhost:5000</div>
                </div>
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}