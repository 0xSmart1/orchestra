'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useI18n } from '@/lib/i18n';
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

interface AvailableModel {
  id: string;
  object: string;
  owned_by?: string;
}

function envKeyName(name: string): string {
  return `LLM_API_KEY_${name.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
}

export default function ModelsPage() {
  const { t } = useI18n();
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'provider' | 'profile'; id: string; name: string } | null>(null);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [loadingModels, setLoadingModels] = useState<string | null>(null);
  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['model-profiles'] }); },
  });

  const updateProfile = useMutation({
    mutationFn: ({ id, ...data }: any) => apiFetch(`/models/profiles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['model-profiles'] }); setEditingProfileId(null); },
  });

  const removeProfile = useMutation({
    mutationFn: (id: string) => apiFetch(`/models/profiles/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['model-profiles'] }); setDeleteTarget(null); },
  });

  async function fetchAvailableModels(providerId: string) {
    setLoadingModels(providerId);
    try {
      const models = await apiFetch<AvailableModel[]>(`/models/providers/${providerId}/available-models`);
      setAvailableModels(models);
      setSelectedProviderId(providerId);
      setShowAvailableModal(true);
    } catch {
      setAvailableModels([]);
    } finally {
      setLoadingModels(null);
    }
  }

  function addProfileFromModel(modelId: string) {
    if (!selectedProviderId) return;
    createProfile.mutate({
      name: modelId,
      providerId: selectedProviderId,
      modelName: modelId,
    });
  }

  const existingModelNames = new Set(profiles.map((p) => p.modelName));

  return (
    <>
      <Header title={t('models.title')} />
      <div className="p-6 max-w-4xl">
        {/* Available models modal */}
        {showAvailableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-surface-900 p-6 rounded-lg border border-border-600 space-y-4 w-[480px] max-h-[70vh] overflow-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-txt-primary">{t('models.availableModels')}</h3>
                <button onClick={() => setShowAvailableModal(false)} className="text-txt-secondary hover:text-txt-primary text-lg leading-none">&times;</button>
              </div>
              {availableModels.length === 0 ? (
                <p className="text-xs text-txt-secondary py-4 text-center">{t('models.noModelsFound')}</p>
              ) : (
                <div className="space-y-1">
                  {availableModels.map((m) => {
                    const alreadyAdded = existingModelNames.has(m.id);
                    return (
                      <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-800 hover:bg-surface-hover">
                        <div>
                          <span className="text-sm text-txt-primary">{m.id}</span>
                          {m.owned_by && <span className="text-xs text-txt-secondary ml-2">({m.owned_by})</span>}
                        </div>
                        {alreadyAdded ? (
                          <span className="text-xs text-accent-green">{t('models.added')}</span>
                        ) : (
                          <button
                            onClick={() => addProfileFromModel(m.id)}
                            className="px-2 py-1 text-xs rounded-md bg-accent-amber/15 text-accent-amber hover:bg-accent-amber/25"
                          >
                            + {t('models.addProfile')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-surface-900 p-6 rounded-lg border border-border-600 space-y-4 w-80">
              <p className="text-sm text-txt-primary">{t('models.confirmDelete')} <span className="font-bold text-red-400">{deleteTarget.name}</span>?</p>
              <div className="flex gap-2">
                <button onClick={() => {
                  if (deleteTarget.type === 'provider') removeProvider.mutate(deleteTarget.id);
                  else removeProfile.mutate(deleteTarget.id);
                }} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-500">Delete</button>
                <button onClick={() => setDeleteTarget(null)} className="px-3 py-1.5 text-txt-secondary text-sm border border-border-600 rounded-md hover:bg-surface-hover">{t('chat.cancel')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Providers */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-txt-secondary uppercase tracking-wider">Providers</h2>
          <button onClick={() => { setShowProviderForm(!showProviderForm); setEditingProviderId(null); }} className="px-3 py-1.5 bg-accent-amber text-surface-900 text-sm rounded-md hover:opacity-90">
            + {t('models.addProvider')}
          </button>
        </div>

        {showProviderForm && (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createProvider.mutate({ name: fd.get('name'), baseUrl: fd.get('baseUrl'), authType: fd.get('authType') || 'api_key' }); }} className="mb-4 p-4 border border-border-600 rounded-lg space-y-3 bg-surface-900">
            <input name="name" placeholder={t('models.providerName')} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" required />
            <input name="baseUrl" placeholder={t('models.providerUrl')} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" required />
            <select name="authType" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none">
              <option value="api_key">API Key</option>
              <option value="oauth">OAuth</option>
            </select>
            <p className="text-xs text-txt-secondary">{t('models.envKeyHint')}: <code className="text-accent-amber">{envKeyName('NAME')}</code></p>
            <button type="submit" className="px-3 py-1.5 bg-accent-green text-surface-900 text-sm rounded-md hover:opacity-90">{t('agents.create')}</button>
          </form>
        )}

        <div className="space-y-2 mb-8">
          {providers.map((p) => (
            <div key={p.id} className="p-3 border border-border-600 rounded-lg bg-surface-900 hover:border-accent-amber/40 transition-colors">
              {editingProviderId === p.id ? (
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); updateProvider.mutate({ id: p.id, name: fd.get('name'), baseUrl: fd.get('baseUrl'), authType: fd.get('authType') }); }} className="space-y-2">
                  <input name="name" defaultValue={p.name} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" required />
                  <input name="baseUrl" defaultValue={p.baseUrl} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" required />
                  <select name="authType" defaultValue={p.authType} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none">
                    <option value="api_key">API Key</option>
                    <option value="oauth">OAuth</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1 bg-accent-green text-surface-900 text-xs rounded-md">{t('agents.save')}</button>
                    <button type="button" onClick={() => setEditingProviderId(null)} className="px-3 py-1 text-txt-secondary text-xs border border-border-600 rounded-md hover:bg-surface-hover">{t('chat.cancel')}</button>
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
                      <button
                        onClick={() => fetchAvailableModels(p.id)}
                        disabled={loadingModels === p.id}
                        className="px-2 py-0.5 text-xs text-accent-amber border border-accent-amber/40 rounded-md hover:bg-accent-amber/10 disabled:opacity-50"
                      >
                        {loadingModels === p.id ? '...' : t('models.loadModels')}
                      </button>
                      <button onClick={() => { setEditingProviderId(p.id); setShowProviderForm(false); }} className="px-2 py-0.5 text-xs text-txt-secondary border border-border-600 rounded-md hover:bg-surface-hover">{t('models.edit')}</button>
                      <button onClick={() => setDeleteTarget({ type: 'provider', id: p.id, name: p.name })} className="px-2 py-0.5 text-xs text-red-400 border border-border-600 rounded-md hover:bg-red-400/10">{t('models.del')}</button>
                    </div>
                  </div>
                  <div className="text-xs text-txt-secondary mt-1">
                    {p.authType} | {t('models.secret')}: <span className={p.encryptedSecretRef ? 'text-accent-amber' : 'text-txt-secondary'}>{p.encryptedSecretRef ? '****' : t('models.notSet')}</span> | Env: <code className="text-accent-amber">{envKeyName(p.name)}</code>
                  </div>
                </div>
              )}
            </div>
          ))}
          {providers.length === 0 && <p className="text-xs text-txt-secondary text-center py-4">{t('models.noProviders')}</p>}
        </div>

        {/* Profiles */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-txt-secondary uppercase tracking-wider">Profiles</h2>
          <button onClick={() => { setShowProfileForm(!showProfileForm); setEditingProfileId(null); }} disabled={providers.length === 0} className="px-3 py-1.5 bg-accent-amber text-surface-900 text-sm rounded-md hover:opacity-90 disabled:opacity-50">
            + {t('models.addProfile')}
          </button>
        </div>

        {showProfileForm && (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createProfile.mutate({ name: fd.get('name'), providerId: fd.get('providerId'), modelName: fd.get('modelName'), endpoint: fd.get('endpoint') || undefined, budgetLimit: fd.get('budgetLimit') ? Number(fd.get('budgetLimit')) : undefined, rateLimitRpm: fd.get('rateLimitRpm') ? Number(fd.get('rateLimitRpm')) : undefined, contextLimitTokens: fd.get('contextLimitTokens') ? Number(fd.get('contextLimitTokens')) : undefined }); }} className="mb-4 p-4 border border-border-600 rounded-lg space-y-3 bg-surface-900">
            <input name="name" placeholder={t('models.profileName')} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" required />
            <select name="providerId" className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" required>
              <option value="">{t('models.selectProvider')}</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input name="modelName" placeholder={t('models.modelName')} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" required />
            <input name="endpoint" placeholder={t('models.customEndpoint')} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" />
            <div className="grid grid-cols-3 gap-2">
              <input name="budgetLimit" type="number" step="0.01" placeholder={t('models.budget')} className="bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" />
              <input name="rateLimitRpm" type="number" placeholder="RPM" className="bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" />
              <input name="contextLimitTokens" type="number" placeholder={t('models.ctxTokens')} className="bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" />
            </div>
            <button type="submit" className="px-3 py-1.5 bg-accent-green text-surface-900 text-sm rounded-md hover:opacity-90">{t('agents.create')}</button>
          </form>
        )}

        <div className="space-y-2">
          {profiles.map((p) => (
            <div key={p.id} className="p-3 border border-border-600 rounded-lg bg-surface-900 hover:border-accent-amber/40 transition-colors">
              {editingProfileId === p.id ? (
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); updateProfile.mutate({ id: p.id, name: fd.get('name'), modelName: fd.get('modelName'), providerId: fd.get('providerId'), endpoint: fd.get('endpoint') || undefined, budgetLimit: fd.get('budgetLimit') ? Number(fd.get('budgetLimit')) : undefined, rateLimitRpm: fd.get('rateLimitRpm') ? Number(fd.get('rateLimitRpm')) : undefined, contextLimitTokens: fd.get('contextLimitTokens') ? Number(fd.get('contextLimitTokens')) : undefined }); }} className="space-y-2">
                  <input name="name" defaultValue={p.name} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" required />
                  <select name="providerId" defaultValue={p.providerId} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" required>
                    {providers.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                  </select>
                  <input name="modelName" defaultValue={p.modelName} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" required />
                  <input name="endpoint" defaultValue={p.endpoint || ''} placeholder={t('models.customEndpoint')} className="w-full bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" />
                  <div className="grid grid-cols-3 gap-2">
                    <input name="budgetLimit" type="number" step="0.01" defaultValue={p.budgetLimit ?? ''} placeholder={t('models.budget')} className="bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" />
                    <input name="rateLimitRpm" type="number" defaultValue={p.rateLimitRpm ?? ''} placeholder="RPM" className="bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" />
                    <input name="contextLimitTokens" type="number" defaultValue={p.contextLimitTokens ?? ''} placeholder={t('models.ctxTokens')} className="bg-surface-800 text-txt-primary px-3 py-2 rounded-md text-sm border border-border-600 focus:border-accent-amber focus:outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1 bg-accent-green text-surface-900 text-xs rounded-md">{t('agents.save')}</button>
                    <button type="button" onClick={() => setEditingProfileId(null)} className="px-3 py-1 text-txt-secondary text-xs border border-border-600 rounded-md hover:bg-surface-hover">{t('chat.cancel')}</button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-txt-secondary">{p.name}</span>
                      <span className="text-sm font-bold text-accent-amber ml-2">{p.modelName}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingProfileId(p.id); setShowProfileForm(false); }} className="px-2 py-0.5 text-xs text-txt-secondary border border-border-600 rounded-md hover:bg-surface-hover">{t('models.edit')}</button>
                      <button onClick={() => setDeleteTarget({ type: 'profile', id: p.id, name: p.name })} className="px-2 py-0.5 text-xs text-red-400 border border-border-600 rounded-md hover:bg-red-400/10">{t('models.del')}</button>
                    </div>
                  </div>
                  <div className="text-xs text-txt-secondary mt-1">
                    {t('models.provider')}: <span className="text-txt-primary">{providerMap[p.providerId] || p.providerId}</span>
                    {p.rateLimitRpm && ` | ${p.rateLimitRpm} RPM`}
                    {p.contextLimitTokens && ` | ${p.contextLimitTokens} ctx`}
                  </div>
                  {p.budgetLimit !== null && p.budgetLimit !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-700 rounded-md overflow-hidden">
                          <div
                            className="h-full rounded-md bg-accent-amber transition-all"
                            style={{ width: `${Math.min((p.budgetUsed / p.budgetLimit) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-txt-secondary">${p.budgetUsed.toFixed(3)} / ${p.budgetLimit}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {profiles.length === 0 && <p className="text-xs text-txt-secondary text-center py-4">{t('models.noProfiles')}</p>}
        </div>
      </div>
    </>
  );
}
