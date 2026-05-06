'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { useState } from 'react';
import { useProject } from '@/lib/project-context';

interface MemoryDocument {
  id: string;
  title: string;
  type: string;
  content: string;
  projectId: string;
  agentId: string | null;
  filePath: string;
  version: number;
  lastSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AgentInstance {
  id: string;
  name: string;
  role: string;
  status: string;
  projectId: string;
}

const MEMORY_TYPES = [
  { value: 'DECISION', label: 'Decision' },
  { value: 'TASK_LOG', label: 'Task Log' },
  { value: 'PROJECT_MEMORY', label: 'Project Memory' },
  { value: 'LESSON_LEARNED', label: 'Lesson Learned' },
  { value: 'SELF_IMPROVEMENT', label: 'Self Improvement' },
] as const;

const typeBadgeColors: Record<string, string> = {
  DECISION: 'bg-purple-900 text-purple-300',
  TASK_LOG: 'bg-blue-900 text-blue-300',
  PROJECT_MEMORY: 'bg-emerald-900 text-emerald-300',
  LESSON_LEARNED: 'bg-yellow-900 text-yellow-300',
  SELF_IMPROVEMENT: 'bg-pink-900 text-pink-300',
};

export default function MemoryPage() {
  const { projectId } = useProject();
  const [activeTab, setActiveTab] = useState<'project' | 'agent'>('project');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('PROJECT_MEMORY');
  const [newContent, setNewContent] = useState('');
  const qc = useQueryClient();

  // --- Agent instances for dropdown ---
  const { data: agentInstances = [] } = useQuery({
    queryKey: ['agent-instances', projectId],
    queryFn: () => apiFetch<AgentInstance[]>(`/agents/instances?projectId=${projectId || ''}`),
    enabled: !!projectId,
  });

  // --- Project memory documents ---
  const { data: projectDocs = [] } = useQuery({
    queryKey: ['memory-project', projectId],
    queryFn: () => apiFetch<MemoryDocument[]>(`/memory?projectId=${projectId}`),
    enabled: !!projectId && activeTab === 'project',
  });

  // --- Agent memory documents ---
  const { data: agentDocs = [] } = useQuery({
    queryKey: ['memory-agent', selectedAgentId],
    queryFn: () => apiFetch<MemoryDocument[]>(`/memory?projectId=${projectId}&agentId=${selectedAgentId}`),
    enabled: !!selectedAgentId && activeTab === 'agent',
  });

  const currentDocs = activeTab === 'project' ? projectDocs : agentDocs;
  const selectedDoc = currentDocs.find((d) => d.id === selectedDocId) ?? null;

  // --- Create document ---
  const createMutation = useMutation({
    mutationFn: (data: { title: string; type: string; content: string; project?: { connect: { id: string } }; agent?: { connect: { id: string } } }) =>
      apiFetch<MemoryDocument>('/memory', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (doc) => {
      if (activeTab === 'project') {
        qc.invalidateQueries({ queryKey: ['memory-project', projectId] });
      } else {
        qc.invalidateQueries({ queryKey: ['memory-agent', selectedAgentId] });
      }
      setShowCreateForm(false);
      setNewTitle('');
      setNewContent('');
      setSelectedDocId(doc.id);
    },
  });

  // --- Update document ---
  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      apiFetch<MemoryDocument>(`/memory/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      if (activeTab === 'project') {
        qc.invalidateQueries({ queryKey: ['memory-project', projectId] });
      } else {
        qc.invalidateQueries({ queryKey: ['memory-agent', selectedAgentId] });
      }
    },
  });

  // --- Delete document ---
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/memory/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      if (selectedDocId) {
        setSelectedDocId(null);
      }
      if (activeTab === 'project') {
        qc.invalidateQueries({ queryKey: ['memory-project', projectId] });
      } else {
        qc.invalidateQueries({ queryKey: ['memory-agent', selectedAgentId] });
      }
    },
  });

  // --- Handle create submit ---
  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const data: { title: string; type: string; content: string; project?: { connect: { id: string } }; agent?: { connect: { id: string } } } = {
      title: newTitle.trim(),
      type: newType,
      content: newContent.trim(),
    };
    if (activeTab === 'project' && projectId) {
      data.project = { connect: { id: projectId } };
    } else if (activeTab === 'agent' && selectedAgentId) {
      data.agent = { connect: { id: selectedAgentId } };
    }
    createMutation.mutate(data);
  };

  // --- Handle save ---
  const handleSave = () => {
    if (!selectedDocId || !editContent.trim()) return;
    updateMutation.mutate({ id: selectedDocId, content: editContent.trim() });
  };

  // --- Select a document (enter view/edit mode) ---
  const handleSelectDoc = (doc: MemoryDocument) => {
    setSelectedDocId(doc.id);
    setEditContent(doc.content);
  };

  // --- Back to list ---
  const handleBack = () => {
    setSelectedDocId(null);
    setEditContent('');
  };

  // --- No project guard ---
  if (!projectId) {
    return (
      <>
        <Header title="Memory" />
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <p className="text-gray-500">Select a project first to view memory.</p>
        </div>
      </>
    );
  }

  // --- View/edit mode ---
  if (selectedDoc) {
    return (
      <>
        <Header title="Memory" />
        <div className="p-6 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBack}
              className="px-2 py-1 text-xs text-gray-400 border border-gray-700 rounded hover:bg-gray-800"
            >
              Back
            </button>
            <h2 className="text-sm font-medium text-gray-100 truncate">{selectedDoc.title}</h2>
            <span className={`px-2 py-0.5 text-[10px] rounded ${typeBadgeColors[selectedDoc.type] || 'bg-gray-700 text-gray-300'}`}>
              {selectedDoc.type}
            </span>
            <span className="text-xs text-gray-600 ml-auto">
              Updated {new Date(selectedDoc.updatedAt).toLocaleString()}
            </span>
          </div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-[calc(100vh-12rem)] bg-gray-800 text-gray-100 px-4 py-3 rounded-lg text-sm font-mono border border-gray-700 resize-none focus:outline-none focus:border-gray-600"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending || editContent === selectedDoc.content}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this document?')) {
                  deleteMutation.mutate(selectedDoc.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="px-4 py-1.5 bg-red-700 text-white text-sm rounded-md hover:bg-red-800 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Memory" />
      <div className="p-6">
        {/* --- Tabs --- */}
        <div className="flex gap-1 mb-5 border-b border-gray-800">
          <button
            onClick={() => { setActiveTab('project'); setSelectedDocId(null); }}
            className={`px-4 py-2 text-sm rounded-t-md ${activeTab === 'project' ? 'bg-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Project Memory
          </button>
          <button
            onClick={() => { setActiveTab('agent'); setSelectedDocId(null); }}
            className={`px-4 py-2 text-sm rounded-t-md ${activeTab === 'agent' ? 'bg-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Agent Memory
          </button>
        </div>

        {/* --- Agent selector (visible only on Agent tab) --- */}
        {activeTab === 'agent' && (
          <div className="mb-5">
            <select
              value={selectedAgentId}
              onChange={(e) => { setSelectedAgentId(e.target.value); setSelectedDocId(null); }}
              className="bg-gray-800 text-gray-100 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              <option value="">Select an agent instance</option>
              {agentInstances.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* --- New Document button --- */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-400">{currentDocs.length} document(s)</p>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={activeTab === 'agent' && !selectedAgentId}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            New Document
          </button>
        </div>

        {/* --- Create form --- */}
        {showCreateForm && (
          <div className="mb-6 p-4 border border-gray-800 rounded-lg space-y-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Document title"
              className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm border border-gray-700"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm border border-gray-700"
            >
              {MEMORY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Document content (markdown)"
              className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded text-sm border border-gray-700 h-32 font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || !newContent.trim() || createMutation.isPending}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 text-gray-400 text-sm border border-gray-700 rounded hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* --- Document list --- */}
        {activeTab === 'agent' && !selectedAgentId ? (
          <p className="text-gray-600 text-center text-sm py-8">Select an agent instance to view its memory.</p>
        ) : currentDocs.length === 0 ? (
          <p className="text-gray-600 text-center text-sm py-8">No memory documents yet.</p>
        ) : (
          <div className="space-y-2">
            {currentDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleSelectDoc(doc)}
                className="w-full text-left p-3 border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-100">{doc.title}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded ${typeBadgeColors[doc.type] || 'bg-gray-700 text-gray-300'}`}>
                    {doc.type}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Updated {new Date(doc.updatedAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
