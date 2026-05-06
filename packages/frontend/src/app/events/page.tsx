'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useEffect, useRef, useState } from 'react';
import { createEventSource } from '@/lib/sse';

interface Event {
  id: string;
  type: string;
  projectId: string;
  agentId?: string;
  taskId?: string;
  payload: string;
  createdAt: string;
}

export default function EventsPage() {
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: initialEvents = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => apiFetch<Event[]>('/events?projectId=&limit=50'),
  });

  const allEvents = [...initialEvents, ...liveEvents].filter(
    (e) => !filter || e.type.includes(filter)
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allEvents.length]);

  const typeColors: Record<string, string> = {
    'agent.created': 'text-blue-400',
    'agent.status.changed': 'text-yellow-400',
    'task.created': 'text-green-400',
    'task.assigned': 'text-purple-400',
    'run.started': 'text-cyan-400',
    'approval.requested': 'text-red-400',
    'memory.updated': 'text-emerald-400',
  };

  return (
    <>
      <Header title="Events" />
      <div className="p-6">
        <div className="mb-4">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by type..."
            className="bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm w-64"
          />
        </div>
        <div className="space-y-1 max-h-[70vh] overflow-y-auto">
          {allEvents.map((e, i) => (
            <div key={e.id + i} className="flex gap-3 px-3 py-1.5 text-xs font-mono border-b border-gray-900">
              <span className="text-gray-600 shrink-0">{new Date(e.createdAt).toLocaleTimeString()}</span>
              <span className={`shrink-0 ${typeColors[e.type] || 'text-gray-400'}`}>{e.type}</span>
              <span className="text-gray-500 truncate">{e.payload}</span>
            </div>
          ))}
          {allEvents.length === 0 && (
            <p className="text-gray-600 text-center py-8">No events yet.</p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </>
  );
}
