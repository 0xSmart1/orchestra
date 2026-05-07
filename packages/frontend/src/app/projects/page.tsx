'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useState } from 'react';

interface ModelProfileBrief {
  id: string;
  name: string;
  modelName: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  workspacePath: string;
  defaultModelProfileId: string | null;
  defaultModelProfile: ModelProfileBrief | null;
  createdAt: string;
}

export default function ProjectsPage() {
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const qc = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', showArchived],
    queryFn: () => apiFetch<Project[]>(`/projects?archived=${showArchived}`),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['model-profiles'],
    queryFn: () => apiFetch<{ id: string; name: string; modelName: string }[]>('/models/profiles'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      apiFetch(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ archived }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const setProfileMutation = useMutation({
    mutationFn: ({ projectId, profileId }: { projectId: string; profileId: string | null }) =>
      apiFetch(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({ defaultModelProfileId: profileId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  return (
    <>
      <Header title="Projects" />
      <div className="p-6 font-mono">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-txt-secondary">{projects.length} project(s)</p>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-xs text-txt-secondary">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Archived
            </label>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-3 py-1.5 bg-accent-cyan text-surface-900 text-sm rounded-sm hover:shadow-[0_0_8px_rgba(0,229,255,0.3)]"
            >
              + New Project
            </button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMutation.mutate({
                name: fd.get('name'),
                description: fd.get('description'),
                workspacePath: fd.get('workspacePath'),
              });
            }}
            className="mb-6 p-4 border border-border-600 rounded-sm space-y-3 bg-surface-900"
          >
            <input name="name" placeholder="Project name" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
            <input name="description" placeholder="Description" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" />
            <input name="workspacePath" placeholder="Workspace path" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
            <button type="submit" className="px-3 py-1.5 bg-accent-green text-surface-900 text-sm rounded-sm hover:shadow-[0_0_8px_rgba(57,255,20,0.3)]">Create</button>
          </form>
        )}

        <div className="space-y-2">
          {projects.map((p) => (
            <div key={p.id} className="p-4 border border-border-600 rounded-sm bg-surface-900 hover:border-accent-cyan transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-txt-primary">{p.name}</h3>
                  <p className="text-xs text-txt-secondary">{p.workspacePath}</p>
                  {p.description && <p className="text-xs text-txt-secondary mt-1 opacity-80">{p.description}</p>}
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete project "${p.name}"?`)) deleteMutation.mutate(p.id);
                  }}
                  className="px-2 py-1 text-xs text-accent-magenta border border-accent-magenta/30 rounded-sm hover:bg-accent-magenta/10"
                >
                  Delete
                </button>
                <button
                  onClick={() => archiveMutation.mutate({ id: p.id, archived: !showArchived })}
                  className="ml-2 px-2 py-1 text-xs text-accent-amber border border-accent-amber/30 rounded-sm hover:bg-accent-amber/10"
                >
                  {showArchived ? 'Restore' : 'Archive'}
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label className="text-[10px] uppercase text-txt-secondary tracking-wider shrink-0">Default Model</label>
                <select
                  value={p.defaultModelProfileId ?? ''}
                  onChange={(e) => setProfileMutation.mutate({ projectId: p.id, profileId: e.target.value || null })}
                  className="flex-1 bg-surface-800 text-txt-primary px-2 py-1 rounded-sm text-xs border border-border-600 focus:border-accent-cyan focus:outline-none"
                >
                  <option value="">— Not set —</option>
                  {profiles.map((mp) => (
                    <option key={mp.id} value={mp.id}>{mp.name} ({mp.modelName})</option>
                  ))}
                </select>
                {p.defaultModelProfile && (
                  <span className="text-xs text-accent-cyan text-glow-cyan shrink-0">{p.defaultModelProfile.modelName}</span>
                )}
              </div>
            </div>
          ))}
          {projects.length === 0 && !showForm && (
            <p className="text-txt-secondary text-center py-8">No projects yet. Create one to get started.</p>
          )}
        </div>
      </div>
    </>
  );
}
