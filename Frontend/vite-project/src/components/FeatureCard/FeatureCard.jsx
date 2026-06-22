import React from 'react';
import Icon from '../Icon/Icon';
import './FeatureCard.css';

export default function FeatureCard({ icon, title, children }) {
  return (
    <article className="feature-card">
      <span><Icon name={icon} size={19} /></span>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
