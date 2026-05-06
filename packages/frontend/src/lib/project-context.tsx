'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { apiFetch } from '@/lib/api';

interface Project {
  id: string;
  name: string;
}

interface ProjectContextValue {
  projectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  projects: Project[];
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextValue>({
  projectId: null,
  setSelectedProjectId: () => {},
  projects: [],
  loading: true,
});

const STORAGE_KEY = 'orchestra:selected-project';

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load projects list on mount
  useEffect(() => {
    let cancelled = false;
    apiFetch<Project[]>('/projects')
      .then((list) => {
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setProjects(arr);

        // Restore selected project from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && arr.some((p) => p.id === stored)) {
          setProjectId(stored);
        } else if (arr.length > 0) {
          // Auto-select first project if nothing stored
          const firstId = arr[0].id;
          setProjectId(firstId);
          localStorage.setItem(STORAGE_KEY, firstId);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setSelectedProjectId = useCallback((id: string | null) => {
    setProjectId(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <ProjectContext.Provider
      value={{ projectId, setSelectedProjectId, projects, loading }}
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
