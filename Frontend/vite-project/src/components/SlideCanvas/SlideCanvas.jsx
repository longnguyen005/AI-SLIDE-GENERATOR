import React from 'react';
import Icon from '../Icon/Icon';
import './SlideCanvas.css';

const VALID_LAYOUTS = new Set(['title', 'section', 'content', 'two_column', 'summary']);

const LAYOUT_LABELS = {
  title: 'Cover',
  section: 'Section Break',
  content: 'Key Insights',
  two_column: 'Side-by-Side',
  summary: 'Executive Summary',
};

function visualIcon(title = '') {
  const text = String(title).toLowerCase();
  if (text.includes('climate') || text.includes('emission') || text.includes('global')) return 'globe';
  if (text.includes('growth') || text.includes('metric') || text.includes('impact') || text.includes('faster')) return 'chart';
  if (text.includes('strategy') || text.includes('recommend') || text.includes('roadmap')) return 'layers';
  if (text.includes('risk') || text.includes('challenge') || text.includes('security') || text.includes('governance')) return 'lock';
  return 'sparkles';
}

export default function SlideCanvas({ slide }) {
  const rawPoints = slide?.content || slide?.points || [];
  const points = Array.isArray(rawPoints) ? rawPoints.filter((point) => String(point).trim().length > 0) : [];
  const rawLayout = slide?.layout || 'content';
  const layout = VALID_LAYOUTS.has(rawLayout) ? rawLayout : 'content';
  const slideNum = String(slide?.slideNumber || 1).padStart(2, '0');
  const title = slide?.title || 'Untitled slide';
  const icon = visualIcon(title);

  const midIndex = Math.max(1, Math.ceil(points.length / 2));
  const leftColumnPoints = points.slice(0, midIndex);
  const rightColumnPoints = points.slice(midIndex);

  return (
    <section
      className={`slide-canvas slide-canvas--${layout}`}
      data-layout={layout}
      aria-label={`Slide ${slideNum}: ${title}`}
    >
      <div className="slide-canvas__accent" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      {layout === 'title' && (
        <>
          <div className="slide-canvas__content">
            <span className="slide-canvas__eyebrow">
              {LAYOUT_LABELS.title} • Slide {slideNum}
            </span>
            <h2>{title}</h2>
            <p className="slide-canvas__hero-lead">
              {points[0] || 'Executive presentation generated with DeckAI.'}
            </p>
            {points.length > 1 && (
              <ul className="slide-canvas__points slide-canvas__points--compact">
                {points.slice(1).map((point, index) => (
                  <li key={`${point}-${index}`}>
                    <span>{String(index + 2).padStart(2, '0')}</span>
                    <p>{point}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <aside className="slide-canvas__visual" aria-hidden="true">
            <div className="slide-canvas__visual-grid" />
            <div className="slide-canvas__visual-icon">
              <Icon name={icon} size={58} />
            </div>
            <div className="slide-canvas__visual-bars">
              <span />
              <span />
              <span />
            </div>
          </aside>
        </>
      )}

      {layout === 'section' && (
        <div className="slide-canvas__content slide-canvas__content--section">
          <div className="slide-canvas__section-header">
            <span className="slide-canvas__section-badge">{slideNum}</span>
            <span className="slide-canvas__eyebrow">
              {LAYOUT_LABELS.section} • Slide {slideNum}
            </span>
          </div>
          <h2>{title}</h2>
          {points.length ? (
            <ul className="slide-canvas__points slide-canvas__points--section">
              {points.map((point, index) => (
                <li key={`${point}-${index}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{point}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="slide-canvas__empty">No slide content yet.</p>
          )}
        </div>
      )}

      {layout === 'content' && (
        <>
          <div className="slide-canvas__content">
            <span className="slide-canvas__eyebrow">
              {LAYOUT_LABELS.content} • Slide {slideNum}
            </span>
            <h2>{title}</h2>
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
              <p className="slide-canvas__empty">No slide content yet.</p>
            )}
          </div>
          <aside className="slide-canvas__visual" aria-hidden="true">
            <div className="slide-canvas__visual-grid" />
            <div className="slide-canvas__visual-icon">
              <Icon name={icon} size={58} />
            </div>
            <div className="slide-canvas__visual-bars">
              <span />
              <span />
              <span />
            </div>
          </aside>
        </>
      )}

      {layout === 'two_column' && (
        <div className="slide-canvas__content slide-canvas__content--full">
          <span className="slide-canvas__eyebrow">
            {LAYOUT_LABELS.two_column} • Slide {slideNum}
          </span>
          <h2>{title}</h2>
          <div className="slide-canvas__columns">
            <div className="slide-canvas__column">
              <strong className="slide-canvas__column-label">Column 01</strong>
              {leftColumnPoints.length ? (
                <ul className="slide-canvas__points">
                  {leftColumnPoints.map((point, index) => (
                    <li key={`${point}-${index}`}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <p>{point}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="slide-canvas__empty">No points in column 1.</p>
              )}
            </div>
            <div className="slide-canvas__column slide-canvas__column--alt">
              <strong className="slide-canvas__column-label">Column 02</strong>
              {rightColumnPoints.length ? (
                <ul className="slide-canvas__points">
                  {rightColumnPoints.map((point, index) => (
                    <li key={`${point}-${index}`}>
                      <span>{String(midIndex + index + 1).padStart(2, '0')}</span>
                      <p>{point}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="slide-canvas__empty">Add another bullet to populate Column 02.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {layout === 'summary' && (
        <div className="slide-canvas__content slide-canvas__content--full">
          <span className="slide-canvas__eyebrow">
            {LAYOUT_LABELS.summary} • Slide {slideNum}
          </span>
          <h2>{title}</h2>
          {points.length ? (
            <ul className="slide-canvas__summary-grid">
              {points.map((point, index) => (
                <li key={`${point}-${index}`} className="slide-canvas__summary-card">
                  <div className="slide-canvas__summary-head">
                    <span className="slide-canvas__summary-check">
                      <Icon name="check" size={16} />
                    </span>
                    <small>Takeaway {String(index + 1).padStart(2, '0')}</small>
                  </div>
                  <p>{point}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="slide-canvas__empty">No slide content yet.</p>
          )}
        </div>
      )}

      <span className="slide-canvas__watermark">DeckAI Generation</span>
    </section>
  );
}
