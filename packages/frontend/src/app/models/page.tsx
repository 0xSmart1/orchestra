'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useState } from 'react';

interface ModelProvider {
  id: string;
  name: string;
  baseUrl: string;
  authType: string;
  encryptedSecretRef: string | null;
  profiles?: ModelProfile[];
}

interface ModelProfile {
  id: string;
  name: string;
  providerId: string;
  modelName: string;
  endpoint: string | null;
  fallbackProfileId: string | null;
  budgetLimit: number | null;
  budgetUsed: number;
  rateLimitRpm: number | null;
  contextLimitTokens: number | null;
  provider?: ModelProvider;
}

function envKeyName(name: string): string {
  return `LLM_API_KEY_${name.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
}

function BudgetBar({ used, limit }: { used: number; limit: number | null }) {
  if (!limit) return <span className="text-xs text-txt-secondary font-mono">No budget set</span>;
  const pct = Math.min((used / limit) * 100, 100);
  // gradient: green -> amber -> magenta based on %
  const barColor =
    pct > 90
      ? 'bg-accent-magenta'
      : pct > 60
        ? 'bg-accent-amber'
        : 'bg-accent-green';
  const glowColor =
    pct > 90
      ? 'shadow-[0_0_6px_rgba(255,0,128,0.4)]'
      : pct > 60
        ? 'shadow-[0_0_6px_rgba(255,170,0,0.4)]'
        : 'shadow-[0_0_6px_rgba(57,255,20,0.4)]';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-700 rounded-sm overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-sm ${glowColor} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-txt-secondary font-mono">${used.toFixed(3)} / ${limit}</span>
    </div>
  );
}

export default function ModelsPage() {
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'provider' | 'profile'; id: string; name: string } | null>(null);
  const qc = useQueryClient();

  const { data: providers = [] } = useQuery({
    queryKey: ['model-providers'],
    queryFn: () => apiFetch<ModelProvider[]>('/models/providers'),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['model-profiles'],
    queryFn: () => apiFetch<ModelProfile[]>('/models/profiles'),
  });

  const providerMap = Object.fromEntries(providers.map((p) => [p.id, p.name]));

  const createProvider = useMutation({
    mutationFn: (data: any) => apiFetch('/models/providers', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['model-providers'] }); setShowProviderForm(false); },
  });

  const updateProvider = useMutation({
    mutationFn: ({ id, ...data }: any) => apiFetch(`/models/providers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['model-providers'] }); setEditingProviderId(null); },
  });

  const removeProvider = useMutation({
    mutationFn: (id: string) => apiFetch(`/models/providers/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['model-providers'] }); qc.invalidateQueries({ queryKey: ['model-profiles'] }); setDeleteTarget(null); },
  });

  const createProfile = useMutation({
    mutationFn: (data: any) => apiFetch('/models/profiles', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['model-profiles'] }); setShowProfileForm(false); },
  });

  const updateProfile = useMutation({
    mutationFn: ({ id, ...data }: any) => apiFetch(`/models/profiles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['model-profiles'] }); setEditingProfileId(null); },
  });

  const removeProfile = useMutation({
    mutationFn: (id: string) => apiFetch(`/models/profiles/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['model-profiles'] }); setDeleteTarget(null); },
  });

  return (
    <>
      <Header title="Models" />
      <div className="p-6 max-w-4xl font-mono">
        {/* --- Delete confirmation modal --- */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-surface-800 p-6 rounded-sm border border-border-500 space-y-4 w-80 shadow-[0_0_20px_rgba(255,0,128,0.15)]">
              <p className="text-sm text-txt-primary">Delete {deleteTarget.type} <span className="font-bold text-accent-magenta">{deleteTarget.name}</span>?</p>
              <div className="flex gap-2">
                <button onClick={() => {
                  if (deleteTarget.type === 'provider') removeProvider.mutate(deleteTarget.id);
                  else removeProfile.mutate(deleteTarget.id);
                }} className="px-3 py-1.5 bg-accent-magenta text-surface-900 text-sm rounded-sm font-mono hover:shadow-[0_0_8px_rgba(255,0,128,0.3)]">Delete</button>
                <button onClick={() => setDeleteTarget(null)} className="px-3 py-1.5 text-txt-secondary text-sm border border-border-600 rounded-sm hover:bg-surface-700">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* --- Providers --- */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-txt-secondary font-mono">PROVIDERS</h2>
          <button onClick={() => { setShowProviderForm(!showProviderForm); setEditingProviderId(null); }} className="px-3 py-1.5 bg-accent-cyan text-surface-900 text-sm rounded-sm font-mono hover:shadow-[0_0_8px_rgba(0,229,255,0.3)]">
            + Add Provider
          </button>
        </div>

        {showProviderForm && (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createProvider.mutate({ name: fd.get('name'), baseUrl: fd.get('baseUrl'), authType: fd.get('authType') || 'api_key' }); }} className="mb-4 p-4 border border-border-600 rounded-sm space-y-3 bg-surface-900">
            <input name="name" placeholder="Provider name (e.g. OpenAI)" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
            <input name="baseUrl" placeholder="Base URL (e.g. https://api.openai.com)" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
            <select name="authType" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none">
              <option value="api_key">API Key</option>
              <option value="oauth">OAuth</option>
            </select>
            <p className="text-xs text-accent-amber">Env key: LLM_API_KEY_&lt;NAME&gt;</p>
            <button type="submit" className="px-3 py-1.5 bg-accent-green text-surface-900 text-sm rounded-sm font-mono hover:shadow-[0_0_8px_rgba(57,255,20,0.3)]">Create</button>
          </form>
        )}

        <div className="space-y-2 mb-8">
          {providers.map((p) => (
            <div key={p.id} className="p-3 border border-border-600 rounded-sm bg-surface-900 hover:border-accent-cyan transition-colors">
              {editingProviderId === p.id ? (
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); updateProvider.mutate({ id: p.id, name: fd.get('name'), baseUrl: fd.get('baseUrl'), authType: fd.get('authType') }); }} className="space-y-2">
                  <input name="name" defaultValue={p.name} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
                  <input name="baseUrl" defaultValue={p.baseUrl} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
                  <select name="authType" defaultValue={p.authType} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none">
                    <option value="api_key">API Key</option>
                    <option value="oauth">OAuth</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1 bg-accent-green text-surface-900 text-xs rounded-sm font-mono hover:shadow-[0_0_8px_rgba(57,255,20,0.3)]">Save</button>
                    <button type="button" onClick={() => setEditingProviderId(null)} className="px-3 py-1 text-txt-secondary text-xs border border-border-600 rounded-sm hover:bg-surface-700">Cancel</button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm text-txt-primary">{p.name}</span>
                      <span className="text-xs text-txt-secondary ml-2">{p.baseUrl}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingProviderId(p.id); setShowProviderForm(false); }} className="px-2 py-0.5 text-xs text-txt-secondary border border-border-600 rounded-sm hover:bg-surface-700 hover:border-accent-cyan">Edit</button>
                      <button onClick={() => setDeleteTarget({ type: 'provider', id: p.id, name: p.name })} className="px-2 py-0.5 text-xs text-accent-magenta border border-border-600 rounded-sm hover:bg-accent-magenta/10">Del</button>
                    </div>
                  </div>
                  <div className="text-xs text-txt-secondary mt-1">
                    {p.authType} <span className="text-border-500">|</span> Secret: <span className={p.encryptedSecretRef ? 'text-accent-amber' : 'text-txt-secondary'}>{p.encryptedSecretRef ? '****' : 'Not set'}</span> <span className="text-border-500">|</span> Env: <code className="text-accent-amber">{envKeyName(p.name)}</code>
                  </div>
                </div>
              )}
            </div>
          ))}
          {providers.length === 0 && <p className="text-xs text-txt-secondary text-center py-4">No providers yet</p>}
        </div>

        {/* --- Profiles --- */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-txt-secondary font-mono">PROFILES</h2>
          <button onClick={() => { setShowProfileForm(!showProfileForm); setEditingProfileId(null); }} disabled={providers.length === 0} className="px-3 py-1.5 bg-accent-cyan text-surface-900 text-sm rounded-sm font-mono hover:shadow-[0_0_8px_rgba(0,229,255,0.3)] disabled:opacity-50">
            + Add Profile
          </button>
        </div>

        {showProfileForm && (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createProfile.mutate({ name: fd.get('name'), providerId: fd.get('providerId'), modelName: fd.get('modelName'), endpoint: fd.get('endpoint') || undefined, budgetLimit: fd.get('budgetLimit') ? Number(fd.get('budgetLimit')) : undefined, rateLimitRpm: fd.get('rateLimitRpm') ? Number(fd.get('rateLimitRpm')) : undefined, contextLimitTokens: fd.get('contextLimitTokens') ? Number(fd.get('contextLimitTokens')) : undefined }); }} className="mb-4 p-4 border border-border-600 rounded-sm space-y-3 bg-surface-900">
            <input name="name" placeholder="Profile name (e.g. GPT-4 Default)" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
            <select name="providerId" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required>
              <option value="">Select provider...</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input name="modelName" placeholder="Model name (e.g. gpt-4)" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
            <input name="endpoint" placeholder="Custom endpoint (optional)" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" />
            <div className="grid grid-cols-3 gap-2">
              <input name="budgetLimit" type="number" step="0.01" placeholder="Budget $" className="bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" />
              <input name="rateLimitRpm" type="number" placeholder="RPM limit" className="bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" />
              <input name="contextLimitTokens" type="number" placeholder="Ctx tokens" className="bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" />
            </div>
            <button type="submit" className="px-3 py-1.5 bg-accent-green text-surface-900 text-sm rounded-sm font-mono hover:shadow-[0_0_8px_rgba(57,255,20,0.3)]">Create</button>
          </form>
        )}

        <div className="space-y-2">
          {profiles.map((p) => (
            <div key={p.id} className="p-3 border border-border-600 rounded-sm bg-surface-900 hover:border-accent-cyan transition-colors">
              {editingProfileId === p.id ? (
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); updateProfile.mutate({ id: p.id, name: fd.get('name'), modelName: fd.get('modelName'), providerId: fd.get('providerId'), endpoint: fd.get('endpoint') || undefined, budgetLimit: fd.get('budgetLimit') ? Number(fd.get('budgetLimit')) : undefined, rateLimitRpm: fd.get('rateLimitRpm') ? Number(fd.get('rateLimitRpm')) : undefined, contextLimitTokens: fd.get('contextLimitTokens') ? Number(fd.get('contextLimitTokens')) : undefined }); }} className="space-y-2">
                  <input name="name" defaultValue={p.name} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
                  <select name="providerId" defaultValue={p.providerId} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required>
                    {providers.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                  </select>
                  <input name="modelName" defaultValue={p.modelName} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" required />
                  <input name="endpoint" defaultValue={p.endpoint || ''} placeholder="Custom endpoint" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" />
                  <div className="grid grid-cols-3 gap-2">
                    <input name="budgetLimit" type="number" step="0.01" defaultValue={p.budgetLimit ?? ''} placeholder="Budget $" className="bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" />
                    <input name="rateLimitRpm" type="number" defaultValue={p.rateLimitRpm ?? ''} placeholder="RPM" className="bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" />
                    <input name="contextLimitTokens" type="number" defaultValue={p.contextLimitTokens ?? ''} placeholder="Ctx" className="bg-surface-800 text-txt-primary px-3 py-2 rounded-sm text-sm border border-border-600 focus:border-accent-cyan focus:outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1 bg-accent-green text-surface-900 text-xs rounded-sm font-mono hover:shadow-[0_0_8px_rgba(57,255,20,0.3)]">Save</button>
                    <button type="button" onClick={() => setEditingProfileId(null)} className="px-3 py-1 text-txt-secondary text-xs border border-border-600 rounded-sm hover:bg-surface-700">Cancel</button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm text-txt-secondary">{p.name}</span>
                      <span className="text-base font-bold text-accent-cyan ml-2">{p.modelName}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingProfileId(p.id); setShowProfileForm(false); }} className="px-2 py-0.5 text-xs text-txt-secondary border border-border-600 rounded-sm hover:bg-surface-700 hover:border-accent-cyan">Edit</button>
                      <button onClick={() => setDeleteTarget({ type: 'profile', id: p.id, name: p.name })} className="px-2 py-0.5 text-xs text-accent-magenta border border-border-600 rounded-sm hover:bg-accent-magenta/10">Del</button>
                    </div>
                  </div>
                  <div className="text-xs text-txt-secondary mt-1">
                    Provider: <span className="text-txt-primary">{providerMap[p.providerId] || p.providerId}</span>
                    {p.rateLimitRpm && ` <span className="text-border-500">|</span> ${p.rateLimitRpm} RPM`}
                    {p.contextLimitTokens && ` <span className="text-border-500">|</span> ${p.contextLimitTokens} ctx`}
                  </div>
                  <div className="mt-2">
                    <BudgetBar used={p.budgetUsed} limit={p.budgetLimit} />
                  </div>
                </div>
              )}
            </div>
          ))}
          {profiles.length === 0 && <p className="text-xs text-txt-secondary text-center py-4">No profiles yet</p>}
        </div>
      </div>
    </>
  );
}
