import React from 'react';
import Icon from '../Icon/Icon';
import './OutlineCard.css';

export default function OutlineCard({
  number,
  title,
  summary,
  highlighted = false,
  staggerIndex = 0,
  onTitleChange,
  onSummaryChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  disableMoveUp = false,
  disableMoveDown = false,
  disableRemove = false,
}) {
  return (
    <article
      className={`outline-card ${highlighted ? 'outline-card--highlighted' : ''}`.trim()}
      style={{ '--stagger-index': staggerIndex }}
    >
      <div className="outline-card__rail">
        <span className="outline-card__number">{number}</span>
        <span className="outline-card__drag" aria-hidden="true">
          <Icon name="drag" size={18} />
        </span>
      </div>

      <div className="outline-card__content">
        <div className="outline-card__top">
          <span className="outline-card__label">Section title</span>
          <div className="outline-card__controls">
            <button
              type="button"
              className="outline-card__control"
              onClick={() => onMoveUp?.()}
              disabled={disableMoveUp}
              aria-label={`Move section ${number} up`}
              title="Move section up"
            >
              <Icon name="chevronDown" size={15} className="outline-card__icon-up" />
            </button>
            <button
              type="button"
              className="outline-card__control"
              onClick={() => onMoveDown?.()}
              disabled={disableMoveDown}
              aria-label={`Move section ${number} down`}
              title="Move section down"
            >
              <Icon name="chevronDown" size={15} />
            </button>
            <button
              type="button"
              className="outline-card__control outline-card__control--danger"
              onClick={() => onRemove?.()}
              disabled={disableRemove}
              aria-label={`Remove section ${number}`}
              title="Remove section"
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        </div>

        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          aria-label={`Section title ${number}`}
          placeholder={`Section ${number}`}
        />

        <span className="outline-card__label">Key points</span>
        <textarea
          value={summary}
          onChange={(event) => onSummaryChange(event.target.value)}
          aria-label={`Key points ${number}`}
          placeholder="Add key takeaways, supporting evidence, or talking points for this section..."
          rows="3"
        />
      </div>
    </article>
  );
}
