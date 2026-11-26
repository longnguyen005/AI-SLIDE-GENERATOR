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
    expect(motionCss).toMatch(/@keyframes\s+deckai-rise-in[\s\S]*?to\s*\{[\s\S]*?transform:\s*none;/);

    const outlineCardCss = fs.readFileSync(
      path.join(srcDir, 'components', 'OutlineCard', 'OutlineCard.css'),
      'utf8'
    );
    expect(outlineCardCss).toMatch(/\.outline-card--highlighted::after\s*\{[\s\S]*?deckai-highlight-pulse/);
    expect(outlineCardCss).not.toMatch(/\.outline-card--highlighted\s*\{[^}]*animation\s*:/);

    const tokensCss = fs.readFileSync(path.join(srcDir, 'styles', 'tokens.css'), 'utf8');
    const definedVars = new Set(
      Array.from(tokensCss.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g), (match) => match[1])
    );

    function collectCssFiles(dir) {
      return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return collectCssFiles(full);
        return entry.name.endsWith('.css') ? [full] : [];
      });
    }

    const transitionAllOffenders = [];
    const layoutTransitionOffenders = [];
    const undefinedVarOffenders = [];

    for (const file of collectCssFiles(srcDir)) {
      const css = fs.readFileSync(file, 'utf8');
      const rel = path.relative(srcDir, file);
      if (/transition\s*:\s*all\b/i.test(css)) {
        transitionAllOffenders.push(rel);
      }
      for (const match of css.matchAll(/transition(?:-property)?\s*:\s*([^;{}]+);/gi)) {
        if (/\b(width|height|top|left|margin|padding)\b/i.test(match[1])) {
          layoutTransitionOffenders.push(`${rel}: ${match[1].trim()}`);
        }
      }
      for (const match of css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)\s*\)/g)) {
        if (!definedVars.has(match[1])) {
          undefinedVarOffenders.push(`${rel}: ${match[1]}`);
        }
      }
    }
    expect(transitionAllOffenders).toEqual([]);
    expect(layoutTransitionOffenders).toEqual([]);
    expect(undefinedVarOffenders).toEqual([]);
  });

  it('drives directional SlideCanvas transitions, sliding tab pill, and tour play/pause/focus controls in HeroShowcase', () => {
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
    expect(showcase.querySelector('.hero-showcase__tab-progress')).toBeInTheDocument();

    // Focusing a layout tab pauses the active tour tick (WCAG 2.2.2)
    fireEvent.focus(within(showcase).getByRole('tab', { name: /section break/i }));
    expect(showcase.querySelector('.hero-showcase__tab-progress')).not.toBeInTheDocument();
  });

  it('animates PreviewPage slide direction, keeps Outline sticky footer viewport-fixed, and keeps EditorPage SlideCanvas + bullets mounted during inline typing', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline'));
    await api.loginDemo();

    const { unmount: unmountPreview } = render(
      <MemoryRouter initialEntries={['/preview/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole('heading', { name: /presentation preview/i })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(document.querySelector('.slide-canvas')).toHaveAttribute('data-direction', 'neutral');
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
    const outlineMain = document.querySelector('.outline-main');
    const outlineSticky = document.querySelector('.outline-sticky');
    expect(outlineSticky).toBeInTheDocument();
    expect(outlineMain?.contains(outlineSticky)).toBe(false);
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

    const bulletInput = screen.getByLabelText('Bullet 2');
    const bulletNodeBefore = document.querySelector('.slide-canvas__points li');
    expect(bulletNodeBefore).toBeInTheDocument();
    fireEvent.change(bulletInput, { target: { value: 'Updated live bullet without remount' } });
    const bulletNodeAfter = document.querySelector('.slide-canvas__points li');
    expect(bulletNodeAfter).toBe(bulletNodeBefore);

    fireEvent.click(screen.getByRole('button', { name: /two column/i }));
    expect(document.querySelector('.slide-canvas')).not.toBe(canvasBeforeTyping);
  });
});
