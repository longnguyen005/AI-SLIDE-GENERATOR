import React, { useRef } from 'react';
import Icon from '../Icon/Icon';
import { useTilt3D } from '../../hooks/useMotion';
import './AuthVisual.css';

const WORKFLOW_HIGHLIGHTS = [
  'Structured AI Outlines',
  '5 Native Slide Layouts',
  '1-Click .pptx Export',
];

const MINI_TAKEAWAYS = [
  ['01', '34% faster knowledge cycle time across pilot pods'],
  ['02', 'Role-scoped retrieval & audit traces enabled by default'],
  ['03', 'Standards-compliant 16:9 OOXML export ready for board review'],
];

export default function AuthVisual({
  title = 'Turn ideas into presentations',
  footer = 'DeckAI presentation engineering workspace',
}) {
  const cardRef = useRef(null);
  useTilt3D(cardRef, { maxDeg: 2.8 });

  return (
    <section className="auth-visual" aria-hidden="true">
      <div className="auth-visual__grid" />

      <div className="auth-visual__brand">
        <span className="auth-visual__brand-mark">
          <Icon name="sparkles" size={16} />
        </span>
        <strong>DeckAI</strong>
        <span className="auth-visual__brand-tag">16:9 Studio</span>
      </div>

      <div className="auth-visual__center">
        <div className="auth-visual__copy">
          <h2>{title}</h2>
          <p>
            Draft structured narratives, inspect adaptive slide geometry, and ship presentation-ready decks without manual formatting.
          </p>
        </div>

        <div ref={cardRef} className="auth-visual__slide-card">
          <div className="auth-visual__slide-top">
            <span className="auth-visual__slide-eyebrow">Executive Summary • Slide 05</span>
            <span className="auth-visual__slide-ratio">16:9 · .pptx</span>
          </div>
          <h3>Q4 Enterprise AI Rollout — Key Takeaways</h3>
          <ul className="auth-visual__slide-rows">
            {MINI_TAKEAWAYS.map(([num, item], index) => (
              <li key={num} style={{ '--item-index': index }}>
                <span>{num}</span>
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </div>

        <ul className="auth-visual__checks">
          {WORKFLOW_HIGHLIGHTS.map((label, index) => (
            <li key={label} style={{ '--item-index': index }}>
              <span className="auth-visual__check-icon">
                <Icon name="check" size={14} />
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="auth-visual__footer">{footer}</p>
    </section>
  );
}
