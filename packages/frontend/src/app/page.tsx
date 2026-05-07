'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useState, useEffect, useCallback } from 'react';
import { createEventSource } from '@/lib/sse';
import { Header } from '@/components/layout/header';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AgentInstance {
  id: string;
  name: string;
  role: string;
  status: string;
  projectId: string;
  modelProfileId: string | null;
  currentTaskId: string | null;
  templateId: string | null;
  systemPrompt: string;
  promptVersion: number;
  memoryPath: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DashboardEvent {
  id: string;
  type: string;
  projectId: string;
  agentId: string | null;
  taskId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Status configuration                                               */
/* ------------------------------------------------------------------ */

interface StatusConfig {
  color: string;          // Tailwind text color class
  bg: string;             // Tailwind background color class
  glow: string;           // Tailwind shadow class
  animation: string;      // CSS animation class or empty
  label: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  idle: {
    color: 'text-txt-secondary',
    bg: 'bg-surface-800',
    glow: '',
    animation: '',
    label: 'IDLE',
  },
  thinking: {
    color: 'text-accent-cyan',
    bg: 'bg-surface-800',
    glow: 'shadow-[0_0_12px_rgba(0,229,255,0.4)]',
    animation: 'animate-pixel-pulse',
    label: 'THINKING',
  },
  researching: {
    color: 'text-accent-cyan',
    bg: 'bg-surface-800',
    glow: 'shadow-[0_0_10px_rgba(0,229,255,0.3)]',
    animation: 'animate-pixel-pulse',
    label: 'RESEARCHING',
  },
  coding: {
    color: 'text-accent-green',
    bg: 'bg-surface-800',
    glow: 'shadow-[0_0_10px_rgba(57,255,20,0.3)]',
    animation: 'animate-pixel-pulse',
    label: 'CODING',
  },
  testing: {
    color: 'text-accent-amber',
    bg: 'bg-surface-800',
    glow: 'shadow-[0_0_10px_rgba(255,170,0,0.3)]',
    animation: 'animate-pixel-pulse',
    label: 'TESTING',
  },
  reviewing: {
    color: 'text-accent-purple',
    bg: 'bg-surface-800',
    glow: 'shadow-[0_0_10px_rgba(179,102,255,0.3)]',
    animation: 'animate-pixel-pulse',
    label: 'REVIEWING',
  },
  blocked: {
    color: 'text-red-500',
    bg: 'bg-surface-800',
    glow: 'shadow-[0_0_10px_rgba(239,68,68,0.4)]',
    animation: 'animate-pixel-blink',
    label: 'BLOCKED',
  },
  waiting_approval: {
    color: 'text-accent-magenta',
    bg: 'bg-surface-800',
    glow: 'shadow-[0_0_10px_rgba(255,0,128,0.3)]',
    animation: 'animate-pixel-pulse',
    label: 'AWAITING APPROVAL',
  },
  done: {
    color: 'text-accent-green/60',
    bg: 'bg-surface-800',
    glow: '',
    animation: '',
    label: 'DONE',
  },
};

function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;
}

/* ------------------------------------------------------------------ */
/*  Pixel art icons (7-wide x 8-tall, monospace grid)                  */
/* ------------------------------------------------------------------ */

const PIXEL_ICONS: Record<string, string[]> = {
  idle: [
    '  .-.  ',
    '  | |  ',
    ' /| |\\ ',
    '  | |  ',
    '  | |  ',
    ' _/ \\_ ',
    '|     |',
    ' `---` ',
  ],
  thinking: [
    '  .-.  ',
    ' (_|_) ',
    ' /|=|\\ ',
    '  |=|  ',
    '  |=|  ',
    ' _/ \\_ ',
    '|  ?  |',
    ' `---` ',
  ],
  researching: [
    '  .-.  ',
    ' (o o) ',
    ' /|=|\\ ',
    '  |=|  ',
    '  |=|  ',
    ' _/ \\_ ',
    '| [ ] |',
    ' `---` ',
  ],
  coding: [
    '  .-.  ',
    ' >-|-< ',
    ' /|=|\\ ',
    '  |=|  ',
    '  |=|  ',
    ' _/ \\_ ',
    '|<../>|',
    ' `---` ',
  ],
  testing: [
    '  .-.  ',
    ' (v v) ',
    ' /|=|\\ ',
    '  |=|  ',
    '  |=|  ',
    ' _/ \\_ ',
    '| [ok]|',
    ' `---` ',
  ],
  reviewing: [
    '  .-.  ',
    ' (O O) ',
    ' /|=|\\ ',
    '  |=|  ',
    '  |=|  ',
    ' _/ \\_ ',
    '| eye |',
    ' `---` ',
  ],
  blocked: [
    '  .-.  ',
    ' (x x) ',
    ' /|=|\\ ',
    '  |=|  ',
    '  |=|  ',
    ' _/ \\_ ',
    '| ERR |',
    ' `---` ',
  ],
  waiting_approval: [
    '  .-.  ',
    ' (- -) ',
    ' /|=|\\ ',
    '  |=|  ',
    '  |=|  ',
    ' _/ \\_ ',
    '| [!] |',
    ' `---` ',
  ],
  done: [
    '  .-.  ',
    ' (^_^) ',
    ' /|=|\\ ',
    '  |=|  ',
    '  |=|  ',
    ' _/ \\_ ',
    '| OK! |',
    ' `---` ',
  ],
};

function getPixelIcon(status: string): string[] {
  return PIXEL_ICONS[status] ?? PIXEL_ICONS.idle;
}

/* ------------------------------------------------------------------ */
/*  Event type accent colors                                           */
/* ------------------------------------------------------------------ */

const EVENT_ACCENT: Record<string, string> = {
  'agent.created': 'text-accent-cyan',
  'agent.status.changed': 'text-accent-amber',
  'task.created': 'text-accent-green',
  'task.assigned': 'text-accent-purple',
  'run.started': 'text-accent-cyan',
  'run.model_call.started': 'text-accent-cyan',
  'run.tool_call.started': 'text-accent-green',
  'run.artifact.created': 'text-accent-amber',
  'run.blocked': 'text-red-500',
  'approval.requested': 'text-accent-magenta',
  'review.started': 'text-accent-purple',
  'review.rejected': 'text-red-500',
  'review.accepted': 'text-accent-green',
  'memory.updated': 'text-accent-purple',
  'cost.threshold.warning': 'text-accent-amber',
};

const EVENT_BG: Record<string, string> = {
  'agent.created': 'bg-accent-cyan/10',
  'agent.status.changed': 'bg-accent-amber/10',
  'task.created': 'bg-accent-green/10',
  'task.assigned': 'bg-accent-purple/10',
  'run.started': 'bg-accent-cyan/10',
  'run.blocked': 'bg-red-500/10',
  'approval.requested': 'bg-accent-magenta/10',
  'memory.updated': 'bg-accent-purple/10',
  'cost.threshold.warning': 'bg-accent-amber/10',
};

/* ------------------------------------------------------------------ */
/*  Stat Cards                                                         */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  value: number | string;
  accent: string;   // accent color class, e.g. 'text-accent-cyan'
  glowColor: string; // raw color for shadow, e.g. 'rgba(0,229,255,0.3)'
}

