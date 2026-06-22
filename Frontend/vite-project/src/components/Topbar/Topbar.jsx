import React from 'react';
import Icon from '../Icon/Icon';
import './Topbar.css';

export default function Topbar({ title, subtitle, searchPlaceholder = 'Search slides...', action }) {
  return (
    <header className="topbar">
      <div className="topbar__title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar__actions">
        <label className="topbar__search">
          <Icon name="search" size={19} />
          <input placeholder={searchPlaceholder} />
        </label>
        {action}
        <button className="topbar__round" aria-label="Thông báo"><Icon name="bell" size={20} /></button>
        <span className="topbar__avatar">JD</span>
      </div>
    </header>
  );
}
