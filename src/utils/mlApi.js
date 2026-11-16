// Client for the Python prediction API (ml/api.py).
// In development, Vite proxies /api to http://127.0.0.1:5000 (see vite.config.js).

export class ApiError extends Error {
  constructor(message, { status = 0, details = [], kind = 'request' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    // 'offline' = server not reachable, 'timeout', 'invalid' = input rejected, 'server' = server error
    this.kind = kind;
  }
}

const OFFLINE_MESSAGE =
  'Cannot reach the prediction server. Start it with "python ml/api.py" and try again.';

export function createClient(base = '', timeoutMs = 30000) {
  async function request(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(base + path, { ...options, signal: controller.signal });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new ApiError('The prediction server took too long to respond.', { kind: 'timeout' });
      }
      throw new ApiError(OFFLINE_MESSAGE, { kind: 'offline' });
    } finally {
      clearTimeout(timer);
    }

    let body = null;
    try {
      body = await response.json();
    } catch {
      /* the response was not JSON */
    }

    if (!response.ok) {
      // A dev proxy with nothing behind it answers with a non-JSON error page.
      if (body === null && response.status >= 500) {
        throw new ApiError(OFFLINE_MESSAGE, { status: response.status, kind: 'offline' });
      }
      throw new ApiError(body?.error ?? `Server error (${response.status}).`, {
        status: response.status,
        details: body?.details ?? [],
        kind: response.status >= 500 ? 'server' : 'invalid',
      });
    }
    return body;
  }

  return {
    health: () => request('/api/health'),
    getModels: () => request('/api/models'),
    getMetrics: () => request('/api/metrics'),
    // models: one key or two different keys; records: objects with the 30 feature values
    predict: (models, records) =>
      request('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models, records }),
      }),
  };
}

export const api = createClient();
