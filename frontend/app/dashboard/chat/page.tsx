'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  FolderGit2,
  GitBranch,
  Terminal,
  Zap,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { ChatMessage, ToolStep, Citation } from '@/app/types';
import { ThinkingBlock } from '@/components/ThinkingBlock';
import { CitationViewer } from '@/components/CitationViewer';

export default function CodebaseChatPage() {
  const searchParams = useSearchParams();
  const repoParam = searchParams.get('repo');

  const [repos, setRepos] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>(repoParam || '');
  const [branch, setBranch] = useState<string>('main');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeToolSteps, setActiveToolSteps] = useState<ToolStep[]>([]);
  const [activeLatency, setActiveLatency] = useState<number | undefined>(undefined);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const aiUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${aiUrl}/api/repos`);
        if (res.ok) {
          const data = await res.json();
          if (data.repos && data.repos.length > 0) {
            setRepos(data.repos);
            if (!selectedRepo) {
              setSelectedRepo(repoParam && data.repos.includes(repoParam) ? repoParam : data.repos[0]);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch repos for chat:', e);
      }
    };
    fetchRepos();
  }, [repoParam]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading || !selectedRepo) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `ast_${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thoughts: [],
      tool_steps: [],
      citations: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setInputMessage('');
    setIsLoading(true);
    setActiveToolSteps([]);
    setActiveLatency(undefined);

    try {
      const aiUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${aiUrl}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_id: selectedRepo,
          message: query,
          branch: branch || 'main',
        }),
      });

      if (!res.ok) {
        throw new Error(`Chat API error: ${res.statusText}`);
      }

      if (!res.body) {
        throw new Error('Readable stream is not supported in this browser.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.replace(/^data:\s*/, '').trim();
          if (!jsonStr) continue;

          try {
            const eventData = JSON.parse(jsonStr);

            if (eventData.type === 'thought') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, thoughts: [...(msg.thoughts || []), eventData.content] }
                    : msg
                )
              );
            } else if (eventData.type === 'tool_start') {
              const newStep: ToolStep = {
                id: eventData.step_id || `step_${Date.now()}`,
                tool_name: eventData.tool_name,
                title: eventData.title || eventData.tool_name.replace(/_/g, ' ').toUpperCase(),
                status: 'running',
                latency_ms: 0,
                args: eventData.args || {},
                summary: `Executing ${eventData.tool_name}...`,
                raw_output: null,
              };
              setActiveToolSteps((prev) => [...prev, newStep]);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, tool_steps: [...(msg.tool_steps || []), newStep] }
                    : msg
                )
              );
            } else if (eventData.type === 'tool_end') {
              const completedStep: ToolStep = {
                id: eventData.step_id,
                tool_name: eventData.tool_name,
                title: eventData.title,
                status: eventData.status || 'completed',
                latency_ms: eventData.latency_ms || 0,
                args: eventData.args || {},
                summary: eventData.summary || 'Execution completed',
                raw_output: eventData.raw_output,
              };
              setActiveToolSteps((prev) =>
                prev.map((s) => (s.id === eventData.step_id ? completedStep : s))
              );
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        tool_steps: (msg.tool_steps || []).map((s) =>
                          s.id === eventData.step_id ? completedStep : s
                        ),
                      }
                    : msg
                )
              );
            } else if (eventData.type === 'citations') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, citations: eventData.citations }
                    : msg
                )
              );
            } else if (eventData.type === 'token') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: (msg.content || '') + eventData.content }
                    : msg
                )
              );
            } else if (eventData.type === 'done') {
              if (eventData.total_latency_ms) {
                setActiveLatency(eventData.total_latency_ms);
              }
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        isStreaming: false,
                        total_latency_ms: eventData.total_latency_ms,
                      }
                    : msg
                )
              );
            }
          } catch (err) {
            console.error('Error parsing SSE event:', err);
          }
        }
      }
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `Error connecting to Codebase AI Agent: ${e.message}`,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header with Project Selector */}
      <header className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <h1 className="text-sm font-semibold text-white">Codebase Chat</h1>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {/* Project selector dropdown */}
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white px-2 py-1 focus:outline-none focus:border-zinc-700 font-medium"
            >
              {repos.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
              {branch}
            </span>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-md hover:bg-zinc-900 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </header>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-4xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-20 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-white">
                Ask anything about {selectedRepo || 'your codebase'}
              </h2>
              <p className="text-xs text-zinc-500 max-w-sm">
                The agent investigates the code, traverses dependencies, and answers with clickable file citations.
              </p>
            </div>

            {/* Quick suggested queries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
              {[
                'How does authentication and token verification work?',
                'What is the blast radius if I change the core schema?',
                'Explain the main entry point and routing structure',
                'Where are database connections configured?',
              ].map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(query)}
                  className="p-3 rounded-xl bg-[#0a0a0a] border border-zinc-800/80 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-all text-left group"
                >
                  <span className="font-medium">{query}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col space-y-2 ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {msg.role === 'user' ? 'You' : 'Codebase Agent'}
                </span>
                <span className="text-[10px] text-zinc-600 font-mono">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-3xl rounded-xl p-4 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-800 text-white font-medium shadow-xs'
                    : 'bg-[#0a0a0a] border border-zinc-800/80 text-zinc-200 shadow-xs w-full'
                }`}
              >
                {msg.role === 'assistant' && (
                  <ThinkingBlock
                    thoughts={msg.thoughts}
                    toolSteps={msg.tool_steps}
                    isStreaming={msg.isStreaming}
                    totalLatencyMs={msg.total_latency_ms}
                  />
                )}

                {msg.content ? (
                  <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap font-sans mt-2">
                    {msg.content}
                  </div>
                ) : msg.isStreaming ? (
                  <div className="flex items-center gap-2 text-zinc-400 py-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Analyzing code structure...</span>
                  </div>
                ) : null}

                {msg.citations && msg.citations.length > 0 && (
                  <CitationViewer citations={msg.citations} />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-800/80 bg-[#0a0a0a] max-w-4xl w-full mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 focus-within:border-zinc-700 transition-colors"
        >
          <input
            type="text"
            placeholder={
              selectedRepo
                ? `Ask anything about ${selectedRepo}...`
                : 'Select a repository to chat with...'
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading || !selectedRepo}
            className="flex-1 px-3 py-2 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50 font-sans"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || !selectedRepo}
            className="p-2 bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors disabled:opacity-30 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}