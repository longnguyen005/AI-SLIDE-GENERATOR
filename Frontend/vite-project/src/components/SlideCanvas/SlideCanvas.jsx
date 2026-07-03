import React from 'react';
import Icon from '../Icon/Icon';
import './SlideCanvas.css';

function visualIcon(title = '') {
  const text = title.toLowerCase();
  if (text.includes('climate') || text.includes('emission') || text.includes('global')) return 'globe';
  if (text.includes('growth') || text.includes('metric') || text.includes('impact')) return 'chart';
  if (text.includes('strategy') || text.includes('recommend') || text.includes('roadmap')) return 'layers';
  if (text.includes('risk') || text.includes('challenge')) return 'info';
  return 'sparkles';
}

export default function SlideCanvas({ slide }) {
  const points = slide?.content || slide?.points || [];
  const layout = slide?.layout || 'content';
  const icon = visualIcon(slide?.title);

  return (
    <section className={`slide-canvas slide-canvas--${layout}`}>
      <div className="slide-canvas__accent" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="slide-canvas__content">
        <span className="slide-canvas__eyebrow">Slide {slide?.slideNumber || '01'}</span>
        <h2>{slide?.title || 'Untitled slide'}</h2>
        {points.length ? (
          <ul className="slide-canvas__points">
            {points.map((point, index) => (
              <li key={`${point}-${index}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{point}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No slide content yet.</p>
        )}
      </div>
      <aside className="slide-canvas__visual" aria-hidden="true">
        <div className="slide-canvas__visual-grid" />
        <div className="slide-canvas__visual-icon"><Icon name={icon} size={58} /></div>
        <div className="slide-canvas__visual-bars">
          <span />
          <span />
          <span />
        </div>
      </aside>
      <span className="slide-canvas__watermark">DeckAI Generation</span>
    </section>
  );
}
