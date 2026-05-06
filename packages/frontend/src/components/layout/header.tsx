'use client';

import { useState, useRef, useEffect } from 'react';
import { useProject } from '@/lib/project-context';

export function Header({ title }: { title: string }) {
  const { projectId, setSelectedProjectId, projects, loading } = useProject();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const currentProject = projects.find((p) => p.id === projectId);

  return (
    <header className="h-11 border-b border-border bg-surface flex items-center px-4 gap-3">
      <h2 className="text-xs font-bold tracking-wider text-accent-cyan uppercase">
        {title}
      </h2>
      <div className="ml-auto relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-2 py-1 bg-surface-hover border border-border text-[11px] text-txt-primary hover:border-border-bright transition-colors"
        >
          <span className="text-accent-cyan">&#9673;</span>
          <span>
            {loading ? '...' : currentProject ? currentProject.name : 'NO PROJECT'}
          </span>
          <span className="text-txt-secondary">&#9662;</span>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border z-50">
            {projects.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-txt-secondary">
                No projects
              </div>
            )}
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProjectId(p.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-surface-hover transition-colors ${
                  p.id === projectId
                    ? 'text-accent-cyan bg-surface-hover'
                    : 'text-txt-secondary'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
