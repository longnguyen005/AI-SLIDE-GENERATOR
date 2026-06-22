import React from 'react';
import Icon from '../Icon/Icon';
import './StatCard.css';

export default function StatCard({ icon, label, value, tone = 'purple' }) {
  return (
    <article className="stat-card">
      <span className={`stat-card__icon stat-card__icon--${tone}`}><Icon name={icon} size={28} /></span>
      <span><small>{label}</small><strong>{value}</strong></span>
    </article>
  );
}
