import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import SlideCanvas from '../components/SlideCanvas/SlideCanvas';
import { api } from '../service/apiClient';

describe('Phase 4 Studio Power-Tools, Deck Themes & Dashboard Duplication', () => {
  let originalFetch;

  beforeEach(async () => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
    sessionStorage.clear();
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline demo mode'));
    await api.loginDemo();
    globalThis.fetch.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    localStorage.clear();
    sessionStorage.clear();
  });

  it('applies normalized data-deck-theme on SlideCanvas and supports Deck color theme selection on CreatePresentationPage', async () => {
    const { container, unmount } = render(
      <div>
        <SlideCanvas slide={{ slideNumber: 1, title: 'Default Theme' }} />
        <SlideCanvas slide={{ slideNumber: 2, title: 'Emerald Theme' }} theme="emerald" />
        <SlideCanvas slide={{ slideNumber: 3, title: 'Fallback Theme' }} theme="unknown-theme" />
      </div>
    );

    const canvases = container.querySelectorAll('.slide-canvas');
    expect(canvases[0]).toHaveAttribute('data-deck-theme', 'indigo');
    expect(canvases[1]).toHaveAttribute('data-deck-theme', 'emerald');
    expect(canvases[2]).toHaveAttribute('data-deck-theme', 'indigo');
    unmount();

    const updateDeckSpy = vi.spyOn(api, 'updateDeck');
    render(
      <MemoryRouter initialEntries={['/create?deckId=demo-deck-outline']}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByDisplayValue('Long-Duration Battery Storage for Industrial Microgrids')
    ).toBeInTheDocument();

    const themeGroup = screen.getByRole('radiogroup', { name: /deck color theme/i });
    const emeraldRadio = within(themeGroup).getByRole('radio', { name: /venture emerald/i });
    const coralRadio = within(themeGroup).getByRole('radio', { name: /keynote coral/i });
    expect(emeraldRadio).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(coralRadio);
    expect(coralRadio).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByRole('button', { name: /update outline/i }));
    await waitFor(() => {
      expect(updateDeckSpy).toHaveBeenCalledWith(
        'demo-deck-outline',
        expect.objectContaining({ theme: 'coral' })
      );
    });
  });

  it('preserves unsaved drafts across slide switches, saves on Ctrl+S, renames deck inline, switches deck theme, and duplicates slides in EditorPage', async () => {
    const updateSlideSpy = vi.spyOn(api, 'updateSlide');
    const updateDeckSpy = vi.spyOn(api, 'updateDeck');
    const duplicateSlideSpy = vi.spyOn(api, 'duplicateSlide');

    const { container } = render(
      <MemoryRouter initialEntries={['/editor/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );

    const titleInput = await screen.findByLabelText(/slide title/i);
    expect(titleInput).toHaveValue(
      'Scaling Enterprise AI Copilots Without Compromising Governance'
    );

    // 1. Edit Slide 1 without saving, switch to Slide 2, then return to Slide 1 -> draft stays intact!
    fireEvent.change(titleInput, {
      target: { value: 'Unsaved Executive Charter Headline' },
    });
    expect(screen.getByText(/unsaved edits/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Phase 1: High-Impact Workflows and Baseline Bottlenecks/i,
      })
    );
    expect(screen.getByLabelText(/slide title/i)).toHaveValue(
      'Phase 1: High-Impact Workflows and Baseline Bottlenecks'
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /Unsaved Executive Charter Headline/i,
      })
    );
    expect(screen.getByLabelText(/slide title/i)).toHaveValue(
      'Unsaved Executive Charter Headline'
    );

    // 2. Press Ctrl+S to save Slide 1
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    await waitFor(() => {
      expect(updateSlideSpy).toHaveBeenCalledWith(
        'demo-slide-1',
        expect.objectContaining({ title: 'Unsaved Executive Charter Headline' })
      );
    });
    await waitFor(() => {
      expect(screen.getByText(/all changes saved/i)).toBeInTheDocument();
    });

    // 3. Switch Deck Theme in Editor properties -> updates SlideCanvas & calls api.updateDeck
    const themeGroup = screen.getByRole('radiogroup', { name: /deck color theme/i });
    fireEvent.click(within(themeGroup).getByRole('radio', { name: /editorial amber/i }));
    await waitFor(() => {
      expect(updateDeckSpy).toHaveBeenCalledWith('demo-deck-ready', { theme: 'amber' });
    });
    expect(container.querySelector('.slide-canvas')).toHaveAttribute('data-deck-theme', 'amber');

    // 4. Inline Deck Title Rename (Escape cancels, Enter saves)
    fireEvent.click(screen.getByRole('button', { name: /rename deck title/i }));
    const deckTitleInput = screen.getByLabelText(/^deck title$/i);
    fireEvent.change(deckTitleInput, { target: { value: 'Cancelled Title' } });
    fireEvent.keyDown(deckTitleInput, { key: 'Escape' });
    expect(screen.queryByLabelText(/^deck title$/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /rename deck title/i }));
    const deckTitleInput2 = screen.getByLabelText(/^deck title$/i);
    fireEvent.change(deckTitleInput2, { target: { value: 'AI Governance Board Deck 2026' } });
    fireEvent.keyDown(deckTitleInput2, { key: 'Enter' });

    await waitFor(() => {
      expect(updateDeckSpy).toHaveBeenCalledWith('demo-deck-ready', {
        title: 'AI Governance Board Deck 2026',
      });
    });
    expect(await screen.findByText('AI Governance Board Deck 2026')).toBeInTheDocument();

    // 5. Duplicate active slide
    fireEvent.click(screen.getByRole('button', { name: /duplicate slide/i }));
    await waitFor(() => {
      expect(duplicateSlideSpy).toHaveBeenCalledWith('demo-slide-1');
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/slide title/i).value).toContain('(Copy)');
    });
  });

  it('duplicates a deck directly from DashboardPage DeckCard quick actions', async () => {
    const duplicateDeckSpy = vi.spyOn(api, 'duplicateDeck');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Enterprise AI Copilots: 2026 Rollout Blueprint')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Duplicate Enterprise AI Copilots: 2026 Rollout Blueprint/i,
      })
    );

    await waitFor(() => {
      expect(duplicateDeckSpy).toHaveBeenCalledWith('demo-deck-ready');
    });
    expect(
      await screen.findByText('Enterprise AI Copilots: 2026 Rollout Blueprint (Copy)')
    ).toBeInTheDocument();
  });

  it('supports Presenter View console (live timer, Up Next preview, teleprompter scale, and Space/P/N shortcuts) with deck theme forwarding', async () => {
    await api.updateDeck('demo-deck-ready', { theme: 'emerald' });

    const { container } = render(
      <MemoryRouter initialEntries={['/preview/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: /presentation preview/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(container.querySelector('.slide-canvas')).toHaveAttribute(
        'data-deck-theme',
        'emerald'
      );
    });

    vi.useFakeTimers();
    try {
      const presenterBtn = screen.getByRole('button', { name: /presenter view/i });
      expect(presenterBtn).toHaveAttribute('aria-pressed', 'false');

      // Guard: Space while focused on a button must NOT advance slides
      presenterBtn.focus();
      fireEvent.keyDown(presenterBtn, { key: ' ' });
      expect(screen.getByText('1 / 5')).toBeInTheDocument();

      // Open Presenter View
      fireEvent.click(presenterBtn);
      expect(presenterBtn).toHaveAttribute('aria-pressed', 'true');

      const consoleRegion = screen.getByRole('region', { name: /presenter console/i });
      expect(within(consoleRegion).getByText('00:00')).toBeInTheDocument();
      expect(
        within(consoleRegion).getByText(
          'Phase 1: High-Impact Workflows and Baseline Bottlenecks'
        )
      ).toBeInTheDocument();

      // Timer ticks forward when running, pauses, and resets cleanly
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(within(consoleRegion).getByText('00:03')).toBeInTheDocument();

      fireEvent.click(within(consoleRegion).getByRole('button', { name: /pause timer/i }));
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(within(consoleRegion).getByText('00:03')).toBeInTheDocument();

      fireEvent.click(within(consoleRegion).getByRole('button', { name: /reset timer/i }));
      expect(within(consoleRegion).getByText('00:00')).toBeInTheDocument();

      // Teleprompter large-text toggle
      const largeNotesBtn = within(consoleRegion).getByRole('button', { name: /large notes/i });
      expect(largeNotesBtn).toHaveAttribute('aria-pressed', 'false');
      fireEvent.click(largeNotesBtn);
      expect(largeNotesBtn).toHaveAttribute('aria-pressed', 'true');

      // Space on document.body advances slides; final slide shows "End of presentation"
      document.body.focus();
      for (let step = 0; step < 4; step += 1) {
        fireEvent.keyDown(window, { key: ' ' });
      }
      expect(screen.getByText('5 / 5')).toBeInTheDocument();
      expect(within(consoleRegion).getByText(/end of presentation/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('mounts all themed slides inside .preview-print-deck only during Print / PDF execution and cleans up afterward', async () => {
    await api.updateDeck('demo-deck-ready', { theme: 'coral' });

    let canvasesDuringPrint = 0;
    let printThemeAttr = '';
    const originalPrint = window.print;
    window.print = vi.fn(() => {
      const printDeck = document.querySelector('.preview-print-deck');
      const printCanvases = printDeck ? printDeck.querySelectorAll('.slide-canvas') : [];
      canvasesDuringPrint = printCanvases.length;
      printThemeAttr = printCanvases[0]?.getAttribute('data-deck-theme') || '';
    });

    try {
      const { container } = render(
        <MemoryRouter initialEntries={['/preview/demo-deck-ready']}>
          <App />
        </MemoryRouter>
      );

      expect(
        await screen.findByRole('heading', { name: /presentation preview/i })
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(container.querySelector('.slide-canvas')).toHaveAttribute(
          'data-deck-theme',
          'coral'
        );
      });

      // Only 1 active SlideCanvas mounted during normal screen mode
      expect(container.querySelectorAll('.slide-canvas')).toHaveLength(1);
      expect(container.querySelector('.preview-print-deck')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /print \/ pdf/i }));
      expect(window.print).toHaveBeenCalledTimes(1);
      expect(canvasesDuringPrint).toBe(5);
      expect(printThemeAttr).toBe('coral');

      // Immediately unmounts print deck after window.print() returns
      expect(container.querySelector('.preview-print-deck')).not.toBeInTheDocument();
      expect(container.querySelectorAll('.slide-canvas')).toHaveLength(1);

      // Native Ctrl/Cmd+P beforeprint mounts .preview-print-deck synchronously via flushSync
      window.dispatchEvent(new Event('beforeprint'));
      expect(container.querySelector('.preview-print-deck')).toBeInTheDocument();
      expect(container.querySelectorAll('.preview-print-deck .slide-canvas')).toHaveLength(5);

      window.dispatchEvent(new Event('afterprint'));
      expect(container.querySelector('.preview-print-deck')).not.toBeInTheDocument();
    } finally {
      window.print = originalPrint;
    }

    // Verify @media print color fidelity, opacity: 1 reset, dark-mode print reset, and @media screen breakpoint scoping
    const previewCss = fs.readFileSync(
      path.resolve('src/pages/PreviewPage/PreviewPage.css'),
      'utf8'
    );
    const slideCanvasCss = fs.readFileSync(
      path.resolve('src/components/SlideCanvas/SlideCanvas.css'),
      'utf8'
    );
    const tokensCss = fs.readFileSync(path.resolve('src/styles/tokens.css'), 'utf8');
    const deskCardCss = fs.readFileSync(
      path.resolve('src/components/DeskCard/DeskCard.css'),
      'utf8'
    );

    expect(previewCss).toMatch(/print-color-adjust:\s*exact/);
    expect(previewCss).toMatch(/\.preview-print-deck[\s\S]*?animation:\s*none\s*!important/);
    expect(previewCss).toMatch(/\.preview-print-deck[\s\S]*?opacity:\s*1\s*!important/);
    expect(slideCanvasCss).toContain('@media screen and (max-width: 1100px)');
    expect(slideCanvasCss).toContain('@media screen and (max-width: 760px)');
    expect(tokensCss).toMatch(/@media\s+print[\s\S]*?:root\[data-theme="dark"\]/);
    expect(deskCardCss).not.toMatch(/\.deck-card__cover--simple[^{]*\{[^}]*--success/);
  });

  it('flushes unsaved multi-slide drafts before Preview navigation, Duplicate slide, cross-slide Save, and guards out-of-order theme updates & modal shortcuts', async () => {
    const updateSlideSpy = vi.spyOn(api, 'updateSlide');

    const { unmount } = render(
      <MemoryRouter initialEntries={['/editor/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );

    const titleInput = await screen.findByLabelText(/slide title/i);

    // 1. Edit Slide 1, switch to Slide 2 without editing Slide 2, click Save changes -> flushes dirty Slide 1!
    fireEvent.change(titleInput, { target: { value: 'Cross-Slide Flushed Title' } });
    fireEvent.click(
      screen.getByRole('button', {
        name: /Phase 1: High-Impact Workflows and Baseline Bottlenecks/i,
      })
    );
    updateSlideSpy.mockClear();

    fireEvent.click(screen.getAllByRole('button', { name: /save changes/i })[0]);
    await waitFor(() => {
      expect(updateSlideSpy).toHaveBeenCalledTimes(1);
      expect(updateSlideSpy).toHaveBeenCalledWith(
        'demo-slide-1',
        expect.objectContaining({ title: 'Cross-Slide Flushed Title' })
      );
    });
    await waitFor(() => {
      expect(screen.getByText(/all changes saved/i)).toBeInTheDocument();
    });

    // 2. Edit Slide 2 and click Duplicate slide without manual Save -> flushes Slide 2 first so copy gets edited title!
    fireEvent.change(screen.getByLabelText(/slide title/i), {
      target: { value: 'Freshly Edited Before Copy' },
    });
    fireEvent.click(screen.getByRole('button', { name: /duplicate slide/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/slide title/i)).toHaveValue(
        'Freshly Edited Before Copy (Copy)'
      );
    });

    // 3. Out-of-order Deck Theme race: slow first request must NOT overwrite newer second theme selection
    let resolveSlowEmerald;
    const realUpdateDeck = api.updateDeck.bind(api);
    const updateDeckRaceSpy = vi
      .spyOn(api, 'updateDeck')
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSlowEmerald = () =>
              resolve({ deck: { _id: 'demo-deck-ready', theme: 'emerald', status: 'ready' } });
          })
      )
      .mockImplementation((id, payload) => realUpdateDeck(id, payload));

    const themeGroup = screen.getByRole('radiogroup', { name: /deck color theme/i });
    fireEvent.click(within(themeGroup).getByRole('radio', { name: /venture emerald/i }));
    fireEvent.click(within(themeGroup).getByRole('radio', { name: /keynote coral/i }));

    await waitFor(() => {
      expect(document.querySelector('.slide-canvas')).toHaveAttribute('data-deck-theme', 'coral');
    });

    await act(async () => {
      resolveSlowEmerald();
    });
    expect(document.querySelector('.slide-canvas')).toHaveAttribute('data-deck-theme', 'coral');
    updateDeckRaceSpy.mockRestore();

    // 4. Edit current slide and click Preview link -> flushes draft before navigating to PreviewPage!
    fireEvent.change(screen.getByLabelText(/slide title/i), {
      target: { value: 'Auto-Flushed Into Preview' },
    });
    fireEvent.click(screen.getByRole('link', { name: /^preview$/i }));

    expect(
      await screen.findByRole('heading', { name: /presentation preview/i })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /Auto-Flushed Into Preview/i })
    ).toBeInTheDocument();

    // 5. Open Shortcuts & tips modal on PreviewPage -> Space, ArrowRight, and P must NOT fire behind dialog
    fireEvent.click(screen.getByRole('button', { name: /shortcuts & tips/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: ' ' });
    fireEvent.keyDown(window, { key: 'p' });
    expect(screen.getByText('1 / 6')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /presenter console/i })).not.toBeInTheDocument();

    unmount();
  });
});
