import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Sidebar } from '@/components/layout/sidebar';
import { QueryProvider } from '@/lib/query-client';
import { ProjectProvider } from '@/lib/project-context';
import { I18nProvider } from '@/lib/i18n';
import './globals.css';

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

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
    <html lang="en" className={jetbrains.variable}>
      <body className="font-mono">
        <QueryProvider>
          <I18nProvider>
            <ProjectProvider>
              <Sidebar />
              <main className="ml-[var(--sidebar-width)] min-h-screen">
                {children}
              </main>
            </ProjectProvider>
          </I18nProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
