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
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-400">{projects.length} project(s)</p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            New Project
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
            className="mb-6 p-4 border border-gray-800 rounded-lg space-y-3"
          >
            <input name="name" placeholder="Project name" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
            <input name="description" placeholder="Description" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" />
            <input name="workspacePath" placeholder="Workspace path" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
            <button type="submit" className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">Create</button>
          </form>
        )}

        <div className="space-y-2">
          {projects.map((p) => (
            <div key={p.id} className="p-4 border border-gray-800 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-medium">{p.name}</h3>
                <p className="text-xs text-gray-500">{p.workspacePath}</p>
                {p.description && <p className="text-xs text-gray-400 mt-1">{p.description}</p>}
              </div>
              <button
                onClick={() => deleteMutation.mutate(p.id)}
                className="px-2 py-1 text-xs text-red-400 hover:text-red-300 border border-red-900 rounded"
              >
                Delete
              </button>
            </div>
          ))}
          {projects.length === 0 && !showForm && (
            <p className="text-gray-600 text-center py-8">No projects yet. Create one to get started.</p>
          )}
        </div>
      </div>
    </>
  );
}
