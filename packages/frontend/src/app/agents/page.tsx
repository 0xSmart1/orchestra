'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useState } from 'react';

interface AgentTemplate {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
}

interface AgentInstance {
  id: string;
  name: string;
  role: string;
  status: string;
  projectId: string;
}

export default function AgentsPage() {
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showInstanceForm, setShowInstanceForm] = useState(false);
  const qc = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['agent-templates'],
    queryFn: () => apiFetch<AgentTemplate[]>('/agents/templates'),
  });

  const { data: instances = [] } = useQuery({
    queryKey: ['agent-instances'],
    queryFn: () => apiFetch<AgentInstance[]>('/agents/instances?projectId='),
  });

  const createTemplate = useMutation({
    mutationFn: (data: any) => apiFetch('/agents/templates', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agent-templates'] }); setShowTemplateForm(false); },
  });

  const createInstance = useMutation({
    mutationFn: (data: any) => apiFetch('/agents/instances', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agent-instances'] }); setShowInstanceForm(false); },
  });

  const statusColors: Record<string, string> = {
    idle: 'bg-gray-600',
    thinking: 'bg-yellow-600',
    coding: 'bg-green-600',
    testing: 'bg-blue-600',
    reviewing: 'bg-purple-600',
    blocked: 'bg-red-600',
    done: 'bg-emerald-600',
  };

  return (
    <>
      <Header title="Agents" />
      <div className="p-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setShowTemplateForm(!showTemplateForm)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">New Template</button>
          <button onClick={() => setShowInstanceForm(!showInstanceForm)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">New Instance</button>
        </div>

        {showTemplateForm && (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createTemplate.mutate({ name: fd.get('name'), role: fd.get('role'), systemPrompt: fd.get('systemPrompt') }); }} className="mb-6 p-4 border border-gray-800 rounded-lg space-y-3">
            <input name="name" placeholder="Template name" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
            <input name="role" placeholder="Role" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
            <textarea name="systemPrompt" placeholder="System prompt" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm h-24" required />
            <button type="submit" className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">Create</button>
          </form>
        )}

        <h3 className="text-sm font-medium text-gray-400 mb-3">Templates</h3>
        <div className="space-y-2 mb-8">
          {templates.map((t) => (
            <div key={t.id} className="p-3 border border-gray-800 rounded-lg">
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-gray-500">{t.role}</div>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-medium text-gray-400 mb-3">Instances</h3>
        <div className="space-y-2">
          {instances.map((inst) => (
            <div key={inst.id} className="p-3 border border-gray-800 rounded-lg flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${statusColors[inst.status] || 'bg-gray-600'}`} />
              <div>
                <div className="font-medium text-sm">{inst.name}</div>
                <div className="text-xs text-gray-500">{inst.role} · {inst.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
