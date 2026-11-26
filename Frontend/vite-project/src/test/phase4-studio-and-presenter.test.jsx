import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
});
