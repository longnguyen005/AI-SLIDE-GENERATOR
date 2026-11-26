import {
  activateBrowserDemo,
  deactivateBrowserDemo,
  DEMO_TOKEN,
  demoStore,
  isBrowserDemoActive,
} from './demoStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DEFAULT_TIMEOUT_MS = 15000;
const AI_TIMEOUT_MS = 45000;
const DEMO_LOGIN_TIMEOUT_MS = 3500;
const PUBLIC_PATHS = new Set(['/', '/login', '/register']);

export { isBrowserDemoActive };

export function getToken() {
  const stored = localStorage.getItem('deckai_token');
  if (stored === DEMO_TOKEN && !isBrowserDemoActive()) {
    localStorage.removeItem('deckai_token');
    return null;
  }
  return stored;
}

export function setToken(token) {
  if (token && token !== DEMO_TOKEN) {
    deactivateBrowserDemo();
  }
  localStorage.setItem('deckai_token', token);
}

export function clearToken() {
  localStorage.removeItem('deckai_token');
  deactivateBrowserDemo();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const onExternalAbort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. Please try again.');
      timeoutError.name = 'AbortError';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timerId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

function handleUnauthorized(path, requestToken) {
  const isExcludedEndpoint =
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/demo') ||
    path === '/auth/me';

  if (isExcludedEndpoint || isBrowserDemoActive()) {
    return;
  }

  if (requestToken && getToken() !== requestToken) {
    return;
  }

  clearToken();
  if (!PUBLIC_PATHS.has(window.location.pathname)) {
    window.location.assign('/login');
  }
}

async function request(path, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const token = getToken();
  const { headers: customHeaders, ...fetchOptions } = options;

  const response = await fetchWithTimeout(
    `${API_URL}${path}`,
    {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(customHeaders || {}),
      },
    },
    timeoutMs
  );

  if (response.status === 204) {
    return undefined;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');

  if (!response.ok) {
    const error = isJson ? await response.json() : { message: 'Request failed' };
    if (response.status === 401) {
      handleUnauthorized(path, token);
    }
    throw new Error(error.message || 'Request failed');
  }

  return isJson ? response.json() : response;
}

function fileNameFromDisposition(value) {
  if (!value) return '';
  const utfMatch = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch) return decodeURIComponent(utfMatch[1]);
  const match = value.match(/filename="?([^"]+)"?/i);
  return match?.[1] || '';
}

async function downloadRequest(path, options = {}, timeoutMs = AI_TIMEOUT_MS) {
  const token = getToken();
  const { headers: customHeaders, ...fetchOptions } = options;

  const response = await fetchWithTimeout(
    `${API_URL}${path}`,
    {
      ...fetchOptions,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(customHeaders || {}),
      },
    },
    timeoutMs
  );

  if (!response.ok) {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const error = isJson ? await response.json() : { message: 'Download failed' };
    if (response.status === 401) {
      handleUnauthorized(path, token);
    }
    throw new Error(error.message || 'Download failed');
  }

  return {
    blob: await response.blob(),
    fileName:
      fileNameFromDisposition(response.headers.get('content-disposition')) || 'deckai-export.pptx',
  };
}

