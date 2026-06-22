import React from 'react';
import './AuthVisual.css';

export default function AuthVisual({ title = 'Turn ideas into presentations', footer = '' }) {
  return (
    <section className="auth-visual" aria-hidden="true">
      <span className="auth-shape auth-shape--circle-one" />
      <span className="auth-shape auth-shape--circle-two" />
      <span className="auth-shape auth-shape--square" />
      <span className="auth-shape auth-shape--pill" />
      <div className="auth-visual__center">
        <div className="auth-visual__logo">D</div>
        <h2>{title}</h2>
      </div>
      <p className="auth-visual__footer">{footer}</p>
    </section>
  );
}
