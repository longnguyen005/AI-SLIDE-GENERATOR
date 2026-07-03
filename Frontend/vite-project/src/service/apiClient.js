const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getToken() {
  return localStorage.getItem('deckai_token');
}

export function setToken(token) {
  localStorage.setItem('deckai_token', token);
}

export function clearToken() {
  localStorage.removeItem('deckai_token');
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');

  if (!response.ok) {
    const error = isJson ? await response.json() : { message: 'Request failed' };
    if (response.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
      clearToken();
      window.location.assign('/login');
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

async function downloadRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const error = isJson ? await response.json() : { message: 'Download failed' };
    if (response.status === 401) {
      clearToken();
      window.location.assign('/login');
    }
    throw new Error(error.message || 'Download failed');
  }

  return {
    blob: await response.blob(),
    fileName: fileNameFromDisposition(response.headers.get('content-disposition')) || 'deckai-export.pptx'
  };
}

export const api = {
  register: (data) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  login: (data) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  me: () => request('/auth/me'),

  getDecks: () => request('/decks'),

  getDeck: (deckId) => request(`/decks/${deckId}`),

  createDeck: (data) =>
    request('/decks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateDeck: (deckId, data) =>
    request(`/decks/${deckId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  generateOutline: (deckId) =>
    request(`/decks/${deckId}/outline/generate`, {
      method: 'POST'
    }),

  getOutline: (deckId) =>
    request(`/decks/${deckId}/outline`),

  updateOutline: (deckId, sections) =>
    request(`/decks/${deckId}/outline`, {
      method: 'PUT',
      body: JSON.stringify({ sections })
    }),

  generateSlides: (deckId) =>
    request(`/decks/${deckId}/slides/generate`, {
      method: 'POST'
    }),

  getSlides: (deckId) =>
    request(`/decks/${deckId}/slides`),

  exportPptx: (deckId) =>
    downloadRequest(`/decks/${deckId}/export/pptx`, {
      method: 'POST'
    }),

  getExports: (deckId) =>
    request(`/decks/${deckId}/exports`),

  updateSlide: (slideId, data) =>
    request(`/slides/${slideId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  regenerateSlide: (slideId, instruction) =>
    request(`/slides/${slideId}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ instruction })
    })
};
