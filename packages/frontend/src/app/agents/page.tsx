'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
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
  systemPrompt: string;
  modelProfileId: string | null;
  memoryPath: string | null;
  currentTaskId: string | null;
}

interface ModelProfile {
  id: string;
  name: string;
  modelName: string;
}

const ROLE_OPTIONS = ['orchestrator', 'backend', 'frontend', 'qa', 'devops', 'reviewer', 'worker', 'custom'];

export default function AgentsPage() {
  const { projectId } = useProject();
  const qc = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['agent-templates'],
    queryFn: () => apiFetch<AgentTemplate[]>('/agents/templates'),
  });

  const { data: instances = [] } = useQuery({
    queryKey: ['agent-instances', projectId],
    queryFn: () =>
      apiFetch<AgentInstance[]>(`/agents/instances?projectId=${projectId || ''}`),
    enabled: !!projectId,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['model-profiles'],
    queryFn: () => apiFetch<ModelProfile[]>('/models/profiles'),
  });

  const selectedAgent = useMemo(
    () => instances.find((agent) => agent.id === selectedAgentId) ?? null,
    [instances, selectedAgentId],
  );

  const createTemplate = useMutation({
    mutationFn: (data: Record<string, FormDataEntryValue | null>) =>
      apiFetch('/agents/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-templates'] });
      setShowTemplateForm(false);
    },
  });

  const createAgent = useMutation({
    mutationFn: (data: {
      name: string;
      role: string;
      systemPrompt: string;
      templateId?: string;
      modelProfileId?: string;
    }) =>
      apiFetch<AgentInstance>('/agents/instances', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          role: data.role,
          systemPrompt: data.systemPrompt,
          project: { connect: { id: projectId } },
          ...(data.templateId ? { template: { connect: { id: data.templateId } } } : {}),
          ...(data.modelProfileId
            ? { modelProfile: { connect: { id: data.modelProfileId } } }
            : {}),
        }),
      }),
    onSuccess: (agent) => {
      qc.invalidateQueries({ queryKey: ['agent-instances', projectId] });
      setSelectedAgentId(agent.id);
      setShowNewAgent(false);
    },
  });

  const updateAgent = useMutation({
    mutationFn: (vars: {
      id: string;
      name: string;
      role: string;
      systemPrompt: string;
      modelProfileId: string;
    }) =>
      apiFetch(`/agents/instances/${vars.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: vars.name,
          role: vars.role,
          systemPrompt: vars.systemPrompt,
          modelProfile: vars.modelProfileId
            ? { connect: { id: vars.modelProfileId } }
            : { disconnect: true },
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-instances', projectId] }),
  });

  const deleteAgent = useMutation({
    mutationFn: (id: string) => apiFetch(`/agents/instances/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['agent-instances', projectId] });
      if (selectedAgentId === id) setSelectedAgentId(null);
    },
  });

  if (!projectId) {
    return (
      <>
        <Header title="Agents" />
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <p className="text-sm text-txt-secondary">Select a project to manage agents.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Agents" />
      <div className="grid h-[calc(100vh-3rem)] grid-cols-[minmax(0,1fr)_360px] gap-0">
        <main className="overflow-y-auto p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-txt-secondary">{instances.length} project agents</p>
              <h3 className="text-lg font-semibold text-txt-primary">Agent roster</h3>
            </div>
            <button
              onClick={() => setShowNewAgent((v) => !v)}
              className="rounded-lg bg-accent-amber px-3 py-2 text-sm text-surface-900 hover:opacity-90"
            >
              New Agent
            </button>
          </div>

          {showNewAgent && (
            <AgentForm
              title="Create agent"
              templates={templates}
              profiles={profiles}
              onSubmit={(data) => createAgent.mutate(data)}
              submitLabel="Create"
            />
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {instances.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedAgentId === agent.id
                    ? 'border-accent-amber bg-surface-800'
                    : 'border-border-600 bg-surface-900 hover:border-border-400'
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-txt-primary">{agent.name}</h4>
                    <p className="text-xs text-txt-secondary">{agent.role}</p>
                  </div>
                  <StatusBadge status={agent.status} />
                </div>
                <p className="line-clamp-3 text-xs leading-5 text-txt-secondary">
                  {agent.systemPrompt}
                </p>
              </button>
            ))}
          </div>

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-txt-primary">Templates</h3>
              <button
                onClick={() => setShowTemplateForm((v) => !v)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-txt-secondary hover:bg-surface-hover hover:text-txt-primary"
              >
                New Template
              </button>
            </div>
            {showTemplateForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  createTemplate.mutate({
                    name: fd.get('name'),
                    role: fd.get('role'),
                    systemPrompt: fd.get('systemPrompt'),
                  });
                }}
                className="mb-3 rounded-lg border border-border-600 bg-surface-900 p-4 space-y-3"
              >
                <input name="name" placeholder="Template name" required className="w-full rounded-md px-3 py-2 text-sm" />
                <input name="role" placeholder="Role" required className="w-full rounded-md px-3 py-2 text-sm" />
                <textarea name="systemPrompt" placeholder="System prompt" required className="h-24 w-full rounded-md px-3 py-2 text-sm" />
                <button className="rounded-lg bg-accent-green px-3 py-1.5 text-sm text-surface-900">Create</button>
              </form>
            )}
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => (
                <div key={template.id} className="rounded-lg border border-border-600 bg-surface-900 p-3">
                  <p className="text-sm font-medium text-txt-primary">{template.name}</p>
                  <p className="text-xs text-accent-amber">{template.role}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="border-l border-border bg-surface p-5 overflow-y-auto">
          {!selectedAgent ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-txt-secondary">
              Select an agent to edit name, role, model, and prompt.
            </div>
          ) : (
            <EditAgentPanel
              agent={selectedAgent}
              profiles={profiles}
              onSave={(data) => updateAgent.mutate({ id: selectedAgent.id, ...data })}
              onDelete={() => {
                if (confirm(`Delete agent "${selectedAgent.name}"?`)) {
                  deleteAgent.mutate(selectedAgent.id);
                }
              }}
            />
          )}
        </aside>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-txt-secondary/15 text-txt-secondary',
    thinking: 'bg-accent-amber/15 text-accent-amber',
    coding: 'bg-accent-green/15 text-accent-green',
    testing: 'bg-accent-amber/15 text-accent-amber',
    reviewing: 'bg-accent-purple/15 text-accent-purple',
    blocked: 'bg-red-500/15 text-red-300',
    done: 'bg-accent-green/15 text-accent-green',
  };
  return (
    <span className={`rounded-md px-2 py-1 text-[11px] ${colors[status] ?? colors.idle}`}>
      {status}
    </span>
  );
}

