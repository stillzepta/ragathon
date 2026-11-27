export type DomainId =
  | 'auto'
  | 'security'
  | 'ops'
  | 'career'
  | 'campus'
  | 'finance'
  | 'bizintel';

export interface DomainPack {
  id: DomainId;
  label: string;
  tagline: string;
  tools: string[];
}

export type AgentStatus = 'idle' | 'running' | 'rejected' | 'done';

export interface AgentNode {
  id: 'orchestrator' | 'rag' | 'tools' | 'planner' | 'critic';
  name: string;
  role: string;
  status: AgentStatus;
  summary: string;
  badge?: string;
  toolCall?: string;
  ragSources?: string[];
  memorySnapshot?: Record<string, unknown>;
  parallelGroup?: boolean;
}

export interface Citation {
  id: number;
  title: string;
  source: string;
  snippet: string;
}

export interface ProposedAction {
  title: string;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  payloadPreview: string;
  status: 'pending' | 'approved' | 'rejected';
  executionNote?: string;
}

export interface MissionResult {
  id: string;
  domain: DomainId;
  prompt: string;
  attachedFileName?: string;
  criticInitialScore: number;
  criticFinalScore: number;
  criticNote: string;
  briefTitle: string;
  briefSections: { heading: string; body: string }[];
  citations: Citation[];
  singleLlmComparison: string;
  proposedAction: ProposedAction;
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  attachedFileName?: string;
  agents?: AgentNode[];
  result?: MissionResult;
  isStreaming?: boolean;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessageItem[];
  updatedAt: string;
}

export interface DemoPreset {
  id: string;
  domain: DomainId;
  label: string;
  prompt: string;
  fileName?: string;
  result: Omit<MissionResult, 'id' | 'createdAt'>;
  timeline: {
    orchestrator: Partial<AgentNode>;
    rag: Partial<AgentNode>;
    tools: Partial<AgentNode>;
    planner: Partial<AgentNode>;
    criticFirst: Partial<AgentNode>;
    criticFinal: Partial<AgentNode>;
  };
}
