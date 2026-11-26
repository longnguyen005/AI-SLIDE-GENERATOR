import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, within } from '@testing-library/react';
import SlideCanvas from '../components/SlideCanvas/SlideCanvas';
import {
  LAYOUT_OPTIONS,
  OUTLINE_LAYOUT_OPTIONS,
  SLIDE_LAYOUTS,
  extractTwoColumnData,
  parseMetricBullet,
  parseTimelineBullet,
} from '../constants/slideLayouts';
import { api, clearToken } from '../service/apiClient';
import { exportDeckPptxClient } from '../service/clientPptxExport';
import { deactivateBrowserDemo } from '../service/demoStore';

describe('Phase 5 Frontend: 8-Layout SlideCanvas, Client PPTX & Smart Demo AI', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearToken();
    deactivateBrowserDemo();
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline demo mode'));
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('exports all 8 slide layout options and renders metrics, timeline, callout, and smart-prefix two_column safely', () => {
    expect(SLIDE_LAYOUTS).toEqual([
      'title',
      'section',
      'content',
      'two_column',
      'metrics',
      'timeline',
      'callout',
      'summary',
    ]);
    expect(LAYOUT_OPTIONS).toHaveLength(8);
    expect(OUTLINE_LAYOUT_OPTIONS).toHaveLength(9);
    expect(OUTLINE_LAYOUT_OPTIONS[0].value).toBe('');

    expect(parseMetricBullet('34% Faster | Support cycle dropped from 38m to 25m', 0)).toEqual({
      value: '34% Faster',
      label: 'Support cycle dropped from 38m to 25m',
    });
    expect(parseTimelineBullet('Phase 1 (Days 1-30): Audit IAM policies', 0)).toEqual({
      stage: 'Phase 1 (Days 1-30)',
      detail: 'Audit IAM policies',
    });

    const splitCols = extractTwoColumnData([
      'Velocity Enabler: Fast curated templates',
      'Velocity Enabler: Sub-2s p95 latency',
      'Security Guardrail: Role-scoped ACLs',
      'Security Guardrail: Zero-retention routing',
    ]);
    expect(splitCols.leftHeader).toBe('Velocity Enabler');
    expect(splitCols.rightHeader).toBe('Security Guardrail');
    expect(splitCols.leftItems).toEqual(['Fast curated templates', 'Sub-2s p95 latency']);
    expect(splitCols.rightItems).toEqual(['Role-scoped ACLs', 'Zero-retention routing']);

    const { container } = render(
      <div>
        <SlideCanvas
          theme="emerald"
          slide={{
            slideNumber: 3,
            layout: 'metrics',
            title: 'Commercial Traction Scorecard',
            content: [
              '48 MWh | Contracted across three industrial hubs',
              '99.4% Uptime | Verified availability across initial fleet',
              'Plain metric fallback without pipe delimiter',
            ],
          }}
        />
        <SlideCanvas
          theme="amber"
          slide={{
            slideNumber: 4,
            layout: 'timeline',
            title: '24-Month Execution Roadmap',
            content: [
              'Phase 1 (Months 1-6): Commission automated cell line',
              'Phase 2 (Months 7-12): Deliver first 80 MWh cohort',
              'Plain milestone without colon delimiter',
            ],
          }}
        />
        <SlideCanvas
          theme="coral"
          slide={{
            slideNumber: 5,
            layout: 'callout',
            title: 'Modular Iron-Air Thesis',
            content: [
              'Earth-abundant chemistry cuts levelized 12-hour storage cost by 58% without thermal runaway.',
              'Zero lithium or cobalt supply-chain exposure.',
              '15-year dispatch software contracts drive 46% gross margin.',
            ],
          }}
        />
        <SlideCanvas
          slide={{
            slideNumber: 6,
            layout: 'callout',
            title: 'Single-Bullet Callout Safety',
            content: ['Standalone executive thesis statement with zero supporting pillars.'],
          }}
        />
        <SlideCanvas
          slide={{
            slideNumber: 7,
            layout: 'two_column',
            title: 'Velocity vs Guardrails',
            content: [
              'Velocity Enabler: Self-serve prompt templates.',
              'Velocity Enabler: Multi-region model routing.',
              'Security Guardrail: Document ACL inheritance.',
              'Security Guardrail: Automated PII redaction.',
            ],
          }}
        />
      </div>
    );

    const metricsCanvas = container.querySelector('.slide-canvas--metrics');
    expect(metricsCanvas).toBeInTheDocument();
    expect(metricsCanvas.querySelector('.slide-canvas__metrics-grid')).toBeInTheDocument();
    expect(within(metricsCanvas).getByText('48 MWh')).toBeInTheDocument();
    expect(within(metricsCanvas).getByText('Contracted across three industrial hubs')).toBeInTheDocument();
    expect(within(metricsCanvas).getByText('KPI 03')).toBeInTheDocument();

    const timelineCanvas = container.querySelector('.slide-canvas--timeline');
    expect(timelineCanvas).toBeInTheDocument();
    expect(timelineCanvas.querySelector('.slide-canvas__timeline-track')).toBeInTheDocument();
    expect(within(timelineCanvas).getByText('Phase 1 (Months 1-6)')).toBeInTheDocument();
    expect(within(timelineCanvas).getByText('Step 03')).toBeInTheDocument();

    const calloutCanvases = container.querySelectorAll('.slide-canvas--callout');
    expect(calloutCanvases).toHaveLength(2);
    expect(calloutCanvases[0].querySelector('.slide-canvas__callout-hero')).toBeInTheDocument();
    expect(calloutCanvases[0].querySelectorAll('.slide-canvas__pillar-card')).toHaveLength(2);
    expect(calloutCanvases[1].querySelector('.slide-canvas__callout-hero')).toBeInTheDocument();
    expect(calloutCanvases[1].querySelectorAll('.slide-canvas__pillar-card')).toHaveLength(0);

    const twoColCanvas = container.querySelector('.slide-canvas--two_column');
    expect(within(twoColCanvas).getByText('Velocity Enabler')).toBeInTheDocument();
    expect(within(twoColCanvas).getByText('Security Guardrail')).toBeInTheDocument();
    expect(within(twoColCanvas).getByText('Self-serve prompt templates.')).toBeInTheDocument();
  });

  it('synthesizes diverse layouts and supports scoped + layout-switching regeneration in demoStore', async () => {
    await api.loginDemo();

    const { decks } = await api.getDecks();
    expect(decks).toHaveLength(2);

    const readyDeck = decks.find((d) => d._id === 'demo-deck-ready');
    const outlineDeck = decks.find((d) => d._id === 'demo-deck-outline');
    const { slides: readySlides } = await api.getSlides(readyDeck._id);
    expect(new Set(readySlides.map((s) => s.layout))).toEqual(
      new Set(['title', 'section', 'content', 'two_column', 'summary'])
    );

    expect(outlineDeck.outline.sections.map((s) => s.suggestedLayout)).toEqual([
      'title',
      'callout',
      'metrics',
      'two_column',
      'timeline',
    ]);

    // Generate slides from GridScale Storage outline deck -> honors suggestedLayout + verbatim titles
    const { slides: gridSlides } = await api.generateSlides(outlineDeck._id);
    expect(gridSlides.map((s) => s.title)).toEqual(outlineDeck.outline.sections.map((s) => s.title));
    expect(gridSlides.map((s) => s.layout)).toEqual([
      'title',
      'callout',
      'metrics',
      'two_column',
      'timeline',
    ]);

    // Create a fresh 6-slide deck -> outline & slide generation produce zero adjacent middle layout duplicates
    const { deck: customDeck } = await api.createDeck({
      topic: 'Real-Time Fraud Detection Mesh',
      description: 'Sub-40ms graph scoring reducing false positives by 52%.',
      tone: 'persuasive',
      slideCount: 6,
    });
    const { outline: customOutline } = await api.generateOutline(customDeck._id);
    expect(customOutline.sections).toHaveLength(6);
    const { slides: customSlides } = await api.generateSlides(customDeck._id);
    const middleLayouts = customSlides.slice(1, 5).map((s) => s.layout);
    for (let i = 1; i < middleLayouts.length; i += 1) {
      expect(middleLayouts[i]).not.toBe(middleLayouts[i - 1]);
    }

    // Legacy string call does NOT append "(Refined)"
    const { slide: legacyRegen } = await api.regenerateSlide('demo-slide-3', 'Make it clearer');
    expect(legacyRegen.title).not.toMatch(/\(Refined\)$/i);

    // Ordinary prompt mentioning 'metrics' does NOT hijack two_column
    const { slide: nonHijacked } = await api.regenerateSlide('demo-slide-4', {
      instruction: 'Add Q3 KPI metrics and tighten summary points',
    });
    expect(nonHijacked.layout).toBe('two_column');

    // Scoped target: 'notes' preserves title, content, and layout
    const beforeNotes = { ...legacyRegen, content: [...legacyRegen.content] };
    const { slide: notesUpdated } = await api.regenerateSlide('demo-slide-3', {
      target: 'notes',
      instruction: 'Add executive transition to security guardrails',
    });
    expect(notesUpdated.title).toBe(beforeNotes.title);
    expect(notesUpdated.content).toEqual(beforeNotes.content);
    expect(notesUpdated.layout).toBe(beforeNotes.layout);
    expect(notesUpdated.speakerNotes).not.toBe(beforeNotes.speakerNotes);

    // Scoped target: 'bullets' preserves title and speakerNotes
    const { slide: bulletsUpdated } = await api.regenerateSlide('demo-slide-3', {
      target: 'bullets',
      instruction: 'Focus on quantifiable seat velocity',
    });
    expect(bulletsUpdated.title).toBe(notesUpdated.title);
    expect(bulletsUpdated.speakerNotes).toBe(notesUpdated.speakerNotes);

    // Explicit preferredLayout: 'metrics' converts layout
    const { slide: convertedMetrics } = await api.regenerateSlide('demo-slide-3', {
      target: 'full',
      preferredLayout: 'metrics',
      allowLayoutChange: true,
      instruction: 'Convert into KPI scorecard',
    });
    expect(convertedMetrics.layout).toBe('metrics');
    expect(convertedMetrics.content.some((line) => line.includes('|'))).toBe(true);
  });

  it('exports a valid client-side .pptx ZIP blob across all 8 slide layouts', async () => {
    const sampleDeck = {
      title: '8-Layout Client PPTX Verification',
      topic: 'Enterprise Platform Architecture',
      theme: 'coral',
    };
    const allLayoutSlides = SLIDE_LAYOUTS.map((layout, idx) => ({
      slideNumber: idx + 1,
      title: `Slide ${idx + 1} (${layout})`,
      layout,
      content:
        layout === 'metrics'
          ? ['42% Faster | Build pipeline duration', '99.95% SLA | Multi-zone availability']
          : layout === 'timeline'
            ? ['Phase 1: Audit baseline', 'Phase 2: Global rollout']
            : ['Primary executive point for export verification.'],
      speakerNotes: `Presenter notes for ${layout} slide.`,
    }));

    const exported = await exportDeckPptxClient(sampleDeck, allLayoutSlides);
    expect(exported.fileName).toMatch(/\.pptx$/);
    expect(exported.blob.size).toBeGreaterThan(2000);
    const headerBytes = new Uint8Array(await exported.blob.slice(0, 4).arrayBuffer());
    expect(Array.from(headerBytes)).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });
});
