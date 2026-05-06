export function createEventSource(
  projectId: string,
  onEvent: (event: any) => void,
): EventSource {
  const es = new EventSource(`http://localhost:3001/events/stream?projectId=${projectId}`);
  es.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      onEvent(data);
    } catch {}
  };
  return es;
}
