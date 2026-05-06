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
  { key: 'backlog', label: 'Backlog', color: 'border-txt-secondary', headerColor: 'text-txt-secondary' },
  { key: 'planned', label: 'Planned', color: 'border-accent-cyan', headerColor: 'text-accent-cyan' },
  { key: 'in_progress', label: 'In Progress', color: 'border-accent-amber', headerColor: 'text-accent-amber' },
  { key: 'in_review', label: 'In Review', color: 'border-accent-purple', headerColor: 'text-accent-purple' },
  { key: 'done', label: 'Done', color: 'border-accent-green', headerColor: 'text-accent-green' },
  { key: 'cancelled', label: 'Cancelled', color: 'border-accent-magenta', headerColor: 'text-accent-magenta' },
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
  0: 'bg-txt-secondary',
  1: 'bg-accent-cyan',
  2: 'bg-accent-amber',
  3: 'bg-accent-magenta',
};

const transitionBtnColors: Record<string, string> = {
  backlog: 'text-txt-secondary border-border-600 hover:bg-surface-700',
  planned: 'text-accent-cyan border-accent-cyan/30 hover:bg-accent-cyan/10',
  in_progress: 'text-accent-amber border-accent-amber/30 hover:bg-accent-amber/10',
  in_review: 'text-accent-purple border-accent-purple/30 hover:bg-accent-purple/10',
  done: 'text-accent-green border-accent-green/30 hover:bg-accent-green/10',
  cancelled: 'text-accent-magenta border-accent-magenta/30 hover:bg-accent-magenta/10',
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
          <p className="text-txt-secondary font-mono">Select a project first to view tasks.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Tasks" />
      <div className="p-6 font-mono">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-txt-secondary">{tasks.length} task(s)</p>
          <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-accent-cyan text-surface-900 text-sm rounded-sm hover:shadow-[0_0_8px_rgba(0,229,255,0.3)]">+ New Task</button>
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
          }} className="mb-6 p-4 border border-border-600 rounded-sm space-y-3 bg-surface-900">
            <input name="title" placeholder="Task title" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
            <textarea name="contract" placeholder="Task contract (optional)" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm h-20 border border-border-600 focus:border-accent-cyan focus:outline-none" />
            <div className="flex gap-2">
              <select name="priority" className="bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none">
                <option value="0">Priority: None</option>
                <option value="1">Priority: Low</option>
                <option value="2">Priority: Medium</option>
                <option value="3">Priority: High</option>
              </select>
              <select name="assigneeId" className="flex-1 bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none">
                <option value="">Unassigned</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
              </select>
            </div>
            <button type="submit" className="px-3 py-1.5 bg-accent-green text-surface-900 text-sm rounded-sm hover:shadow-[0_0_8px_rgba(57,255,20,0.3)]">Create</button>
          </form>
        )}

        <div className="flex gap-3 overflow-x-auto pb-4">
          {tasksByStatus.map((col) => (
            <div key={col.key} className="min-w-[220px] flex-shrink-0">
              <h3 className={`text-xs font-medium mb-2 sticky top-0 bg-surface-900 py-1 ${col.headerColor}`}>
                {col.label} <span className="text-txt-secondary">({col.tasks.length})</span>
              </h3>
              <div className="space-y-2">
                {col.tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`border-l-2 ${col.color} bg-surface-900 p-3 rounded-r-sm cursor-pointer hover:bg-surface-800 transition-colors border-t border-r border-b border-border-600`}
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${priorityDots[t.priority] || 'bg-txt-secondary'}`} />
                      <span className="text-sm font-medium truncate text-txt-primary">{t.title}</span>
                    </div>
                    {t.assigneeId && (
                      <div className="text-xs text-txt-secondary mt-1">{agentMap[t.assigneeId] || t.assigneeId}</div>
                    )}

                    {expandedId === t.id && (
                      <div className="mt-2 pt-2 border-t border-border-600 space-y-2">
                        {t.contract && <p className="text-xs text-txt-secondary">{t.contract}</p>}
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
                          className="w-full bg-surface-800 text-txt-primary px-2 py-1 rounded-sm text-xs border border-border-600 focus:border-accent-cyan focus:outline-none"
                        >
                          <option value="">Unassigned</option>
                          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <div className="text-[10px] text-txt-secondary">Updated {new Date(t.updatedAt).toLocaleString()}</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteTask.mutate(t.id); }}
                          className="px-2 py-0.5 text-[10px] text-accent-magenta border border-accent-magenta/30 rounded-sm hover:bg-accent-magenta/10"
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
                            className={`px-1.5 py-0.5 text-[10px] border rounded-sm ${transitionBtnColors[next] || 'text-txt-secondary border-border-600 hover:bg-surface-700'}`}
                          >{colDef?.label || next}</button>
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
