import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import Sidebar from '../components/SideBar/SideBar';
import Topbar from '../components/Topbar/Topbar';
import { api } from '../service/apiClient';

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
});
