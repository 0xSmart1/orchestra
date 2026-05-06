'use client';

import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/', icon: '◉' },
  { label: 'Chat', href: '/chat', icon: '◈' },
  { label: 'Projects', href: '/projects', icon: '◎' },
  { label: 'Agents', href: '/agents', icon: '◈' },
  { label: 'Tasks', href: '/tasks', icon: '◧' },
  { label: 'Models', href: '/models', icon: '◆' },
  { label: 'Events', href: '/events', icon: '◉' },
  { label: 'Memory', href: '/memory', icon: '▤' },
  { label: 'Pixel Office', href: '/pixel-office', icon: '◨' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] border-r border-gray-800 bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold tracking-tight">Orchestra</h1>
        <p className="text-xs text-gray-500">Agent Control Plane</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800 text-xs text-gray-600">
        v0.1.0
      </div>
    </aside>
  );
}
