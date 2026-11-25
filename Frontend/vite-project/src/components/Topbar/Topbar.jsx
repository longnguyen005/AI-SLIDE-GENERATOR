import React, { useMemo } from 'react';
import Icon from '../Icon/Icon';
import { useAuth } from '../../context/AuthContext';
import './Topbar.css';

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export default function Topbar({
  title,
  subtitle,
  searchPlaceholder = 'Search decks...',
  searchValue = '',
  onSearchChange,
  action,
  showSearch,
}) {
  const { user } = useAuth();
  const avatar = useMemo(() => initials(user?.fullName || user?.email || ''), [user]);
  const shouldShowSearch = showSearch ?? Boolean(onSearchChange);

  return (
    <header className="topbar">
      <div className="topbar__title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar__actions">
        {shouldShowSearch && (
          <label className="topbar__search">
            <Icon name="search" size={19} />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </label>
        )}
        {action}
        <span className="topbar__avatar" title={user?.email || 'Account'}>{avatar}</span>
      </div>
    </header>
  );
}
