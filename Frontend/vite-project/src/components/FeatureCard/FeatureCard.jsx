import React from 'react';
import Icon from '../Icon/Icon';
import './FeatureCard.css';

export default function FeatureCard({ icon, title, children, className = '', style, ...rest }) {
  return (
    <article className={`feature-card ${className}`.trim()} style={style} {...rest}>
      <span><Icon name={icon} size={19} /></span>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
