'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/', icon: '▶' },
  { label: 'Chat', href: '/chat', icon: '◈' },
  { label: 'Projects', href: '/projects', icon: '■' },
  { label: 'Agents', href: '/agents', icon: '◆' },
  { label: 'Tasks', href: '/tasks', icon: '▯' },
  { label: 'Models', href: '/models', icon: '▸' },
  { label: 'Events', href: '/events', icon: '◉' },
  { label: 'Memory', href: '/memory', icon: '▤' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] border-r border-border bg-surface flex flex-col z-40">
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-sm font-bold tracking-widest text-accent-cyan">
          ORCHESTRA
          <span className="animate-pixel-blink text-accent-cyan">_</span>
        </h1>
        <p className="text-[10px] text-txt-secondary tracking-wider mt-0.5">
          AGENT CTRL PLANE
        </p>
      </div>
      <nav className="flex-1 py-2 px-1 space-y-px">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-1.5 text-xs transition-all ${
                isActive
                  ? 'text-accent-cyan bg-surface-hover glow-cyan border-l-2 border-accent-cyan'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-hover border-l-2 border-transparent'
              }`}
            >
              <span className="text-[11px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-border text-[10px] text-txt-secondary">
        v0.1.0 // BUILD 0526
      </div>
    </aside>
  );
}
