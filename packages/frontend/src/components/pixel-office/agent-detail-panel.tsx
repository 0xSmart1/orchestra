'use client';

interface AgentData {
  id: string;
  name: string;
  role: string;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  coding: 'Coding',
  testing: 'Testing',
  reviewing: 'Reviewing',
  blocked: 'Blocked',
  waiting_approval: 'Waiting Approval',
  done: 'Done',
};

const STATUS_BG: Record<string, string> = {
  idle: 'bg-gray-600',
  thinking: 'bg-yellow-600',
  coding: 'bg-green-600',
  testing: 'bg-blue-600',
  reviewing: 'bg-purple-600',
  blocked: 'bg-red-600',
  waiting_approval: 'bg-orange-600',
  done: 'bg-emerald-600',
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
    <div className="w-72 border-l border-gray-800 bg-gray-900 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">{agent.name}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 text-lg"
          aria-label="Close detail panel"
        >
          &times;
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500">Role</p>
          <p className="text-sm">{agent.role}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              STATUS_BG[agent.status] ?? 'bg-gray-600'
            }`}
          >
            {STATUS_LABELS[agent.status] ?? agent.status}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500">Agent ID</p>
          <p className="text-xs font-mono text-gray-400">{agent.id}</p>
        </div>
      </div>
    </div>
  );
}
