'use client';

import React, { useState } from 'react';
import { ToolStep } from '../types';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Terminal,
  Code,
  Layers,
  Database,
  CheckCircle2,
  Clock,
  Loader2,
  FileText,
  Activity,
  GitMerge,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface ThinkingBlockProps {
  thoughts?: string[];
  toolSteps?: ToolStep[];
  isStreaming?: boolean;
  totalLatencyMs?: number;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  thoughts = [],
  toolSteps = [],
  isStreaming = false,
  totalLatencyMs,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  if (thoughts.length === 0 && toolSteps.length === 0 && !isStreaming) {
    return null;
  }

  const getStepIcon = (toolName: string) => {
    switch (toolName) {
      case 'hybrid_search':
        return <GitMerge className="w-4 h-4 text-cyan-400" />;
      case 'vector_search':
        return <Database className="w-4 h-4 text-purple-400" />;
      case 'get_symbol_details':
      case 'search_symbols':
        return <Code className="w-4 h-4 text-emerald-400" />;
      case 'get_file_dependencies':
        return <Layers className="w-4 h-4 text-amber-400" />;
      case 'get_blast_radius':
        return <Activity className="w-4 h-4 text-rose-400" />;
      case 'get_repo_structure':
        return <FileText className="w-4 h-4 text-blue-400" />;
      default:
        return <Terminal className="w-4 h-4 text-indigo-400" />;
    }
  };

  const toggleStepExpand = (stepId: string) => {
    setExpandedStepId((prev) => (prev === stepId ? null : stepId));
  };

  return (
    <div className="my-2 rounded-xl bg-[#0d121f] border border-slate-800/80 overflow-hidden shadow-lg transition-all">
      {/* Expandable Thinking Header Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-900/60 hover:bg-slate-900/90 text-left transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            {isStreaming && (
              <span className="absolute -inset-1 rounded-full bg-amber-400/20 animate-ping" />
            )}
          </div>
          <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
            Thinking
          </span>
          {isStreaming ? (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
              <Loader2 className="w-3 h-3 animate-spin" />
              Reasoning & Executing Tools...
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono">
              {toolSteps.length} Step{toolSteps.length === 1 ? '' : 's'} Processed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400 hover:text-slate-200">
          {totalLatencyMs !== undefined && (
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {totalLatencyMs}ms
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Reasoning & Tool Execution Timeline Body */}
      {isOpen && (
        <div className="p-3.5 space-y-3 bg-[#0d121f]/90 border-t border-slate-800/60 text-xs">
          {/* Thoughts List */}
          {thoughts.length > 0 && (
            <div className="space-y-1.5 pb-2 border-b border-slate-800/60">
              {thoughts.map((t, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300 italic leading-relaxed">
                  <span className="text-amber-400/80 font-mono select-none">›</span>
                  <span className="font-mono text-[11px] text-slate-300/90">{t}</span>
                </div>
              ))}
            </div>
          )}

          {/* Timeline Execution Steps */}
          {toolSteps.length > 0 && (
            <div className="relative pl-3 space-y-3 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
              {toolSteps.map((step) => {
                const isExpanded = expandedStepId === step.id;
                return (
                  <div key={step.id} className="relative group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-md bg-slate-900 border border-slate-800 shrink-0 z-10">
                          {getStepIcon(step.tool_name)}
                        </div>

                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200 text-xs">
                            {step.title}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {step.summary || step.tool_name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {step.status === 'running' ? (
                          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        ) : (
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                            <span>{step.latency_ms}ms</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                        )}

                        <button
                          onClick={() => toggleStepExpand(step.id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all"
                          title="Toggle Code / JSON details"
                        >
                          {isExpanded ? (
                            <Minimize2 className="w-3 h-3" />
                          ) : (
                            <Maximize2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Step Detail Box (Code / JSON output preview) */}
                    {isExpanded && (
                      <div className="mt-2 ml-7 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-300 space-y-2">
                        {step.args && Object.keys(step.args).length > 0 && (
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">
                              Input Arguments:
                            </span>
                            <pre className="text-emerald-300 bg-slate-900/80 p-2 rounded border border-slate-800/60 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(step.args, null, 2)}
                            </pre>
                          </div>
                        )}

                        {step.raw_output && (
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">
                              Output Result Preview:
                            </span>
                            <pre className="text-cyan-300 bg-slate-900/80 p-2 rounded border border-slate-800/60 max-h-48 overflow-y-auto overflow-x-auto whitespace-pre-wrap">
                              {typeof step.raw_output === 'string'
                                ? step.raw_output
                                : JSON.stringify(step.raw_output, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
