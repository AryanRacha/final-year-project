'use client';

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Zap,
  Lock,
} from 'lucide-react';

interface HealthCheckerProps {
  selectedRepo: string;
}

export const HealthChecker: React.FC<HealthCheckerProps> = ({ selectedRepo }) => {
  const auditRules = [
    {
      rule: 'Architectural Layer Isolation',
      desc: 'Python AI service must not make direct GitHub commits; only Bun control plane holds credentials.',
      status: 'PASSED',
      score: '100%',
    },
    {
      rule: 'Circular Import Prevention',
      desc: 'Neo4j import graph scans for cyclic file dependency chains.',
      status: 'PASSED',
      score: '0 Cycles',
    },
    {
      rule: 'Docstring & Signature Coverage',
      desc: 'All public symbols have LLM-generated semantic descriptions in Vector KB.',
      status: 'PASSED',
      score: '96.4%',
    },
    {
      rule: 'Dead Code & Orphan Symbol Detection',
      desc: 'Identifies unreachable functions with 0 callers and 0 export consumers.',
      status: 'WARNING',
      score: '3 Isolated Symbols',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-semibold">
            Quality & Convention Guard
          </span>
          <span className="text-zinc-500 font-mono text-xs">•</span>
          <span className="text-zinc-400 text-xs font-mono">{selectedRepo}</span>
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          Automated Codebase Conventions & Health Audit
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Continuous architectural rule verification against the Knowledge Graph.
        </p>
      </div>

      <div className="space-y-3">
        {auditRules.map((rule, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                {rule.status === 'PASSED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{rule.rule}</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">{rule.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0 font-mono text-xs">
              <span className="text-zinc-400">{rule.score}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  rule.status === 'PASSED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {rule.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
