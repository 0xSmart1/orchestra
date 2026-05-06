'use client';

import { useState, useRef, useEffect } from 'react';
import { useProject } from '@/lib/project-context';

export function Header({ title }: { title: string }) {
  const { projectId, setSelectedProjectId, projects, loading } = useProject();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const currentProject = projects.find((p) => p.id === projectId);

  return (
    <header className="h-14 border-b border-gray-800 bg-gray-900 flex items-center px-6 gap-4">
      <h2 className="text-sm font-medium">{title}</h2>

      {/* Project selector */}
      <div className="ml-auto relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <span className="text-gray-500">&#9678;</span>
          {loading ? (
            'Loading...'
          ) : currentProject ? (
            currentProject.name
          ) : (
            'No project'
          )}
          <span className="text-gray-500 ml-1">&#9662;</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
            {projects.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500">
                No projects. Create one in Projects.
              </div>
            )}
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProjectId(p.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-700 transition-colors ${
                  p.id === projectId ? 'text-blue-400' : 'text-gray-300'
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
