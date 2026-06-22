import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '../Icon/Icon';
import Logo from '../Logo/Logo';
import Button from '../Button/Button';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/create', icon: 'plus', label: 'Create' },
  { to: '/outline', icon: 'list', label: 'Outline' },
  { to: '/editor', icon: 'edit', label: 'Editor' },
  { to: '/preview', icon: 'eye', label: 'Preview' },
];

export default function Sidebar({ active, variant = 'workspace' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setOpen((value) => !value)} aria-label="Mở menu">
        <Icon name={open ? 'close' : 'menu'} />
      </button>
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <Logo subtitle={variant === 'workspace' ? 'Cognitive flow' : 'AI presentation tool'} />
          {variant === 'workspace' && (
            <div className="workspace-box">
              <span>Workspace</span>
              <strong>Personal</strong>
              <Icon name="chevronDown" size={16} />
            </div>
          )}
        </div>

        <Button to="/create" icon="plus" className="sidebar__new">New Presentation</Button>

        <nav className="sidebar__nav" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar__link ${(isActive || active === item.label.toLowerCase()) ? 'sidebar__link--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="sidebar__icon"><Icon name={item.icon} size={21} /></span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <NavLink to="/presentations" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
            <span className="sidebar__icon"><Icon name="layers" size={21} /></span>
            <span>All Decks</span>
          </NavLink>
        </nav>

        <div className="sidebar__footer">
          <a href="#settings" className="sidebar__utility"><Icon name="settings" size={20} /> Settings</a>
          <a href="#help" className="sidebar__utility"><Icon name="help" size={20} /> Help Center</a>
          <div className="sidebar__profile">
            <span className="avatar avatar--photo">AR</span>
            <span><strong>Alex Rivera</strong><small>Pro Plan</small></span>
            <Icon name="dots" size={18} />
          </div>
        </div>
      </aside>
    </>
  );
}
