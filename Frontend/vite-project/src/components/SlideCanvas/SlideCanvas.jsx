import React from 'react';
import Icon from '../Icon/Icon';
import { normalizeDeckTheme } from '../../constants/deckThemes';
import {
  LAYOUT_LABELS,
  VALID_LAYOUTS,
  extractTwoColumnData,
  parseMetricBullet,
  parseTimelineBullet,
} from '../../constants/slideLayouts';
import './SlideCanvas.css';

function visualIcon(title = '') {
  const text = String(title).toLowerCase();
  if (text.includes('climate') || text.includes('emission') || text.includes('global')) return 'globe';
  if (text.includes('growth') || text.includes('metric') || text.includes('impact') || text.includes('faster')) return 'chart';
  if (text.includes('strategy') || text.includes('recommend') || text.includes('roadmap')) return 'layers';
  if (text.includes('risk') || text.includes('challenge') || text.includes('security') || text.includes('governance')) return 'lock';
  return 'sparkles';
}

export default function SlideCanvas({ slide, direction = 0, theme }) {
  const rawPoints = slide?.content || slide?.points || [];
  const points = Array.isArray(rawPoints) ? rawPoints.filter((point) => String(point).trim().length > 0) : [];
  const rawLayout = slide?.layout || 'content';
  const layout = VALID_LAYOUTS.has(rawLayout) ? rawLayout : 'content';
  const resolvedTheme = normalizeDeckTheme(theme || slide?.theme);
  const slideNum = String(slide?.slideNumber || 1).padStart(2, '0');
  const title = slide?.title || 'Untitled slide';
  const icon = visualIcon(title);
  const directionAttr = direction > 0 ? 'forward' : direction < 0 ? 'backward' : 'neutral';

  const twoColumn = layout === 'two_column' ? extractTwoColumnData(points) : null;
  const metricCards = layout === 'metrics' ? points.slice(0, 4).map((p, idx) => parseMetricBullet(p, idx)) : [];
  const timelineSteps = layout === 'timeline' ? points.slice(0, 4).map((p, idx) => parseTimelineBullet(p, idx)) : [];
  const calloutLead = points[0] || 'Anchor execution on measurable strategic priorities.';
  const calloutPillars = points.slice(1, 4);

  return (
    <section
      className={`slide-canvas slide-canvas--${layout}`}
      data-layout={layout}
      data-deck-theme={resolvedTheme}
      data-direction={directionAttr}
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
            <p className="slide-canvas__hero-lead" style={{ '--item-index': 0 }}>
              {points[0] || 'Executive presentation generated with DeckAI.'}
            </p>
            {points.length > 1 && (
              <ul className="slide-canvas__points slide-canvas__points--compact">
                {points.slice(1).map((point, index) => (
                  <li key={index} style={{ '--item-index': index + 1 }}>
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
                <li key={index} style={{ '--item-index': index }}>
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
                  <li key={index} style={{ '--item-index': index }}>
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

      {layout === 'two_column' && twoColumn && (
        <div className="slide-canvas__content slide-canvas__content--full">
          <span className="slide-canvas__eyebrow">
            {LAYOUT_LABELS.two_column} • Slide {slideNum}
          </span>
          <h2>{title}</h2>
          <div className="slide-canvas__columns">
            <div className="slide-canvas__column" style={{ '--item-index': 0 }}>
              <strong className="slide-canvas__column-label">{twoColumn.leftHeader}</strong>
              {twoColumn.leftItems.length ? (
                <ul className="slide-canvas__points">
                  {twoColumn.leftItems.map((point, index) => (
                    <li key={index} style={{ '--item-index': index + 1 }}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <p>{point}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="slide-canvas__empty">No points in column 1.</p>
              )}
            </div>
            <div className="slide-canvas__column slide-canvas__column--alt" style={{ '--item-index': 1 }}>
              <strong className="slide-canvas__column-label">{twoColumn.rightHeader}</strong>
              {twoColumn.rightItems.length ? (
                <ul className="slide-canvas__points">
                  {twoColumn.rightItems.map((point, index) => (
                    <li key={index} style={{ '--item-index': twoColumn.midIndex + index + 1 }}>
                      <span>{String(twoColumn.midIndex + index + 1).padStart(2, '0')}</span>
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

      {layout === 'metrics' && (
        <div className="slide-canvas__content slide-canvas__content--full">
          <span className="slide-canvas__eyebrow">
            {LAYOUT_LABELS.metrics} • Slide {slideNum}
          </span>
          <h2>{title}</h2>
          {metricCards.length ? (
            <div
              className="slide-canvas__metrics-grid"
              data-count={metricCards.length}
            >
              {metricCards.map((metric, index) => (
                <article
                  key={index}
                  className="slide-canvas__metric-card"
                  style={{ '--item-index': index }}
                >
                  <span className="slide-canvas__metric-index">
                    Signal {String(index + 1).padStart(2, '0')}
                  </span>
                  <strong className="slide-canvas__metric-value">{metric.value}</strong>
                  <p className="slide-canvas__metric-label">{metric.label}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="slide-canvas__empty">No metric benchmarks added yet.</p>
          )}
        </div>
      )}

      {layout === 'timeline' && (
        <div className="slide-canvas__content slide-canvas__content--full">
          <span className="slide-canvas__eyebrow">
            {LAYOUT_LABELS.timeline} • Slide {slideNum}
          </span>
          <h2>{title}</h2>
          {timelineSteps.length ? (
            <ol className="slide-canvas__timeline-track">
              {timelineSteps.map((step, index) => (
                <li
                  key={index}
                  className="slide-canvas__timeline-step"
                  style={{ '--item-index': index }}
                >
                  <div className="slide-canvas__timeline-node">
                    <span className="slide-canvas__timeline-num">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <strong className="slide-canvas__timeline-stage">{step.stage}</strong>
                  </div>
                  <p className="slide-canvas__timeline-detail">{step.detail}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="slide-canvas__empty">No roadmap milestones added yet.</p>
          )}
        </div>
      )}

      {layout === 'callout' && (
        <div className="slide-canvas__content slide-canvas__content--full">
          <span className="slide-canvas__eyebrow">
            {LAYOUT_LABELS.callout} • Slide {slideNum}
          </span>
          <h2>{title}</h2>
          {points.length ? (
            <div className="slide-canvas__callout-stack">
              <div className="slide-canvas__callout-hero" style={{ '--item-index': 0 }}>
                <span className="slide-canvas__callout-tag">
                  <Icon name={icon} size={15} />
                  <span>Executive Thesis</span>
                </span>
                <p>{calloutLead}</p>
              </div>
              {calloutPillars.length > 0 && (
                <ul className="slide-canvas__pillars-grid">
                  {calloutPillars.map((pillar, index) => (
                    <li
                      key={index}
                      className="slide-canvas__pillar-card"
                      style={{ '--item-index': index + 1 }}
                    >
                      <small>Supporting Pillar {String(index + 1).padStart(2, '0')}</small>
                      <p>{pillar}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="slide-canvas__empty">No slide content yet.</p>
          )}
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
                <li
                  key={index}
                  className="slide-canvas__summary-card"
                  style={{ '--item-index': index }}
                >
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
