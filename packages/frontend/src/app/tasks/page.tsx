'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: number;
  projectId: string;
}

const COLUMNS = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'running', label: 'Running' },
  { key: 'review', label: 'Review' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
];

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiFetch<Task[]>('/tasks?projectId='),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setShowForm(false); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const tasksByStatus = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.key),
  }));

  const statusColors: Record<string, string> = {
    backlog: 'border-gray-600',
    assigned: 'border-yellow-600',
    running: 'border-blue-600',
    review: 'border-purple-600',
    accepted: 'border-green-600',
    rejected: 'border-red-600',
  };

  return (
    <>
      <Header title="Tasks" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-400">{tasks.length} task(s)</p>
          <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">New Task</button>
        </div>

        {showForm && (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createMutation.mutate({ title: fd.get('title'), project: { connect: { id: 'default' } } }); }} className="mb-6 p-4 border border-gray-800 rounded-lg space-y-3">
            <input name="title" placeholder="Task title" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
            <button type="submit" className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">Create</button>
          </form>
        )}

        <div className="grid grid-cols-6 gap-3 overflow-x-auto">
          {tasksByStatus.map((col) => (
            <div key={col.key} className="min-w-[180px]">
              <h3 className="text-xs font-medium text-gray-500 mb-2">{col.label} ({col.tasks.length})</h3>
              <div className="space-y-2">
                {col.tasks.map((t) => (
                  <div key={t.id} className={`p-3 border-l-2 ${statusColors[t.status] || 'border-gray-600'} bg-gray-900 rounded-r-lg`}>
                    <p className="text-sm font-medium">{t.title}</p>
                    <div className="flex gap-1 mt-2">
                      {COLUMNS.filter(c => c.key !== t.status).slice(0, 3).map(c => (
                        <button key={c.key} onClick={() => statusMutation.mutate({ id: t.id, status: c.key })} className="px-1.5 py-0.5 text-[10px] text-gray-400 border border-gray-700 rounded hover:bg-gray-800">{c.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
