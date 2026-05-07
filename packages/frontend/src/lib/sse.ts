import { API_BASE } from './api';

export function createEventSource(
  projectId: string,
  onEvent: (event: any) => void,
): EventSource {
  const es = new EventSource(`${API_BASE}/events/stream?projectId=${projectId}`);
  es.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      onEvent(data);
    } catch {}
  };
  return es;
}
