import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../Icon/Icon';
import Logo from '../Logo/Logo';
import Button from '../Button/Button';
import { api, clearToken, getToken } from '../../service/apiClient';
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
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function Sidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [panel, setPanel] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('deckai_theme') === 'dark');

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (!getToken()) {
        if (active) setUserLoaded(true);
        return;
      }
      try {
        const result = await api.me();
        if (active) setUser(result.user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setUserLoaded(true);
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('deckai_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const displayName = user?.fullName || (userLoaded ? 'Account' : 'Loading account...');
  const displayEmail = user?.email || (userLoaded ? 'Signed in' : 'Please wait');
  const displayInitials = useMemo(() => initials(displayName), [displayName]);

  const togglePanel = (name) => setPanel((value) => (value === name ? '' : name));
  const openPopup = (name) => setPanel(name);

  const logout = () => {
    clearToken();
    navigate('/');
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
        <Icon name={open ? 'close' : 'menu'} />
      </button>
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <Logo subtitle="Cognitive flow" />
          <button type="button" className="workspace-box" onClick={() => togglePanel('workspace')}>
            <span>Workspace</span>
            <strong>Personal</strong>
            <Icon name="chevronDown" size={16} />
          </button>
          {panel === 'workspace' && (
            <div className="sidebar-panel">
              <strong>Personal Workspace</strong>
              <small>Owner: {displayName}</small>
              <small>Status: Active</small>
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
              <span className="sidebar__icon"><Icon name={item.icon} size={21} /></span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button type="button" className="sidebar__utility sidebar__utility--button" onClick={() => openPopup('settings')}><Icon name="settings" size={20} /> Settings</button>
          <a href="#help" className="sidebar__utility"><Icon name="help" size={20} /> Help Center</a>
          <button type="button" className="sidebar__utility sidebar__utility--button" onClick={logout}><Icon name="logout" size={20} /> Log out</button>
          <button type="button" className="sidebar__profile" onClick={() => openPopup('account')}>
            <span className="avatar avatar--photo">{displayInitials}</span>
            <span><strong>{displayName}</strong><small>{displayEmail}</small></span>
            <Icon name="dots" size={18} />
          </button>
        </div>
      </aside>

      {(panel === 'settings' || panel === 'account') && (
        <div className="sidebar-popup-backdrop">
          <section className="sidebar-popup" role="dialog" aria-modal="true">
            <header className="sidebar-popup__header">
              <div>
                <strong>{panel === 'settings' ? 'Settings' : 'Account details'}</strong>
                <small>{panel === 'settings' ? 'Customize your workspace' : 'Your DeckAI profile'}</small>
              </div>
              <button type="button" onClick={() => setPanel('')} aria-label="Close popup"><Icon name="close" size={20} /></button>
            </header>

            {panel === 'settings' && (
              <div className="sidebar-popup__body">
                <label className="sidebar-toggle-row">
                  <span>
                    <strong>Dark mode</strong>
                    <small>Switch the workspace to a darker color theme.</small>
                  </span>
                  <input type="checkbox" checked={darkMode} onChange={(event) => setDarkMode(event.target.checked)} />
                </label>
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
