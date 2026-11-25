import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from '../App';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Sidebar from '../components/SideBar/SideBar';
import Topbar from '../components/Topbar/Topbar';
import { api, clearToken, getToken } from '../service/apiClient';

function AuthProbe() {
  const auth = useAuth();
  const location = useLocation();
  return (
    <div data-testid="auth-probe">
      <span data-testid="probe-path">{location.pathname}</span>
      <span data-testid="probe-user">{auth.user?.email || 'none'}</span>
      <span data-testid="probe-demo">{String(auth.isBrowserDemo)}</span>
      <span data-testid="probe-loading">{String(auth.loading)}</span>
      <span data-testid="probe-fns">
        {[
          typeof auth.loginWithToken,
          typeof auth.startInstantDemo,
          typeof auth.logout,
          typeof auth.refreshUser,
        ].join(',')}
      </span>
    </div>
  );
}

describe('Task 3: Frontend AuthContext, Hybrid Browser Demo Fallback & Client PPTX Export', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    localStorage.clear();
    sessionStorage.clear();
  });

  it('activates Browser Demo Mode in sessionStorage when /api/auth/demo fails and persists across reloads without hitting /api/auth/me', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    globalThis.fetch = fetchMock;

    const demoResult = await api.loginDemo();

    expect(demoResult.demo).toBe(true);
    expect(demoResult.browserDemo).toBe(true);
    expect(demoResult.user.email).toBe('demo@deckai.app');
    expect(getToken()).toBeTruthy();

    const rawDemoState = sessionStorage.getItem('deckai_browser_demo_v1');
    expect(rawDemoState).toBeTruthy();
    const parsedState = JSON.parse(rawDemoState);
    expect(parsedState.decks).toHaveLength(2);

    const { decks } = await api.getDecks();
    expect(decks).toHaveLength(2);

    const readyDeck = decks.find((d) => d.status === 'ready');
    const outlineDeck = decks.find((d) => d.status === 'outline_ready');
    expect(readyDeck).toBeDefined();
    expect(outlineDeck).toBeDefined();
    expect(outlineDeck.outline.sections).toHaveLength(5);

    const { slides } = await api.getSlides(readyDeck._id);
    expect(slides).toHaveLength(5);
    expect(new Set(slides.map((s) => s.layout))).toEqual(
      new Set(['title', 'section', 'content', 'two_column', 'summary'])
    );

    const contentSlide = slides.find((s) => s.layout === 'content');
    const { versions } = await api.getSlideVersions(contentSlide._id);
    expect(versions.length).toBeGreaterThanOrEqual(1);

    // Simulate reload: clear fetch mock history and mount AuthProvider on an authenticated route
    fetchMock.mockClear();

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('probe-loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('probe-user')).toHaveTextContent('demo@deckai.app');
    expect(screen.getByTestId('probe-demo')).toHaveTextContent('true');
    expect(screen.getByTestId('probe-fns')).toHaveTextContent('function,function,function,function');
    expect(screen.getByRole('status')).toHaveTextContent(/browser|sandbox|demo/i);
    expect(fetchMock).not.toHaveBeenCalled();

    // Clearing token also clears browser demo mode
    clearToken();
    expect(getToken()).toBeNull();
    expect(sessionStorage.getItem('deckai_browser_demo_v1')).toBeNull();
  });

  it('falls back to Browser Demo Mode when /api/auth/demo times out via AbortController', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn((_url, options = {}) => {
      return new Promise((_resolve, reject) => {
        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }
      });
    });
    globalThis.fetch = fetchMock;

    const loginPromise = api.loginDemo();
    await vi.advanceTimersByTimeAsync(10000);
    const result = await loginPromise;

    expect(result.demo).toBe(true);
    expect(result.browserDemo).toBe(true);
    expect(sessionStorage.getItem('deckai_browser_demo_v1')).toBeTruthy();
  });

  it('supports full CRUD, version restore snapshots, lifecycle guards, and real .pptx Blob export in Browser Demo Mode', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline'));
    await api.loginDemo();

    // 1. createDeck
    const { deck } = await api.createDeck({
      topic: 'Autonomous Supply Chains',
      description: 'Executive briefing on predictive logistics',
      language: 'English',
      tone: 'professional',
      slideCount: 4,
    });
    expect(deck._id).toBeTruthy();
    expect(deck.status).toBe('draft');

    // 2. generateOutline
    const { outline } = await api.generateOutline(deck._id);
    expect(outline.sections).toHaveLength(4);

    // 3. generateSlides
    const { slides: initialSlides } = await api.generateSlides(deck._id);
    expect(initialSlides).toHaveLength(4);
    expect(initialSlides[0].layout).toBe('title');
    expect(initialSlides[3].layout).toBe('summary');

    // 4. updateSlide
    const { slide: updatedFirst } = await api.updateSlide(initialSlides[0]._id, {
      title: 'Updated Supply Chain Vision',
      layout: 'two_column',
    });
    expect(updatedFirst.title).toBe('Updated Supply Chain Vision');
    expect(updatedFirst.layout).toBe('two_column');

    // 5. createSlide
    const { slide: createdSlide } = await api.createSlide(deck._id, {
      title: 'Risk Mitigation Matrix',
      content: ['Multi-region supplier redundancy', 'Automated buffer stock triggers'],
      speakerNotes: 'Highlight supplier diversification.',
      layout: 'section',
    });
    expect(createdSlide.slideNumber).toBe(5);

    // 6. reorderSlides
    const currentSlides = (await api.getSlides(deck._id)).slides;
    const reversedIds = [...currentSlides].reverse().map((s) => s._id);
    const { slides: reorderedSlides } = await api.reorderSlides(deck._id, reversedIds);
    expect(reorderedSlides[0]._id).toBe(createdSlide._id);
    expect(reorderedSlides[0].slideNumber).toBe(1);

    // 7. regenerateSlide & getSlideVersions
    const { slide: regeneratedSlide } = await api.regenerateSlide(
      createdSlide._id,
      'Quantify Q4 margin improvements'
    );
    expect(regeneratedSlide._id).toBe(createdSlide._id);
    expect(regeneratedSlide.title).not.toBe('');

    const { versions: versionsAfterRegen } = await api.getSlideVersions(createdSlide._id);
    expect(versionsAfterRegen).toHaveLength(1);
    expect(versionsAfterRegen[0].title).toBe('Risk Mitigation Matrix');

    // 8. restoreSlideVersion snapshots current slide before restoring
    const { slide: restoredSlide } = await api.restoreSlideVersion(
      createdSlide._id,
      versionsAfterRegen[0]._id
    );
    expect(restoredSlide.title).toBe('Risk Mitigation Matrix');

    const { versions: versionsAfterRestore } = await api.getSlideVersions(createdSlide._id);
    expect(versionsAfterRestore).toHaveLength(2);

    // 9. exportPptx returns a real OOXML .pptx Blob
    const exported = await api.exportPptx(deck._id);
    expect(exported.blob).toBeInstanceOf(Blob);
    expect(exported.blob.size).toBeGreaterThan(1000);
    expect(exported.fileName).toMatch(/\.pptx$/);
    const headerBytes = new Uint8Array(await exported.blob.arrayBuffer());
    expect(headerBytes[0]).toBe(0x50); // 'P'
    expect(headerBytes[1]).toBe(0x4b); // 'K'

    const summaryAfterExport = await api.getSummary();
    expect(summaryAfterExport.totalExports).toBeGreaterThanOrEqual(1);

    // 10. Last-slide deletion guard & deleteDeck
    const slidesBeforeDelete = (await api.getSlides(deck._id)).slides;
    for (let i = 0; i < slidesBeforeDelete.length - 1; i += 1) {
      await api.deleteSlide(slidesBeforeDelete[i]._id);
    }
    const lastRemaining = (await api.getSlides(deck._id)).slides;
    expect(lastRemaining).toHaveLength(1);
    await expect(api.deleteSlide(lastRemaining[0]._id)).rejects.toThrow(/last|remaining/i);

    await api.deleteDeck(deck._id);
    const remainingDecks = (await api.getDecks()).decks;
    expect(remainingDecks.find((d) => d._id === deck._id)).toBeUndefined();
  });

  it('clicking "Try Instant Demo" on LandingPage logs in via startInstantDemo and navigates to /dashboard', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Backend sleeping'));

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    const demoBtn = screen.getByRole('button', { name: /try instant demo/i });
    fireEvent.click(demoBtn);

    expect(await screen.findByRole('heading', { name: /presentations/i })).toBeInTheDocument();
    expect(await screen.findByText(/Enterprise AI Copilots: 2026 Rollout Blueprint/i)).toBeInTheDocument();
  });

  it('SideBar and Topbar consume useAuth() without firing duplicate GET /api/auth/me requests', async () => {
    localStorage.setItem('deckai_token', 'jwt-live-token');

    const fetchMock = vi.fn(async (url) => {
      if (String(url).endsWith('/auth/me')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            user: {
              id: 'user-42',
              fullName: 'Evelyn Vance',
              email: 'evelyn@deckai.app',
              createdAt: '2026-02-01T12:00:00.000Z',
            },
          }),
        };
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    globalThis.fetch = fetchMock;

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Sidebar />
          <Topbar title="Presentations" />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Evelyn Vance')).toBeInTheDocument();
    expect(screen.getAllByText('EV').length).toBeGreaterThanOrEqual(2);

    const meCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/me'));
    expect(meCalls).toHaveLength(1);
  });
});
