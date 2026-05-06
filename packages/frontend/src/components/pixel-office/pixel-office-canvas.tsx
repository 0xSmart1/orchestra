'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { useProject } from '@/lib/project-context';

interface AgentData {
  id: string;
  name: string;
  role: string;
  status: string;
}

interface AgentSprite {
  container: Container;
  body: Graphics;
  label: Text;
  statusDot: Graphics;
  data: AgentData;
}

const STATUS_COLORS: Record<string, number> = {
  idle: 0x666666,
  thinking: 0xffcc00,
  coding: 0x22c55e,
  testing: 0x3b82f6,
  reviewing: 0xa855f7,
  blocked: 0xef4444,
  waiting_approval: 0xf97316,
  done: 0x10b981,
};

const AGENT_SIZE = 60;
const GRID_COLS = 6;
const GRID_GAP = 20;
const GRID_PADDING = 40;
const LABEL_OFFSET = 20;

export function PixelOfficeCanvas({ onAgentClick }: { onAgentClick: (agent: AgentData) => void }) {
  const { projectId } = useProject();
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const spritesRef = useRef<Map<string, AgentSprite>>(new Map());
  const sseRef = useRef<EventSource | null>(null);

  const updateAgentStatus = useCallback((agentId: string, status: string) => {
    const sprite = spritesRef.current.get(agentId);
    if (!sprite) return;
    sprite.data.status = status;
    const color = STATUS_COLORS[status] ?? 0x666666;
    sprite.statusDot.clear();
    sprite.statusDot.beginFill(color);
    sprite.statusDot.drawCircle(0, 0, 6);
    sprite.statusDot.endFill();
    sprite.statusDot.x = AGENT_SIZE / 2 - 8;
    sprite.statusDot.y = -AGENT_SIZE / 2 + 8;
  }, []);

  const setAgents = useCallback(
    (agents: AgentData[]) => {
      const app = appRef.current;
      if (!app) return;

      // Clear existing sprites
      spritesRef.current.forEach((s) => s.container.destroy({ children: true }));
      spritesRef.current.clear();

      // Remove old agent containers from stage (keep any base layer)
      while (app.stage.children.length > 0) {
        app.stage.removeChildAt(0);
      }

      const container = new Container();
      app.stage.addChild(container);

      agents.forEach((agent, i) => {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        const x = GRID_PADDING + col * (AGENT_SIZE + GRID_GAP);
        const y = GRID_PADDING + row * (AGENT_SIZE + GRID_GAP + LABEL_OFFSET);

        const agentContainer = new Container();
        agentContainer.x = x;
        agentContainer.y = y;
        agentContainer.eventMode = 'static';
        agentContainer.cursor = 'pointer';

        // Body (desk)
        const body = new Graphics();
        body.beginFill(0x1e293b);
        body.drawRoundedRect(0, 0, AGENT_SIZE, AGENT_SIZE, 8);
        body.endFill();
        // Inner accent
        body.beginFill(0x334155);
        body.drawRoundedRect(4, 4, AGENT_SIZE - 8, AGENT_SIZE - 8, 6);
        body.endFill();

        // Status dot
        const statusDot = new Graphics();
        const color = STATUS_COLORS[agent.status] ?? 0x666666;
        statusDot.beginFill(color);
        statusDot.drawCircle(0, 0, 6);
        statusDot.endFill();
        statusDot.x = AGENT_SIZE / 2 - 8;
        statusDot.y = -AGENT_SIZE / 2 + 8;

        // Name label
        const label = new Text(agent.name.substring(0, 8), {
          fontSize: 10,
          fill: 0x94a3b8,
          fontFamily: 'monospace',
        });
        label.x = AGENT_SIZE / 2;
        label.y = AGENT_SIZE + 4;
        label.anchor.set(0.5, 0);

        // Role text
        const roleLabel = new Text(agent.role.substring(0, 6), {
          fontSize: 8,
          fill: 0x64748b,
          fontFamily: 'monospace',
        });
        roleLabel.x = AGENT_SIZE / 2;
        roleLabel.y = AGENT_SIZE / 2;
        roleLabel.anchor.set(0.5, 0.5);

        agentContainer.addChild(body);
        agentContainer.addChild(statusDot);
        agentContainer.addChild(label);
        agentContainer.addChild(roleLabel);

        agentContainer.on('pointerdown', () => onAgentClick(agent));

        container.addChild(agentContainer);

        spritesRef.current.set(agent.id, {
          container: agentContainer,
          body,
          label,
          statusDot,
          data: agent,
        });
      });

      // Resize renderer to fit grid
      const totalRows = Math.ceil(agents.length / GRID_COLS);
      const width = Math.max(GRID_PADDING * 2 + GRID_COLS * (AGENT_SIZE + GRID_GAP), 400);
      const height =
        Math.max(GRID_PADDING * 2 + totalRows * (AGENT_SIZE + GRID_GAP + LABEL_OFFSET), 300);
      app.renderer.resize(width, height);
    },
    [onAgentClick],
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application({
      backgroundColor: 0x0f172a,
      antialias: true,
      resizeTo: canvasRef.current,
    });
    appRef.current = app;

    // Attach canvas to DOM
    canvasRef.current.appendChild(app.view as unknown as Node);

    // Load initial agents from REST endpoint
    if (projectId) {
      fetch(`http://localhost:3001/agents/instances?projectId=${projectId}`)
        .then((r) => r.json())
        .then((agents: AgentData[]) => {
          if (Array.isArray(agents) && agents.length > 0) {
            setAgents(agents);
          }
        })
        .catch(() => {
          // Backend not running -- canvas stays empty until SSE connects
        });
    }

    // Connect SSE for real-time status updates
    if (projectId) {
      const es = new EventSource(`http://localhost:3001/events/stream?projectId=${projectId}`);
      es.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data);
          if (event.type === 'agent.status.changed' && event.agentId) {
            const payload = JSON.parse(event.payload ?? '{}');
            updateAgentStatus(event.agentId, payload.status ?? 'idle');
          }
        } catch {
          // Ignore malformed events
        }
      };
      sseRef.current = es;
    }

    return () => {
      sseRef.current?.close();
      sseRef.current = null;
      app.destroy(true);
      appRef.current = null;
    };
  }, [projectId, setAgents, updateAgentStatus]);

  return (
    <div
      ref={canvasRef}
      className="w-full h-[500px] rounded-lg border border-gray-800 overflow-hidden"
    />
  );
}
