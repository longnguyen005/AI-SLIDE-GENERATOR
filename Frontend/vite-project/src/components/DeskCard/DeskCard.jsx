import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import './DeskCard.css';

export default function DeckCard({ deck, selected = false }) {
  const deckId = deck._id || deck.id;
  const title = deck.title || deck.topic || 'Untitled deck';
  const subtitle = deck.description || deck.topic || deck.status || 'No description yet';
  const slides = Number(deck.slideCount || deck.slides || 0);
  const status = deck.status ? deck.status.replace(/_/g, ' ') : 'draft';

  return (
    <Link to={`/preview/${deckId}`} className={`deck-card ${selected ? 'deck-card--selected' : ''}`}>
      {selected && <span className="deck-card__check"><Icon name="check" size={16} /></span>}
      <div className="deck-card__cover deck-card__cover--blue">
        <span className="deck-card__cover-icon"><Icon name="sparkles" size={52} /></span>
        <span className="deck-card__slides">{slides} slides</span>
      </div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
      <div className="deck-card__tags">
        <span>{status}</span>
        {deck.tone && <span>{deck.tone}</span>}
      </div>
    </Link>
  );
}
