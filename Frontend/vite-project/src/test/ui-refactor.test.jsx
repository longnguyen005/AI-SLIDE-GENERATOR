import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import Sidebar from '../components/SideBar/SideBar';
import Topbar from '../components/Topbar/Topbar';
import { api } from '../service/apiClient';

const appCssRaw = fs.readFileSync(path.resolve('src/App.css'), 'utf8');
const sidebarCssRaw = fs.readFileSync(
  path.resolve('src/components/SideBar/SideBar.css'),
  'utf8'
);
const landingCssRaw = fs.readFileSync(
  path.resolve('src/pages/LandingPage/LandingPage.css'),
  'utf8'
);
const task3CssRaw = [
  'src/pages/DashboardPage/DashboardPage.css',
  'src/components/DeskCard/DeskCard.css',
  'src/components/StatCard/StatCard.css',
  'src/pages/CreatePresentationPage/CreatePresentationPage.css',
  'src/pages/OutlinePage/OutlinePage.css',
  'src/components/OutlineCard/OutlineCard.css',
  'src/components/ProgressSteps/ProgressSteps.css',
].map((relPath) => [relPath, fs.readFileSync(path.resolve(relPath), 'utf8')]);

function ThemeProbe() {
  const { theme, isDark } = useTheme();
  return <span data-testid="theme-probe">{`${theme}:${isDark}`}</span>;
}

