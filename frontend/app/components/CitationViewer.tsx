"use client";

import React, { useState } from "react";
import { Citation } from "../types";
import {
  FileCode,
  Database,
  GitBranch,
  ExternalLink,
  X,
  Code2,
} from "lucide-react";

interface CitationViewerProps {
  citations: Citation[];
}

export const CitationViewer: React.FC<CitationViewerProps> = ({
  citations,
}) => {
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800/80">
      <div className="flex items-center gap-2 mb-2">
        <FileCode className="w-3.5 h-3.5 text-zinc-300" />
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          Cited Knowledge Base References ({citations.length}):
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {citations.map((cit) => (
          <button
            key={cit.id}
            onClick={() => setActiveCitation(cit)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs transition-all text-zinc-300 group font-mono cursor-pointer"
          >
            <span className="font-bold text-white bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
              [{cit.id}]
            </span>
            <span className="truncate max-w-[180px] text-[11px] text-zinc-200">
              {cit.file_path.split("/").pop()}
            </span>
            {cit.lines && (
              <span className="text-[10px] text-zinc-500">:{cit.lines}</span>
            )}
            <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-white" />
          </button>
        ))}
      </div>

      {/* Citation Details Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-zinc-900/60 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white font-mono">
                    [{activeCitation.id}] {activeCitation.file_path}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                    <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 font-mono">
                      {activeCitation.source_type} hit
                    </span>
                    {activeCitation.symbol && (
                      <span className="font-mono text-emerald-400 text-[11px]">
                        Symbol: {activeCitation.symbol}
                      </span>
                    )}
                    {activeCitation.lines && (
                      <span className="font-mono text-zinc-400 text-[11px]">
                        Lines: {activeCitation.lines}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Code Body */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-zinc-200 bg-black">
              <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed text-zinc-300">
                {activeCitation.snippet}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-zinc-950 border-t border-zinc-800 text-right text-xs text-zinc-400 font-mono">
              {activeCitation.distance !== undefined &&
                activeCitation.distance !== null && (
                  <span>
                    Vector Similarity Distance:{" "}
                    <strong className="text-white">
                      {activeCitation.distance}
                    </strong>
                  </span>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
