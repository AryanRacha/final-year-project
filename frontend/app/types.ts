export interface Citation {
  id: number;
  file_path: string;
  symbol?: string | null;
  lines?: string | null;
  snippet: string;
  source_type: "vector" | "graph";
  distance?: number | null;
}

export interface ToolStep {
  id: string;
  tool_name: string;
  title: string;
  status: "completed" | "failed" | "running";
  latency_ms: number;
  args: Record<string, any>;
  summary: string;
  raw_output: any;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  citations?: Citation[];
  tool_steps?: ToolStep[];
  total_latency_ms?: number;
}

export interface RepoInfo {
  repos: string[];
  vector_count: number;
  graph_repos: string[];
}
