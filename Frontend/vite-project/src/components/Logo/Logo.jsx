import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import { getToken } from '../../service/apiClient';
import './Logo.css';

export default function Logo({ compact = false, subtitle = 'AI-powered decks', to }) {
  const target = to || (getToken() ? '/dashboard' : '/');

  return (
    <Link to={target} className={`brand ${compact ? 'brand--compact' : ''}`}>
      <span className="brand__mark"><Icon name="sparkles" size={18} /></span>
      {!compact && (
        <span className="brand__copy">
          <strong>DeckAI</strong>
          <small>{subtitle}</small>
        </span>
      )}
    </Link>
  );
}
