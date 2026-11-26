import React from 'react';
import Icon from '../Icon/Icon';
import { useCountUp } from '../../hooks/useMotion';
import './StatCard.css';

export default function StatCard({ icon, label, value, tone = 'purple', staggerIndex = 0 }) {
  const animatedValue = useCountUp(typeof value === 'number' ? value : Number(value) || 0);

  return (
    <article className="stat-card" style={{ '--stagger-index': staggerIndex }}>
      <span className={`stat-card__icon stat-card__icon--${tone}`}><Icon name={icon} size={28} /></span>
      <span><small>{label}</small><strong>{animatedValue}</strong></span>
    </article>
  );
}
