'use client';

import React, { useState } from 'react';
import { Citation } from '../types';
import { FileCode, Database, GitBranch, ExternalLink, X, Code2 } from 'lucide-react';

interface CitationViewerProps {
  citations: Citation[];
}

export const CitationViewer: React.FC<CitationViewerProps> = ({ citations }) => {
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-800/80">
      <div className="flex items-center gap-2 mb-2">
        <FileCode className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Cited Knowledge Base References ({citations.length}):
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {citations.map((cit) => (
          <button
            key={cit.id}
            onClick={() => setActiveCitation(cit)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 text-xs transition-all text-slate-300 group"
          >
            <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
              [{cit.id}]
            </span>
            <span className="truncate max-w-[180px] font-mono text-[11px] text-slate-200">
              {cit.file_path.split('/').pop()}
            </span>
            {cit.lines && (
              <span className="text-[10px] text-slate-500 font-mono">:{cit.lines}</span>
            )}
            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
          </button>
        ))}
      </div>

      {/* Citation Details Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    [{activeCitation.id}] {activeCitation.file_path}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-cyan-300 font-mono">
                      {activeCitation.source_type} hit
                    </span>
                    {activeCitation.symbol && (
                      <span className="font-mono text-emerald-400">
                        Symbol: {activeCitation.symbol}
                      </span>
                    )}
                    {activeCitation.lines && (
                      <span className="font-mono text-slate-400">Lines: {activeCitation.lines}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Code Body */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-slate-200 bg-slate-950">
              <pre className="p-4 rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {activeCitation.snippet}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-right text-xs text-slate-400">
              {activeCitation.distance !== undefined && activeCitation.distance !== null && (
                <span>Vector Similarity Distance: <strong className="text-indigo-400">{activeCitation.distance}</strong></span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
