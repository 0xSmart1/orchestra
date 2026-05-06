'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useState } from 'react';
import { useProject } from '@/lib/project-context';

interface Task {
  id: string;
  projectId: string;
  title: string;
  contract: string | null;
  status: string;
  assigneeId: string | null;
  reviewerId: string | null;
  priority: number;
  parentTaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AgentInstance {
  id: string;
  name: string;
  role: string;
  status: string;
}

const COLUMNS = [
  { key: 'backlog', label: 'Backlog', color: 'border-gray-600' },
  { key: 'planned', label: 'Planned', color: 'border-blue-600' },
  { key: 'in_progress', label: 'In Progress', color: 'border-yellow-600' },
  { key: 'in_review', label: 'In Review', color: 'border-purple-600' },
  { key: 'done', label: 'Done', color: 'border-green-600' },
  { key: 'cancelled', label: 'Cancelled', color: 'border-red-600' },
];

const TRANSITIONS: Record<string, string[]> = {
  backlog: ['planned', 'cancelled'],
  planned: ['backlog', 'in_progress', 'cancelled'],
  in_progress: ['planned', 'in_review', 'cancelled'],
  in_review: ['in_progress', 'done', 'cancelled'],
  done: ['in_review', 'cancelled'],
  cancelled: ['backlog'],
};

const priorityDots: Record<number, string> = {
  0: 'bg-gray-500',
  1: 'bg-blue-500',
  2: 'bg-yellow-500',
  3: 'bg-red-500',
};

export default function TasksPage() {
  const { projectId } = useProject();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => apiFetch<Task[]>(`/tasks?projectId=${projectId}`),
    enabled: !!projectId,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agent-instances', projectId],
    queryFn: () => apiFetch<AgentInstance[]>(`/agents/instances?projectId=${projectId}`),
    enabled: !!projectId,
  });

  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a.name]));

  const createTask = useMutation({
    mutationFn: (data: any) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks', projectId] }); setShowForm(false); },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, ...data }: { id: string; [k: string]: any }) =>
      apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const tasksByStatus = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.key),
  }));

  if (!projectId) {
    return (
      <>
        <Header title="Tasks" />
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <p className="text-gray-500">Select a project first to view tasks.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Tasks" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-400">{tasks.length} task(s)</p>
          <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">New Task</button>
        </div>

        {showForm && (
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            createTask.mutate({
              title: fd.get('title'),
              contract: fd.get('contract') || undefined,
              priority: Number(fd.get('priority')) || 0,
              assignee: fd.get('assigneeId') ? { connect: { id: fd.get('assigneeId') } } : undefined,
              project: { connect: { id: projectId } },
            });
          }} className="mb-6 p-4 border border-gray-800 rounded-lg space-y-3">
            <input name="title" placeholder="Task title" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
            <textarea name="contract" placeholder="Task contract (optional)" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm h-20" />
            <div className="flex gap-2">
              <select name="priority" className="bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm">
                <option value="0">Priority: None</option>
                <option value="1">Priority: Low</option>
                <option value="2">Priority: Medium</option>
                <option value="3">Priority: High</option>
              </select>
              <select name="assigneeId" className="flex-1 bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm">
                <option value="">Unassigned</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
              </select>
            </div>
            <button type="submit" className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">Create</button>
          </form>
        )}

        <div className="flex gap-3 overflow-x-auto pb-4">
          {tasksByStatus.map((col) => (
            <div key={col.key} className="min-w-[220px] flex-shrink-0">
              <h3 className="text-xs font-medium text-gray-500 mb-2 sticky top-0 bg-gray-900 py-1">
                {col.label} <span className="text-gray-600">({col.tasks.length})</span>
              </h3>
              <div className="space-y-2">
                {col.tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`border-l-2 ${col.color} bg-gray-900 p-3 rounded-r-lg cursor-pointer hover:bg-gray-800 transition-colors`}
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${priorityDots[t.priority] || 'bg-gray-500'}`} />
                      <span className="text-sm font-medium truncate">{t.title}</span>
                    </div>
                    {t.assigneeId && (
                      <div className="text-xs text-gray-500 mt-1">{agentMap[t.assigneeId] || t.assigneeId}</div>
                    )}

                    {expandedId === t.id && (
                      <div className="mt-2 pt-2 border-t border-gray-800 space-y-2">
                        {t.contract && <p className="text-xs text-gray-400">{t.contract}</p>}
                        <select
                          value={t.assigneeId || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateTask.mutate({
                              id: t.id,
                              assignee: e.target.value ? { connect: { id: e.target.value } } : { disconnect: true },
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-gray-800 text-gray-100 px-2 py-1 rounded text-xs"
                        >
                          <option value="">Unassigned</option>
                          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <div className="text-[10px] text-gray-600">Updated {new Date(t.updatedAt).toLocaleString()}</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteTask.mutate(t.id); }}
                          className="px-2 py-0.5 text-[10px] text-red-400 border border-gray-700 rounded hover:bg-red-900"
                        >Delete</button>
                      </div>
                    )}

                    <div className="flex gap-1 mt-2 flex-wrap">
                      {(TRANSITIONS[t.status] || []).map((next) => {
                        const colDef = COLUMNS.find((c) => c.key === next);
                        return (
                          <button
                            key={next}
                            onClick={(e) => { e.stopPropagation(); updateTask.mutate({ id: t.id, status: next }); }}
                            className="px-1.5 py-0.5 text-[10px] text-gray-400 border border-gray-700 rounded hover:bg-gray-700"
                          >→ {colDef?.label || next}</button>
                        );
                      })}
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
