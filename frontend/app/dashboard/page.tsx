"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ChatMessage, ToolStep, Citation, RepoInfo } from "../types";
import { ToolVisualizer } from "../components/ToolVisualizer";
import { CitationViewer } from "../components/CitationViewer";
import { ThinkingBlock } from "../components/ThinkingBlock";
import { PRReviewCard } from "../components/PRReviewCard";
import { PRIssueChecklist, PRIssueItem } from "../components/PRIssueChecklist";
import {
  Bot,
  User,
  Send,
  Sparkles,
  GitBranch,
  Database,
  Cpu,
  RefreshCw,
  Zap,
  Code,
  Layers,
  CheckCircle2,
  Terminal,
  Plus,
  LogOut,
  ChevronDown,
  ShieldCheck,
  LayoutDashboard,
  ExternalLink,
  Activity,
  GitPullRequest,
  MessageSquare,
  Wrench,
  Globe,
} from "lucide-react";

export interface PRData {
  id: string;
  repoFullName: string;
  prNumber: number;
  title: string;
  body?: string;
  state: string;
  status: string;
  baseBranch: string;
  headBranch: string;
  authorLogin?: string;
  htmlUrl?: string;
  review?: {
    id: string;
    verdict: string;
    riskScore: number;
    summary: string;
    agentRationale?: string;
    status?: string;
  } | null;
  issues?: PRIssueItem[];
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"chat" | "prs">("prs");
  const [repos, setRepos] = useState<string[]>([
    "final-year-project",
    "demo-mern",
  ]);
  const [selectedRepo, setSelectedRepo] = useState<string>("final-year-project");

  // RAG Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeToolSteps, setActiveToolSteps] = useState<ToolStep[]>([]);
  const [activeLatency, setActiveLatency] = useState<number | undefined>(undefined);

  // Ingest Modal State
  const [isIngestModalOpen, setIsIngestModalOpen] = useState<boolean>(false);
  const [ingestPath, setIngestPath] = useState<string>("");
  const [ingestRepoId, setIngestRepoId] = useState<string>("");
  const [githubUrl, setGithubUrl] = useState<string>("");
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  // PR Review Agent State
  const [pullRequestsList, setPullRequestsList] = useState<PRData[]>([]);
  const [selectedPR, setSelectedPR] = useState<PRData | null>(null);
  const [isPRsLoading, setIsPRsLoading] = useState<boolean>(false);
  const [isEvaluatingPR, setIsEvaluatingPR] = useState<boolean>(false);
  const [isFixingPR, setIsFixingPR] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch repositories & PRs on load
  useEffect(() => {
    fetchRepos();
    fetchPullRequests();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const fetchRepos = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/repos");
      if (res.ok) {
        const data: RepoInfo = await res.json();
        if (data.repos && data.repos.length > 0) {
          setRepos(data.repos);
          if (!data.repos.includes(selectedRepo)) {
            setSelectedRepo(data.repos[0]);
          }
        }
      }
    } catch (e) {
      console.warn("Backend server not reachable on load:", e);
    }
  };

