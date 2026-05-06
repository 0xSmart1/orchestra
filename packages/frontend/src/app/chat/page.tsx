'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useProject } from '@/lib/project-context';
import { useEffect, useRef, useState, useCallback } from 'react';

interface Conversation {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationMessage {
  id: string;
  conversationId: string;
  role: string;
  agentId?: string;
  content: string;
  taskId?: string;
  createdAt: string;
}

export default function ChatPage() {
  const { projectId } = useProject();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  // --- Conversations list ---
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', projectId],
    queryFn: () => apiFetch<Conversation[]>(`/conversations?projectId=${projectId ?? ''}`),
    enabled: !!projectId,
  });

  // --- Messages for selected conversation ---
  const { data: messagesData } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: () => apiFetch<{ messages: ConversationMessage[] }>(`/conversations/${selectedId}`),
    enabled: !!selectedId,
  });
  const messages = messagesData?.messages ?? [];

  // --- SSE: listen for new messages in the selected conversation ---
  useEffect(() => {
    if (!selectedId) return;
    const es = new EventSource(
      `http://localhost:3001/conversations/${selectedId}/stream`,
    );
    es.onmessage = (msg) => {
      try {
        const data: ConversationMessage = JSON.parse(msg.data);
        qc.setQueryData(['messages', selectedId], (old: { messages: ConversationMessage[] } | undefined) => {
          const prev = old?.messages ?? [];
          if (prev.some((m) => m.id === data.id)) return old;
          return { messages: [...prev, data] };
        });
      } catch {}
    };
    return () => es.close();
  }, [selectedId, qc]);

  // --- Auto-scroll on new messages ---
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // --- Create conversation ---
  const createConv = useMutation({
    mutationFn: (title: string) =>
      apiFetch<Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ project: { connect: { id: projectId } }, title }),
      }),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['conversations', projectId] });
      setSelectedId(conv.id);
    },
  });

  // --- Send message ---
  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      apiFetch<ConversationMessage>(`/conversations/${selectedId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, projectId: projectId ?? '' }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', selectedId] });
      setInput('');
    },
  });

  // --- Handle send ---
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    if (!selectedId) {
      const title = text.length > 40 ? text.slice(0, 40) + '...' : text;
      createConv.mutate(title, {
        onSuccess: (conv) => {
          sendMessage.mutate(text, {
            context: { conversationId: conv.id },
          } as any);
        },
      });
      return;
    }

    sendMessage.mutate(text);
  }, [input, selectedId, createConv, sendMessage]);

  // --- Handle Enter key ---
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // --- Role styling ---
  const roleConfig: Record<string, { label: string; bubble: string; labelColor: string }> = {
    user: {
      label: 'You',
      bubble: 'bg-blue-700 ml-auto',
      labelColor: 'text-blue-400',
    },
    orchestrator: {
      label: 'Orchestrator',
      bubble: 'bg-gray-800 border border-gray-700',
      labelColor: 'text-emerald-400',
    },
    worker: {
      label: 'Worker',
      bubble: 'bg-gray-800 border border-gray-700',
      labelColor: 'text-purple-400',
    },
    system: {
      label: 'System',
      bubble: 'bg-gray-900 border border-gray-800',
      labelColor: 'text-yellow-400',
    },
  };

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  if (!projectId) {
    return (
      <>
        <Header title="Chat" />
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <p className="text-gray-500">Select a project first to start chatting.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Chat" />
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* --- Left sidebar: conversations list --- */}
        <div className="w-64 shrink-0 border-r border-gray-800 bg-gray-900 flex flex-col">
          <div className="p-3">
            <button
              onClick={() => createConv.mutate('New Conversation')}
              disabled={createConv.isPending}
              className="w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              + New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-800 hover:bg-gray-800 ${
                  selectedId === conv.id
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-400'
                }`}
              >
                <div className="truncate">{conv.title}</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-gray-600 text-center text-xs py-6">
                No conversations yet.
              </p>
            )}
          </div>
        </div>

        {/* --- Main area: messages + input --- */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Conversation header */}
          {selectedId && (
            <div className="h-10 shrink-0 border-b border-gray-800 bg-gray-900 flex items-center px-4">
              <span className="text-sm text-gray-300 truncate">
                {selectedConversation?.title ?? 'Conversation'}
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!selectedId && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-600">
                  <p className="text-lg mb-2">Orchestrator Chat</p>
                  <p className="text-sm">
                    Select a conversation or start a new one.
                  </p>
                </div>
              </div>
            )}
            {messages.map((msg) => {
              const cfg = roleConfig[msg.role] ?? {
                label: msg.role,
                bubble: 'bg-gray-800',
                labelColor: 'text-gray-400',
              };
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 ${cfg.bubble}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${cfg.labelColor}`}>
                        {cfg.label}
                      </span>
                      {msg.agentId && (
                        <span className="text-xs text-gray-600">
                          {msg.agentId}
                        </span>
                      )}
                      {msg.taskId && (
                        <span className="text-xs text-gray-600">
                          task:{msg.taskId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-mono text-gray-200 whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
            {(sendMessage.isPending || createConv.isPending) && (
              <div className="flex justify-start">
                <div className="max-w-[70%] rounded-lg px-3 py-2 bg-gray-800 border border-gray-700">
                  <span className="text-xs text-emerald-400">Orchestrator</span>
                  <div className="text-sm text-gray-400 mt-1 animate-pulse">
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-gray-800 bg-gray-900 p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={sendMessage.isPending || createConv.isPending}
                className="flex-1 bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm font-mono placeholder-gray-600 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sendMessage.isPending || createConv.isPending}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
