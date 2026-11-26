import React, { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { api } from '../service/apiClient';
import { useCountUp, useReducedMotion, useScrollReveal } from '../hooks/useMotion';

function RevealHarness() {
  const rootRef = useRef(null);
  const reduced = useReducedMotion();
  const count = useCountUp(42);
  useScrollReveal(rootRef);

  return (
    <div ref={rootRef}>
      <span data-testid="reduced-flag">{String(reduced)}</span>
      <span data-testid="count-value">{count}</span>
      <section data-reveal data-testid="reveal-block">
        Revealed content
      </section>
    </div>
  );
}

describe('DeckAI × Open Design Motion Choreography', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('provides JSDOM-safe motion hooks, enforces prefers-reduced-motion CSS, and bans transition: all across stylesheets', async () => {
    render(<RevealHarness />);

    expect(screen.getByTestId('reduced-flag')).toHaveTextContent('false');
    expect(screen.getByTestId('count-value')).toHaveTextContent('42');
    expect(screen.getByTestId('reveal-block')).toHaveAttribute('data-visible', 'true');

    const fs = await import('node:fs');
    const path = await import('node:path');
    const srcDir = path.resolve(import.meta.dirname, '..');

    const motionCss = fs.readFileSync(path.join(srcDir, 'styles', 'motion.css'), 'utf8');
    expect(motionCss).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
    expect(motionCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);

    function collectCssFiles(dir) {
      return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return collectCssFiles(full);
        return entry.name.endsWith('.css') ? [full] : [];
      });
    }

    const transitionAllOffenders = [];
    for (const file of collectCssFiles(srcDir)) {
      const css = fs.readFileSync(file, 'utf8');
      if (/transition\s*:\s*all\b/i.test(css)) {
        transitionAllOffenders.push(path.relative(srcDir, file));
      }
    }
    expect(transitionAllOffenders).toEqual([]);
  });

  it('drives directional SlideCanvas transitions, sliding tab pill, and tour play/pause controls in HeroShowcase', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    const showcase = screen.getByRole('region', { name: /interactive workspace preview/i });
    expect(showcase.querySelector('.hero-showcase__pill')).toBeInTheDocument();

    fireEvent.click(within(showcase).getByRole('tab', { name: /side-by-side/i }));
    expect(showcase.querySelector('.slide-canvas')).toHaveAttribute('data-direction', 'forward');

    fireEvent.click(within(showcase).getByRole('tab', { name: /section break/i }));
    expect(showcase.querySelector('.slide-canvas')).toHaveAttribute('data-direction', 'backward');

    const tourBtn = within(showcase).getByRole('button', { name: /layout tour/i });
    const initialLabel = tourBtn.getAttribute('aria-label');
    fireEvent.click(tourBtn);
    expect(tourBtn.getAttribute('aria-label')).not.toBe(initialLabel);
  });

  it('animates PreviewPage slide direction, highlights moved Outline sections, and keeps EditorPage SlideCanvas mounted during inline typing', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline'));
    await api.loginDemo();

    const { unmount: unmountPreview } = render(
      <MemoryRouter initialEntries={['/preview/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole('heading', { name: /presentation preview/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    expect(document.querySelector('.slide-canvas')).toHaveAttribute('data-direction', 'forward');
    fireEvent.click(screen.getByRole('button', { name: /^previous$/i }));
    expect(document.querySelector('.slide-canvas')).toHaveAttribute('data-direction', 'backward');
    unmountPreview();

    const { unmount: unmountOutline } = render(
      <MemoryRouter initialEntries={['/outline/demo-deck-outline']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole('heading', { name: /outline editor/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Move section 2 up' }));
    expect(document.querySelector('.outline-card--highlighted')).toBeInTheDocument();
    unmountOutline();

    render(
      <MemoryRouter initialEntries={['/editor/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );
    const titleInput = await screen.findByLabelText(/slide title/i);
    const canvasBeforeTyping = document.querySelector('.slide-canvas');
    fireEvent.change(titleInput, { target: { value: 'Instant Inline Headline Edit' } });
    const canvasAfterTyping = document.querySelector('.slide-canvas');
    expect(canvasAfterTyping).toBe(canvasBeforeTyping);

    fireEvent.click(screen.getByRole('button', { name: /two column/i }));
    expect(document.querySelector('.slide-canvas')).not.toBe(canvasBeforeTyping);
  });
});