export const api = {
  register: async (data) => {
    const result = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    deactivateBrowserDemo();
    return result;
  },

  login: async (data) => {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    deactivateBrowserDemo();
    return result;
  },

  loginDemo: async () => {
    try {
      const result = await request(
        '/auth/demo',
        { method: 'POST' },
        DEMO_LOGIN_TIMEOUT_MS
      );
      deactivateBrowserDemo();
      setToken(result.token);
      return { ...result, demo: true, browserDemo: false };
    } catch {
      const fallback = activateBrowserDemo();
      setToken(fallback.token);
      return fallback;
    }
  },

  me: () => (isBrowserDemoActive() ? demoStore.me() : request('/auth/me')),

  getDecks: () => (isBrowserDemoActive() ? demoStore.getDecks() : request('/decks')),

  getSummary: () =>
    isBrowserDemoActive() ? demoStore.getSummary() : request('/decks/stats/summary'),

  getDeck: (deckId) =>
    isBrowserDemoActive() ? demoStore.getDeck(deckId) : request(`/decks/${deckId}`),

  createDeck: (data) =>
    isBrowserDemoActive()
      ? demoStore.createDeck(data)
      : request('/decks', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

  updateDeck: (deckId, data) =>
    isBrowserDemoActive()
      ? demoStore.updateDeck(deckId, data)
      : request(`/decks/${deckId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),

  duplicateDeck: (deckId) =>
    isBrowserDemoActive()
      ? demoStore.duplicateDeck(deckId)
      : request(`/decks/${deckId}/duplicate`, {
          method: 'POST',
        }),

  deleteDeck: (deckId) =>
    isBrowserDemoActive()
      ? demoStore.deleteDeck(deckId)
      : request(`/decks/${deckId}`, {
          method: 'DELETE',
        }),

  generateOutline: (deckId) =>
    isBrowserDemoActive()
      ? demoStore.generateOutline(deckId)
      : request(
          `/decks/${deckId}/outline/generate`,
          { method: 'POST' },
          AI_TIMEOUT_MS
        ),

  getOutline: (deckId) =>
    isBrowserDemoActive()
      ? demoStore.getOutline(deckId)
      : request(`/decks/${deckId}/outline`),

  updateOutline: (deckId, sections) =>
    isBrowserDemoActive()
      ? demoStore.updateOutline(deckId, sections)
      : request(`/decks/${deckId}/outline`, {
          method: 'PUT',
          body: JSON.stringify({ sections }),
        }),

  generateSlides: (deckId) =>
    isBrowserDemoActive()
      ? demoStore.generateSlides(deckId)
      : request(
          `/decks/${deckId}/slides/generate`,
          { method: 'POST' },
          AI_TIMEOUT_MS
        ),

  getSlides: (deckId) =>
    isBrowserDemoActive()
      ? demoStore.getSlides(deckId)
      : request(`/decks/${deckId}/slides`),

  createSlide: (deckId, data = {}) =>
    isBrowserDemoActive()
      ? demoStore.createSlide(deckId, data)
      : request(`/decks/${deckId}/slides`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),

  duplicateSlide: (slideId) =>
    isBrowserDemoActive()
      ? demoStore.duplicateSlide(slideId)
      : request(`/slides/${slideId}/duplicate`, {
          method: 'POST',
        }),

  deleteSlide: (slideId) =>
    isBrowserDemoActive()
      ? demoStore.deleteSlide(slideId)
      : request(`/slides/${slideId}`, {
          method: 'DELETE',
        }),

  reorderSlides: (deckId, slideIds) =>
    isBrowserDemoActive()
      ? demoStore.reorderSlides(deckId, slideIds)
      : request(`/decks/${deckId}/slides/reorder`, {
          method: 'PATCH',
          body: JSON.stringify({ slideIds }),
        }),

  exportPptx: (deckId) =>
    isBrowserDemoActive()
      ? demoStore.exportPptx(deckId)
      : downloadRequest(`/decks/${deckId}/export/pptx`, {
          method: 'POST',
        }),

  getExports: (deckId) =>
    isBrowserDemoActive()
      ? demoStore.getExports(deckId)
      : request(`/decks/${deckId}/exports`),

  updateSlide: (slideId, data) =>
    isBrowserDemoActive()
      ? demoStore.updateSlide(slideId, data)
      : request(`/slides/${slideId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),

  regenerateSlide: (slideId, instruction) =>
    isBrowserDemoActive()
      ? demoStore.regenerateSlide(slideId, instruction)
      : request(
          `/slides/${slideId}/regenerate`,
          {
            method: 'POST',
            body: JSON.stringify({ instruction }),
          },
          AI_TIMEOUT_MS
        ),

  getSlideVersions: (slideId) =>
    isBrowserDemoActive()
      ? demoStore.getSlideVersions(slideId)
      : request(`/slides/${slideId}/versions`),

  restoreSlideVersion: (slideId, versionId) =>
    isBrowserDemoActive()
      ? demoStore.restoreSlideVersion(slideId, versionId)
      : request(`/slides/${slideId}/versions/${versionId}/restore`, {
          method: 'POST',
        }),
};
