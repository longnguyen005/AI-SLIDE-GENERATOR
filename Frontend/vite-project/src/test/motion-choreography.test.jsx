import React, { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
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
});
