'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useState } from 'react';

interface ModelProfile {
  id: string;
  name: string;
  modelName: string;
}

interface AgentInstance {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  modelProfileId: string | null;
  status: string;
}

const ORCHESTRATOR_TOOLS = [
  'create_agent',
  'create_task',
  'run_worker',
  'list_agents',
  'list_tasks',
] as const;

const TOOL_LABELS: Record<string, Record<string, string>> = {
  en: {
    create_agent: 'Create Agent',
    create_task: 'Create Task',
    run_worker: 'Run Worker',
    list_agents: 'List Agents',
    list_tasks: 'List Tasks',
  },
  ru: {
    create_agent: 'Создать агента',
    create_task: 'Создать задачу',
    run_worker: 'Запустить воркера',
    list_agents: 'Список агентов',
    list_tasks: 'Список задач',
  },
};

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const qc = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['model-profiles'],
    queryFn: () => apiFetch<ModelProfile[]>('/models/profiles'),
  });

  // Find orchestrator agent for current project
  const { data: orchestratorAgents = [] } = useQuery({
    queryKey: ['orchestrator-agents'],
    queryFn: () => apiFetch<AgentInstance[]>('/agents/instances?projectId='),
  });

  const orchestrator = orchestratorAgents.find((a) => a.role === 'orchestrator');

  const [enabledTools, setEnabledTools] = useState<Set<string>>(
    new Set(ORCHESTRATOR_TOOLS),
  );

  const [orchestratorPrompt, setOrchestratorPrompt] = useState(
    orchestrator?.systemPrompt ?? '',
  );

  const updateOrchestrator = useMutation({
    mutationFn: (data: { id: string; systemPrompt: string; modelProfileId?: string }) =>
      apiFetch(`/agents/instances/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          systemPrompt: data.systemPrompt,
          ...(data.modelProfileId
            ? { modelProfile: { connect: { id: data.modelProfileId } } }
            : {}),
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orchestrator-agents'] }),
  });

  const toggleTool = (tool: string) => {
    setEnabledTools((prev) => {
      const next = new Set(prev);
      if (next.has(tool)) next.delete(tool);
      else next.add(tool);
      return next;
    });
  };

  const toolLabels = TOOL_LABELS[locale] ?? TOOL_LABELS.en;

  return (
    <>
      <Header title={t('settings.title')} />
      <div className="mx-auto max-w-4xl p-6 space-y-5">
        {/* Workspace Preferences */}
        <section className="rounded-lg border border-border-600 bg-surface-900 p-5">
          <h3 className="text-base font-semibold text-txt-primary">
            {t('settings.workspace')}
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs text-txt-secondary">
              {t('settings.language')}
              <select
                className="w-full rounded-md px-3 py-2 text-sm bg-surface-800 border border-border-600 text-txt-primary"
                value={locale}
                onChange={(e) => setLocale(e.target.value as 'en' | 'ru')}
              >
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-txt-secondary">
              {t('settings.theme')}
              <select
                className="w-full rounded-md px-3 py-2 text-sm bg-surface-800 border border-border-600 text-txt-primary"
                defaultValue="dark"
              >
                <option value="dark">{t('settings.dark')}</option>
                <option value="system">{t('settings.system')}</option>
                <option value="light" disabled>{t('settings.light')}</option>
              </select>
            </label>
          </div>
        </section>

        {/* Model Defaults */}
        <section className="rounded-lg border border-border-600 bg-surface-900 p-5">
          <h3 className="text-base font-semibold text-txt-primary">
            {t('settings.modelDefaults')}
          </h3>
          <div className="mt-4 grid gap-4">
            <label className="space-y-1 text-xs text-txt-secondary">
              {t('settings.defaultModel')}
              <select className="w-full rounded-md px-3 py-2 text-sm bg-surface-800 border border-border-600 text-txt-primary" defaultValue="">
                <option value="">{t('settings.useProjectDefault')}</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.modelName})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* API Configuration */}
        <section className="rounded-lg border border-border-600 bg-surface-900 p-5">
          <h3 className="text-base font-semibold text-txt-primary">
            {t('settings.apiConfig')}
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs text-txt-secondary">
              {t('settings.omniRouteEndpoint')}
              <input
                className="w-full rounded-md px-3 py-2 text-sm bg-surface-800 border border-border-600 text-txt-primary"
                value="http://localhost:3001"
                readOnly
              />
            </label>
            <label className="space-y-1 text-xs text-txt-secondary">
              {t('settings.apiKey')}
              <input
                className="w-full rounded-md px-3 py-2 text-sm bg-surface-800 border border-border-600 text-txt-primary"
                value="••••••••••••"
                readOnly
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-txt-secondary">
            {t('settings.secretsNote')}
          </p>
        </section>

        {/* Orchestrator Configuration */}
        <section className="rounded-lg border border-border-600 bg-surface-900 p-5">
          <h3 className="text-base font-semibold text-txt-primary">
            {t('settings.orchestrator')}
          </h3>

          {orchestrator ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-accent-amber/15 px-2 py-1 text-[11px] text-accent-amber">
                  {orchestrator.status}
                </span>
                <span className="text-xs text-txt-secondary">
                  ID: {orchestrator.id.slice(0, 8)}
                </span>
              </div>

              <label className="block space-y-1 text-xs text-txt-secondary">
                {t('settings.orchestratorPrompt')}
                <textarea
                  value={orchestratorPrompt}
                  onChange={(e) => setOrchestratorPrompt(e.target.value)}
                  className="h-32 w-full rounded-md px-3 py-2 text-sm bg-surface-800 border border-border-600 text-txt-primary leading-6"
                />
              </label>

              <label className="block space-y-1 text-xs text-txt-secondary">
                {t('agents.modelProfile')}
                <select
                  className="w-full rounded-md px-3 py-2 text-sm bg-surface-800 border border-border-600 text-txt-primary"
                  defaultValue={orchestrator.modelProfileId ?? ''}
                >
                  <option value="">{t('settings.useProjectDefault')}</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} ({profile.modelName})
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p className="text-xs text-txt-secondary mb-2">
                  {t('settings.orchestratorTools')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {ORCHESTRATOR_TOOLS.map((tool) => (
                    <button
                      key={tool}
                      onClick={() => toggleTool(tool)}
                      className={`rounded-md px-2.5 py-1.5 text-xs border transition-colors ${
                        enabledTools.has(tool)
                          ? 'bg-accent-amber/15 border-accent-amber/40 text-accent-amber'
                          : 'bg-surface-800 border-border-600 text-txt-secondary'
                      }`}
                    >
                      {toolLabels[tool] ?? tool}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-txt-secondary mb-2">
                  {t('settings.orchestratorMcp')}
                </p>
                <div className="rounded-md border border-border-600 bg-surface-800 p-3 text-xs text-txt-secondary">
                  {t('settings.mcpNone')}
                </div>
              </div>

              <div>
                <p className="text-xs text-txt-secondary mb-2">
                  {t('settings.orchestratorSkills')}
                </p>
                <div className="rounded-md border border-border-600 bg-surface-800 p-3 text-xs text-txt-secondary">
                  {t('settings.skillsNone')}
                </div>
              </div>

              <button
                onClick={() =>
                  updateOrchestrator.mutate({
                    id: orchestrator.id,
                    systemPrompt: orchestratorPrompt,
                  })
                }
                className="rounded-lg bg-accent-amber px-4 py-2 text-sm text-surface-900 hover:opacity-90"
              >
                {t('settings.save')}
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-border-600 bg-surface-800 p-4 text-sm text-txt-secondary">
              {locale === 'ru'
                ? 'Оркестратор не найден. Создайте агента с ролью "orchestrator" на странице Агентов.'
                : 'No orchestrator found. Create an agent with role "orchestrator" on the Agents page.'}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
