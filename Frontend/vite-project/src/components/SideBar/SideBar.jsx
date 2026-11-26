import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../Icon/Icon';
import Logo from '../Logo/Logo';
import Button from '../Button/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './SideBar.css';

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/create', icon: 'plus', label: 'Create' },
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function formatDate(value) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, loading, isBrowserDemo, logout: authLogout } = useAuth();
  const { isDark, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState('');

  const displayName = user?.fullName || (!loading ? 'Account' : 'Loading account...');
  const displayEmail = user?.email || (!loading ? 'Signed in' : 'Please wait');
  const displayInitials = useMemo(() => initials(user?.fullName || user?.email || ''), [user]);

  const togglePanel = (name) => setPanel((value) => (value === name ? '' : name));
  const openPopup = (name) => {
    setOpen(false);
    setPanel(name);
  };

  const handleLogout = () => {
    setOpen(false);
    authLogout();
    navigate('/');
  };

  const popupMeta =
    panel === 'settings'
      ? { title: 'Settings', subtitle: 'Customize your workspace' }
      : panel === 'help'
        ? { title: 'Shortcuts & tips', subtitle: 'Keyboard navigation & AI slide workflow' }
        : { title: 'Account details', subtitle: 'Your DeckAI profile' };

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Icon name={open ? 'close' : 'menu'} size={18} />
      </button>

      {open && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <Logo subtitle="Cognitive flow" />
          <button
            type="button"
            className="workspace-box"
            onClick={() => togglePanel('workspace')}
            aria-expanded={panel === 'workspace'}
          >
            <span>Workspace</span>
            <strong>{isBrowserDemo ? 'Demo Sandbox' : 'Personal'}</strong>
            <Icon name="chevronDown" size={16} />
          </button>
          {panel === 'workspace' && (
            <div className="sidebar-panel">
              <strong>{isBrowserDemo ? 'Demo Sandbox Workspace' : 'Personal Workspace'}</strong>
              <small>Owner: {displayName}</small>
              <small>Status: {isBrowserDemo ? 'Browser Sandbox' : 'Active'}</small>
            </div>
          )}
        </div>

        <Button to="/create" icon="plus" className="sidebar__new">New Presentation</Button>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="sidebar__icon"><Icon name={item.icon} size={18} /></span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button
            type="button"
            className="sidebar__utility sidebar__utility--button"
            onClick={() => openPopup('settings')}
          >
            <Icon name="settings" size={18} /> Settings
          </button>
          <button
            type="button"
            className="sidebar__utility sidebar__utility--button"
            onClick={() => openPopup('help')}
          >
            <Icon name="help" size={18} /> Shortcuts &amp; tips
          </button>
          <button
            type="button"
            className="sidebar__utility sidebar__utility--button"
            onClick={handleLogout}
          >
            <Icon name="logout" size={18} /> Log out
          </button>
          <button type="button" className="sidebar__profile" onClick={() => openPopup('account')}>
            <span className="avatar avatar--photo">{displayInitials}</span>
            <span>
              <strong>{displayName}</strong>
              <small>{displayEmail}</small>
            </span>
            <Icon name="dots" size={16} />
          </button>
        </div>
      </aside>

      {(panel === 'settings' || panel === 'account' || panel === 'help') && (
        <div
          className="sidebar-popup-backdrop"
          role="presentation"
          onMouseDown={() => setPanel('')}
        >
          <section
            className="sidebar-popup"
            role="dialog"
            aria-modal="true"
            aria-label={popupMeta.title}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="sidebar-popup__header">
              <div>
                <strong>{popupMeta.title}</strong>
                <small>{popupMeta.subtitle}</small>
              </div>
              <button type="button" onClick={() => setPanel('')} aria-label="Close popup">
                <Icon name="close" size={18} />
              </button>
            </header>

            {panel === 'settings' && (
              <div className="sidebar-popup__body">
                <label className="sidebar-toggle-row">
                  <span>
                    <strong>Dark mode</strong>
                    <small>Switch the workspace to a darker color theme.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')}
                  />
                </label>
              </div>
            )}

            {panel === 'help' && (
              <div className="sidebar-popup__body">
                <ul className="sidebar-tips-list">
                  <li className="sidebar-tips-item">
                    <div>
                      <strong>Keyboard slide &amp; presenter navigation</strong>
                      <small>Use Arrow keys or Space to step through slides, press P for Presenter View, and press Ctrl+S in the Editor to save.</small>
                    </div>
                    <span className="sidebar-kbd-group">
                      <kbd>←</kbd>
                      <kbd>→</kbd>
                      <kbd>P</kbd>
                    </span>
                  </li>
                  <li className="sidebar-tips-item">
                    <div>
                      <strong>4 deck themes, duplication &amp; version history</strong>
                      <small>Switch brand palettes live on the canvas, duplicate decks or slides in one click, and restore snapshots anytime.</small>
                    </div>
                  </li>
                  <li className="sidebar-tips-item">
                    <div>
                      <strong>Instant Demo, PowerPoint &amp; PDF export</strong>
                      <small>Export themed .pptx files or print 16:9 PDF handouts even offline in Instant Demo Browser Sandbox mode.</small>
                    </div>
                  </li>
                </ul>
              </div>
            )}

            {panel === 'account' && (
              <div className="sidebar-popup__body">
                <div className="account-summary">
                  <span className="avatar avatar--photo">{displayInitials}</span>
                  <div>
                    <strong>{displayName}</strong>
                    <small>{displayEmail}</small>
                  </div>
                </div>
                <dl className="account-details">
                  <div><dt>Account ID</dt><dd>{user?.id || 'Unknown'}</dd></div>
                  <div><dt>Email</dt><dd>{displayEmail}</dd></div>
                  <div><dt>Created</dt><dd>{formatDate(user?.createdAt)}</dd></div>
                </dl>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
