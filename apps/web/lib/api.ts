const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const API_BASE_URL = configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`;
type ApiFetchInit = RequestInit & { timeoutMs?: number };

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiErrorMessage(response: Response, fallback: string) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = await response.clone().json().catch(() => null);
    const message = payload?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string' && message.trim()) return message;
  }

  const text = await response.clone().text().catch(() => '');
  return text.trim() || fallback;
}

export async function apiFetch(path: string, init: ApiFetchInit = {}) {
  const { timeoutMs = init.body instanceof FormData ? 120000 : 30000, ...requestInit } = init;
  const headers = init.body instanceof FormData
    ? requestInit.headers
    : {
      'Content-Type': 'application/json',
      ...(requestInit.headers || {}),
    };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let forwardAbort: (() => void) | undefined;

  if (requestInit.signal) {
    if (requestInit.signal.aborted) {
      controller.abort();
    } else {
      forwardAbort = () => controller.abort();
      requestInit.signal.addEventListener('abort', forwardAbort, { once: true });
    }
  }

  try {
    return await fetch(apiUrl(path), {
      ...requestInit,
      credentials: 'include',
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    if (forwardAbort) {
      requestInit.signal?.removeEventListener('abort', forwardAbort);
    }
  }
}
