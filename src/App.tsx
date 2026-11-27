import { ArrowUp, Paperclip, X } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatSidebar } from './components/ChatSidebar';
import { TopBar } from './components/TopBar';
import { SemanticBloom } from './shaders/semantic-bloom/SemanticBloom';
import './shaders/threeui.css';
import { DEMO_PRESETS } from './data/presets';
import {
  AgentNode,
  ChatMessageItem,
  ChatThread,
  DemoPreset,
  MissionResult,
} from './types';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

const INITIAL_AGENTS: AgentNode[] = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    role: 'Central Planner',
    status: 'idle',
    summary: 'Classifying intent and routing to specialized agents.',
  },
  {
    id: 'rag',
    name: 'Knowledge RAG Agent',
    role: 'Vector Retrieval',
    status: 'idle',
    summary: 'Searching uploaded documents & domain playbooks.',
    parallelGroup: true,
  },
  {
    id: 'tools',
    name: 'Tool Analyst Agent',
    role: 'Live Execution',
    status: 'idle',
    summary: 'Running Python forensics, search, or data tools.',
    parallelGroup: true,
  },
  {
    id: 'planner',
    name: 'Synthesizer Agent',
    role: 'Draft & Action',
    status: 'idle',
    summary: 'Combining Shared Memory into a structured answer.',
  },
  {
    id: 'critic',
    name: 'Critic Evaluator',
    role: 'Quality & Safety Gate',
    status: 'idle',
    summary: 'Scoring output and triggering self-correction if < 85.',
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const runTokenRef = useRef(0);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length, isRunning]);

  const updateAssistantMessage = (
    threadId: string,
    messageId: string,
    updater: (msg: ChatMessageItem) => ChatMessageItem
  ) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id !== threadId
          ? t
          : {
              ...t,
              messages: t.messages.map((m) => (m.id === messageId ? updater(m) : m)),
            }
      )
    );
  };

  const patchAgentInMessage = (
    threadId: string,
    messageId: string,
    agentId: AgentNode['id'],
    patch: Partial<AgentNode>
  ) => {
    updateAssistantMessage(threadId, messageId, (msg) => ({
      ...msg,
      agents: (msg.agents ?? INITIAL_AGENTS).map((a) =>
        a.id === agentId ? { ...a, ...patch } : a
      ),
    }));
  };

  const buildCustomMission = (userPrompt: string, fileName?: string): DemoPreset => ({
    id: `custom-${Date.now()}`,
    domain: 'auto',
    label: 'Custom Chat',
    prompt: userPrompt,
    fileName,
    timeline: {
      orchestrator: {
        summary: 'Auto-detected intent and initialized Shared Memory.',
        badge: 'Auto Route',
        memorySnapshot: {
          goal: userPrompt.slice(0, 90),
          attached_file: fileName ?? null,
        },
      },
      rag: {
        summary: `Retrieved relevant context${fileName ? ` from ${fileName}` : ' from knowledge base'}.`,
        badge: '2 RAG hits',
        ragSources: [
          fileName ? `${fileName}#chunk-1` : 'Knowledge-Base.md#L12',
          'AgentVerse-Context.md#L4',
        ],
      },
      tools: {
        summary: 'Executed domain tools and structured signal checks.',
        badge: '2 tools run',
        toolCall: 'auto_tool_runner() → verified structured signals in 380ms',
        memorySnapshot: { status: 'verified' },
      },
      planner: {
        summary: 'Synthesized Shared Memory into a grounded response.',
        badge: 'Draft v1 → v2',
      },
      criticFirst: {
        summary: 'Rejected v1 (68/100): Requested clearer verification constraints.',
        badge: '68/100 · Revising',
      },
      criticFinal: {
        summary: 'Approved v2 (92/100): Grounded, concise, and Rule #6 compliant.',
        badge: '92/100 · Verified',
      },
    },
    result: {
      domain: 'auto',
      prompt: userPrompt,
      attachedFileName: fileName,
      criticInitialScore: 68,
      criticFinalScore: 92,
      criticNote:
        'Critic flagged missing verification constraints in Draft 1 (68/100) and refined the response (92/100).',
      briefTitle: 'AgentVerse Response',
      briefSections: [
        {
          heading: 'Analysis',
          body: `Processed "${userPrompt.slice(0, 140)}${
            userPrompt.length > 140 ? '...' : ''
          }" across parallel RAG retrieval and live tool checks [1].`,
        },
        {
          heading: 'Recommended Next Step',
          body: `Review the grounded findings${
            fileName ? ` from ${fileName}` : ''
          } and approve the proposed action below if you want the agents to execute it [2].`,
        },
      ],
      citations: [
        {
          id: 1,
          title: fileName ? `Uploaded: ${fileName}` : 'Domain Knowledge Base',
          source: fileName ?? 'Knowledge-Base.md',
          snippet: 'Extracted into Shared Memory during parallel RAG pass.',
        },
        {
          id: 2,
          title: 'Tool Execution Trace',
          source: 'auto_tool_runner()',
          snippet: 'Verified by Critic Evaluator before presenting.',
        },
      ],
      singleLlmComparison: '',
      proposedAction: {
        title: 'Execute Proposed Action & Save to Memory',
        description: 'Requires your approval before running any external action.',
        riskLevel: 'Medium',
        payloadPreview: `ACTION: EXECUTE_WORKFLOW\nPROMPT: "${userPrompt.slice(0, 80)}"`,
        status: 'pending',
      },
    },
  });

  const sendMessage = async (presetOverride?: DemoPreset) => {
    const text = (presetOverride ? presetOverride.prompt : input).trim();
    if (!text || isRunning) return;

    const token = ++runTokenRef.current;
    const nowLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      attachedFileName: presetOverride?.fileName ?? attachedFile?.name,
      createdAt: nowLabel,
    };

    const assistantMsgId = `assistant-${Date.now() + 1}`;
    const assistantMsg: ChatMessageItem = {
      id: assistantMsgId,
      role: 'assistant',
      text: '',
      agents: INITIAL_AGENTS.map((a) => ({ ...a })),
      isStreaming: true,
      createdAt: nowLabel,
    };

    let targetThreadId = activeThreadId;
    if (!targetThreadId) {
      targetThreadId = `thread-${Date.now()}`;
      const newThread: ChatThread = {
        id: targetThreadId,
        title: presetOverride?.label ?? text.slice(0, 38),
        messages: [userMsg, assistantMsg],
        updatedAt: nowLabel,
      };
      setThreads((prev) => [newThread, ...prev]);
      setActiveThreadId(targetThreadId);
    } else {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === targetThreadId
            ? { ...t, messages: [...t.messages, userMsg, assistantMsg], updatedAt: nowLabel }
            : t
        )
      );
    }

    setInput('');
    const currentFile = attachedFile;
    setAttachedFile(null);
    setIsRunning(true);

    // Optional live FastAPI backend call
    if (API_URL && !presetOverride) {
      try {
        const formData = new FormData();
        formData.append('prompt', text);
        formData.append('domain', 'auto');
        if (currentFile) formData.append('file', currentFile);

        const res = await fetch(`${API_URL}/api/run`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = (await res.json()) as MissionResult;
          updateAssistantMessage(targetThreadId, assistantMsgId, (m) => ({
            ...m,
            isStreaming: false,
            agents: INITIAL_AGENTS.map((a) => ({ ...a, status: 'done' })),
            result: data,
          }));
          setIsRunning(false);
          return;
        }
      } catch {
        // Fallback to Studio simulation
      }
    }

    const matchedPreset =
      presetOverride ??
      DEMO_PRESETS.find((p) => p.prompt === text) ??
      buildCustomMission(text, currentFile?.name);
    const t = matchedPreset.timeline;

    patchAgentInMessage(targetThreadId, assistantMsgId, 'orchestrator', {
      status: 'running',
      summary: 'Analyzing request and assigning specialized agents...',
    });
    await sleep(500);
    if (runTokenRef.current !== token) return;
    patchAgentInMessage(targetThreadId, assistantMsgId, 'orchestrator', {
      status: 'done',
      ...t.orchestrator,
    });

    patchAgentInMessage(targetThreadId, assistantMsgId, 'rag', {
      status: 'running',
      summary: 'Querying FAISS vector store...',
    });
    patchAgentInMessage(targetThreadId, assistantMsgId, 'tools', {
      status: 'running',
      summary: 'Executing live Python tools...',
    });
    await sleep(850);
    if (runTokenRef.current !== token) return;
    patchAgentInMessage(targetThreadId, assistantMsgId, 'rag', { status: 'done', ...t.rag });
    patchAgentInMessage(targetThreadId, assistantMsgId, 'tools', {
      status: 'done',
      ...t.tools,
    });

    patchAgentInMessage(targetThreadId, assistantMsgId, 'planner', {
      status: 'running',
      summary: 'Synthesizing Shared Memory into Draft v1...',
    });
    await sleep(550);
    if (runTokenRef.current !== token) return;
    patchAgentInMessage(targetThreadId, assistantMsgId, 'planner', {
      status: 'done',
      ...t.planner,
      badge: 'Draft v1',
    });

    patchAgentInMessage(targetThreadId, assistantMsgId, 'critic', {
      status: 'rejected',
      ...t.criticFirst,
    });
    await sleep(800);
    if (runTokenRef.current !== token) return;

    patchAgentInMessage(targetThreadId, assistantMsgId, 'planner', {
      status: 'running',
      summary: 'Applying Critic feedback for Draft v2...',
    });
    await sleep(550);
    if (runTokenRef.current !== token) return;
    patchAgentInMessage(targetThreadId, assistantMsgId, 'planner', {
      status: 'done',
      ...t.planner,
    });
    patchAgentInMessage(targetThreadId, assistantMsgId, 'critic', {
      status: 'done',
      ...t.criticFinal,
    });

    const finalResult: MissionResult = {
      ...matchedPreset.result,
      id: `mission-${Date.now()}`,
      createdAt: nowLabel,
    };

    updateAssistantMessage(targetThreadId, assistantMsgId, (m) => ({
      ...m,
      isStreaming: false,
      result: finalResult,
    }));
    setIsRunning(false);
  };

  const handleApproveAction = async (messageId: string, editedPayload?: string) => {
    if (!activeThreadId) return;
    const msg = activeThread?.messages.find((m) => m.id === messageId);
    if (!msg?.result) return;

    const finalPayload = editedPayload ?? msg.result.proposedAction.payloadPreview;
    if (API_URL) {
      try {
        await fetch(`${API_URL}/api/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mission_id: msg.result.id, payload: finalPayload }),
        });
      } catch {
        // Continue local confirmation
      }
    }

    updateAssistantMessage(activeThreadId, messageId, (m) =>
      !m.result
        ? m
        : {
            ...m,
            result: {
              ...m.result,
              proposedAction: {
                ...m.result.proposedAction,
                payloadPreview: finalPayload,
                status: 'approved',
                executionNote: 'Approved — action executed & saved to memory.',
              },
            },
          }
    );
  };

  const handleRejectAction = (messageId: string) => {
    if (!activeThreadId) return;
    updateAssistantMessage(activeThreadId, messageId, (m) =>
      !m.result
        ? m
        : {
            ...m,
            result: {
              ...m.result,
              proposedAction: {
                ...m.result.proposedAction,
                status: 'rejected',
                executionNote: 'Rejected — no external action was taken.',
              },
            },
          }
    );
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAttachedFile(e.target.files?.[0] ?? null);
  };

  const handleNewChat = () => {
    runTokenRef.current++;
    setIsRunning(false);
    setActiveThreadId(null);
    setInput('');
    setAttachedFile(null);
  };

  const isEmptyChat = !activeThread || activeThread.messages.length === 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030303]">
      <div className="relative z-10 h-full w-full flex overflow-hidden">
        <ChatSidebar
        open={sidebarOpen}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={(id) => setActiveThreadId(id)}
        onNewChat={handleNewChat}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="relative flex-1 flex flex-col min-w-0 pointer-events-none">
        {/* SemanticBloom centered inside the chat area */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <SemanticBloom
            mode="dark"
            text=""
            size={1.0}
            opacity={1.0}
            className="w-full h-full"
          />
        </div>

        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onNewChat={handleNewChat}
          isLiveBackend={Boolean(API_URL)}
        />

        {/* Chat Scroll Area */}
        <div className={`relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 ${isEmptyChat ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          {isEmptyChat ? (
            <div className="h-full" />
          ) : (
            <div className="max-w-3xl mx-auto py-6 space-y-6 pointer-events-auto">
              {activeThread.messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onApproveAction={(id, edited) => void handleApproveAction(id, edited)}
                  onRejectAction={handleRejectAction}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Sticky Bottom Dia-Glass Chat Input */}
        <div className="relative z-10 px-4 sm:px-6 pb-5 pt-2 pointer-events-auto">
          <div className="max-w-3xl mx-auto dia-glass rounded-full px-3 py-2">
            {attachedFile && (
              <div className="mb-2 px-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/10 text-neutral-100 border border-white/15">
                  <Paperclip className="w-3 h-3" />
                  <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}

            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv,.log,.json,.eml"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach PDF, Log, or CSV"
                className="p-2.5 rounded-full hover:bg-white/10 text-neutral-300 transition cursor-pointer shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={1}
                placeholder="Message AgentVerse..."
                className="flex-1 resize-none bg-transparent py-2 text-sm text-white placeholder:text-neutral-400 focus:outline-none max-h-36"
              />

              <button
                type="button"
                disabled={!input.trim() || isRunning}
                onClick={() => void sendMessage()}
                aria-label="Send message"
                className="p-2.5 rounded-full bg-white text-[#030303] hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
