export const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';

export async function api(path: string, token: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    // Retry only chat transport failures. Never replay run creation, approvals,
    // bookings, or HTTP errors such as a provider rate limit.
    if (path !== '/api/chat' || !(error instanceof TypeError)) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (options.signal?.aborted) throw error;
    try {
      response = await fetch(`${API_URL}${path}`, { ...options, headers });
    } catch (retryError) {
      if (options.signal?.aborted) throw retryError;
      throw new Error('The connection to Diablo was interrupted. Your message is still visible; please send it again.');
    }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.detail === 'string' ? body.detail : `Request failed (${response.status}).`);
  }
  return response;
}

export interface RunEvent {
  status: 'queued' | 'running' | 'completed' | 'failed';
  stage?: string;
  message?: string;
  action?: string;
}

export async function watchRun(
  runId: string,
  token: string,
  signal: AbortSignal,
  onEvent: (event: RunEvent) => void,
) {
  let cursor = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    let reader: ReadableStreamDefaultReader<string> | undefined;
    try {
      const response = await api(`/api/runs/${runId}/events`, token, {
        signal,
        headers: cursor ? { 'Last-Event-ID': cursor } : {},
      });
      if (!response.body) throw new Error('The browser could not read run events.');
      reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const lines = buffer.slice(0, boundary).split('\n');
          buffer = buffer.slice(boundary + 2);
          const data = lines.find((line) => line.startsWith('data: '))?.slice(6);
          cursor = lines.find((line) => line.startsWith('id: '))?.slice(4) ?? cursor;
          if (data) {
            const event = JSON.parse(data) as RunEvent;
            onEvent(event);
            if (event.status === 'completed' || event.status === 'failed') return;
          }
          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch (error) {
      if (signal.aborted || attempt === 2) throw error;
    } finally {
      await reader?.cancel().catch(() => undefined);
    }
    try {
      const snapshot = await api(`/api/runs/${runId}`, token, { signal });
      const { status } = await snapshot.json();
      if (status === 'completed' || status === 'failed') return;
    } catch (error) {
      if (!(error instanceof TypeError) || signal.aborted || attempt === 2) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('The progress connection closed. Try again shortly.');
}
