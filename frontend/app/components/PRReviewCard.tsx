"use client";

import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Cpu, CheckCircle2, GitPullRequest } from "lucide-react";

export interface PRReviewData {
  verdict: "ACCEPT" | "SUGGEST" | "REJECT" | string;
  riskScore: number;
  summary: string;
  agentRationale?: string;
  status?: string;
}

interface PRReviewCardProps {
  review: PRReviewData | null;
  prNumber: number;
  title: string;
  author?: string;
  headBranch: string;
  baseBranch: string;
  htmlUrl?: string;
  onEvaluateNow?: () => void;
  isEvaluating?: boolean;
}

export const PRReviewCard: React.FC<PRReviewCardProps> = ({
  review,
  prNumber,
  title,
  author,
  headBranch,
  baseBranch,
  htmlUrl,
  onEvaluateNow,
  isEvaluating = false,
}) => {
  if (!review) {
    return (
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                PR #{prNumber}: {title}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {headBranch} → {baseBranch} • {author || "contributor"}
              </p>
            </div>
          </div>
          {onEvaluateNow && (
            <button
              onClick={onEvaluateNow}
              disabled={isEvaluating}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              {isEvaluating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running ReAct Review...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  Run AI PR Review
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  const isSkipped = review.status === "skipped_ai_fix" || headBranch.startsWith("ai-fix/");
  const isAccept = review.verdict === "ACCEPT";
  const riskScore = review.riskScore || 0;
  const getRiskColor = (score: number) => {
    if (score >= 5) return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    if (score >= 2.5) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800/80 rounded-2xl p-6 mb-6 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isSkipped
            ? "bg-purple-500"
            : isAccept
            ? "bg-emerald-500"
            : "bg-amber-500"
        }`}
      />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-3 rounded-xl border mt-0.5 ${
              isSkipped
                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                : isAccept
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            <GitPullRequest className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                PR #{prNumber}
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {title}
              </h3>
              {htmlUrl && (
                <a
                  href={htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline font-mono"
                >
                  View on GitHub ↗
                </a>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
              <span className="text-slate-300 font-semibold">{headBranch}</span> →{" "}
              <span>{baseBranch}</span> • Author:{" "}
              <span className="text-slate-300">{author || "contributor"}</span>
            </p>
          </div>
        </div>

        {/* Verdict Badge & Risk Score */}
        <div className="flex items-center gap-3">
          {isSkipped ? (
            <div className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              AI Fix PR (Skipped Review)
            </div>
          ) : (
            <>
              <div
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                  isAccept
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                }`}
              >
                {isAccept ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                )}
                Verdict: {review.verdict}
              </div>

              <div className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${getRiskColor(riskScore)}`}>
                Risk Score: {riskScore.toFixed(1)} / 10
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary section */}
      <div className="mt-5 space-y-3">
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Executive AI Summary
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {review.summary}
          </p>
        </div>

        {/* Agent Rationale */}
        {review.agentRationale && (
          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/40">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Gemini ReAct Orchestrator Rationale
            </h4>
            <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {review.agentRationale}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
