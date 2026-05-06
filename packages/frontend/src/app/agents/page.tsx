'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useState, useMemo } from 'react';
import { useProject } from '@/lib/project-context';

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
  const { projectId } = useProject();
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showInstanceForm, setShowInstanceForm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const qc = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['agent-templates'],
    queryFn: () => apiFetch<AgentTemplate[]>('/agents/templates'),
  });

  const { data: instances = [] } = useQuery({
    queryKey: ['agent-instances', projectId],
    queryFn: () => apiFetch<AgentInstance[]>(`/agents/instances?projectId=${projectId || ''}`),
  });

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId],
  );

  const createTemplate = useMutation({
    mutationFn: (data: any) => apiFetch('/agents/templates', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agent-templates'] }); setShowTemplateForm(false); },
  });

  const createInstance = useMutation({
    mutationFn: (data: any) =>
      apiFetch('/agents/instances', {
        method: 'POST',
        body: JSON.stringify({ ...data, projectId }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agent-instances', projectId] }); setShowInstanceForm(false); },
  });

  const statusColors: Record<string, string> = {
    idle: 'bg-txt-secondary',
    thinking: 'bg-accent-amber',
    coding: 'bg-accent-green',
    testing: 'bg-accent-cyan',
    reviewing: 'bg-accent-purple',
    blocked: 'bg-accent-magenta',
    done: 'bg-accent-green',
  };

  const statusAnimations: Record<string, string> = {
    thinking: 'animate-pulse',
    coding: 'animate-pulse-glow',
    blocked: 'animate-pixel-blink',
  };

  const roleBadgeColors: Record<string, string> = {
    orchestrator: 'bg-accent-green/20 text-accent-green border-accent-green/30',
    worker: 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30',
    reviewer: 'bg-accent-purple/20 text-accent-purple border-accent-purple/30',
    qa: 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
    security: 'bg-accent-magenta/20 text-accent-magenta border-accent-magenta/30',
  };

  return (
    <>
      <Header title="Agents" />
      <div className="p-6 font-mono">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setShowTemplateForm(!showTemplateForm)} className="px-3 py-1.5 bg-accent-cyan text-surface-900 text-sm rounded-sm hover:shadow-[0_0_8px_rgba(0,229,255,0.3)]">+ New Template</button>
          <button onClick={() => setShowInstanceForm(!showInstanceForm)} className="px-3 py-1.5 bg-accent-cyan text-surface-900 text-sm rounded-sm hover:shadow-[0_0_8px_rgba(0,229,255,0.3)]">+ New Instance</button>
        </div>

        {showTemplateForm && (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createTemplate.mutate({ name: fd.get('name'), role: fd.get('role'), systemPrompt: fd.get('systemPrompt') }); }} className="mb-6 p-4 border border-border-600 rounded-sm space-y-3 bg-surface-900">
            <input name="name" placeholder="Template name" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
            <input name="role" placeholder="Role" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
            <textarea name="systemPrompt" placeholder="System prompt" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm h-24 border border-border-600 focus:border-accent-cyan focus:outline-none" required />
            <button type="submit" className="px-3 py-1.5 bg-accent-green text-surface-900 text-sm rounded-sm hover:shadow-[0_0_8px_rgba(57,255,20,0.3)]">Create</button>
          </form>
        )}

        {showInstanceForm && projectId && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createInstance.mutate({
                name: instanceName,
                role: selectedTemplate?.role,
                systemPrompt: selectedTemplate?.systemPrompt,
                template: { connect: { id: selectedTemplateId } },
              });
            }}
            className="mb-6 p-4 border border-border-600 rounded-sm space-y-3 bg-surface-900"
          >
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none"
              required
            >
              <option value="">Select template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="Instance name"
              className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none"
              required
            />
            {selectedTemplate && (
              <div className="text-xs text-txt-secondary space-y-1 border border-border-600 rounded-sm p-3 bg-surface-800">
                <div><span className="text-txt-primary">Role:</span> {selectedTemplate.role}</div>
                <div><span className="text-txt-primary">System prompt:</span> {selectedTemplate.systemPrompt}</div>
              </div>
            )}
            <button type="submit" className="px-3 py-1.5 bg-accent-green text-surface-900 text-sm rounded-sm hover:shadow-[0_0_8px_rgba(57,255,20,0.3)]">
              Create
            </button>
          </form>
        )}

        <h3 className="text-sm font-medium text-txt-secondary mb-3">TEMPLATES</h3>
        <div className="space-y-2 mb-8">
          {templates.map((t) => (
            <div key={t.id} className="p-3 border border-border-600 rounded-sm bg-surface-900 hover:border-accent-cyan transition-colors">
              <div className="font-medium text-txt-primary">{t.name}</div>
              <span className={`inline-block px-2 py-0.5 text-[10px] rounded-sm border mt-1 ${roleBadgeColors[t.role] || 'bg-surface-700 text-txt-secondary border-border-600'}`}>
                {t.role}
              </span>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-medium text-txt-secondary mb-3">INSTANCES</h3>
        <div className="space-y-2">
          {instances.map((inst) => (
            <div key={inst.id} className="p-3 border border-border-600 rounded-sm bg-surface-900 hover:border-accent-cyan transition-colors flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${statusColors[inst.status] || 'bg-txt-secondary'} ${statusAnimations[inst.status] || ''}`} />
              <div>
                <div className="font-medium text-sm text-txt-primary">{inst.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-sm border ${roleBadgeColors[inst.role] || 'bg-surface-700 text-txt-secondary border-border-600'}`}>
                    {inst.role}
                  </span>
                  <span className="text-xs text-txt-secondary">{inst.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
