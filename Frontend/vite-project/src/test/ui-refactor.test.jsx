import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

    fireEvent.click(within(showcase).getByRole('tab', { name: /side-by-side/i }));
    expect(showcase.querySelector('.slide-canvas--two_column')).toBeInTheDocument();

    fireEvent.click(within(showcase).getByRole('tab', { name: /executive summary/i }));
    expect(showcase.querySelector('.slide-canvas--summary')).toBeInTheDocument();
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
});
