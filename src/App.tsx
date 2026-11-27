import { ArrowUp, Paperclip, X } from 'lucide-react';
import { ChangeEvent, ClipboardEvent, useEffect, useRef, useState } from 'react';
import { ArtifactPanel } from './components/ArtifactPanel';
import { ChatMessage } from './components/ChatMessage';
import { ChatSidebar } from './components/ChatSidebar';
import { AuthUser, LoginModal } from './components/LoginModal';
import SplitText from './components/SplitText';
import { api, API_URL } from './api';
import { supabase } from './lib/supabase';
import { DEMO_PRESETS } from './data/presets';
import {
  AgentNode,
  ChatMessageItem,
  ChatThread,
  DemoPreset,
  MissionResult,
  ProposedAction,
} from './types';

const CONNECTED_AGENTS: AgentNode[] = [
  { id: 'orchestrator', name: 'Planner', role: 'Planning', status: 'idle', summary: 'Queued' },
  { id: 'rag', name: 'Researcher', role: 'Evidence retrieval', status: 'idle', summary: 'Queued' },
  { id: 'planner', name: 'Analyst', role: 'Memo writing', status: 'idle', summary: 'Queued' },
  { id: 'critic', name: 'Evaluator', role: 'Memo review', status: 'idle', summary: 'Queued' },
];

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
    title: 'Chat with saved memory',
    description:
      'Multi-turn conversations with Google sign-in and Supabase history—context stays synced across reloads.',
    windowTitle: 'Chat + Memory',
    promptPreview: 'Summarize our last diligence run...',
    subject: 'Context Synced · 12-Turn Memory',
    body: 'Signed in via Google OAuth. Your threads persist in Supabase with row-level security and carry the latest 12 messages into every reply.',
    tones: ['Fast Chat', 'Saved Threads', 'Context'],
    preset: DEMO_PRESETS[0],
  },
  {
    num: '2',
    title: 'Four-agent diligence pipeline',
    description:
      'Planner, Researcher, Analyst, and Evaluator run in sequence with live SSE progress updates.',
    windowTitle: '4-Agent Pipeline',
    promptPreview: 'Run due diligence on this seed deck...',
    subject: 'Live SSE · 4 Stages Completed',
    body: 'Planner → Researcher → Analyst → Evaluator streamed real-time stage updates and compiled a structured startup investment memo.',
    tones: ['Planner', 'Researcher', 'Evaluator'],
    preset: DEMO_PRESETS[1],
  },
  {
    num: '3',
    title: 'Grounded in files & RAG',
    description:
      'Upload PDFs, CSVs, logs, or images. Agents retrieve cited excerpts and optional web search results.',
    windowTitle: 'RAG + Citations',
    promptPreview: 'Check burn rate in financials.csv...',
    subject: '2 Cited Excerpts · Grounded',
    body: 'Extracted chunks from your uploaded file alongside SBA guide playbooks and web search with inline source citations.',
    tones: ['Citations', 'Uploads', 'Web Search'],
    preset: DEMO_PRESETS[2],
  },
  {
    num: '4',
    title: 'Critic review & PDF/MD export',
    description:
      'Evaluator scores Draft v1, refines Draft v2, records your sign-off, and exports PDF or Markdown.',
    windowTitle: 'Review & Export',
    promptPreview: 'Approve follow-up & export memo...',
    subject: 'Draft v2 Verified · Ready to Export',
    body: 'Critic refined the memo from v1 to v2. Approve or reject the follow-up decision with one click, then download as PDF or Markdown.',
    tones: ['Approve', 'PDF Export', 'Markdown'],
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
  const [introDocked, setIntroDocked] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [hasUnlocked, setHasUnlocked] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('agentverse_user'));
    } catch {
      return false;
    }
  });
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [selectedArtifactMsgId, setSelectedArtifactMsgId] = useState<string | null>(null);

  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);
  const [activeToneIdx, setActiveToneIdx] = useState(0);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);
  const [heroInput, setHeroInput] = useState('');

  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [apiToken, setApiToken] = useState('');
  const [manualToken] = useState(() => {
    try { return sessionStorage.getItem('agentverse_api_token') ?? ''; }
    catch { return ''; }
  });
  const requestToken = () => (manualToken || apiToken).trim();
  const [promptMode] = useState<'chat' | 'diligence'>('chat');
  const activeRequest = useRef<AbortController | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const runTokenRef = useRef(0);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  const activeShowcase = SHOWCASE_ITEMS[activeShowcaseIdx] ?? SHOWCASE_ITEMS[0];
  const isEmptyChat = !activeThread || activeThread.messages.length === 0;

  const latestArtifactMsg =
    [...(activeThread?.messages ?? [])].reverse().find((m) => m.result) ?? null;
  const activeArtifactMsg =
    activeThread?.messages.find((m) => m.id === selectedArtifactMsgId && m.result) ??
    latestArtifactMsg;

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setAuthReady(true);
      return;
    }
    let mounted = true;
    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const sessionUser = data.session?.user;
      setApiToken(data.session?.access_token ?? '');
      if (sessionUser) {
        void client.from('profiles').upsert({
          id: sessionUser.id,
          full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
          avatar_url: sessionUser.user_metadata?.avatar_url ?? null,
        }, { onConflict: 'id' });
      }
      setUser(sessionUser ? {
        name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
        email: sessionUser.email ?? '',
      } : null);
      setLoginOpen(!sessionUser);
      setAuthReady(true);
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      setApiToken(session?.access_token ?? '');
      if (sessionUser) {
        void client.from('profiles').upsert({
          id: sessionUser.id,
          full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
          avatar_url: sessionUser.user_metadata?.avatar_url ?? null,
        }, { onConflict: 'id' });
      }
      setUser(sessionUser ? {
        name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
        email: sessionUser.email ?? '',
      } : null);
      setLoginOpen(!sessionUser);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || !apiToken) return;
    let cancelled = false;
    const loadChats = async () => {
      const { data: threadRows, error: threadError } = await client
        .from('chat_threads').select('id,title,updated_at').order('updated_at', { ascending: false });
      if (threadError || !threadRows?.length || cancelled) return;
      const ids = threadRows.map((row) => row.id as string);
      const { data: messageRows, error: messageError } = await client
        .from('chat_messages').select('id,thread_id,role,content,created_at')
        .in('thread_id', ids).order('created_at', { ascending: true });
      if (messageError || cancelled) return;
      const restored: ChatThread[] = threadRows.map((row) => ({
        id: row.id as string,
        title: row.title as string,
        updatedAt: new Date(row.updated_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: (messageRows ?? []).filter((message) => message.thread_id === row.id).map((message) => ({
          id: message.id as string,
          role: message.role as 'user' | 'assistant',
          text: message.content as string,
          createdAt: new Date(message.created_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })),
      }));
      setThreads((current) => {
        const unsaved = current.filter((thread) => !restored.some((saved) => saved.id === thread.id));
        return [...unsaved, ...restored];
      });
    };
    void loadChats();
    return () => { cancelled = true; };
  }, [apiToken]);

  useEffect(() => {
    if (API_URL || !isEmptyChat || isPreviewPaused || heroInput.trim()) return;
    const timer = setInterval(() => {
      setActiveShowcaseIdx((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
      setActiveToneIdx(0);
    }, 2000);
    return () => clearInterval(timer);
  }, [isEmptyChat, isPreviewPaused, heroInput]);

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

  const sendMessage = async (presetOverride?: DemoPreset, customText?: string, forceDiligence = false) => {
    const rawText = (presetOverride ? presetOverride.prompt : customText ?? input).trim();
    if ((!rawText && !attachedFile) || isRunning) return;
    const text = rawText || (attachedFile?.type.startsWith('image/') ? 'Analyze this image' : `Analyze ${attachedFile?.name ?? 'file'}`);

    const isChat = !presetOverride && !attachedFile && !forceDiligence && promptMode === 'chat';
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
      agents: isChat ? undefined : INITIAL_AGENTS.map((a) => ({ ...a })),
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
            'Diablo-Context.md#L4',
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
          summary: 'Approved v2 (92/100): Grounded, concise, and verified.',
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
        briefTitle: 'Diablo Response',
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

    setInput('');
    setHeroInput('');
    const currentFile = attachedFile;
    setAttachedFile(null);
    setIsRunning(true);

    if (!presetOverride && API_URL) {
      const controller = new AbortController();
      activeRequest.current = controller;
      const timer = window.setTimeout(() => controller.abort('timeout'), 120_000);
      const signal = controller.signal;
      try {
        const formData = new FormData();
        formData.append('prompt', text);
        if (isChat) {
          formData.append('history', JSON.stringify((activeThread?.messages ?? [])
            .filter((message) => !message.isStreaming && !message.error && !message.result)
            .slice(-12)
            .map((message) => ({ role: message.role, content: message.text }))));
          const { data: auth } = await supabase?.auth.getUser() ?? { data: { user: null } };
          const signedInUser = auth.user;
          if (supabase && signedInUser) {
            const { error: threadError } = await supabase.from('chat_threads').upsert({
              id: targetThreadId,
              user_id: signedInUser.id,
              title: activeThread?.title ?? text.slice(0, 38),
              updated_at: new Date().toISOString(),
            });
            if (threadError) throw new Error('Could not save this chat.');
            const { error: messageError } = await supabase.from('chat_messages').insert({
              id: userMsg.id, thread_id: targetThreadId, user_id: signedInUser.id,
              role: 'user', content: text,
            });
            if (messageError) throw new Error('Could not save this message.');
          }
          const response = await api('/api/chat', requestToken(), {
            method: 'POST', body: formData, signal,
          });
          const { reply } = await response.json() as { reply: string };
          updateAssistantMessage(targetThreadId, assistantMsgId, (m) => ({
            ...m, text: reply, isStreaming: false,
          }));
          if (supabase && signedInUser) {
            const { error: saveError } = await supabase.from('chat_messages').insert({
              id: assistantMsgId, thread_id: targetThreadId, user_id: signedInUser.id,
              role: 'assistant', content: reply,
            });
            if (saveError) {
              updateAssistantMessage(targetThreadId, assistantMsgId, (m) => ({
                ...m, error: 'Reply shown, but it could not be saved.',
              }));
            } else {
              await supabase.from('chat_threads').update({ updated_at: new Date().toISOString() })
                .eq('id', targetThreadId);
            }
          }
          return;
        }

        updateAssistantMessage(targetThreadId, assistantMsgId, (m) => ({
          ...m, agents: CONNECTED_AGENTS,
        }));
        formData.append('domain', 'bizintel');
        if (currentFile) formData.append('file', currentFile);

        const response = await api('/api/run', requestToken(), {
          method: 'POST', body: formData, signal,
        });
        const missionResult = await response.json() as MissionResult & { error?: string };
        if (missionResult.error) {
          throw new Error(missionResult.error);
        }
        updateAssistantMessage(targetThreadId, assistantMsgId, (m) => ({
          ...m,
          isStreaming: false,
          result: missionResult,
          agents: m.agents?.map((a) => ({ ...a, status: 'done' })),
        }));
      } catch (error) {
        updateAssistantMessage(targetThreadId, assistantMsgId, (m) => ({
          ...m, isStreaming: false,
          error: signal.reason === 'timeout' ? 'The run took too long to display.'
            : signal.aborted ? 'Stopped watching this run.'
              : error instanceof Error ? error.message : 'Could not connect to the workspace.',
        }));
      } finally {
        window.clearTimeout(timer);
        if (runTokenRef.current === token) {
          activeRequest.current = null;
          setIsRunning(false);
        }
      }
      return;
    }

    const activeMission =
      presetOverride ??
      DEMO_PRESETS.find((p) => p.prompt === text) ??
      buildCustomMission(text, currentFile?.name);
    const t = activeMission.timeline;

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
      summary: 'Previewing the retrieval step...',
    });
    patchAgentInMessage(targetThreadId, assistantMsgId, 'tools', {
      status: 'running',
      summary: 'Previewing the tool step...',
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
      ...activeMission.result,
      mode: 'simulation',
      id: `mission-${Date.now()}`,
      createdAt: nowLabel,
    };

    updateAssistantMessage(targetThreadId, assistantMsgId, (m) => ({
      ...m,
      isStreaming: false,
      result: finalResult,
    }));
    setSelectedArtifactMsgId(assistantMsgId);
    setIsRunning(false);
    if (!hasUnlocked) {
      setLoginOpen(true);
    }
  };

  const handleDecision = async (
    messageId: string, status: 'approved' | 'rejected', payload?: string,
  ) => {
    if (!activeThreadId) return;
    const msg = activeThread?.messages.find((m) => m.id === messageId);
    if (!msg?.result || msg.actionPending) return;
    const threadId = activeThreadId;
    updateAssistantMessage(threadId, messageId, (m) => ({
      ...m, actionPending: true, actionError: undefined,
    }));
    try {
      let action: ProposedAction = {
        ...msg.result.proposedAction,
        status,
        payloadPreview: payload ?? msg.result.proposedAction.payloadPreview,
        executionNote: `Simulation decision: ${status}.`,
      };
      if (msg.result.mode !== 'simulation') {
        const response = await api('/api/approve', requestToken(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mission_id: msg.result.id, payload, status }),
          signal: AbortSignal.timeout(15_000),
        });
        ({ action } = await response.json() as { action: ProposedAction });
      }
      updateAssistantMessage(threadId, messageId, (m) => ({
        ...m, actionPending: false,
        result: m.result && { ...m.result, proposedAction: action },
      }));
    } catch (error) {
      updateAssistantMessage(threadId, messageId, (m) => ({
        ...m, actionPending: false,
        actionError: error instanceof Error ? error.message : 'Could not save your decision.',
      }));
    }
  };

  const downloadReport = async (runId: string, format: 'md' | 'pdf') => {
    const response = await api(`/api/runs/${runId}/report/${format}`, requestToken(), {
      signal: AbortSignal.timeout(15_000),
    });
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = `diligence.${format}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const [attachedPreviewUrl, setAttachedPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!attachedFile || !attachedFile.type.startsWith('image/')) {
      setAttachedPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(attachedFile);
    setAttachedPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attachedFile]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAttachedFile(e.target.files?.[0] ?? null);
  };

  const extractImageFromClipboard = (clipboardData: DataTransfer | null): File | null => {
    if (!clipboardData) return null;

    if (clipboardData.files && clipboardData.files.length > 0) {
      for (const file of Array.from(clipboardData.files)) {
        if (
          file.type.startsWith('image/') ||
          /\.(png|jpe?g|webp|gif|bmp|svg|heic)$/i.test(file.name)
        ) {
          const ext = (file.type.split('/')[1] || file.name.split('.').pop() || 'png').replace(/[^a-z0-9]/gi, '');
          return file.name && file.name !== 'image.png'
            ? file
            : new File([file], `pasted-image-${Date.now()}.${ext}`, { type: file.type || 'image/png' });
        }
      }
    }

    if (clipboardData.items) {
      for (const item of Array.from(clipboardData.items)) {
        if (item.kind === 'file' || item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file && (file.type.startsWith('image/') || item.type.startsWith('image/'))) {
            const mime = file.type || item.type || 'image/png';
            const ext = mime.split('/')[1] || 'png';
            return file.name && file.name !== 'image.png'
              ? file
              : new File([file], `pasted-image-${Date.now()}.${ext}`, { type: mime });
          }
        }
      }
    }

    return null;
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const imageFile = extractImageFromClipboard(e.clipboardData);
    if (imageFile) {
      e.preventDefault();
      e.stopPropagation();
      setAttachedFile(imageFile);
    }
  };

  useEffect(() => {
    const onWindowPaste = (e: globalThis.ClipboardEvent) => {
      const imageFile = extractImageFromClipboard(e.clipboardData);
      if (imageFile) {
        e.preventDefault();
        setAttachedFile(imageFile);
        if (activeThreadId) {
          chatInputRef.current?.focus();
        } else {
          heroInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [activeThreadId]);

  const handleNewChat = () => {
    runTokenRef.current++;
    activeRequest.current?.abort();
    activeRequest.current = null;
    setIsRunning(false);
    setActiveThreadId(null);
    setInput('');
    setHeroInput('');
    setAttachedFile(null);
  };

  const showArtifact = Boolean(activeArtifactMsg && (hasUnlocked || user));

  return (
    <div className="relative h-screen w-screen overflow-hidden kraft-bg text-[#111113] flex">
      {/* Splash backdrop that fades away to reveal main page */}
      {!splashHidden && (
        <div
          aria-hidden="true"
          className={`fixed inset-0 z-[45] kraft-bg transition-opacity duration-700 ease-out ${
            introDocked ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />
      )}

      {/* Morphing "diablo" bubble logo: starts upper-center, bounces & shrinks into top-left corner */}
      <button
        type="button"
        onClick={handleNewChat}
        title="Diablo Home"
        style={{ transformOrigin: 'center center' }}
        className={`fixed z-50 -translate-x-1/2 -translate-y-1/2 transition-all duration-[850ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] cursor-pointer ${
          introDocked
            ? 'top-7 left-14 sm:left-16 scale-[0.3]'
            : 'top-[38%] left-1/2 scale-100'
        }`}
      >
        <SplitText
          text="diablo"
          tag="h1"
          className="font-display text-6xl sm:text-8xl font-bold tracking-[-0.04em] text-[#111113]"
          effect="pop"
          splitType="chars"
          delay={55}
          duration={0.95}
          staggerFrom="start"
          trigger="load"
          accentColor="#4f56b8"
          textAlign="center"
          onLetterAnimationComplete={() => {
            setTimeout(() => setIntroDocked(true), 360);
            setTimeout(() => setSplashHidden(true), 1200);
          }}
        />
      </button>
      <div className="relative flex-1 flex flex-col min-w-0">
        {/* Main Viewport */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-20 lg:pt-4 pb-24 lg:pb-4">
          {isEmptyChat ? (
            <div className="max-w-6xl mx-auto min-h-full flex items-start lg:items-center py-4 lg:py-12">
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
                {/* Left Editorial Column */}
                <div className="lg:col-span-6 space-y-6 sm:space-y-9">
                  <h1 className="font-display text-[34px] sm:text-5xl lg:text-6xl font-bold tracking-[-0.04em] leading-[1.06] text-[#111113]">
                    One workspace
                    <br />
                    for the work that{' '}
                    <span className="font-serif-accent italic font-semibold text-[1.03em]">
                      slows
                    </span>{' '}
                    you down
                  </h1>

                  <div className="space-y-5">
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
                            className={`text-sm font-mono-code pt-0.5 transition-colors ${
                              isActive
                                ? 'text-[#2e3278] font-semibold'
                                : 'text-[#252850]/65 group-hover:text-[#111113]'
                            }`}
                          >
                            {item.num}
                          </span>
                          <div>
                            <p
                              className={`text-base sm:text-[17px] font-medium transition-colors ${
                                isActive
                                  ? 'text-[#111113]'
                                  : 'text-[#1c1e36]/75 group-hover:text-[#111113]'
                              }`}
                            >
                              {item.title}
                            </p>
                            {isActive && (
                              <p className="mt-1.5 text-sm text-[#24263b] leading-relaxed max-w-md">
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
                <div
                  className="lg:col-span-6 relative"
                  onMouseEnter={() => setIsPreviewPaused(true)}
                  onMouseLeave={() => setIsPreviewPaused(false)}
                >
                  <div className="relative rounded-3xl dia-glass overflow-hidden">
                    {/* Subtle indigo top-edge highlight */}
                    <div className="h-[1.5px] w-full indigo-top-glow" />

                    {/* Window Header */}
                    <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-black/15" />
                        <span className="w-3 h-3 rounded-full bg-black/15" />
                        <span className="w-3 h-3 rounded-full bg-black/15" />
                      </div>
                      <span className="text-xs sm:text-[13px] text-[#6E6E77]">
                        {activeShowcase.windowTitle}
                      </span>
                    </div>

                    {/* Window Body */}
                    <div className="p-6 sm:p-7 space-y-5">
                      {/* Interactive Prompt Input Bar inside Card */}
                      <div
                        onClick={() => heroInputRef.current?.focus()}
                        className={`flex items-center gap-2.5 rounded-full bg-white pl-4 pr-2 border transition-all duration-300 ease-out cursor-text focus-within:scale-[1.03] focus-within:-translate-y-0.5 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 focus-within:shadow-[0_18px_40px_rgba(38,43,102,0.18),0_4px_12px_rgba(79,86,184,0.15)] ${
                          heroInput.trim()
                            ? 'scale-[1.03] -translate-y-0.5 border-indigo-500 ring-4 ring-indigo-500/15 shadow-[0_18px_40px_rgba(38,43,102,0.18),0_4px_12px_rgba(79,86,184,0.15)]'
                            : 'border-indigo-200/90 shadow-[0_6px_18px_rgba(79,86,184,0.09)] hover:border-indigo-300'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="w-0.5 h-4 rounded-full bg-indigo-500 animate-pulse shrink-0 pointer-events-none"
                        />
                        <input
                          ref={heroInputRef}
                          type="text"
                          value={heroInput}
                          onChange={(e) => setHeroInput(e.target.value)}
                          onPaste={handlePaste}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (heroInput.trim() || attachedFile) {
                                void sendMessage(undefined, heroInput);
                              } else {
                                void sendMessage(activeShowcase.preset);
                              }
                            }
                          }}
                          aria-label="Message"
                          placeholder={`Ask anything — ${activeShowcase.promptPreview}`}
                          className="flex-1 min-w-0 py-2.5 bg-transparent text-sm text-[#111113] placeholder:text-[#6E6E77] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (heroInput.trim()) {
                              void sendMessage(undefined, heroInput);
                            } else {
                              void sendMessage(activeShowcase.preset);
                            }
                          }}
                          aria-label="Run prompt"
                          className="w-8 h-8 rounded-full bg-[#111113] hover:bg-indigo-600 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-sm"
                        >
                          <ArrowUp className="w-4 h-4 stroke-[2.4]" />
                        </button>
                      </div>

                      {attachedFile && (
                        <div className="flex items-center">
                          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-900 border border-indigo-200">
                            {attachedPreviewUrl ? (
                              <img
                                src={attachedPreviewUrl}
                                alt={attachedFile.name}
                                className="w-5 h-5 rounded object-cover shrink-0"
                              />
                            ) : (
                              <Paperclip className="w-3 h-3" />
                            )}
                            <span className="truncate max-w-[220px]">{attachedFile.name}</span>
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

                      {/* Preview Output Box */}
                      <div
                        key={activeShowcase.num}
                        className="rounded-2xl bg-[#F7F8FC] border border-indigo-100/80 p-5 min-h-[190px] space-y-2.5 animate-fade-slide"
                      >
                        <p className="text-sm font-medium text-[#111113]">
                          {activeShowcase.subject}
                        </p>
                        <p className="text-[13px] text-[#4A4A58] leading-relaxed">
                          {activeShowcase.body}
                        </p>
                      </div>

                      {/* Bottom Tone / Suggestion Chips */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {activeShowcase.tones.map((tone, tIdx) => (
                          <button
                            key={tone}
                            type="button"
                            onClick={() => setActiveToneIdx(tIdx)}
                            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
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
                    className="mx-7 -mt-2 h-9 rounded-b-3xl bg-white/55 backdrop-blur-md border border-t-0 border-white/70 opacity-75"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto h-full py-2 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Document & Code Panel */}
              {showArtifact && activeArtifactMsg && (
                <div className="lg:col-span-7 min-h-[420px] pb-3 order-2 lg:order-1">
                  <ArtifactPanel
                    message={activeArtifactMsg}
                    onApproveAction={(id, edited) => void handleDecision(id, 'approved', edited)}
                    onRejectAction={(id) => void handleDecision(id, 'rejected')}
                    onDownloadReport={downloadReport}
                  />
                </div>
              )}

              {/* Right Chat & Typing Column */}
              <div
                className={`${
                  showArtifact ? 'lg:col-span-5 order-1 lg:order-2' : 'lg:col-span-8 lg:col-start-3'
                } flex flex-col min-h-0`}
              >
                <div className="flex-1 overflow-y-auto -mx-6 px-6 pt-3 pb-10 space-y-4">
                  {activeThread.messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isSelected={activeArtifactMsg?.id === msg.id}
                      onSelectArtifact={(id) => setSelectedArtifactMsgId(id)}
                    />
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Chat Input Bar */}
                <div className="pt-2 pb-3">
                  <div
                    onClick={() => chatInputRef.current?.focus()}
                    className="rounded-full bg-white/90 backdrop-blur-xl border border-white px-3 py-2 shadow-[0_14px_36px_rgba(38,43,102,0.14)] transition-all duration-300 ease-out cursor-text focus-within:bg-white focus-within:scale-[1.02] focus-within:-translate-y-0.5 focus-within:shadow-[0_20px_48px_rgba(38,43,102,0.22)]"
                  >
                    {attachedFile && (
                      <div className="mb-2 px-2">
                        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-900 border border-indigo-200">
                          {attachedPreviewUrl ? (
                            <img
                              src={attachedPreviewUrl}
                              alt={attachedFile.name}
                              className="w-5 h-5 rounded object-cover shrink-0"
                            />
                          ) : (
                            <Paperclip className="w-3 h-3" />
                          )}
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
                        accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.md,.csv,.log,.json,.eml"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach image, PDF, Log, or CSV"
                        className="p-2 rounded-full hover:bg-black/[0.05] text-[#555562] hover:text-[#111113] transition cursor-pointer shrink-0"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      <textarea
                        ref={chatInputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={handlePaste}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void sendMessage();
                          }
                        }}
                        rows={1}
                        placeholder="Ask Diablo anything..."
                        className="flex-1 resize-none bg-transparent py-1.5 text-sm text-[#111113] placeholder:text-[#7A7A85] focus:outline-none max-h-32"
                      />

                      <button
                        type="button"
                        disabled={(!input.trim() && !attachedFile) || isRunning}
                        onClick={() => void sendMessage()}
                        aria-label="Send message"
                        className="w-8 h-8 rounded-full bg-[#111113] hover:bg-[#2A2A32] text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition cursor-pointer shrink-0"
                      >
                        <ArrowUp className="w-4 h-4 stroke-[2.3]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gemini-Style Slim Icon Rail on Right Side (hidden during splash) */}
      {introDocked && (
        <ChatSidebar
          open={sidebarOpen}
          threads={threads}
          activeThreadId={activeThreadId}
          user={user}
          onSelectThread={(id) => setActiveThreadId(id)}
          onNewChat={handleNewChat}
          onSelectPreset={(preset) => void sendMessage(preset)}
          onToggleDrawer={() => setSidebarOpen((v) => !v)}
          onCloseDrawer={() => setSidebarOpen(false)}
          onOpenLogin={() => setLoginOpen(true)}
          onLogout={() => {
            void supabase?.auth.signOut().finally(() => {
              setUser(null);
              setHasUnlocked(false);
              setApiToken('');
              localStorage.removeItem('agentverse_user');
            });
          }}
        />
      )}

      {authReady && (
        <LoginModal
          open={loginOpen}
          onClose={() => {
            setHasUnlocked(true);
            setLoginOpen(false);
          }}
          onLogin={(loggedInUser) => {
            setUser(loggedInUser);
            setHasUnlocked(true);
            localStorage.setItem('agentverse_user', JSON.stringify(loggedInUser));
            setLoginOpen(false);
          }}
        />
      )}
    </div>
  );
}
