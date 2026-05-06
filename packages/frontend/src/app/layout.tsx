import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Orchestra — Agent Control Plane',
  description: 'User-owned control plane for LLM agent teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <main className="ml-[var(--sidebar-width)] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