describe('DeckAI × Open Design UI Refactor', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
    sessionStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    localStorage.clear();
    sessionStorage.clear();
  });

  it('synchronizes ThemeProvider across Topbar and SideBar and supports standalone mounting without ThemeProvider', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline'));
    await api.loginDemo();

    const { unmount } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ThemeProvider>
          <AuthProvider>
            <Sidebar />
            <Topbar title="Presentations" />
            <ThemeProbe />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('theme-probe')).toHaveTextContent('light:false');
    expect(document.documentElement.dataset.theme).toBe('light');

    // Toggle theme from Topbar
    fireEvent.click(screen.getByRole('button', { name: /toggle color theme/i }));
    expect(screen.getByTestId('theme-probe')).toHaveTextContent('dark:true');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('deckai_theme')).toBe('dark');

    // Open Shortcuts & tips modal instead of dead #help hash
    fireEvent.click(screen.getByRole('button', { name: /shortcuts & tips/i }));
    expect(await screen.findByRole('dialog')).toHaveTextContent(/keyboard|arrow|instant demo/i);
    fireEvent.click(screen.getByRole('button', { name: /close popup/i }));

    unmount();

    // Standalone mount WITHOUT ThemeProvider (Review Focus #1)
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Sidebar />
          <Topbar title="Presentations" />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(document.documentElement.dataset.theme).toBe('dark');
    fireEvent.click(screen.getByRole('button', { name: /toggle color theme/i }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('deckai_theme')).toBe('light');
  });

  it('toggles mobile drawer aria-expanded state, closes on backdrop click, and avoids banner/logo overlap in shell CSS', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline'));
    await api.loginDemo();

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ThemeProvider>
          <AuthProvider>
            <div className="page-shell">
              <Sidebar />
              <main className="page-content">
                <Topbar title="Presentations" />
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    const menuToggle = screen.getByRole('button', { name: /open menu/i });
    const sidebarEl = container.querySelector('.sidebar');

    expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
    expect(sidebarEl).not.toHaveClass('sidebar--open');
    expect(container.querySelector('.sidebar-backdrop')).not.toBeInTheDocument();

    // Open mobile drawer
    fireEvent.click(menuToggle);
    expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
    expect(sidebarEl).toHaveClass('sidebar--open');

    const backdrop = container.querySelector('.sidebar-backdrop');
    expect(backdrop).toBeInTheDocument();

    // Clicking .sidebar-backdrop closes the mobile drawer
    fireEvent.click(backdrop);
    expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
    expect(sidebarEl).not.toHaveClass('sidebar--open');
    expect(container.querySelector('.sidebar-backdrop')).not.toBeInTheDocument();

    // Shell positioning & z-index contract: clear wrapped .demo-sandbox-banner and open drawer <Logo />
    expect(appCssRaw.length).toBeGreaterThan(100);
    expect(sidebarCssRaw.length).toBeGreaterThan(100);
    expect(appCssRaw).toMatch(/\.page-shell,\s*\.editor-page\s*\{[^}]*position:\s*relative;/s);
    expect(sidebarCssRaw).not.toContain('top: 54px');
    expect(sidebarCssRaw).toMatch(
      /\.page-shell\s+\.sidebar-toggle,\s*\.editor-page\s+\.sidebar-toggle\s*\{[^}]*position:\s*absolute;[^}]*top:\s*20px;[^}]*left:\s*16px;/s
    );
    expect(sidebarCssRaw).toMatch(/\.sidebar-backdrop\s*\{[^}]*z-index:\s*55;/s);
    expect(sidebarCssRaw).toMatch(/\.sidebar\s*\{[^}]*z-index:\s*60;/s);
    expect(sidebarCssRaw).toMatch(
      /\.sidebar-toggle\[aria-expanded="true"\][^{]*\{[^}]*position:\s*fixed;[^}]*left:\s*calc\(min\(272px,\s*84vw\)\s*-\s*48px\);[^}]*z-index:\s*65;/s
    );
  });

  it('renders interactive 5-layout HeroShowcase on LandingPage with truthful capability metrics and no fake monitor skeleton', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /create stunning presentations/i })).toBeInTheDocument();
    expect(container.querySelector('.monitor-demo')).not.toBeInTheDocument();
    expect(screen.queryByText(/1000\+/i)).not.toBeInTheDocument();

    const showcase = screen.getByRole('region', { name: /interactive workspace preview/i });
    expect(showcase.querySelector('.slide-canvas--title')).toBeInTheDocument();

    // Multi-step keyboard roving tabIndex navigation across HeroShowcase tabs
    const coverTab = within(showcase).getByRole('tab', { name: /cover/i });
    const sectionTab = within(showcase).getByRole('tab', { name: /section break/i });
    const insightsTab = within(showcase).getByRole('tab', { name: /key insights/i });

    coverTab.focus();
    expect(document.activeElement).toBe(coverTab);

    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(sectionTab);
    expect(sectionTab).toHaveAttribute('aria-selected', 'true');
    expect(showcase.querySelector('.slide-canvas--section')).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(insightsTab);
    expect(insightsTab).toHaveAttribute('aria-selected', 'true');
    expect(showcase.querySelector('.slide-canvas--content')).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement, { key: 'End' });
    expect(document.activeElement).toBe(
      within(showcase).getByRole('tab', { name: /executive summary/i })
    );
    expect(showcase.querySelector('.slide-canvas--summary')).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement, { key: 'Home' });
    expect(document.activeElement).toBe(coverTab);
    expect(showcase.querySelector('.slide-canvas--title')).toBeInTheDocument();

    fireEvent.click(within(showcase).getByRole('tab', { name: /side-by-side/i }));
    expect(showcase.querySelector('.slide-canvas--two_column')).toBeInTheDocument();

    fireEvent.click(within(showcase).getByRole('tab', { name: /executive summary/i }));
    expect(showcase.querySelector('.slide-canvas--summary')).toBeInTheDocument();

    // LandingPage.css uses tokens.css custom properties exclusively with zero raw hex literals
    expect(landingCssRaw).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('deduplicates LoginPage Back to home, syncs theme across AuthPage, and preserves RegisterPage input on mismatch error', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getAllByRole('link', { name: /back to home/i })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /back to home/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /toggle color theme/i }));
    expect(document.documentElement.dataset.theme).toBe('dark');

    unmount();

    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(nameInput, { target: { value: 'Long Nguyen' } });
    fireEvent.change(emailInput, { target: { value: 'long@deckai.app' } });
    fireEvent.change(passInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmInput, { target: { value: 'Mismatch999' } });
    fireEvent.blur(confirmInput);

    expect(screen.getByRole('alert')).toHaveTextContent(/passwords do not match/i);
    expect(nameInput).toHaveValue('Long Nguyen');
    expect(emailInput).toHaveValue('long@deckai.app');
  });

  it('filters Dashboard decks by Ready / In Progress pills and renders 200-char titles safely in DeskCard mini-covers', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline'));
    await api.loginDemo();
    const longTopic = `${'Autonomous Enterprise Telemetry '.repeat(7)}`.slice(0, 200);
    await api.createDeck({ topic: longTopic, tone: 'academic', slideCount: 5 });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Enterprise AI Copilots: 2026 Rollout Blueprint')).toBeInTheDocument();
    expect(screen.getByText('GridScale Storage: Series A Investor Overview')).toBeInTheDocument();
    expect(screen.getAllByText(longTopic).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole('button', { name: /^ready\b/i }));
    expect(screen.getByText('Enterprise AI Copilots: 2026 Rollout Blueprint')).toBeInTheDocument();
    expect(screen.queryByText('GridScale Storage: Series A Investor Overview')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^in progress\b/i }));
    expect(screen.queryByText('Enterprise AI Copilots: 2026 Rollout Blueprint')).not.toBeInTheDocument();
    expect(screen.getByText('GridScale Storage: Series A Investor Overview')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^all\b/i }));
    expect(screen.getByText('Enterprise AI Copilots: 2026 Rollout Blueprint')).toBeInTheDocument();
    expect(screen.getByText('GridScale Storage: Series A Investor Overview')).toBeInTheDocument();

    for (const [relPath, cssContent] of task3CssRaw) {
      expect(cssContent, `${relPath} must use tokens.css variables with zero raw hexes`).not.toMatch(
        /#[0-9a-fA-F]{3,8}\b/
      );
    }
  });

  it('pre-selects lowercase draft tone on CreatePresentationPage, populates starter chips, and submits lowercase tone', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline'));
    await api.loginDemo();
    const { deck } = await api.createDeck({
      topic: 'Initial Research Topic',
      tone: 'academic',
      slideCount: 5,
    });
    const updateDeckSpy = vi.spyOn(api, 'updateDeck');

    render(
      <MemoryRouter initialEntries={[`/create?deckId=${deck._id}`]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Initial Research Topic')).toBeInTheDocument();
    const academicRadio = screen.getByRole('radio', { name: /academic/i });
    const simpleRadio = screen.getByRole('radio', { name: /simple/i });
    const professionalRadio = screen.getByRole('radio', { name: /professional/i });
    const persuasiveRadio = screen.getByRole('radio', { name: /persuasive/i });
    expect(academicRadio).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByText(/10k\+/i)).not.toBeInTheDocument();

    // WAI-ARIA keyboard roving navigation across Tone radiogroup
    academicRadio.focus();
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(simpleRadio);
    expect(simpleRadio).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(document.activeElement, { key: 'Home' });
    expect(document.activeElement).toBe(professionalRadio);
    expect(professionalRadio).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(document.activeElement, { key: 'End' });
    expect(document.activeElement).toBe(persuasiveRadio);
    expect(persuasiveRadio).toHaveAttribute('aria-checked', 'true');

    // Starter chip updates topic and switching Tone card submits lowercase tone
    fireEvent.click(screen.getAllByRole('button', { name: /use starter:/i })[0]);
    fireEvent.click(screen.getByRole('radio', { name: /persuasive/i }));
    fireEvent.click(screen.getByRole('button', { name: /update outline/i }));

    await waitFor(() => {
      expect(updateDeckSpy).toHaveBeenCalledWith(
        deck._id,
        expect.objectContaining({ tone: 'persuasive' })
      );
    });
  });

  it('supports OutlinePage section add, move, remove, removes fake +1 pill, and normalizes blank section titles before save', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline'));
    await api.loginDemo();
    const updateOutlineSpy = vi.spyOn(api, 'updateOutline');

    render(
      <MemoryRouter initialEntries={['/outline/demo-deck-outline']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /outline editor/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /collaborators/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /account details/i })).toBeInTheDocument();

    // Theme toggle works on OutlinePage
    fireEvent.click(screen.getByRole('button', { name: /toggle color theme/i }));
    expect(document.documentElement.dataset.theme).toBe('dark');

    // 5 seeded sections -> Add section -> 6 sections -> Remove -> Add back -> 6 sections
    fireEvent.click(screen.getByRole('button', { name: /add section/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove section 6' }));
    expect(screen.queryByLabelText('Section title 6')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add section/i }));
    const sixthTitle = screen.getByLabelText('Section title 6');
    fireEvent.change(sixthTitle, { target: { value: '   ' } }); // blank whitespace (Review Focus #3)

    // Move section 6 up to position 5
    fireEvent.click(screen.getByRole('button', { name: 'Move section 6 up' }));

    // Save via Back to Topic and verify normalized non-empty section title
    fireEvent.click(screen.getByRole('button', { name: /back to topic/i }));
    await waitFor(() => {
      expect(updateOutlineSpy).toHaveBeenCalledTimes(1);
    });
    const savedSections = updateOutlineSpy.mock.calls[0][1];
    expect(savedSections).toHaveLength(6);
    expect(savedSections[4].title).toBe('Section 5');
  });

  it('renders real slide titles in PreviewPage filmstrip, handles empty-bullet slides cleanly, and switches active slide', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Offline'));
    await api.loginDemo();
    await api.createSlide('demo-deck-ready', {
      title: 'Appendix: Empty Content Edge Case',
      content: [],
      speakerNotes: '',
      layout: 'content',
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/preview/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /presentation preview/i })).toBeInTheDocument();

    const fourthThumb = screen.getByRole('button', {
      name: /Go to slide 4: Balancing Rapid Experimentation Against Zero-Trust Security Controls/i,
    });
    fireEvent.click(fourthThumb);

    expect(
      screen.getByRole('heading', {
        name: 'Balancing Rapid Experimentation Against Zero-Trust Security Controls',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('4 / 6')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Go to slide 6: Appendix: Empty Content Edge Case/i })
    );
    expect(screen.getByText(/no slide content yet/i)).toBeInTheDocument();

    unmount();

    const longSlideTitle = `${'Zero-Trust Telemetry Architecture '.repeat(7)}`.slice(0, 200);
    await api.createSlide('demo-deck-ready', {
      title: longSlideTitle,
      content: [],
      speakerNotes: '',
      layout: 'two_column',
    });
    await api.createSlide('demo-deck-ready', {
      title: '   ',
      content: [],
      speakerNotes: '',
      layout: 'summary',
    });

    const { unmount: unmountEdgePreview } = render(
      <MemoryRouter initialEntries={['/preview/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('button', { name: `Go to slide 7: ${longSlideTitle}` })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Go to slide 8: Untitled slide' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();

    unmountEdgePreview();

    render(
      <MemoryRouter initialEntries={['/editor/demo-deck-ready']}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Enterprise AI Copilots: 2026 Rollout Blueprint')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /toggle color theme/i }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('deckai_theme')).toBe('dark');
  });

  it('eliminates forbidden default Tailwind indigo hex literals across all component and page CSS files', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const srcDir = path.resolve(import.meta.dirname, '..');

    function collectCssFiles(dir) {
      return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return collectCssFiles(full);
        return entry.name.endsWith('.css') && entry.name !== 'tokens.css' ? [full] : [];
      });
    }

    const forbiddenIndigo = /#(6366f1|4f46e5|4338ca|3730a3|8b5cf6|7c3aed|a855f7)\b/i;
    const offenders = [];

    for (const filePath of collectCssFiles(srcDir)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(forbiddenIndigo);
      if (match) {
        offenders.push(`${path.relative(srcDir, filePath)} (${match[0]})`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