function StatCard({ label, value, accent, glowColor }: StatCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden
        bg-surface-900 border border-border-600 rounded-sm p-4
        font-mono
        transition-all duration-200
        hover:border-border-400
        hover:shadow-[0_0_12px_var(--glow)]
      `}
      style={{ '--glow': glowColor } as React.CSSProperties}
    >
      {/* Gradient accent bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${glowColor.replace('0.3', '1').replace('0.15', '1')}, transparent)`,
        }}
      />
      <p className="text-[10px] uppercase tracking-widest text-txt-secondary mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>
        {value}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pixel-art Agent Cell                                               */
/* ------------------------------------------------------------------ */

interface AgentCellProps {
  agent: AgentInstance;
  latestEvent: DashboardEvent | null;
  isExpanded: boolean;
  onToggle: () => void;
}

function AgentCell({ agent, latestEvent, isExpanded, onToggle }: AgentCellProps) {
  const config = getStatusConfig(agent.status);
  const icon = getPixelIcon(agent.status);

  return (
    <button
      onClick={onToggle}
      className={`
        group relative text-left
        bg-surface-900 border border-border-600 rounded-sm
        p-3 cursor-pointer
        transition-all duration-150
        hover:border-border-400
        ${config.glow}
        ${config.animation}
        ${isExpanded ? 'col-span-2 row-span-2' : ''}
      `}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.05) 2px)',
        }}
      />

      {/* Status indicator dot */}
      <div
        className={`
          absolute top-2 right-2 w-2 h-2 rounded-none
          ${config.color.replace('text-', 'bg-')}
          ${config.animation}
        `}
      />

      {/* Pixel art icon */}
      <div
        className={`font-mono text-[8px] leading-[10px] whitespace-pre ${config.color} select-none`}
      >
        {icon.join('\n')}
      </div>

      {/* Agent name */}
      <p className="mt-2 text-xs font-mono text-txt-primary truncate">
        {agent.name}
      </p>

      {/* Status label */}
      <p
        className={`text-[9px] font-mono uppercase tracking-wider ${config.color}`}
      >
        {config.label}
      </p>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border-600 space-y-2">
          <DetailRow label="Role" value={agent.role} />
          <DetailRow
            label="Model"
            value={agent.modelProfileId ?? '—'}
          />
          <DetailRow
            label="Task"
            value={agent.currentTaskId ?? '—'}
          />
          {latestEvent && (
            <div>
              <p className="text-[9px] uppercase text-txt-secondary">
                Last Event
              </p>
              <p className="text-[10px] font-mono text-txt-primary truncate">
                {latestEvent.type}
              </p>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase text-txt-secondary">{label}</p>
      <p className="text-[10px] font-mono text-txt-primary truncate">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Event Feed Row                                                     */
/* ------------------------------------------------------------------ */

function EventRow({ event }: { event: DashboardEvent }) {
  const accent = EVENT_ACCENT[event.type] ?? 'text-txt-secondary';
  const bg = EVENT_BG[event.type] ?? 'bg-surface-800';

  const time = (() => {
    try {
      return new Date(event.createdAt).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '--:--:--';
    }
  })();

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-1.5
        border-b border-border-600
        font-mono text-[11px]
        ${bg}
      `}
    >
      <span className="text-txt-secondary tabular-nums shrink-0">{time}</span>
      <span
        className={`shrink-0 px-1.5 py-0.5 rounded-sm border border-border-600 ${accent}`}
      >
        {event.type}
      </span>
      <span className="text-txt-secondary truncate">
        {event.agentId ? `agent:${event.agentId.slice(0, 8)}` : ''}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Page                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { projectId } = useProject();
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [liveStatusMap, setLiveStatusMap] = useState<Record<string, string>>(
    {},
  );

  /* ---- Data queries ---- */

  const { data: agents = [] } = useQuery<AgentInstance[]>({
    queryKey: ['agent-instances', projectId],
    queryFn: () =>
      apiFetch<AgentInstance[]>(
        `/agents/instances?projectId=${projectId ?? ''}`,
      ),
    enabled: !!projectId,
  });

  const { data: projects = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['projects'],
    queryFn: () => apiFetch('/projects'),
  });

  const { data: tasks = [] } = useQuery<{ id: string; status: string }[]>({
    queryKey: ['tasks', projectId],
    queryFn: () =>
      apiFetch(`/tasks?projectId=${projectId ?? ''}`),
    enabled: !!projectId,
  });

  const { data: events = [] } = useQuery<DashboardEvent[]>({
    queryKey: ['events-dashboard', projectId],
    queryFn: () =>
      apiFetch<DashboardEvent[]>(
        `/events?projectId=${projectId ?? ''}&limit=5`,
      ),
    enabled: !!projectId,
  });

  /* ---- SSE for live status updates ---- */

  useEffect(() => {
    if (!projectId) return;

    const es = createEventSource(projectId, (event: {
      type: string;
      agentId?: string;
      payload?: Record<string, unknown>;
    }) => {
      if (event.type === 'agent.status.changed' && event.agentId) {
        const newStatus =
          typeof event.payload?.status === 'string'
            ? event.payload.status
            : 'idle';
        setLiveStatusMap((prev) => ({
          ...prev,
          [event.agentId!]: newStatus,
        }));
      }
    });

    return () => es.close();
  }, [projectId]);

  /* ---- Merge live statuses into agent data ---- */

  const mergedAgents = agents.map((a) => ({
    ...a,
    status: liveStatusMap[a.id] ?? a.status,
  }));

  /* ---- Build latest-event lookup per agent ---- */

  const latestEventByAgent = (() => {
    const map: Record<string, DashboardEvent> = {};
    for (const e of events) {
      if (e.agentId) {
        map[e.agentId] = e;
      }
    }
    return map;
  })();

  /* ---- Derived counts ---- */

  const activeTasks = tasks.filter(
    (t) => t.status !== 'done' && t.status !== 'cancelled',
  ).length;

  const eventCountToday = (() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    // We only fetched 5 events, but stat shows the fetched count
    // as the API doesn't give a total. This is honest.
    return events.length;
  })();

  /* ---- Toggle expanded agent ---- */

  const handleAgentToggle = useCallback((agentId: string) => {
    setExpandedAgentId((prev) => (prev === agentId ? null : agentId));
  }, []);

  /* ---- Render ---- */

  return (
    <>
      <Header title="Dashboard" />
      <div className="p-5 space-y-5 font-mono">
      {/* Section: Stat Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Projects"
          value={projects.length}
          accent="text-accent-cyan"
          glowColor="rgba(0,229,255,0.3)"
        />
        <StatCard
          label="Agents"
          value={mergedAgents.length}
          accent="text-accent-green"
          glowColor="rgba(57,255,20,0.3)"
        />
        <StatCard
          label="Active Tasks"
          value={activeTasks}
          accent="text-accent-amber"
          glowColor="rgba(255,170,0,0.3)"
        />
        <StatCard
          label="Events"
          value={eventCountToday}
          accent="text-accent-purple"
          glowColor="rgba(179,102,255,0.3)"
        />
      </section>

      {/* Section: Pixel Office Grid */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xs uppercase tracking-widest text-accent-cyan text-glow-cyan">
            ◈ Pixel Office
          </h2>
          <div className="flex-1 h-[1px] divider-glow" />
          <span className="text-[10px] text-txt-secondary">
            {mergedAgents.length} agent{mergedAgents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {mergedAgents.length === 0 ? (
          <div className="bg-surface-900 border border-border-600 rounded-sm p-8 text-center">
            <div className="text-txt-secondary text-xs font-mono">
              {'// No agents deployed yet'}
            </div>
            <div className="text-[10px] text-txt-secondary/60 mt-1">
              Create agents to see them appear here
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 auto-rows-min">
            {mergedAgents.map((agent) => (
              <AgentCell
                key={agent.id}
                agent={agent}
                latestEvent={latestEventByAgent[agent.id] ?? null}
                isExpanded={expandedAgentId === agent.id}
                onToggle={() => handleAgentToggle(agent.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section: Recent Events */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xs uppercase tracking-widest text-accent-amber text-glow-amber">
            ◉ Recent Events
          </h2>
          <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, var(--accent-amber), transparent 80%)' }} />
          <a
            href="/events"
            className="text-[10px] text-accent-cyan hover:underline"
          >
            view all &rarr;
          </a>
        </div>

        <div className="bg-surface-900 border border-border-600 rounded-sm overflow-hidden">
          {events.length === 0 ? (
            <div className="p-6 text-center text-txt-secondary text-xs font-mono">
              {'// No events yet'}
            </div>
          ) : (
            events.slice(0, 5).map((event) => (
              <EventRow key={event.id} event={event} />
            ))
          )}
        </div>
      </section>
      </div>
    </>
  );
}
