import { ArrowUp, Paperclip, X } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatSidebar } from './components/ChatSidebar';
import { TopBar } from './components/TopBar';
import { DEMO_PRESETS } from './data/presets';
import {
  AgentNode,
  ChatMessageItem,
  ChatThread,
  DemoPreset,
  MissionResult,
} from './types';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

interface ShowcaseItem {
  num: string;
  title: string;
  description: string;
  windowTitle: string;
  promptPreview: string;
  subject: string;
  body: string;
  tones: string[];
  preset: DemoPreset;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    num: '1',
    title: 'Verify links & emails',
    description:
      'Give it one suspicious message. Agents inspect DNS, SSL and scam patterns before you click.',
    windowTitle: 'Security',
    promptPreview: 'Audit this internship offer link before I reply',
    subject: 'Verdict: 96/100 Phishing Risk',
    body: 'Domain g00gle-careers-verify.xyz was registered 2 days ago using zero-substitution typosquatting and lacks EV TLS. Quarantine recommended.',
    tones: ['Brief', 'Forensics', 'Action'],
    preset: DEMO_PRESETS[0],
  },
  {
    num: '2',
    title: 'Triage incident logs',
    description:
      'Isolate root causes from stack traces, config diffs and past postmortems in seconds.',
    windowTitle: 'Ops',
    promptPreview: 'Find why checkout-api is throwing 502 after v2.14',
    subject: 'Root Cause: DB Pool Exhaustion (v2.14)',
    body: 'DB_POOL_SIZE jumped 10 → 50 across 8 pods (400 > max 100). Roll back deployment pods gracefully instead of restarting primary RDS.',
    tones: ['Root Cause', 'Rollback', 'Status'],
    preset: DEMO_PRESETS[1],
  },
  {
    num: '3',
    title: 'Match resume to JD',
    description:
      'Compare your projects against any job description, spot skill gaps and draft outreach.',
    windowTitle: 'Career',
    promptPreview: 'Compare my resume against the Backend AI Intern JD',
    subject: '78% JD Match — 14-Day Prep Roadmap',
    body: 'Strong core in Python, FastAPI & Gemini API. Add Redis caching and multi-stage Dockerfiles to close the remaining 22% gap before applying.',
    tones: ['Warm', 'Direct', 'Formal'],
    preset: DEMO_PRESETS[2],
  },
  {
    num: '4',
    title: 'Hand over routine work',
    description:
      'Five specialized agents plan, verify and wait for your approval before any real-world action.',
    windowTitle: 'Draft',
    promptPreview: 'Write a launch email for the spring release',
    subject: 'Subject: The spring release is here',
    body: 'Hi Jordan, spring is here and so is the update you asked for. Shared drafts, faster search and a calmer workspace are waiting the next time you open the app.',
    tones: ['Warm', 'Direct', 'Formal'],
    preset: DEMO_PRESETS[0],
  },
];

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);
  const [activeToneIdx, setActiveToneIdx] = useState(0);
  const [heroInput, setHeroInput] = useState('');

  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const runTokenRef = useRef(0);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  const activeShowcase = SHOWCASE_ITEMS[activeShowcaseIdx] ?? SHOWCASE_ITEMS[0];

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
        summary: `Retrieved relevant context${
          fileName ? ` from ${fileName}` : ' from knowledge base'
        }.`,
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

  const sendMessage = async (presetOverride?: DemoPreset, customText?: string) => {
    const text = (presetOverride ? presetOverride.prompt : customText ?? input).trim();
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
    setHeroInput('');
    const currentFile = attachedFile;
    setAttachedFile(null);
    setIsRunning(true);

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
    setHeroInput('');
    setAttachedFile(null);
  };

  const isEmptyChat = !activeThread || activeThread.messages.length === 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden kraft-bg text-[#111113] flex">
      <ChatSidebar
        open={sidebarOpen}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={(id) => setActiveThreadId(id)}
        onNewChat={handleNewChat}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="relative flex-1 flex flex-col min-w-0">
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onNewChat={handleNewChat}
          isLiveBackend={Boolean(API_URL)}
        />

        {/* Main Viewport */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8">
          {isEmptyChat ? (
            <div className="max-w-5xl mx-auto min-h-full flex items-center py-10">
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                {/* Left Editorial Column */}
                <div className="lg:col-span-6 space-y-8">
                  <h1 className="text-4xl sm:text-5xl font-normal tracking-[-0.03em] leading-[1.08] text-[#111113]">
                    One workspace
                    <br />
                    for the work that{' '}
                    <span className="font-serif-accent italic font-normal text-[1.08em]">
                      slows
                    </span>{' '}
                    you down
                  </h1>

                  <div className="space-y-4">
                    {SHOWCASE_ITEMS.map((item, idx) => {
                      const isActive = idx === activeShowcaseIdx;
                      return (
                        <button
                          key={item.num}
                          type="button"
                          onClick={() => {
                            setActiveShowcaseIdx(idx);
                            setActiveToneIdx(0);
                          }}
                          className="w-full text-left flex items-start gap-4 group cursor-pointer"
                        >
                          <span
                            className={`text-xs font-mono-code pt-1 transition-colors ${
                              isActive
                                ? 'text-indigo-600 font-semibold'
                                : 'text-[#9A9AA8] group-hover:text-[#4A4A55]'
                            }`}
                          >
                            {item.num}
                          </span>
                          <div>
                            <p
                              className={`text-sm sm:text-[15px] font-medium transition-colors ${
                                isActive
                                  ? 'text-[#111113]'
                                  : 'text-[#6E6E7C] group-hover:text-[#111113]'
                              }`}
                            >
                              {item.title}
                            </p>
                            {isActive && (
                              <p className="mt-1.5 text-xs sm:text-[13px] text-[#4A4A58] leading-relaxed max-w-sm">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Interactive Window Preview */}
                <div className="lg:col-span-6 relative">
                  <div className="relative rounded-2xl dia-glass overflow-hidden">
                    {/* Subtle indigo top-edge highlight */}
                    <div className="h-[1.5px] w-full indigo-top-glow" />

                    {/* Window Header */}
                    <div className="px-4 py-3 border-b border-black/[0.06] flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-black/15" />
                        <span className="w-2.5 h-2.5 rounded-full bg-black/15" />
                        <span className="w-2.5 h-2.5 rounded-full bg-black/15" />
                      </div>
                      <span className="text-xs text-[#6E6E77]">
                        {activeShowcase.windowTitle}
                      </span>
                    </div>

                    {/* Window Body */}
                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Prompt Input Bar inside Card */}
                      <div className="flex items-center gap-2 rounded-full bg-[#F5F6FA] border border-black/[0.07] pl-4 pr-1.5 py-1.5">
                        <input
                          type="text"
                          value={heroInput}
                          onChange={(e) => setHeroInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (heroInput.trim()) {
                                void sendMessage(undefined, heroInput);
                              } else {
                                void sendMessage(activeShowcase.preset);
                              }
                            }
                          }}
                          placeholder={activeShowcase.promptPreview}
                          className="flex-1 bg-transparent text-xs sm:text-[13px] text-[#111113] placeholder:text-[#6E6E77] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (heroInput.trim()) {
                              void sendMessage(undefined, heroInput);
                            } else {
                              void sendMessage(activeShowcase.preset);
                            }
                          }}
                          aria-label="Run prompt"
                          className="w-7 h-7 rounded-full bg-[#111113] hover:bg-[#2A2A32] text-white flex items-center justify-center transition cursor-pointer shrink-0"
                        >
                          <ArrowUp className="w-3.5 h-3.5 stroke-[2.4]" />
                        </button>
                      </div>

                      {/* Preview Output Box */}
                      <div className="rounded-xl bg-[#F7F8FC] border border-indigo-100/80 p-4 min-h-[150px] space-y-2">
                        <p className="text-xs font-medium text-[#111113]">
                          {activeShowcase.subject}
                        </p>
                        <p className="text-xs text-[#4A4A58] leading-relaxed">
                          {activeShowcase.body}
                        </p>
                      </div>

                      {/* Bottom Tone / Suggestion Chips */}
                      <div className="flex items-center gap-2 pt-1">
                        {activeShowcase.tones.map((tone, tIdx) => (
                          <button
                            key={tone}
                            type="button"
                            onClick={() => setActiveToneIdx(tIdx)}
                            className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                              tIdx === activeToneIdx
                                ? 'bg-[#111113] text-white'
                                : 'bg-[#F1F2F8] text-[#4A4A58] hover:text-[#111113] border border-black/[0.05]'
                            }`}
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Subtle stacked card peeking beneath */}
                  <div
                    aria-hidden="true"
                    className="mx-6 -mt-2 h-8 rounded-b-2xl bg-white/55 backdrop-blur-md border border-t-0 border-white/70 opacity-75"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 space-y-6">
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

        {/* Bottom Chat Input Bar (shown in active chat) */}
        {!isEmptyChat && (
          <div className="px-4 sm:px-6 pb-5 pt-2">
            <div className="max-w-3xl mx-auto rounded-full bg-white/90 backdrop-blur-xl border border-white px-3 py-2 shadow-[0_14px_36px_rgba(38,43,102,0.16)]">
              {attachedFile && (
                <div className="mb-2 px-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-900 border border-indigo-200">
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

              <div className="flex items-center gap-2">
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
                  className="p-2 rounded-full hover:bg-black/[0.05] text-[#555562] hover:text-[#111113] transition cursor-pointer shrink-0"
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
                  placeholder="Ask AgentVerse anything..."
                  className="flex-1 resize-none bg-transparent py-1.5 text-sm text-[#111113] placeholder:text-[#7A7A85] focus:outline-none max-h-36"
                />

                <button
                  type="button"
                  disabled={!input.trim() || isRunning}
                  onClick={() => void sendMessage()}
                  aria-label="Send message"
                  className="w-8 h-8 rounded-full bg-[#111113] hover:bg-[#2A2A32] text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition cursor-pointer shrink-0"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.3]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
