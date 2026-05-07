'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  archived?: boolean;
}

interface ProjectContextValue {
  projectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  projects: Project[];
  loading: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue>({
  projectId: null,
  setSelectedProjectId: () => {},
  projects: [],
  loading: true,
  refreshProjects: async () => {},
});

const STORAGE_KEY = 'orchestra:selected-project';

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const qc = useQueryClient();

  // Use TanStack Query for projects — same cache key as Projects page
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiFetch<Project[]>('/projects'),
  });

  // Auto-select: if stored ID gone, pick first available
  const activeProjects = projects.filter((p) => !p.archived);

  if (projectId && !activeProjects.some((p) => p.id === projectId) && activeProjects.length > 0) {
    const firstId = activeProjects[0].id;
    setProjectId(firstId);
    localStorage.setItem(STORAGE_KEY, firstId);
  } else if (!projectId && activeProjects.length > 0) {
    const firstId = activeProjects[0].id;
    setProjectId(firstId);
    localStorage.setItem(STORAGE_KEY, firstId);
  }

  const setSelectedProjectId = useCallback((id: string | null) => {
    setProjectId(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['projects'] });
  }, [qc]);

  return (
    <ProjectContext.Provider
      value={{ projectId, setSelectedProjectId, projects: activeProjects, loading: isLoading, refreshProjects }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return ctx;
}
