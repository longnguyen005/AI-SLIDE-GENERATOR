import React from 'react';
import Icon from '../Icon/Icon';
import './OutlineCard.css';

export default function OutlineCard({ number, title, summary, onTitleChange, onSummaryChange }) {
  return (
    <article className="outline-card">
      <div className="outline-card__drag"><Icon name="drag" size={20} /></div>
      <span className="outline-card__number">{number}</span>
      <div className="outline-card__content">
        <label>Section title</label>
        <input value={title} onChange={(event) => onTitleChange(event.target.value)} aria-label={`Section title ${number}`} />
        <label>Key points</label>
        <textarea value={summary} onChange={(event) => onSummaryChange(event.target.value)} rows="3" />
      </div>
    </article>
  );
}
