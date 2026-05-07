'use client';

interface AgentData {
  id: string;
  name: string;
  role: string;
  status: string;
  modelProfileId?: string | null;
  currentTaskId?: string | null;
  memoryPath?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  coding: 'Coding',
  testing: 'Testing',
  reviewing: 'Reviewing',
  blocked: 'Blocked',
  waiting_approval: 'Awaiting Approval',
  done: 'Done',
};

const STATUS_BG: Record<string, string> = {
  idle: 'bg-txt-secondary/30 text-txt-secondary',
  thinking: 'bg-accent-cyan/20 text-accent-cyan',
  coding: 'bg-accent-green/20 text-accent-green',
  testing: 'bg-accent-amber/20 text-accent-amber',
  reviewing: 'bg-accent-purple/20 text-accent-purple',
  blocked: 'bg-accent-magenta/20 text-accent-magenta animate-pixel-blink',
  waiting_approval: 'bg-accent-amber/20 text-accent-amber',
  done: 'bg-accent-green/10 text-accent-green/60',
};

const ROLE_BADGES: Record<string, string> = {
  orchestrator: 'text-accent-green text-glow-green',
  worker: 'text-accent-cyan text-glow-cyan',
  reviewer: 'text-accent-purple text-glow-purple',
  qa: 'text-accent-amber text-glow-amber',
  security: 'text-accent-magenta text-glow-magenta',
};

export function AgentDetailPanel({
  agent,
  onClose,
}: {
  agent: AgentData | null;
  onClose: () => void;
}) {
  if (!agent) return null;

  return (
    <div className="w-80 border-l border-border-600 bg-surface-900 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-txt-primary">{agent.name}</h3>
        <button
          onClick={onClose}
          className="text-txt-secondary hover:text-accent-magenta text-lg transition-colors"
          aria-label="Close detail panel"
        >
          &times;
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] uppercase text-txt-secondary tracking-wider">Role</p>
          <p className={`text-sm ${ROLE_BADGES[agent.role] ?? 'text-txt-primary'}`}>{agent.role}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-txt-secondary tracking-wider">Status</p>
          <span
            className={`inline-block px-2 py-0.5 rounded-sm border border-border-600 text-[11px] font-mono ${
              STATUS_BG[agent.status] ?? 'bg-txt-secondary/30 text-txt-secondary'
            }`}
          >
            {STATUS_LABELS[agent.status] ?? agent.status}
          </span>
        </div>
        <div>
          <p className="text-[10px] uppercase text-txt-secondary tracking-wider">Agent ID</p>
          <p className="text-[10px] font-mono text-txt-secondary">{agent.id}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-txt-secondary tracking-wider">Current Task</p>
          <p className="text-xs text-txt-primary">{agent.currentTaskId ?? 'None'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-txt-secondary tracking-wider">Model</p>
          <p className="text-xs text-txt-primary">{agent.modelProfileId ?? 'Project default'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-txt-secondary tracking-wider">Memory</p>
          <p className="text-xs text-txt-primary">{agent.memoryPath ?? 'Not linked'}</p>
        </div>
        <div className="rounded-lg border border-border-600 bg-surface-800 p-3">
          <p className="text-[10px] uppercase text-txt-secondary tracking-wider">Recent Activity</p>
          <p className="mt-1 text-xs text-txt-secondary">
            Live run artifacts, blockers, and tool events will appear here as runtime events are expanded.
          </p>
        </div>
      </div>
    </div>
  );
}
