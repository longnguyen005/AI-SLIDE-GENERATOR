import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import SlideCanvas from '../components/SlideCanvas/SlideCanvas';
import { api } from '../service/apiClient';

describe('Task 4: Connected EditorPage, 5-Layout SlideCanvas & Workspace Polish', () => {
  let originalFetch;

  beforeEach(async () => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
    sessionStorage.clear();
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline sandbox test'));
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

  it('loads real deck title and slides for /editor/:deckId with zero hardcoded fintech copy', async () => {
    render(
      <MemoryRouter initialEntries={['/editor/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Enterprise AI Copilots: 2026 Rollout Blueprint')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        name: 'Scaling Enterprise AI Copilots Without Compromising Governance',
      })
    ).toBeInTheDocument();

    expect(screen.queryByText(/Market Analysis: Fintech Growth/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /regenerate this slide/i })).not.toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('edits slide title, bullets, two_column layout, and speaker notes then saves via api.updateSlide', async () => {
    const updateSlideSpy = vi.spyOn(api, 'updateSlide');

    const { container } = render(
      <MemoryRouter initialEntries={['/editor/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );

    const titleInput = await screen.findByLabelText(/slide title/i);
    expect(titleInput).toHaveValue(
      'Scaling Enterprise AI Copilots Without Compromising Governance'
    );

    fireEvent.change(titleInput, {
      target: { value: 'Executive AI Governance Charter' },
    });

    const firstBulletInput = screen.getByLabelText('Bullet 1');
    fireEvent.change(firstBulletInput, {
      target: { value: 'Unified policy layer across engineering and GTM.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /add bullet/i }));
    const fourthBulletInput = screen.getByLabelText('Bullet 4');
    fireEvent.change(fourthBulletInput, {
      target: { value: 'Automated SOC2 control attestation on every prompt.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /two column/i }));
    expect(container.querySelector('.slide-canvas--two_column')).toBeInTheDocument();

    const notesInput = screen.getByLabelText(/speaker notes/i);
    fireEvent.change(notesInput, {
      target: { value: 'Emphasize audit readiness before Q4 seat expansion.' },
    });

    fireEvent.click(screen.getAllByRole('button', { name: /save changes/i })[0]);

    await waitFor(() => {
      expect(updateSlideSpy).toHaveBeenCalledWith('demo-slide-1', {
        title: 'Executive AI Governance Charter',
        content: [
          'Unified policy layer across engineering and GTM.',
          'Anchor deployment on three measurable workflows before expanding organization-wide.',
          'Pair model routing controls with role-scoped retrieval from day one.',
          'Automated SOC2 control attestation on every prompt.',
        ],
        layout: 'two_column',
        speakerNotes: 'Emphasize audit readiness before Q4 seat expansion.',
      });
    });

    expect(
      await screen.findByRole('heading', { name: 'Executive AI Governance Charter' })
    ).toBeInTheDocument();
  });

  it('invokes createSlide, reorderSlides, and deleteSlide and disables Remove slide when 1 slide remains', async () => {
    const { deck } = await api.createDeck({
      topic: 'Edge Inference Economics',
      slideCount: 2,
    });
    await api.updateOutline(deck._id, [
      { id: 's1', title: 'Latency Baseline', summary: 'Measure p99 edge response.' },
      { id: 's2', title: 'Hardware Sizing', summary: 'Compare GPU vs NPU nodes.' },
    ]);
    const { slides: seededSlides } = await api.generateSlides(deck._id);
    expect(seededSlides).toHaveLength(2);

    const createSlideSpy = vi.spyOn(api, 'createSlide');
    const reorderSlidesSpy = vi.spyOn(api, 'reorderSlides');
    const deleteSlideSpy = vi.spyOn(api, 'deleteSlide');

    render(
      <MemoryRouter initialEntries={[`/editor/${deck._id}`]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByLabelText(/slide title/i)).toHaveValue('Latency Baseline');

    // Add slide (2 -> 3 slides)
    fireEvent.click(screen.getAllByRole('button', { name: /add slide/i })[0]);
    await waitFor(() => {
      expect(createSlideSpy).toHaveBeenCalledWith(deck._id, expect.any(Object));
    });
    const createdSlideId = (await createSlideSpy.mock.results[0].value).slide._id;

    // Newly added slide is selected at index 2 (3rd slide): Move up swaps it to index 1
    const moveUpBtn = screen.getByRole('button', { name: /move slide up/i });
    const moveDownBtn = screen.getByRole('button', { name: /move slide down/i });
    expect(moveDownBtn).toBeDisabled();
    expect(moveUpBtn).not.toBeDisabled();

    fireEvent.click(moveUpBtn);
    await waitFor(() => {
      expect(reorderSlidesSpy).toHaveBeenCalledWith(deck._id, [
        seededSlides[0]._id,
        createdSlideId,
        seededSlides[1]._id,
      ]);
    });

    // Now at index 1, Move down swaps it back to index 2
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /move slide down/i })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole('button', { name: /move slide down/i }));
    await waitFor(() => {
      expect(reorderSlidesSpy).toHaveBeenCalledWith(deck._id, [
        seededSlides[0]._id,
        seededSlides[1]._id,
        createdSlideId,
      ]);
    });

    // Remove two slides until only 1 slide remains
    const removeBtn = screen.getByRole('button', { name: /remove slide/i });
    expect(removeBtn).not.toBeDisabled();
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(deleteSlideSpy).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove slide/i })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole('button', { name: /remove slide/i }));

    await waitFor(() => {
      expect(deleteSlideSpy).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove slide/i })).toBeDisabled();
    });
  });

  it('opens Version history, loads api.getSlideVersions, and restores a snapshot via api.restoreSlideVersion', async () => {
    const getVersionsSpy = vi.spyOn(api, 'getSlideVersions');
    const restoreVersionSpy = vi.spyOn(api, 'restoreSlideVersion');

    render(
      <MemoryRouter initialEntries={['/editor/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Enterprise AI Copilots: 2026 Rollout Blueprint')
    ).toBeInTheDocument();

    // Select Slide 3 which has pre-seeded version 1 in demoStore
    fireEvent.click(
      screen.getByRole('button', {
        name: /Targeted Knowledge Workflows Deliver 34% Faster Cycle Times/i,
      })
    );

    expect(await screen.findByLabelText(/slide title/i)).toHaveValue(
      'Targeted Knowledge Workflows Deliver 34% Faster Cycle Times'
    );

    fireEvent.click(screen.getAllByRole('button', { name: /version history/i })[0]);

    await waitFor(() => {
      expect(getVersionsSpy).toHaveBeenCalledWith('demo-slide-3');
    });

    const dialog = await screen.findByRole('dialog', { name: /version history/i });
    expect(
      await within(dialog).findByText('Knowledge Workflows Show Promising Early Productivity Gains')
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: /restore/i }));

    await waitFor(() => {
      expect(restoreVersionSpy).toHaveBeenCalledWith('demo-slide-3', 'demo-version-1');
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/slide title/i)).toHaveValue(
        'Knowledge Workflows Show Promising Early Productivity Gains'
      );
    });
    expect(
      screen.getByRole('heading', {
        name: 'Knowledge Workflows Show Promising Early Productivity Gains',
      })
    ).toBeInTheDocument();
  });

  it('distinguishes all 5 SlideCanvas layouts and wires Dashboard search, Delete, and Preview <-> Editor links', async () => {
    const samplePoints = [
      'First strategic pillar with measurable telemetry.',
      'Second operational milestone for Q2 rollout.',
      'Third governance control for enterprise compliance.',
      'Fourth adoption benchmark across target teams.',
    ];

    const { container, unmount } = render(
      <div>
        <SlideCanvas slide={{ slideNumber: 1, title: 'Cover Layout', content: samplePoints, layout: 'title' }} />
        <SlideCanvas slide={{ slideNumber: 2, title: 'Divider Layout', content: samplePoints, layout: 'section' }} />
        <SlideCanvas slide={{ slideNumber: 3, title: 'Content Layout', content: samplePoints, layout: 'content' }} />
        <SlideCanvas slide={{ slideNumber: 4, title: 'Split Layout', content: samplePoints, layout: 'two_column' }} />
        <SlideCanvas slide={{ slideNumber: 5, title: 'Summary Layout', content: samplePoints, layout: 'summary' }} />
      </div>
    );

    expect(container.querySelector('.slide-canvas--title .slide-canvas__hero-lead')).toBeInTheDocument();
    expect(container.querySelector('.slide-canvas--section .slide-canvas__section-badge')).toBeInTheDocument();
    expect(container.querySelector('.slide-canvas--content .slide-canvas__visual')).toBeInTheDocument();
    expect(container.querySelectorAll('.slide-canvas--two_column .slide-canvas__column')).toHaveLength(2);
    expect(container.querySelector('.slide-canvas--summary .slide-canvas__summary-grid')).toBeInTheDocument();

    unmount();

    const deleteDeckSpy = vi.spyOn(api, 'deleteDeck');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Enterprise AI Copilots: 2026 Rollout Blueprint')
    ).toBeInTheDocument();
    expect(screen.getByText('GridScale Storage: Series A Investor Overview')).toBeInTheDocument();

    // Live search filter on Dashboard
    const searchInput = screen.getByPlaceholderText(/search decks/i);
    fireEvent.change(searchInput, { target: { value: 'GridScale' } });
    expect(screen.getByText('GridScale Storage: Series A Investor Overview')).toBeInTheDocument();
    expect(
      screen.queryByText('Enterprise AI Copilots: 2026 Rollout Blueprint')
    ).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '' } });
    expect(
      screen.getByText('Enterprise AI Copilots: 2026 Rollout Blueprint')
    ).toBeInTheDocument();

    // Delete outline deck from Dashboard quick action
    fireEvent.click(
      screen.getByRole('button', { name: /Delete GridScale Storage: Series A Investor Overview/i })
    );
    await waitFor(() => {
      expect(deleteDeckSpy).toHaveBeenCalledWith('demo-deck-outline');
    });
    await waitFor(() => {
      expect(
        screen.queryByText('GridScale Storage: Series A Investor Overview')
      ).not.toBeInTheDocument();
    });

    // Bidirectional Dashboard -> Preview -> Editor -> Preview navigation
    fireEvent.click(
      screen.getByRole('link', { name: /Preview Enterprise AI Copilots: 2026 Rollout Blueprint/i })
    );
    expect(await screen.findByRole('heading', { name: /presentation preview/i })).toBeInTheDocument();

    const editSlidesLink = await screen.findByRole('link', { name: /edit slides/i });
    fireEvent.click(editSlidesLink);

    expect(await screen.findByLabelText(/slide title/i)).toHaveValue(
      'Scaling Enterprise AI Copilots Without Compromising Governance'
    );

    fireEvent.click(screen.getByRole('link', { name: /^preview$/i }));
    expect(await screen.findByRole('heading', { name: /presentation preview/i })).toBeInTheDocument();
  });

  it('enforces 10-slide Add cap, English modal labels, AI regeneration, and useAuth on OutlinePage', async () => {
    const { deck } = await api.createDeck({
      topic: 'Ten Slide Cap Verification',
      slideCount: 10,
    });
    await api.generateOutline(deck._id);
    const { slides: tenSlides } = await api.generateSlides(deck._id);
    expect(tenSlides).toHaveLength(10);

    const { unmount } = render(
      <MemoryRouter initialEntries={[`/editor/${deck._id}`]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Ten Slide Cap Verification')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add slide/i })).toBeDisabled();

    // Open RegenerateModal and verify English Close aria-label + AI regeneration update
    fireEvent.click(screen.getByRole('button', { name: /regenerate with ai/i }));
    const regenDialog = await screen.findByRole('dialog', { name: /regenerate this slide/i });
    expect(within(regenDialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();

    const initialTitle = screen.getByLabelText(/slide title/i).value;
    fireEvent.click(within(regenDialog).getByRole('button', { name: 'Make it clearer' }));
    fireEvent.click(within(regenDialog).getByRole('button', { name: /^regenerate$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /regenerate this slide/i })).not.toBeInTheDocument();
    });
    const regeneratedTitle = screen.getByLabelText(/slide title/i).value;
    expect(regeneratedTitle.length).toBeGreaterThan(5);
    expect(regeneratedTitle).not.toBe(initialTitle);
    expect(regeneratedTitle).not.toMatch(/\(Refined\)$/);

    unmount();

    // Verify OutlinePage uses useAuth() without extra fetch and formats dates in en-US
    globalThis.fetch.mockClear();
    render(
      <MemoryRouter initialEntries={['/outline/demo-deck-outline']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /outline editor/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /account details/i }));
    const accountDialog = await screen.findByRole('dialog');
    expect(within(accountDialog).getByText('Alex Rivera (Demo)')).toBeInTheDocument();
    expect(within(accountDialog).getByText(/Mar 1, 2026/i)).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('surfaces failed deck loads and 0-slide add errors as alerts instead of misreporting an empty deck', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/editor/missing-deck-404']}>
        <App />
      </MemoryRouter>
    );

    const loadAlert = await screen.findByRole('alert');
    expect(loadAlert).toHaveTextContent(/deck not found/i);
    expect(screen.queryByText(/no slides in this deck yet/i)).not.toBeInTheDocument();
    expect(within(loadAlert).getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );

    unmount();

    // Also verify 0-slide deck shows error alert if Add slide fails
    const { deck: emptyDeck } = await api.createDeck({
      topic: 'Zero Slide Draft Deck',
      slideCount: 3,
    });
    vi.spyOn(api, 'createSlide').mockRejectedValueOnce(
      new Error('Failed to create initial slide')
    );

    render(
      <MemoryRouter initialEntries={[`/editor/${emptyDeck._id}`]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/no slides in this deck yet/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /add slide/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /failed to create initial slide/i
    );
  });

  it('renders Version history fetch and restore errors inside the dialog without showing empty-history copy', async () => {
    const getVersionsSpy = vi
      .spyOn(api, 'getSlideVersions')
      .mockRejectedValueOnce(new Error('Version service unavailable'));

    render(
      <MemoryRouter initialEntries={['/editor/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Enterprise AI Copilots: 2026 Rollout Blueprint')
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /version history/i })[0]);

    const dialogAfterFetchFail = await screen.findByRole('dialog', {
      name: /version history/i,
    });
    expect(await within(dialogAfterFetchFail).findByRole('alert')).toHaveTextContent(
      /version service unavailable/i
    );
    expect(
      within(dialogAfterFetchFail).queryByText(/no saved snapshots for this slide yet/i)
    ).not.toBeInTheDocument();

    // Close modal, restore real getSlideVersions, select Slide 3, and verify restore error inside modal
    fireEvent.click(within(dialogAfterFetchFail).getByRole('button', { name: /close version history/i }));
    getVersionsSpy.mockRestore();

    vi.spyOn(api, 'restoreSlideVersion').mockRejectedValueOnce(
      new Error('Snapshot restore conflict')
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /Targeted Knowledge Workflows Deliver 34% Faster Cycle Times/i,
      })
    );
    fireEvent.click(screen.getAllByRole('button', { name: /version history/i })[0]);

    const dialogForRestoreFail = await screen.findByRole('dialog', {
      name: /version history/i,
    });
    const restoreBtn = await within(dialogForRestoreFail).findByRole('button', {
      name: /restore/i,
    });
    fireEvent.click(restoreBtn);

    expect(await within(dialogForRestoreFail).findByRole('alert')).toHaveTextContent(
      /snapshot restore conflict/i
    );
  });
});
