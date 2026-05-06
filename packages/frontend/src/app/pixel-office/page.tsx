'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { PixelOfficeCanvas } from '@/components/pixel-office/pixel-office-canvas';
import { AgentDetailPanel } from '@/components/pixel-office/agent-detail-panel';

interface AgentData {
  id: string;
  name: string;
  role: string;
  status: string;
}

export default function PixelOfficePage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  return (
    <>
      <Header title="Pixel Office" />
      <div className="p-6">
        <p className="text-xs text-gray-500 mb-4">
          Live agent observability &mdash; click an agent for details
        </p>
        <div className="flex">
          <div className="flex-1">
            <PixelOfficeCanvas onAgentClick={setSelectedAgent} />
          </div>
          <AgentDetailPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
        </div>
      </div>
    </>
  );
}
