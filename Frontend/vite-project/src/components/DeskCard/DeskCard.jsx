import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import './DeskCard.css';

export default function DeckCard({ deck, selected = false }) {
  return (
    <Link to="/preview" className={`deck-card ${selected ? 'deck-card--selected' : ''}`}>
      {selected && <span className="deck-card__check"><Icon name="check" size={16} /></span>}
      <div className={`deck-card__cover deck-card__cover--${deck.cover}`}>
        <span className="deck-card__cover-icon"><Icon name={deck.icon || 'sparkles'} size={52} /></span>
        <span className="deck-card__slides">{deck.slides} slides</span>
      </div>
      <h3>{deck.title}</h3>
      <p>{deck.subtitle}</p>
      <div className="deck-card__tags">
        {deck.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
    </Link>
  );
}
