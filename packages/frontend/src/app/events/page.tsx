'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useEffect, useRef, useState } from 'react';
import { createEventSource } from '@/lib/sse';
import { useProject } from '@/lib/project-context';

interface Event {
  id: string;
  type: string;
  projectId: string;
  agentId?: string;
  taskId?: string;
  payload: string;
  createdAt: string;
}

const typeBadgeColors: Record<string, string> = {
  'agent.created': 'bg-accent-green/20 text-accent-green border-accent-green/30',
  'agent.status.changed': 'bg-accent-green/20 text-accent-green border-accent-green/30',
  'task.created': 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
  'task.assigned': 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
  'run.started': 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30',
  'run.completed': 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30',
  'approval.requested': 'bg-accent-magenta/20 text-accent-magenta border-accent-magenta/30',
  'approval.resolved': 'bg-accent-magenta/20 text-accent-magenta border-accent-magenta/30',
  'memory.updated': 'bg-accent-purple/20 text-accent-purple border-accent-purple/30',
  'memory.created': 'bg-accent-purple/20 text-accent-purple border-accent-purple/30',
};

const typeTextColors: Record<string, string> = {
  'agent.created': 'text-accent-green',
  'agent.status.changed': 'text-accent-green',
  'task.created': 'text-accent-amber',
  'task.assigned': 'text-accent-amber',
  'run.started': 'text-accent-cyan',
  'run.completed': 'text-accent-cyan',
  'approval.requested': 'text-accent-magenta',
  'approval.resolved': 'text-accent-magenta',
  'memory.updated': 'text-accent-purple',
  'memory.created': 'text-accent-purple',
};

export default function EventsPage() {
  const { projectId } = useProject();
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: initialEvents = [] } = useQuery({
    queryKey: ['events', projectId],
    queryFn: () => apiFetch<Event[]>(`/events?projectId=${projectId || ''}&limit=50`),
  });

  // SSE: connect when projectId is available
  useEffect(() => {
    if (!projectId) return;
    setIsConnected(true);
    const es = createEventSource(projectId, (event) =>
      setLiveEvents((prev) => [...prev, event]),
    );
    es.addEventListener('error', () => setIsConnected(false));
    return () => { es.close(); setIsConnected(false); };
  }, [projectId]);

  const allEvents = [...initialEvents, ...liveEvents].filter(
    (e) => !filter || e.type.includes(filter)
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allEvents.length]);

  return (
    <>
      <Header title="Events" />
      <div className="p-6 font-mono">
        <div className="mb-4 flex items-center gap-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by type..."
            className="bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm w-64 border border-border-600 focus:border-accent-cyan focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent-cyan animate-pulse-glow' : 'bg-txt-secondary'}`} />
            <span className="text-xs text-txt-secondary">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
        <div className="space-y-1 max-h-[70vh] overflow-y-auto">
          {allEvents.map((e, i) => (
            <div key={e.id + i} className="flex gap-3 px-3 py-1.5 text-xs font-mono border-b border-border-600 hover:bg-surface-800 transition-colors">
              <span className="text-txt-secondary shrink-0">{new Date(e.createdAt).toLocaleTimeString()}</span>
              <span className={`shrink-0 px-1.5 py-0.5 rounded-sm border ${typeBadgeColors[e.type] || 'bg-surface-700 text-txt-secondary border-border-600'}`}>
                {e.type}
              </span>
              <span className="text-txt-secondary truncate">{e.payload}</span>
            </div>
          ))}
          {allEvents.length === 0 && (
            <p className="text-txt-secondary text-center py-8">No events yet.</p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </>
  );
}
