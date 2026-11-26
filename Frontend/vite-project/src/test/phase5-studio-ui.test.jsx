import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { api, clearToken } from '../service/apiClient';
import { deactivateBrowserDemo } from '../service/demoStore';

describe('Phase 5 Studio & Showcase UI: Outline Layout Selector, Scoped RegenerateModal & 8-Layout HeroShowcase', () => {
  let originalFetch;

  beforeEach(async () => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
    sessionStorage.clear();
    clearToken();
    deactivateBrowserDemo();
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline browser demo'));
    await api.loginDemo();
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('allows selecting a per-section Target Layout on OutlinePage and generates matching slide layouts', async () => {
    render(
      <MemoryRouter initialEntries={['/outline/demo-deck-outline']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /outline editor/i })).toBeInTheDocument();

    const section2LayoutSelect = screen.getByLabelText('Target layout for section 2');
    const section3LayoutSelect = screen.getByLabelText('Target layout for section 3');
    expect(section2LayoutSelect).toHaveValue('callout');
    expect(section3LayoutSelect).toHaveValue('metrics');

    // Selecting 'metrics' on Section 2 clears unpinned Section 3's colliding 'metrics' to Auto ('')
    fireEvent.change(section2LayoutSelect, { target: { value: 'metrics' } });
    expect(section2LayoutSelect).toHaveValue('metrics');
    expect(section3LayoutSelect).toHaveValue('');

    // Trigger Generate Slides -> confirm dialog -> lands on PreviewPage
    fireEvent.click(screen.getAllByRole('button', { name: /generate slides/i })[0]);
    const confirmDialog = await screen.findByRole('dialog');
    fireEvent.click(within(confirmDialog).getByRole('button', { name: /generate slides/i }));

    expect(await screen.findByRole('heading', { name: /presentation preview/i })).toBeInTheDocument();
    const nextBtn = await screen.findByRole('button', { name: /^next$/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(document.querySelector('.slide-canvas--metrics')).toBeInTheDocument();
    });

    // Slide 3 must NOT collide with Slide 2's 'metrics' layout
    fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(document.querySelector('.slide-canvas--metrics')).not.toBeInTheDocument();
    });
  });

  it('exposes all 8 layouts in EditorPage, flushes unsaved inline drafts before Speaker Notes Only regeneration, and converts layout via preset', async () => {
    const updateSlideSpy = vi.spyOn(api, 'updateSlide');
    const regenerateSpy = vi.spyOn(api, 'regenerateSlide');

    render(
      <MemoryRouter initialEntries={['/editor/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Enterprise AI Copilots: 2026 Rollout Blueprint')
    ).toBeInTheDocument();

    const propsPanel = screen.getByLabelText('Slide properties');
    for (const label of [
      'Title Cover',
      'Section Divider',
      'Standard Content',
      'Two Column',
      'KPI Metrics',
      'Roadmap Flow',
      'Thesis Callout',
      'Executive Summary',
    ]) {
      expect(within(propsPanel).getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    }

    // Select Slide 3 (Standard Content)
    fireEvent.click(
      screen.getByRole('button', {
        name: /Targeted Knowledge Workflows Deliver 34% Faster Cycle Times/i,
      })
    );

    const titleInput = await screen.findByLabelText(/slide title/i);
    const notesTextarea = screen.getByLabelText(/speaker notes/i);
    const initialNotes = notesTextarea.value;

    // Edit headline inline WITHOUT clicking Save changes
    fireEvent.change(titleInput, {
      target: { value: 'Inline Draft Headline Preserved Across Notes Rewrite' },
    });

    // Open RegenerateModal -> switch scope to Speaker Notes Only -> Regenerate
    fireEvent.click(screen.getByRole('button', { name: /regenerate with ai/i }));
    const regenDialog = await screen.findByRole('dialog', { name: /regenerate this slide/i });

    fireEvent.click(within(regenDialog).getByRole('tab', { name: /speaker notes only/i }));
    fireEvent.click(within(regenDialog).getByRole('button', { name: /^regenerate$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /regenerate this slide/i })).not.toBeInTheDocument();
    });

    expect(updateSlideSpy).toHaveBeenCalledWith(
      'demo-slide-3',
      expect.objectContaining({
        title: 'Inline Draft Headline Preserved Across Notes Rewrite',
      })
    );
    expect(regenerateSpy).toHaveBeenCalledWith(
      'demo-slide-3',
      expect.objectContaining({
        target: 'notes',
      })
    );
    expect(screen.getByLabelText(/slide title/i)).toHaveValue(
      'Inline Draft Headline Preserved Across Notes Rewrite'
    );
    expect(screen.getByLabelText(/speaker notes/i).value).not.toBe(initialNotes);

    // Open RegenerateModal again -> click 'Convert to KPI Metrics' preset -> Regenerate
    fireEvent.click(screen.getByRole('button', { name: /regenerate with ai/i }));
    const regenDialog2 = await screen.findByRole('dialog', { name: /regenerate this slide/i });

    fireEvent.click(within(regenDialog2).getByRole('button', { name: /convert to kpi metrics/i }));
    fireEvent.click(within(regenDialog2).getByRole('button', { name: /^regenerate$/i }));

    await waitFor(() => {
      expect(document.querySelector('.slide-canvas--metrics')).toBeInTheDocument();
    });

    // Typing an explicit conversion prompt in Custom instruction (without touching the checkbox) converts layout to timeline
    fireEvent.click(screen.getByRole('button', { name: /regenerate with ai/i }));
    const regenDialog3 = await screen.findByRole('dialog', { name: /regenerate this slide/i });
    fireEvent.change(within(regenDialog3).getByLabelText(/custom instruction/i), {
      target: { value: 'Convert into a 3-phase execution timeline for European launch' },
    });
    fireEvent.click(within(regenDialog3).getByRole('button', { name: /^regenerate$/i }));
    await waitFor(() => {
      expect(document.querySelector('.slide-canvas--timeline')).toBeInTheDocument();
    });

    // Selecting a layout preset and then unchecking 'Allow AI to switch...' unlocks checkbox and preserves timeline
    fireEvent.click(screen.getByRole('button', { name: /regenerate with ai/i }));
    const regenDialog4 = await screen.findByRole('dialog', { name: /regenerate this slide/i });
    fireEvent.click(within(regenDialog4).getByRole('button', { name: /convert to kpi metrics/i }));
    const layoutCheckbox = within(regenDialog4).getByLabelText(
      /allow ai to switch to a better slide layout/i
    );
    expect(layoutCheckbox).toBeChecked();
    fireEvent.click(layoutCheckbox);
    expect(layoutCheckbox).not.toBeChecked();
    fireEvent.click(within(regenDialog4).getByRole('button', { name: /^regenerate$/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /regenerate this slide/i })).not.toBeInTheDocument();
    });
    expect(document.querySelector('.slide-canvas--timeline')).toBeInTheDocument();
  });

  it('renders 8 adaptive slide layouts on LandingPage and HeroShowcase', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    const specsRegion = screen.getByRole('region', { name: /product capabilities/i });
    expect(within(specsRegion).getByText('8')).toBeInTheDocument();
    expect(within(specsRegion).getByText(/adaptive slide layouts/i)).toBeInTheDocument();

    const showcase = screen.getByRole('region', { name: /interactive workspace preview/i });
    expect(within(showcase).getAllByRole('tab')).toHaveLength(8);

    fireEvent.click(within(showcase).getByRole('tab', { name: /kpi metrics/i }));
    expect(showcase.querySelector('.slide-canvas--metrics')).toBeInTheDocument();

    fireEvent.click(within(showcase).getByRole('tab', { name: /roadmap flow/i }));
    expect(showcase.querySelector('.slide-canvas--timeline')).toBeInTheDocument();

    fireEvent.click(within(showcase).getByRole('tab', { name: /thesis callout/i }));
    expect(showcase.querySelector('.slide-canvas--callout')).toBeInTheDocument();
  });
});
