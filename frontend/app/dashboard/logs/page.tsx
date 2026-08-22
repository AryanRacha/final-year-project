'use client';

import React, { useState } from 'react';
import { Activity, Terminal, RefreshCw, CheckCircle2, Zap } from 'lucide-react';

export default function ActivityLogsPage() {
  const [logs] = useState([
    {
      id: '1',
      time: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: 'Platform engine initialized. Connected to local AI Service.',
      source: 'Engine',
    },
    {
      id: '2',
      time: new Date().toLocaleTimeString(),
      level: 'READY',
      message: 'ReAct Agent and Codebase RAG ready for requests.',
      source: 'Agent',
    },
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <header className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-300" />
          <h1 className="text-sm font-semibold text-white">Activity & Execution Logs</h1>
        </div>
      </header>

      <div className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-4">
        <div className="rounded-xl bg-[#0a0a0a] border border-zinc-800/80 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Terminal Output Stream</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          <div className="p-4 font-mono text-xs space-y-2 text-zinc-300 bg-black">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <span className="text-zinc-600 shrink-0">{log.time}</span>
                <span className="px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 text-[10px] shrink-0">
                  {log.source}
                </span>
                <span className="text-zinc-300">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}