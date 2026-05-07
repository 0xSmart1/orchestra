'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useI18n } from '@/lib/i18n';

interface Project {
  id: string;
  name: string;
}

const NAV_ICONS: Record<string, string> = {
  Dashboard: 'D',
  Chat: 'C',
  Agents: 'A',
  Tasks: 'T',
  Models: 'M',
  Events: 'E',
  Memory: 'R',
  Settings: 'S',
};

export function Sidebar() {
  const pathname = usePathname();
  const { projectId, setSelectedProjectId, projects, refreshProjects } = useProject();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);

  const navItems = [
    { label: t('nav.dashboard'), href: '/', icon: NAV_ICONS['Dashboard'] },
    { label: t('nav.chat'), href: '/chat', icon: NAV_ICONS['Chat'] },
    { label: t('nav.agents'), href: '/agents', icon: NAV_ICONS['Agents'] },
    { label: t('nav.tasks'), href: '/tasks', icon: NAV_ICONS['Tasks'] },
    { label: t('nav.models'), href: '/models', icon: NAV_ICONS['Models'] },
    { label: t('nav.events'), href: '/events', icon: NAV_ICONS['Events'] },
    { label: t('nav.memory'), href: '/memory', icon: NAV_ICONS['Memory'] },
    { label: t('nav.settings'), href: '/settings', icon: NAV_ICONS['Settings'] },
  ];

  useEffect(() => {
    if (!archivedOpen) return;
    apiFetch<Project[]>('/projects?archived=true')
      .then((list) => setArchivedProjects(Array.isArray(list) ? list : []))
      .catch(() => setArchivedProjects([]));
  }, [archivedOpen]);

  async function archiveProject(id: string, archived: boolean) {
    await apiFetch(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    });
    await refreshProjects();
    qc.invalidateQueries({ queryKey: ['projects'] });
    if (archived && projectId === id) setSelectedProjectId(null);
    if (archivedOpen) {
      const list = await apiFetch<Project[]>('/projects?archived=true');
      setArchivedProjects(Array.isArray(list) ? list : []);
    }
  }

  async function deleteProject(id: string, name: string) {
    if (!confirm(`Delete project "${name}"?`)) return;
    await apiFetch(`/projects/${id}`, { method: 'DELETE' });
    await refreshProjects();
    qc.invalidateQueries({ queryKey: ['projects'] });
    if (projectId === id) setSelectedProjectId(null);
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] border-r border-border bg-surface flex flex-col z-40">
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-sm font-semibold tracking-wide text-txt-primary">
          Orchestra
        </h1>
        <p className="text-[11px] text-txt-secondary mt-0.5">
          {t('sidebar.subtitle')}
        </p>
      </div>

      <section className="border-b border-border px-3 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-txt-secondary">
            {t('nav.projects')}
          </span>
          <Link href="/projects" className="text-[11px] text-accent-amber hover:text-txt-primary">
            {t('nav.manage')}
          </Link>
        </div>
        <div className="space-y-1">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`group flex items-center gap-1 rounded-lg ${
                project.id === projectId ? 'bg-surface-hover' : ''
              }`}
            >
              <button
                onClick={() => setSelectedProjectId(project.id)}
                className={`min-w-0 flex-1 truncate rounded-lg px-2.5 py-1.5 text-left text-xs ${
                  project.id === projectId
                    ? 'text-txt-primary'
                    : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-hover'
                }`}
              >
                {project.name}
              </button>
              <button
                title={t('chat.archive')}
                onClick={() => archiveProject(project.id, true)}
                className="hidden group-hover:block px-1.5 py-1 text-[10px] text-txt-secondary hover:text-accent-amber"
              >
                {t('nav.archive')}
              </button>
              <button
                title={t('chat.delete')}
                onClick={() => deleteProject(project.id, project.name)}
                className="hidden group-hover:block px-1.5 py-1 text-[10px] text-txt-secondary hover:text-red-400"
              >
                {t('nav.delete')}
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="px-2.5 py-2 text-xs text-txt-secondary">{t('nav.noProjects')}</p>
          )}
        </div>
        <button
          onClick={() => setArchivedOpen((v) => !v)}
          className="mt-2 w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-txt-secondary hover:bg-surface-hover hover:text-txt-primary"
        >
          {archivedOpen ? t('nav.hideArchived') : t('nav.showArchived')}
        </button>
        {archivedOpen && (
          <div className="mt-1 space-y-1">
            {archivedProjects.map((project) => (
              <div key={project.id} className="flex items-center gap-1 rounded-lg bg-surface-800">
                <span className="min-w-0 flex-1 truncate px-2.5 py-1.5 text-xs text-txt-secondary">
                  {project.name}
                </span>
                <button
                  onClick={() => archiveProject(project.id, false)}
                  className="px-2 py-1 text-[10px] text-accent-amber"
                >
                  {t('nav.restore')}
                </button>
              </div>
            ))}
            {archivedProjects.length === 0 && (
              <p className="px-2.5 py-1.5 text-[11px] text-txt-secondary">
                {t('nav.noProjects')}
              </p>
            )}
          </div>
        )}
      </section>

      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                isActive
                  ? 'text-txt-primary bg-surface-hover'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-hover'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-surface-800 text-[10px]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pixel-pulse" />
          <span className="text-[10px] text-accent-green">{t('nav.online')}</span>
        </div>
        <p className="text-[10px] text-txt-secondary">v0.1.0</p>
      </div>
    </aside>
  );
}
