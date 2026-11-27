import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { AgentNode } from '../types';

interface AgentPipelineProps {
  agents: AgentNode[];
  criticInitialScore?: number;
  criticFinalScore?: number;
}

export function AgentPipeline({
  agents,
  criticInitialScore,
  criticFinalScore,
}: AgentPipelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const orchestrator = agents.find((a) => a.id === 'orchestrator');
  const parallelAgents = agents.filter((a) => a.id === 'rag' || a.id === 'tools');
  const downstreamAgents = agents.filter((a) => a.id === 'planner' || a.id === 'critic');

  const renderCard = (agent: AgentNode) => {
    const isExpanded = expandedId === agent.id;
    const hasDetails = Boolean(
      agent.toolCall || agent.ragSources?.length || agent.memorySnapshot
    );

    const statusIcon =
      agent.status === 'running' ? (
        <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
      ) : agent.status === 'rejected' ? (
        <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
      ) : agent.status === 'done' ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-white/25" />
      );

    const roleIcon =
      agent.id === 'rag' ? (
        <Database className="w-3.5 h-3.5 text-neutral-400" />
      ) : agent.id === 'tools' ? (
        <Wrench className="w-3.5 h-3.5 text-neutral-400" />
      ) : agent.id === 'critic' ? (
        <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
      ) : (
        <Cpu className="w-3.5 h-3.5 text-neutral-400" />
      );

    return (
      <div
        key={agent.id}
        className={`rounded-2xl bg-white/[0.05] border border-white/10 p-3.5 transition-all ${
          agent.status === 'running'
            ? 'ring-1 ring-sky-400/40'
            : agent.status === 'rejected'
            ? 'ring-1 ring-amber-400/50'
            : ''
        }`}
      >
        <button
          type="button"
          onClick={() => hasDetails && setExpandedId(isExpanded ? null : agent.id)}
          className={`w-full text-left flex items-start justify-between gap-3 ${
            hasDetails ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 shrink-0">{statusIcon}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white">
                  {roleIcon}
                  {agent.name}
                </span>
                <span className="text-[11px] text-neutral-400">{agent.role}</span>
              </div>
              <p className="mt-1 text-xs text-neutral-300 leading-relaxed">
                {agent.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {agent.badge && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                  agent.status === 'rejected'
                    ? 'bg-amber-400/15 text-amber-200 border border-amber-400/25'
                    : agent.status === 'done'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25'
                    : 'bg-white/10 text-neutral-300'
                }`}
              >
                {agent.badge}
              </span>
            )}
            {hasDetails &&
              (isExpanded ? (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              ))}
          </div>
        </button>

        {isExpanded && hasDetails && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            {agent.toolCall && (
              <div className="rounded-xl bg-black/40 px-3 py-2">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">
                  Tool Execution
                </span>
                <code className="font-mono-code text-[11px] text-neutral-200 break-all">
                  {agent.toolCall}
                </code>
              </div>
            )}

            {agent.ragSources && agent.ragSources.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 mr-1">
                  RAG Chunks:
                </span>
                {agent.ragSources.map((src) => (
                  <span
                    key={src}
                    className="font-mono-code text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-neutral-200"
                  >
                    {src}
                  </span>
                ))}
              </div>
            )}

            {agent.memorySnapshot && (
              <div className="rounded-xl bg-black/45 text-neutral-200 p-3 overflow-x-auto border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">
                  Shared Memory Snapshot
                </span>
                <pre className="font-mono-code text-[11px] leading-relaxed">
                  {JSON.stringify(agent.memorySnapshot, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2.5 pt-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] text-neutral-400">
          Click any completed agent to inspect Shared Memory & tool calls
        </p>

        {criticInitialScore !== undefined && criticFinalScore !== undefined && (
          <div className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-medium text-neutral-200">
            Critic: <span className="text-amber-300">{criticInitialScore}</span> →{' '}
            <span className="text-emerald-300">{criticFinalScore}/100</span>
          </div>
        )}
      </div>

      {orchestrator && renderCard(orchestrator)}

      <div className="relative pl-3 border-l border-white/15 space-y-2">
        <span className="inline-block text-[10px] uppercase tracking-widest text-neutral-400">
          Parallel Fan-Out (asyncio)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {parallelAgents.map(renderCard)}
        </div>
      </div>

      {downstreamAgents.map(renderCard)}
    </div>
  );
}
