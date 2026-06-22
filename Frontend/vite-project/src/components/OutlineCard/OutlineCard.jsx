import React, { useState } from 'react';
import Icon from '../Icon/Icon';
import './OutlineCard.css';

export default function OutlineCard({ number, title, points }) {
  const [value, setValue] = useState(points.join('\n'));
  return (
    <article className="outline-card">
      <div className="outline-card__drag"><Icon name="drag" size={20} /></div>
      <span className="outline-card__number">{number}</span>
      <div className="outline-card__content">
        <label>Section title</label>
        <input value={title} readOnly aria-label={`Tiêu đề phần ${number}`} />
        <label>Key points</label>
        <textarea value={value} onChange={(event) => setValue(event.target.value)} rows="3" />
      </div>
    </article>
  );
}
