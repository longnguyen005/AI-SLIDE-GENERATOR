import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../Icon/Icon';
import { api, getToken } from '../../service/apiClient';
import './Topbar.css';

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export default function Topbar({ title, subtitle, searchPlaceholder = 'Search slides...', action, showSearch = true }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (!getToken()) return;
      try {
        const result = await api.me();
        if (active) setUser(result.user);
      } catch {
        if (active) setUser(null);
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  const avatar = useMemo(() => initials(user?.fullName || user?.email || ''), [user]);

  return (
    <header className="topbar">
      <div className="topbar__title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar__actions">
        {showSearch && (
          <label className="topbar__search">
            <Icon name="search" size={19} />
            <input placeholder={searchPlaceholder} />
          </label>
        )}
        {action}
        <button className="topbar__round" aria-label="Notifications"><Icon name="bell" size={20} /></button>
        <span className="topbar__avatar" title={user?.email || 'Account'}>{avatar}</span>
      </div>
    </header>
  );
}
