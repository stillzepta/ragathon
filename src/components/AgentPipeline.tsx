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
  isSimulation?: boolean;
  criticInitialScore?: number;
  criticFinalScore?: number;
}

export function AgentPipeline({
  agents,
  isSimulation = true,
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
        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
      ) : agent.status === 'rejected' ? (
        <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
      ) : agent.status === 'done' ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-black/20" />
      );

    const roleIcon =
      agent.id === 'rag' ? (
        <Database className="w-3.5 h-3.5 text-[#6E6E77]" />
      ) : agent.id === 'tools' ? (
        <Wrench className="w-3.5 h-3.5 text-[#6E6E77]" />
      ) : agent.id === 'critic' ? (
        <ShieldAlert className="w-3.5 h-3.5 text-[#6E6E77]" />
      ) : (
        <Cpu className="w-3.5 h-3.5 text-[#6E6E77]" />
      );

    return (
      <div
        key={agent.id}
        className={`rounded-2xl bg-[#F7F8FC] border border-black/[0.06] p-3.5 transition-all ${
          agent.status === 'running'
            ? 'ring-1 ring-indigo-400/50'
            : agent.status === 'rejected'
            ? 'ring-1 ring-amber-400/60'
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
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#111113]">
                  {roleIcon}
                  {agent.name}
                </span>
                <span className="text-[11px] text-[#7A7A85]">{agent.role}</span>
              </div>
              <p className="mt-1 text-xs text-[#4A4A55] leading-relaxed">
                {agent.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {agent.badge && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                  agent.status === 'rejected'
                    ? 'bg-amber-100 text-amber-900'
                    : agent.status === 'done'
                    ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/80'
                    : 'bg-black/[0.05] text-[#4A4A55]'
                }`}
              >
                {agent.badge}
              </span>
            )}
            {hasDetails &&
              (isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[#7A7A85]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#7A7A85]" />
              ))}
          </div>
        </button>

        {isExpanded && hasDetails && (
          <div className="mt-3 pt-3 border-t border-black/[0.06] space-y-2">
            {agent.toolCall && (
              <div className="rounded-xl bg-white px-3 py-2 border border-black/[0.05]">
                <span className="text-[10px] uppercase tracking-wider text-[#6E6E77] block mb-1">
                  Tool Execution
                </span>
                <code className="font-mono-code text-[11px] text-[#111113] break-all">
                  {agent.toolCall}
                </code>
              </div>
            )}

            {agent.ragSources && agent.ragSources.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#6E6E77] mr-1">
                  RAG Chunks:
                </span>
                {agent.ragSources.map((src) => (
                  <span
                    key={src}
                    className="font-mono-code text-[11px] px-2 py-0.5 rounded-md bg-white text-[#3A3A45] border border-black/[0.05]"
                  >
                    {src}
                  </span>
                ))}
              </div>
            )}

            {agent.memorySnapshot && (
              <div className="rounded-xl bg-white text-[#111113] p-3 overflow-x-auto border border-black/[0.05]">
                <span className="text-[10px] uppercase tracking-wider text-[#6E6E77] block mb-1">
                  {isSimulation ? 'Shared Memory Snapshot' : 'Recorded Progress'}
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
        <p className="text-[11px] text-[#6E6E77]">
          {isSimulation ? 'Inspect example agent outputs' : 'Open a stage to inspect its recorded progress'}
        </p>

        {criticInitialScore !== undefined && criticFinalScore !== undefined && (
          <div className="px-2.5 py-0.5 rounded-full bg-[#F1F2F8] text-[11px] font-medium text-[#111113]">
            Critic: <span className="text-amber-700">{criticInitialScore}</span> →{' '}
            <span className="text-indigo-700">{criticFinalScore}/100</span>
          </div>
        )}
      </div>

      {orchestrator && renderCard(orchestrator)}

      {isSimulation ? (
      <div className="relative pl-3 border-l border-indigo-200 space-y-2">
        <span className="inline-block text-[10px] uppercase tracking-widest text-[#7A7A85]">
          Parallel Fan-Out (asyncio)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {parallelAgents.map(renderCard)}
        </div>
      </div>

      ) : parallelAgents.map(renderCard)}

      {downstreamAgents.map(renderCard)}
    </div>
  );
}
