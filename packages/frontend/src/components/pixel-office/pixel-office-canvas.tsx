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
  idle: 0x888888,
  thinking: 0x00e5ff,
  coding: 0x39ff14,
  testing: 0xffaa00,
  reviewing: 0xb366ff,
  blocked: 0xff0080,
  waiting_approval: 0xffaa00,
  done: 0x39ff14,
};

const ROLE_COLORS: Record<string, number> = {
  orchestrator: 0xd4a574,
  backend: 0x7c9a5e,
  frontend: 0xc8956c,
  qa: 0x8b7355,
  devops: 0x9a7c5e,
  reviewer: 0x8b7355,
  worker: 0xc8956c,
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
    const color = STATUS_COLORS[status] ?? 0x888888;
    sprite.statusDot.clear();
    sprite.statusDot.beginFill(color);
    sprite.statusDot.drawCircle(0, 0, 6);
    sprite.statusDot.endFill();
    sprite.statusDot.x = AGENT_SIZE / 2 - 8;
    sprite.statusDot.y = -AGENT_SIZE / 2 + 8;

    // Update body border color based on status
    sprite.body.clear();
    sprite.body.beginFill(0x2a2420);
    sprite.body.drawRect(0, 0, AGENT_SIZE, AGENT_SIZE);
    sprite.body.endFill();
    // Inner area
    sprite.body.beginFill(0x352f2a);
    sprite.body.drawRect(3, 3, AGENT_SIZE - 6, AGENT_SIZE - 6);
    sprite.body.endFill();
    // Accent border top line
    sprite.body.beginFill(color);
    sprite.body.drawRect(3, 3, AGENT_SIZE - 6, 2);
    sprite.body.endFill();
  }, []);

  const setAgents = useCallback(
    (agents: AgentData[]) => {
      const app = appRef.current;
      if (!app) return;

      // Clear existing sprites
      spritesRef.current.forEach((s) => s.container.destroy({ children: true }));
      spritesRef.current.clear();

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

        const color = STATUS_COLORS[agent.status] ?? 0x888888;
        const roleColor = ROLE_COLORS[agent.role] ?? 0xc8956c;

        // Body — pixel-style square with accent top bar
        const body = new Graphics();
        body.beginFill(roleColor);
        if (agent.role === 'orchestrator') {
          body.drawRoundedRect(-2, -2, AGENT_SIZE + 4, AGENT_SIZE + 4, 10);
        } else if (agent.role === 'qa' || agent.role === 'reviewer') {
          body.drawRect(-1, -1, AGENT_SIZE + 2, AGENT_SIZE + 2);
        } else {
          body.drawRoundedRect(0, 0, AGENT_SIZE, AGENT_SIZE, 6);
        }
        body.endFill();
        // Inner area
        body.beginFill(0x352f2a);
        body.drawRoundedRect(4, 4, AGENT_SIZE - 8, AGENT_SIZE - 8, 5);
        body.endFill();
        // Accent top bar
        body.beginFill(color);
        body.drawRect(8, 8, AGENT_SIZE - 16, 3);
        body.endFill();

        // Status dot
        const statusDot = new Graphics();
        statusDot.beginFill(color);
        statusDot.drawCircle(0, 0, 6);
        statusDot.endFill();
        statusDot.x = AGENT_SIZE / 2 - 8;
        statusDot.y = -AGENT_SIZE / 2 + 8;

        // Name label
        const label = new Text(agent.name.substring(0, 8), {
          fontSize: 10,
          fill: 0xe0e0e0,
          fontFamily: 'monospace',
        });
        label.x = AGENT_SIZE / 2;
        label.y = AGENT_SIZE + 4;
        label.anchor.set(0.5, 0);

        // Role text
        const roleLabel = new Text(agent.role.substring(0, 6), {
          fontSize: 8,
          fill: roleColor,
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
      backgroundColor: 0x0a0a0f,
      antialias: true,
      resizeTo: canvasRef.current,
    });
    appRef.current = app;

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
          // Backend not running — canvas stays empty until SSE connects
        });
    }

    // Connect SSE for real-time status updates
    if (projectId) {
      const es = new EventSource(`http://localhost:3001/events/stream?projectId=${projectId}`);
      es.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data);
          if (event.type === 'agent.status.changed' && event.agentId) {
            const payload =
              event.payload && typeof event.payload === 'object'
                ? event.payload
                : {};
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
      className="w-full h-[500px] rounded-sm border border-border-600 overflow-hidden"
    />
  );
}
