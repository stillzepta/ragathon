import { ArrowUp, Paperclip, X } from 'lucide-react';
import { ChangeEvent, ClipboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArtifactPanel } from './components/ArtifactPanel';
import { ChatMessage } from './components/ChatMessage';
import { ChatSidebar } from './components/ChatSidebar';
import { EmailModal } from './components/EmailModal';
import { AuthUser, LoginModal } from './components/LoginModal';
import SplitText from './components/SplitText';
import { api, API_URL, watchRun } from './api';
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

const STAGE_IDS: Record<string, AgentNode['id'] | undefined> = {
  planner: 'orchestrator',
  researcher: 'rag',
  analyst: 'planner',
  writer: 'planner',
  evaluator: 'critic',
  revision: 'planner',
};

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
  suggestions: { label: string; prompt: string }[];
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
    subject: 'Try asking Diablo',
    suggestions: [
      {
        label: 'Summarize key risks from my previous due-diligence runs',
        prompt: 'Summarize key risks from my previous due-diligence runs',
      },
      {
        label: 'Compare burn rate and runway across two startup pitches',
        prompt: 'Compare burn rate and runway across two startup pitches',
      },
    ],
    preset: DEMO_PRESETS[0],
  },
  {
    num: '2',
    title: 'Four-agent diligence pipeline',
    description:
      'Planner, Researcher, Analyst, and Evaluator run in sequence with live SSE progress updates.',
    windowTitle: '4-Agent Pipeline',
    promptPreview: 'Run due diligence on this seed deck...',
    subject: 'Run a 4-agent workflow',
    suggestions: [
      {
        label: 'Run due diligence on a B2B AI SaaS seed startup',
        prompt: 'Run a 4-agent due diligence analysis on a B2B AI SaaS seed startup with $40k MRR',
      },
      {
        label: 'Evaluate unit economics, moat, and GTM risks for a fintech app',
        prompt: 'Evaluate unit economics, competitive moat, and GTM risks for a consumer fintech app',
      },
    ],
    preset: DEMO_PRESETS[1],
  },
  {
    num: '3',
    title: 'Grounded in files & RAG',
    description:
      'Upload PDFs, CSVs, logs, or images. Agents retrieve cited excerpts and optional web search results.',
    windowTitle: 'RAG + Citations',
    promptPreview: 'Check burn rate in financials.csv...',
    subject: 'Search files & live knowledge',
    suggestions: [
      {
        label: 'Check SBA market benchmarks and compliance risks for a new SaaS',
        prompt: 'Check SBA market benchmarks and compliance risks for a new B2B SaaS company',
      },
      {
        label: 'Audit a pitch deck or financial CSV for hidden red flags',
        prompt: 'What financial red flags should I audit first in a seed-stage startup pitch deck?',
      },
    ],
    preset: DEMO_PRESETS[2],
  },
  {
    num: '4',
    title: 'Critic review & PDF/MD export',
    description:
      'Evaluator scores Draft v1, refines Draft v2, records your sign-off, and exports PDF or Markdown.',
    windowTitle: 'Review & Export',
    promptPreview: 'Approve follow-up & export memo...',
    subject: 'Self-correcting memos & sign-off',
    suggestions: [
      {
        label: 'Draft an investor-ready diligence memo with Critic verification',
        prompt: 'Draft an investor-ready startup due-diligence memo with key risks and follow-up actions',
      },
      {
        label: 'List critical follow-up questions before a Series A term sheet',
        prompt: 'List the top follow-up diligence questions to verify before signing a Series A term sheet',
      },
    ],
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

export default function App() {
  const [introDocked, setIntroDocked] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [hasUnlocked, setHasUnlocked] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('agentverse_user'));
    } catch {
      return false;
    }
  });
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [blankChatOpen, setBlankChatOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [selectedArtifactMsgId, setSelectedArtifactMsgId] = useState<string | null>(null);

  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);
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
  // Chat is the default. Task-shaped prompts are promoted to the workflow
  // automatically; the sidebar can still force either mode explicitly.
  const [promptMode, setPromptMode] = useState<'chat' | 'diligence'>('chat');
  const activeRequest = useRef<AbortController | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const runTokenRef = useRef(0);
  const historyOwner = useRef<string | null>(null);
  const historyGeneration = useRef(0);
  const signingOut = useRef(false);

  const resetChat = useCallback(() => {
    runTokenRef.current++;
    activeRequest.current?.abort();
    activeRequest.current = null;
    setIsRunning(false);
    setActiveThreadId(null);
    setSelectedArtifactMsgId(null);
    setInput('');
    setHeroInput('');
    setAttachedFile(null);
  }, []);

  const clearChatHistory = useCallback(() => {
    historyGeneration.current++;
    resetChat();
    setThreads([]);
    setBlankChatOpen(false);
    setSidebarOpen(false);
  }, [resetChat]);


  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  const activeShowcase = SHOWCASE_ITEMS[activeShowcaseIdx] ?? SHOWCASE_ITEMS[0];
  const isHome = !activeThread && !blankChatOpen;
  const showChatSidebar = !isHome || Boolean(heroInput.trim());

  useEffect(() => {
    if (showChatSidebar && window.matchMedia('(min-width: 1024px)').matches) {
      setSidebarOpen(true);
    }
  }, [showChatSidebar]);

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
    let authEventReceived = false;
    client.auth.getSession().then(({ data }) => {
      if (!mounted || authEventReceived) return;
      const sessionUser = data.session?.user;
      historyOwner.current = sessionUser?.id ?? null;
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
      setAuthReady(true);
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      if (signingOut.current && session) return;
      const sessionUser = session?.user;
      const previousOwner = historyOwner.current;
      historyOwner.current = sessionUser?.id ?? null;
      if (previousOwner && previousOwner !== historyOwner.current) clearChatHistory();
      setAuthReady(true);
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
      if (sessionUser) setLoginOpen(false);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [clearChatHistory]);

  useEffect(() => {
    const client = supabase;
    const owner = historyOwner.current;
    const generation = historyGeneration.current;
    if (!client || !apiToken || !owner) return;
    let cancelled = false;
    const isCurrent = () => !cancelled && historyOwner.current === owner &&
      historyGeneration.current === generation;
    const loadChats = async () => {
      const { data: threadRows, error: threadError } = await client
        .from('chat_threads').select('id,title,updated_at').eq('user_id', owner).order('updated_at', { ascending: false });
      if (threadError || !threadRows?.length || !isCurrent()) return;
      const ids = threadRows.map((row) => row.id as string);
      const { data: messageRows, error: messageError } = await client
        .from('chat_messages').select('id,thread_id,role,content,created_at')
        .in('thread_id', ids).order('created_at', { ascending: true });
      if (messageError || !isCurrent()) return;
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
        if (!isCurrent()) return current;
        const unsaved = current.filter((thread) => !restored.some((saved) => saved.id === thread.id));
        return [...unsaved, ...restored];
      });
    };
    void loadChats();
    return () => { cancelled = true; };
  }, [apiToken]);

  useEffect(() => {
    if (API_URL || !isHome || isPreviewPaused || heroInput.trim()) return;
    const timer = setInterval(() => {
      setActiveShowcaseIdx((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [isHome, isPreviewPaused, heroInput]);

  useEffect(() => {
    const messages = messagesRef.current;
    messages?.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
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

    const isImageAttachment = Boolean(attachedFile && attachedFile.type.startsWith('image/'));
    const taskShape = /\b(plan|research|investigate|evaluate|compare|analy[sz]e|create|build|calculate|book|find|recommend|trip|itinerary|market|startup|competitor)\b/i.test(text);
    const workflowRequested = forceDiligence || promptMode === 'diligence' || taskShape || Boolean(attachedFile && !isImageAttachment);
    const followUpRunId = !presetOverride && !workflowRequested ? activeArtifactMsg?.result?.id : undefined;
    const isChat = !followUpRunId && !presetOverride && (!attachedFile || isImageAttachment) && !workflowRequested;
    const authToken = requestToken();
    if (!presetOverride && !isChat && API_URL && !authToken) {
      if (forceDiligence) {
        setHeroInput(text);
      }
      setLoginOpen(true);
      return;
    }

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
        if (followUpRunId) {
          const response = await api(`/api/runs/${followUpRunId}/follow-up`, requestToken(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text }),
            signal,
          });
          const { reply } = await response.json() as { reply: string };
          updateAssistantMessage(targetThreadId, assistantMsgId, (m) => ({ ...m, text: reply, isStreaming: false }));
          return;
        }
        if (isChat) {
          if (currentFile && currentFile.type.startsWith('image/')) {
            formData.append('file', currentFile);
          }
          formData.append('history', JSON.stringify((activeThread?.messages ?? [])
            .filter((message) => !message.isStreaming && !message.error && !message.result)
            .slice(-12)
            .map((message) => ({ role: message.role, content: message.text }))));
          let signedInUser: { id: string } | null = null;
          try {
            const { data: auth } = await supabase?.auth.getUser() ?? { data: { user: null } };
            signedInUser = auth.user ? { id: auth.user.id } : null;
          } catch {
            // Chat replies must not depend on Supabase availability.
            signedInUser = null;
          }
          if (supabase && signedInUser) {
            const { error: threadError } = await supabase.from('chat_threads').upsert({
              id: targetThreadId,
              user_id: signedInUser.id,
              title: activeThread?.title ?? text.slice(0, 38),
              updated_at: new Date().toISOString(),
            });
            if (!threadError) {
              await supabase.from('chat_messages').insert({
                id: userMsg.id, thread_id: targetThreadId, user_id: signedInUser.id,
                role: 'user', content: text,
              });
            }
          }
          const response = await api('/api/chat', requestToken(), {
            method: 'POST', body: formData, signal,
          });
          const { reply } = await response.json() as { reply: string };
          updateAssistantMessage(targetThreadId, assistantMsgId, (m) => ({
            ...m, text: reply, isStreaming: false,
          }));
          if (!hasUnlocked && !user) {
            setLoginOpen(true);
          }
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
        formData.append('domain', 'research');
        if (currentFile) formData.append('file', currentFile);

        const response = await api('/api/runs', authToken, {
          method: 'POST', body: formData, signal,
        });
        const { id } = await response.json() as { id: string };
        await watchRun(id, authToken, signal, (event) => {
          const agent = event.stage && STAGE_IDS[event.stage];
          if (agent) {
            patchAgentInMessage(targetThreadId, assistantMsgId, agent, {
              status: event.action === 'started' ? 'running' : 'done',
              summary: event.message,
            });
          }
        });
        const snapshot = await api(`/api/runs/${id}`, authToken, { signal });
        const { status, result } = await snapshot.json() as {
          status: string; result?: MissionResult & { error?: string };
        };
        if (status !== 'completed' || !result) {
          throw new Error(result?.error ?? 'The research run did not finish.');
        }
        updateAssistantMessage(targetThreadId, assistantMsgId, (m) => ({
          ...m, isStreaming: false, result,
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

    if (!presetOverride) {
      updateAssistantMessage(targetThreadId, assistantMsgId, (message) => ({
        ...message,
        isStreaming: false,
        error: 'Live analysis is unavailable because no backend is connected.',
      }));
      setIsRunning(false);
      return;
    }
    updateAssistantMessage(targetThreadId, assistantMsgId, (message) => ({
      ...message,
      isStreaming: false,
      error: 'Live research requires the FastAPI backend. Set VITE_API_URL and try again.',
    }));
    setIsRunning(false);
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
        if (!isHome) {
          chatInputRef.current?.focus();
        } else {
          heroInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [isHome]);

  const handleHome = () => {
    resetChat();
    setBlankChatOpen(false);
    setSidebarOpen(false);
  };

  const handleNewChat = () => {
    resetChat();
    setBlankChatOpen(true);
    setSidebarOpen(window.matchMedia('(min-width: 1024px)').matches);
    requestAnimationFrame(() => chatInputRef.current?.focus());
  };

  // The final reviewed answer is the single source of truth in the chat.
  // Reports remain downloadable through the report endpoint, but the raw
  // artifact/trace pane must not duplicate or distract from the answer.
  const showArtifact = false;

  return (
    <div className="relative flex h-dvh w-full overflow-hidden kraft-bg text-[#111113]">
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
        onClick={handleHome}
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
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Main Viewport */}
        <div className={`min-h-0 flex-1 px-4 pb-24 pt-20 sm:px-8 lg:pb-4 lg:pt-4 ${isHome ? 'overflow-y-auto' : 'overflow-hidden'}`}>
          {isHome ? (
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
                          onClick={() => setActiveShowcaseIdx(idx)}
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

                      {/* Interactive Search & Feature Suggestions Box */}
                      <div
                        key={activeShowcase.num}
                        className="rounded-2xl bg-[#F7F8FC] border border-indigo-100/80 p-4 min-h-[190px] space-y-2.5 animate-fade-slide"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600/90 px-1">
                          {activeShowcase.subject}
                        </p>
                        <div className="space-y-2">
                          {activeShowcase.suggestions.map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => void sendMessage(undefined, item.prompt, activeShowcaseIdx > 0)}
                              className="w-full text-left flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white hover:bg-indigo-50/70 border border-indigo-100/80 hover:border-indigo-300 text-[13px] text-[#1E1E26] transition cursor-pointer group"
                            >
                              <span className="leading-snug">{item.label}</span>
                              <ArrowUp className="w-3.5 h-3.5 shrink-0 rotate-45 text-indigo-500 opacity-60 group-hover:opacity-100 transition" />
                            </button>
                          ))}
                        </div>
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
            <div className="mx-auto grid h-full max-w-7xl auto-rows-[minmax(0,1fr)] grid-cols-1 items-stretch gap-6 py-2 lg:grid-cols-12">
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
                <div ref={messagesRef} className="-mx-6 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 pb-4 pt-3">
                  {activeThread?.messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isSelected={activeArtifactMsg?.id === msg.id}
                      locked={!hasUnlocked && !user}
                      onUnlock={() => setLoginOpen(true)}
                    onSelectArtifact={undefined}
                    />
                  ))}
                </div>

                {/* Chat Input Bar */}
                <div className="shrink-0 pb-3 pt-2">
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

      {/* Workspace navigation */}
      {introDocked && (
        <ChatSidebar
          open={sidebarOpen}
          chatContext={showChatSidebar}
          threads={threads}
          activeThreadId={activeThreadId}
          user={user}
          promptMode={promptMode}
          onPromptModeChange={setPromptMode}
          onSelectThread={(id) => setActiveThreadId(id)}
          onNewChat={handleNewChat}
          onHome={handleHome}
          onToggleDrawer={() => setSidebarOpen((v) => !v)}
          onCloseDrawer={() => setSidebarOpen(false)}
          onOpenLogin={() => setLoginOpen(true)}
          onOpenEmail={() => setEmailOpen(true)}
          onLogout={() => {
            signingOut.current = true;
            historyOwner.current = null;
            clearChatHistory();
            setEmailOpen(false);
            void supabase?.auth.signOut().finally(() => {
              signingOut.current = false;
              setUser(null);
              setHasUnlocked(false);
              setApiToken('');
              localStorage.removeItem('agentverse_user');
            });
          }}
        />
      )}

      <EmailModal
        open={emailOpen}
        token={requestToken()}
        senderName={user?.name}
        onClose={() => setEmailOpen(false)}
      />

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
