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
  if (!limit) return <span className="text-xs text-gray-500">No budget set</span>;
  const pct = Math.min((used / limit) * 100, 100);
  const color = pct > 90 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-700 rounded overflow-hidden">
        <div className={`h-full ${color} rounded`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400">${used.toFixed(3)} / ${limit}</span>
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
      <div className="p-6 max-w-4xl">
        {/* --- Delete confirmation modal --- */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4 w-80">
              <p className="text-sm text-gray-200">Delete {deleteTarget.type} <span className="font-bold">{deleteTarget.name}</span>?</p>
              <div className="flex gap-2">
                <button onClick={() => {
                  if (deleteTarget.type === 'provider') removeProvider.mutate(deleteTarget.id);
                  else removeProfile.mutate(deleteTarget.id);
                }} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700">Delete</button>
                <button onClick={() => setDeleteTarget(null)} className="px-3 py-1.5 text-gray-400 text-sm border border-gray-700 rounded hover:bg-gray-700">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* --- Providers --- */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-400">Providers</h2>
          <button onClick={() => { setShowProviderForm(!showProviderForm); setEditingProviderId(null); }} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            Add Provider
          </button>
        </div>

        {showProviderForm && (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createProvider.mutate({ name: fd.get('name'), baseUrl: fd.get('baseUrl'), authType: fd.get('authType') || 'api_key' }); }} className="mb-4 p-4 border border-gray-800 rounded-lg space-y-3">
            <input name="name" placeholder="Provider name (e.g. OpenAI)" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
            <input name="baseUrl" placeholder="Base URL (e.g. https://api.openai.com)" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
            <select name="authType" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm">
              <option value="api_key">API Key</option>
              <option value="oauth">OAuth</option>
            </select>
            <p className="text-xs text-gray-500">Env key will be: LLM_API_KEY_&lt;NAME&gt;</p>
            <button type="submit" className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">Create</button>
          </form>
        )}

        <div className="space-y-2 mb-8">
          {providers.map((p) => (
            <div key={p.id} className="p-3 border border-gray-800 rounded-lg">
              {editingProviderId === p.id ? (
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); updateProvider.mutate({ id: p.id, name: fd.get('name'), baseUrl: fd.get('baseUrl'), authType: fd.get('authType') }); }} className="space-y-2">
                  <input name="name" defaultValue={p.name} className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
                  <input name="baseUrl" defaultValue={p.baseUrl} className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
                  <select name="authType" defaultValue={p.authType} className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm">
                    <option value="api_key">API Key</option>
                    <option value="oauth">OAuth</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Save</button>
                    <button type="button" onClick={() => setEditingProviderId(null)} className="px-3 py-1 text-gray-400 text-xs border border-gray-700 rounded hover:bg-gray-700">Cancel</button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{p.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{p.baseUrl}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingProviderId(p.id); setShowProviderForm(false); }} className="px-2 py-0.5 text-xs text-gray-400 border border-gray-700 rounded hover:bg-gray-700">Edit</button>
                      <button onClick={() => setDeleteTarget({ type: 'provider', id: p.id, name: p.name })} className="px-2 py-0.5 text-xs text-red-400 border border-gray-700 rounded hover:bg-red-900">Del</button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {p.authType} · Secret: {p.encryptedSecretRef ? '••••' : 'Not set'} · Env: <code className="text-gray-400">{envKeyName(p.name)}</code>
                  </div>
                </div>
              )}
            </div>
          ))}
          {providers.length === 0 && <p className="text-xs text-gray-600 text-center py-4">No providers yet</p>}
        </div>

        {/* --- Profiles --- */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-400">Profiles</h2>
          <button onClick={() => { setShowProfileForm(!showProfileForm); setEditingProfileId(null); }} disabled={providers.length === 0} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
            Add Profile
          </button>
        </div>

        {showProfileForm && (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createProfile.mutate({ name: fd.get('name'), providerId: fd.get('providerId'), modelName: fd.get('modelName'), endpoint: fd.get('endpoint') || undefined, budgetLimit: fd.get('budgetLimit') ? Number(fd.get('budgetLimit')) : undefined, rateLimitRpm: fd.get('rateLimitRpm') ? Number(fd.get('rateLimitRpm')) : undefined, contextLimitTokens: fd.get('contextLimitTokens') ? Number(fd.get('contextLimitTokens')) : undefined }); }} className="mb-4 p-4 border border-gray-800 rounded-lg space-y-3">
            <input name="name" placeholder="Profile name (e.g. GPT-4 Default)" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
            <select name="providerId" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required>
              <option value="">Select provider...</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input name="modelName" placeholder="Model name (e.g. gpt-4)" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
            <input name="endpoint" placeholder="Custom endpoint (optional)" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" />
            <div className="grid grid-cols-3 gap-2">
              <input name="budgetLimit" type="number" step="0.01" placeholder="Budget $" className="bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" />
              <input name="rateLimitRpm" type="number" placeholder="RPM limit" className="bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" />
              <input name="contextLimitTokens" type="number" placeholder="Ctx tokens" className="bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" />
            </div>
            <button type="submit" className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">Create</button>
          </form>
        )}

        <div className="space-y-2">
          {profiles.map((p) => (
            <div key={p.id} className="p-3 border border-gray-800 rounded-lg">
              {editingProfileId === p.id ? (
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); updateProfile.mutate({ id: p.id, name: fd.get('name'), modelName: fd.get('modelName'), providerId: fd.get('providerId'), endpoint: fd.get('endpoint') || undefined, budgetLimit: fd.get('budgetLimit') ? Number(fd.get('budgetLimit')) : undefined, rateLimitRpm: fd.get('rateLimitRpm') ? Number(fd.get('rateLimitRpm')) : undefined, contextLimitTokens: fd.get('contextLimitTokens') ? Number(fd.get('contextLimitTokens')) : undefined }); }} className="space-y-2">
                  <input name="name" defaultValue={p.name} className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
                  <select name="providerId" defaultValue={p.providerId} className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required>
                    {providers.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                  </select>
                  <input name="modelName" defaultValue={p.modelName} className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
                  <input name="endpoint" defaultValue={p.endpoint || ''} placeholder="Custom endpoint" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" />
                  <div className="grid grid-cols-3 gap-2">
                    <input name="budgetLimit" type="number" step="0.01" defaultValue={p.budgetLimit ?? ''} placeholder="Budget $" className="bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" />
                    <input name="rateLimitRpm" type="number" defaultValue={p.rateLimitRpm ?? ''} placeholder="RPM" className="bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" />
                    <input name="contextLimitTokens" type="number" defaultValue={p.contextLimitTokens ?? ''} placeholder="Ctx" className="bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Save</button>
                    <button type="button" onClick={() => setEditingProfileId(null)} className="px-3 py-1 text-gray-400 text-xs border border-gray-700 rounded hover:bg-gray-700">Cancel</button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{p.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{p.modelName}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingProfileId(p.id); setShowProfileForm(false); }} className="px-2 py-0.5 text-xs text-gray-400 border border-gray-700 rounded hover:bg-gray-700">Edit</button>
                      <button onClick={() => setDeleteTarget({ type: 'profile', id: p.id, name: p.name })} className="px-2 py-0.5 text-xs text-red-400 border border-gray-700 rounded hover:bg-red-900">Del</button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Provider: {providerMap[p.providerId] || p.providerId}
                    {p.rateLimitRpm && ` · ${p.rateLimitRpm} RPM`}
                    {p.contextLimitTokens && ` · ${p.contextLimitTokens} ctx`}
                  </div>
                  <div className="mt-2">
                    <BudgetBar used={p.budgetUsed} limit={p.budgetLimit} />
                  </div>
                </div>
              )}
            </div>
          ))}
          {profiles.length === 0 && <p className="text-xs text-gray-600 text-center py-4">No profiles yet</p>}
        </div>
      </div>
    </>
  );
}
