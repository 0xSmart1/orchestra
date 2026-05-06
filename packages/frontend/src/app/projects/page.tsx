'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  description: string;
  workspacePath: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch<Project[]>('/projects'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  return (
    <>
      <Header title="Projects" />
      <div className="p-6 font-mono">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-txt-secondary">{projects.length} project(s)</p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-accent-cyan text-surface-900 text-sm rounded-sm hover:shadow-[0_0_8px_rgba(0,229,255,0.3)]"
          >
            + New Project
          </button>
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
            <div key={p.id} className="p-4 border border-border-600 rounded-sm bg-surface-900 flex justify-between items-center hover:border-accent-cyan transition-colors">
              <div>
                <h3 className="font-medium text-txt-primary">{p.name}</h3>
                <p className="text-xs text-txt-secondary">{p.workspacePath}</p>
                {p.description && <p className="text-xs text-txt-secondary mt-1 opacity-80">{p.description}</p>}
              </div>
              <button
                onClick={() => deleteMutation.mutate(p.id)}
                className="px-2 py-1 text-xs text-accent-magenta border border-accent-magenta/30 rounded-sm hover:bg-accent-magenta/10"
              >
                Delete
              </button>
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