function AgentForm({
  title,
  templates,
  profiles,
  onSubmit,
  submitLabel,
}: {
  title: string;
  templates: AgentTemplate[];
  profiles: ModelProfile[];
  onSubmit: (data: { name: string; role: string; systemPrompt: string; templateId?: string; modelProfileId?: string }) => void;
  submitLabel: string;
}) {
  const [templateId, setTemplateId] = useState('');
  const selectedTemplate = templates.find((template) => template.id === templateId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSubmit({
          name: String(fd.get('name') ?? ''),
          role: String(fd.get('role') ?? selectedTemplate?.role ?? 'worker'),
          systemPrompt: String(fd.get('systemPrompt') ?? selectedTemplate?.systemPrompt ?? ''),
          templateId: templateId || undefined,
          modelProfileId: String(fd.get('modelProfileId') ?? '') || undefined,
        });
      }}
      className="mb-5 rounded-lg border border-border-600 bg-surface-900 p-4 space-y-3"
    >
      <h4 className="text-sm font-semibold text-txt-primary">{title}</h4>
      <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
        <option value="">No template</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>{template.name}</option>
        ))}
      </select>
      <input name="name" placeholder="Agent name" required className="w-full rounded-md px-3 py-2 text-sm" />
      <select name="role" defaultValue={selectedTemplate?.role ?? 'worker'} className="w-full rounded-md px-3 py-2 text-sm">
        {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
      </select>
      <select name="modelProfileId" className="w-full rounded-md px-3 py-2 text-sm">
        <option value="">Use project default model</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>{profile.name} ({profile.modelName})</option>
        ))}
      </select>
      <textarea
        name="systemPrompt"
        placeholder="System prompt"
        defaultValue={selectedTemplate?.systemPrompt ?? ''}
        required
        className="h-28 w-full rounded-md px-3 py-2 text-sm"
      />
      <button className="rounded-lg bg-accent-amber px-3 py-2 text-sm text-surface-900">
        {submitLabel}
      </button>
    </form>
  );
}

function EditAgentPanel({
  agent,
  profiles,
  onSave,
  onDelete,
}: {
  agent: AgentInstance;
  profiles: ModelProfile[];
  onSave: (data: { name: string; role: string; systemPrompt: string; modelProfileId: string }) => void;
  onDelete: () => void;
}) {
  return (
    <form
      key={agent.id}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSave({
          name: String(fd.get('name') ?? ''),
          role: String(fd.get('role') ?? ''),
          systemPrompt: String(fd.get('systemPrompt') ?? ''),
          modelProfileId: String(fd.get('modelProfileId') ?? ''),
        });
      }}
      className="space-y-4"
    >
      <div>
        <p className="text-xs uppercase tracking-wider text-txt-secondary">Editing</p>
        <h3 className="text-lg font-semibold text-txt-primary">{agent.name}</h3>
      </div>
      <label className="block space-y-1 text-xs text-txt-secondary">
        Name
        <input name="name" defaultValue={agent.name} required className="w-full rounded-md px-3 py-2 text-sm" />
      </label>
      <label className="block space-y-1 text-xs text-txt-secondary">
        Role
        <select name="role" defaultValue={agent.role} className="w-full rounded-md px-3 py-2 text-sm">
          {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
      </label>
      <label className="block space-y-1 text-xs text-txt-secondary">
        Model Profile
        <select name="modelProfileId" defaultValue={agent.modelProfileId ?? ''} className="w-full rounded-md px-3 py-2 text-sm">
          <option value="">Use project default</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>{profile.name} ({profile.modelName})</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-xs text-txt-secondary">
        System Prompt
        <textarea name="systemPrompt" defaultValue={agent.systemPrompt} required className="h-44 w-full rounded-md px-3 py-2 text-sm leading-6" />
      </label>
      <div className="rounded-lg border border-border-600 bg-surface-900 p-3 text-xs text-txt-secondary space-y-1">
        <div>Status: <span className="text-txt-primary">{agent.status}</span></div>
        <div>Current task: <span className="text-txt-primary">{agent.currentTaskId ?? 'none'}</span></div>
        <div>Memory: <span className="text-txt-primary">{agent.memoryPath ?? 'not linked'}</span></div>
      </div>
      <div className="flex gap-2">
        <button className="rounded-lg bg-accent-amber px-3 py-2 text-sm text-surface-900" type="submit">
          Save
        </button>
        <button
          className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
          type="button"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </form>
  );
}