  const fetchPullRequests = async () => {
    setIsPRsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/v1/prs");
      if (res.ok) {
        const data = await res.json();
        const prs: PRData[] = data.pullRequests || [];
        setPullRequestsList(prs);
        if (prs.length > 0 && !selectedPR) {
          setSelectedPR(prs[0]);
        }
      } else {
        createMockPRsIfEmpty();
      }
    } catch (e) {
      console.warn("API Service not reachable, setting demo PR data:", e);
      createMockPRsIfEmpty();
    } finally {
      setIsPRsLoading(false);
    }
  };

  const createMockPRsIfEmpty = () => {
    const mockPRs: PRData[] = [
      {
        id: "demo-pr-1",
        repoFullName: "AryanRacha/final-year-project",
        prNumber: 42,
        title: "feat(auth): add JWT token refresh and role RBAC middleware",
        body: "Refactors auth flow, adds JWT token rotation, and adds RBAC middleware.",
        state: "open",
        status: "reviewed",
        baseBranch: "main",
        headBranch: "feature/jwt-rbac-auth",
        authorLogin: "dev-lead",
        htmlUrl: "https://github.com/AryanRacha/final-year-project/pull/42",
        review: {
          id: "rev-1",
          verdict: "SUGGEST",
          riskScore: 6.4,
          summary: "ReAct Agent Review: Found 3 critical security & logical issues. Downstream ripple affects user session handlers.",
          agentRationale:
            "Orchestrator (Gemini 2.0 Flash) called FastMCP tool `get_blast_radius`. Downstream symbols `getUserByGithubId` and `authMiddleware` will be affected. Groq Llama worker identified potential unhandled token null dereference.",
        },
        issues: [
          {
            id: "issue-1",
            title: "Potential Null Pointer Exception in Auth Middleware",
            description: "Token string dereference lacks validation when Bearer header is empty or undefined.",
            category: "security",
            severity: "error",
            filePath: "backend/api-service/src/middlewares/auth.middleware.ts",
            line: 28,
            suggestedFix: "Add `if (!token) return c.json({ error: 'Unauthorized' }, 401);` check.",
            isFixed: false,
          },
          {
            id: "issue-2",
            title: "Downstream Blast Radius Ripple Risk on User Session",
            description: "Modifying authorization header format will break existing frontend session context getters.",
            category: "blast_radius",
            severity: "warning",
            filePath: "frontend/context/AuthContext.tsx",
            line: 45,
            suggestedFix: "Ensure backward compatibility for legacy token bearer format.",
            isFixed: false,
          },
          {
            id: "issue-3",
            title: "Missing Error Catching in Async Handler",
            description: "Async database query lacks try-catch wrapper causing potential 500 server crashes.",
            category: "bug",
            severity: "warning",
            filePath: "backend/api-service/src/modules/auth/auth.service.ts",
            line: 62,
            suggestedFix: "Wrap DB query in try-catch and return structured error response.",
            isFixed: false,
          },
        ],
      },
    ];
    setPullRequestsList(mockPRs);
    if (!selectedPR) setSelectedPR(mockPRs[0]);
  };

  const handleRunPRReview = async (prId: string) => {
    setIsEvaluatingPR(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/v1/prs/${prId}/review`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pullRequest) {
          setSelectedPR(data.pullRequest);
          fetchPullRequests();
        }
      } else {
        alert("PR evaluation failed. Ensure api-service and ai-service are running.");
      }
    } catch (e: any) {
      alert(`PR review request failed: ${e.message}`);
    } finally {
      setIsEvaluatingPR(false);
    }
  };

  const handleFixSelectedIssues = async (selectedIssueIds: string[]) => {
    if (!selectedPR) return;
    setIsFixingPR(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/v1/prs/${selectedPR.id}/fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueIds: selectedIssueIds }),
      });

      const data = await res.json();
      if (res.ok) {
        fetchPullRequests();
        return { fixPrUrl: data.fixPrUrl };
      } else {
        throw new Error(data.error || "Failed to fix issues");
      }
    } finally {
      setIsFixingPR(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const assistantMsgId = `ast_${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      thoughts: [],
      tool_steps: [],
      citations: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    if (!textToSend) setInputMessage("");
    setIsLoading(true);
    setActiveToolSteps([]);
    setActiveLatency(undefined);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_id: selectedRepo,
          message: query,
          branch: "main",
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const event = JSON.parse(jsonStr);

            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id !== assistantMsgId) return msg;

                const updatedThoughts = [...(msg.thoughts || [])];
                const updatedSteps = [...(msg.tool_steps || [])];
                let updatedContent = msg.content;
                let updatedCitations = msg.citations || [];
                let updatedLatency = msg.total_latency_ms;
                let isStreaming = msg.isStreaming;

                if (event.type === "thought") {
                  if (event.content && !updatedThoughts.includes(event.content)) {
                    updatedThoughts.push(event.content);
                  }
                } else if (event.type === "tool_start") {
                  const existingIdx = updatedSteps.findIndex((s) => s.id === event.step_id);
                  const stepObj: ToolStep = {
                    id: event.step_id,
                    step_index: event.step_index,
                    tool_name: event.tool_name,
                    title: event.title,
                    status: "running",
                    latency_ms: 0,
                    args: event.args || {},
                    summary: "Executing tool...",
                    raw_output: null,
                  };
                  if (existingIdx >= 0) updatedSteps[existingIdx] = stepObj;
                  else updatedSteps.push(stepObj);
                  setActiveToolSteps([...updatedSteps]);
                } else if (event.type === "tool_end") {
                  const existingIdx = updatedSteps.findIndex((s) => s.id === event.step_id);
                  const stepObj: ToolStep = {
                    id: event.step_id,
                    step_index: event.step_index,
                    tool_name: event.tool_name,
                    title: event.title,
                    status: "completed",
                    latency_ms: event.latency_ms || 0,
                    args: event.args || {},
                    summary: event.summary || "",
                    raw_output: event.raw_output || {},
                  };
                  if (existingIdx >= 0) updatedSteps[existingIdx] = stepObj;
                  else updatedSteps.push(stepObj);
                  setActiveToolSteps([...updatedSteps]);
                } else if (event.type === "answer_delta") {
                  updatedContent += event.delta;
                } else if (event.type === "citations") {
                  updatedCitations = event.citations || [];
                } else if (event.type === "done") {
                  isStreaming = false;
                  updatedLatency = event.total_latency_ms;
                  setActiveLatency(event.total_latency_ms);
                }

                return {
                  ...msg,
                  thoughts: updatedThoughts,
                  tool_steps: updatedSteps,
                  content: updatedContent,
                  citations: updatedCitations,
                  total_latency_ms: updatedLatency,
                  isStreaming,
                };
              })
            );
          } catch (e) {
            console.warn("Failed to parse SSE payload:", e);
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== assistantMsgId) return msg;
          return {
            ...msg,
            content: `⚠️ Failed to query Knowledge Base: ${err.message || "Make sure backend services are running"}`,
            isStreaming: false,
          };
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const [ingestMode, setIngestMode] = useState<"github" | "local">("github");

  const handleIngestRepo = async () => {
    setIsIngesting(true);
    try {
      if (ingestMode === "github") {
        if (!githubUrl.trim()) return;
        const res = await fetch("http://127.0.0.1:8000/api/ingest-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo_url: githubUrl.trim() }),
        });

        if (res.ok) {
          const data = await res.json();
          alert(`Successfully ingested repository '${data.repo_id}' from GitHub! Parsed ${data.files_parsed || 0} files and ${data.symbols_parsed || 0} symbols.`);
          setIsIngestModalOpen(false);
          setGithubUrl("");
          fetchRepos();
          if (data.repo_id) setSelectedRepo(data.repo_id);
        } else {
          const err = await res.json();
          alert(`GitHub URL Ingestion failed: ${err.detail || err.error || "Error"}`);
        }
      } else {
        if (!ingestPath.trim() || !ingestRepoId.trim()) return;
        const res = await fetch("http://127.0.0.1:8000/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repo_id: ingestRepoId.trim(),
            repo_dir: ingestPath.trim(),
            branch: "main",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          alert(`Successfully ingested local repository '${ingestRepoId}'! Parsed ${data.files_parsed} files and ${data.symbols_parsed} symbols.`);
          setIsIngestModalOpen(false);
          fetchRepos();
          setSelectedRepo(ingestRepoId);
        } else {
          const err = await res.json();
          alert(`Local Ingestion failed: ${err.detail || "Error"}`);
        }
      }
    } catch (e: any) {
      alert(`Ingestion request failed: ${e.message}. Ensure Python ai-service is running on port 8000.`);
    } finally {
      setIsIngesting(false);
    }
  };

  const samplePrompts = [
    "How does hybrid search work in this repository?",
    "What functions and dependencies exist in reviewer.py?",
    "Where is Neo4j client initialized and used?",
    "Show blast radius if I modify the Auth token verification logic.",
  ];

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-100 font-sans overflow-hidden select-none">
      {/* Vercel Top Navigation & Breadcrumbs Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-zinc-950 border-b border-zinc-800/80 shrink-0 z-20">
        {/* Left: Vercel Breadcrumbs & Mode Switcher */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded bg-white text-black flex items-center justify-center font-bold text-xs font-mono group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="text-sm font-bold text-white tracking-tight">
              Sentinel
            </span>
          </Link>
          <span className="text-zinc-600 font-mono text-sm">/</span>

          {/* Tab Switcher: PR Review Agent vs RAG Chat */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab("prs")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === "prs"
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>PR Review Agent</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>RAG Knowledge Chat</span>
            </button>
          </div>

          {/* Repo Switcher Dropdown */}
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800 text-xs">
            <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="bg-transparent text-white font-mono font-medium focus:outline-none cursor-pointer"
            >
              {repos.map((r) => (
                <option key={r} value={r} className="bg-zinc-900 text-white">
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center/Right: Ingest Action & User Profile */}
        <div className="flex items-center gap-3">

          <button
            onClick={() => setIsIngestModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Repo</span>
          </button>

          {/* User Profile Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username || "User"}
                    className="w-6 h-6 rounded-full border border-zinc-700"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-zinc-800 text-white text-[10px] font-bold flex items-center justify-center border border-zinc-700">
                    {user.username ? user.username[0].toUpperCase() : "U"}
                  </div>
                )}
                <span className="text-xs font-medium text-zinc-200 hidden md:inline">
                  {user.username || user.email || "Developer"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl py-1.5 z-50 text-xs font-sans">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <p className="font-semibold text-white">
                      {user.name || user.username || "Authenticated User"}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono truncate">
                      {user.email || "GitHub Session"}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-rose-400 hover:bg-zinc-900 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs px-3 py-1.5 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-all"
            >
              Log In
            </Link>
          )}
        </div>
      </header>

      {/* Main View Area */}
      {activeTab === "prs" ? (
        /* PR Review Agent Tab View */
        <div className="flex-1 flex overflow-hidden p-6 gap-6">
          {/* Left Sidebar: Pull Requests Listing */}
          <div className="w-80 md:w-96 shrink-0 flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Pull Requests</h3>
              </div>
              <button
                onClick={fetchPullRequests}
                className="p-1 text-zinc-400 hover:text-white rounded"
                title="Refresh PRs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPRsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
              {pullRequestsList.map((pr) => {
                const isSelected = selectedPR?.id === pr.id;
                const isSkipped = pr.status === "skipped_ai_fix" || pr.headBranch.startsWith("ai-fix/");

                return (
                  <div
                    key={pr.id}
                    onClick={() => setSelectedPR(pr)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg"
                        : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        #{pr.prNumber}
                      </span>
                      {isSkipped ? (
                        <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                          AI Fix PR
                        </span>
                      ) : pr.review ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            pr.review.verdict === "ACCEPT"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {pr.review.verdict}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                          Pending Review
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-zinc-200 line-clamp-2 leading-snug">
                      {pr.title}
                    </h4>

                    <p className="text-[10px] text-zinc-400 font-mono mt-1.5 flex items-center gap-1.5">
                      <span className="text-zinc-300">{pr.headBranch}</span>
                      <span>→</span>
                      <span>{pr.baseBranch}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Main Content: PR Review Card + Issue Checklist */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {selectedPR ? (
              <div>
                <PRReviewCard
                  review={selectedPR.review || null}
                  prNumber={selectedPR.prNumber}
                  title={selectedPR.title}
                  author={selectedPR.authorLogin}
                  headBranch={selectedPR.headBranch}
                  baseBranch={selectedPR.baseBranch}
                  htmlUrl={selectedPR.htmlUrl}
                  onEvaluateNow={() => handleRunPRReview(selectedPR.id)}
                  isEvaluating={isEvaluatingPR}
                />

                <PRIssueChecklist
                  issues={selectedPR.issues || []}
                  onFixSelected={handleFixSelectedIssues}
                  isFixing={isFixingPR}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <GitPullRequest className="w-12 h-12 text-zinc-600 mb-3" />
                <h3 className="text-lg font-bold text-white">Select a Pull Request to Review</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Choose a PR from the left sidebar to view ReAct agent rationale and execute automated AI fixes.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* RAG Chat Tab View */
        <div className="flex flex-1 overflow-hidden p-4 gap-4">
          <div className="flex-1 flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-white" />
                <span>repo: {selectedRepo}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400">branch: main</span>
              </div>
              <span className="text-[11px] text-zinc-500">
                ReAct Autonomous Loop
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto p-6 gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-xl">
                    <Bot className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Ask Sentinel about repository{" "}
                      <span className="font-mono text-emerald-400">
                        '{selectedRepo}'
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      The autonomous agent will search the Neo4j graph, query
                      Chroma vector embeddings, and stream step-by-step reasoning
                      traces.
                    </p>
                  </div>

                  <div className="w-full flex flex-col gap-2 mt-2">
                    <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider text-left">
                      Suggested Questions:
                    </span>
                    {samplePrompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(p)}
                        className="text-left text-xs p-3 rounded-xl bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700 text-zinc-300 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <span>{p}</span>
                        <Zap className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0 mt-1 font-mono font-bold text-xs">
                        S
                      </div>
                    )}

                    <div
                      className={`max-w-3xl flex flex-col rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-zinc-800 text-white rounded-br-none font-medium"
                          : "bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-bl-none"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 opacity-60 font-mono text-[10px]">
                        <span>
                          {msg.role === "user" ? "You" : "Sentinel Agent"}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {msg.role === "assistant" && (
                        <ThinkingBlock
                          thoughts={msg.thoughts}
                          toolSteps={msg.tool_steps}
                          isStreaming={msg.isStreaming}
                          totalLatencyMs={msg.total_latency_ms}
                        />
                      )}

                      <div className="whitespace-pre-wrap font-sans text-xs md:text-sm mt-1">
                        {msg.content}
                      </div>

                      {msg.citations && msg.citations.length > 0 && (
                        <CitationViewer citations={msg.citations} />
                      )}
                    </div>

                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-1">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="p-3 bg-zinc-950 border-t border-zinc-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Ask anything about '${selectedRepo}' codebase...`}
                  disabled={isLoading}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 disabled:opacity-40 flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          <div className="w-96 md:w-105 shrink-0">
            <ToolVisualizer
              toolSteps={activeToolSteps}
              totalLatencyMs={activeLatency}
              isThinking={isLoading}
            />
          </div>
        </div>
      )}

      {/* Ingest Repository Modal */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Ingest Repository into Knowledge Base
              </h3>
              <button
                onClick={() => setIsIngestModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setIngestMode("github")}
                className={`flex-1 py-1.5 font-medium rounded-lg transition-all cursor-pointer ${
                  ingestMode === "github"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                GitHub Link
              </button>
              <button
                type="button"
                onClick={() => setIngestMode("local")}
                className={`flex-1 py-1.5 font-medium rounded-lg transition-all cursor-pointer ${
                  ingestMode === "local"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Local Directory
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              {ingestMode === "github" ? (
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    GitHub Repository URL:
                  </label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/mananch1/financial-web-translate"
                    className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-zinc-600 font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Directly clones and indexes symbol graph + vector embeddings from GitHub.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">
                      Repository ID:
                    </label>
                    <input
                      type="text"
                      value={ingestRepoId}
                      onChange={(e) => setIngestRepoId(e.target.value)}
                      placeholder="e.g. final-year-project"
                      className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-zinc-600 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">
                      Local Directory Path:
                    </label>
                    <input
                      type="text"
                      value={ingestPath}
                      onChange={(e) => setIngestPath(e.target.value)}
                      placeholder="e.g. d:\DOCS\VIT Ebooks\Final Year Project\final-year-project"
                      className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-zinc-600 font-mono text-[11px]"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsIngestModalOpen(false)}
                className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIngestRepo}
                disabled={
                  isIngesting ||
                  (ingestMode === "github" ? !githubUrl.trim() : (!ingestPath.trim() || !ingestRepoId.trim()))
                }
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                {isIngesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Indexing...</span>
                  </>
                ) : (
                  <span>Start Ingestion</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
