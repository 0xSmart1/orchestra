'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useState } from 'react';

interface ModelProvider { id: string; name: string; baseUrl: string; authType: string; profiles?: ModelProfile[]; }
interface ModelProfile { id: string; name: string; modelName: string; providerId: string; provider?: ModelProvider; }

export default function ModelsPage() {
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const qc = useQueryClient();

  const { data: providers = [] } = useQuery({
    queryKey: ['model-providers'],
    queryFn: () => apiFetch<ModelProvider[]>('/models/providers'),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['model-profiles'],
    queryFn: () => apiFetch<ModelProfile[]>('/models/profiles'),
  });

  const createProvider = useMutation({
    mutationFn: (data: any) => apiFetch('/models/providers', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['model-providers'] }); setShowProviderForm(false); },
  });

  const createProfile = useMutation({
    mutationFn: (data: any) => apiFetch('/models/profiles', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['model-profiles'] }); setShowProfileForm(false); },
  });

  return (
    <>
      <Header title="Models" />
      <div className="p-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setShowProviderForm(!showProviderForm)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Add Provider</button>
          <button onClick={() => setShowProfileForm(!showProfileForm)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Add Profile</button>
        </div>

        {showProviderForm && (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createProvider.mutate({ name: fd.get('name'), baseUrl: fd.get('baseUrl'), authType: fd.get('authType') || 'api_key' }); }} className="mb-6 p-4 border border-gray-800 rounded-lg space-y-3">
            <input name="name" placeholder="Provider name (e.g. OpenAI)" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
            <input name="baseUrl" placeholder="Base URL" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm" required />
            <select name="authType" className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm">
              <option value="api_key">API Key</option>
              <option value="oauth">OAuth</option>
            </select>
            <button type="submit" className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">Create</button>
          </form>
        )}

        <h3 className="text-sm font-medium text-gray-400 mb-3">Providers</h3>
        <div className="space-y-2 mb-8">
          {providers.map((p) => (
            <div key={p.id} className="p-3 border border-gray-800 rounded-lg">
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">{p.baseUrl} · {p.authType}</div>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-medium text-gray-400 mb-3">Profiles</h3>
        <div className="space-y-2">
          {profiles.map((p) => (
            <div key={p.id} className="p-3 border border-gray-800 rounded-lg">
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">{p.modelName} · provider: {p.provider?.name || p.providerId}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
