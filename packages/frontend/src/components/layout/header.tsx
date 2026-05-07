'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export function Header({ title }: { title: string }) {
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

  return (
    <header className="h-12 border-b border-border bg-surface flex items-center px-5 gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-txt-primary">
        {title}
      </h2>
      <div className="ml-auto relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-800 px-2.5 py-1.5 text-xs text-txt-primary hover:border-border-bright"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-amber/20 text-accent-amber">
            U
          </span>
          <span>User</span>
          <span className="text-txt-secondary">&#9662;</span>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-surface shadow-lg z-50 overflow-hidden">
            <Link
              href="/settings"
              className="block px-3 py-2 text-xs text-txt-primary hover:bg-surface-hover"
              onClick={() => setOpen(false)}
            >
              Settings
            </Link>
            <button className="w-full text-left px-3 py-2 text-xs text-txt-secondary hover:bg-surface-hover">
              Theme: Dark
            </button>
            <div className="border-t border-border px-3 py-2 text-[11px] text-txt-secondary">
              Orchestra v0.1.0
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
