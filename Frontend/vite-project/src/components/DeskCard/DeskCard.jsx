import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import './DeskCard.css';

function deckHref(deckId, status) {
  if (status === 'ready') {
    return `/preview/${deckId}`;
  }
  return `/outline/${deckId}`;
}

export default function DeckCard({ deck, selected = false, onDelete, deleting = false }) {
  const deckId = deck._id || deck.id;
  const title = deck.title || deck.topic || 'Untitled deck';
  const subtitle = deck.description || deck.topic || deck.status || 'No description yet';
  const slides = Number(deck.slideCount || deck.slides || 0);
  const status = deck.status ? deck.status.replace(/_/g, ' ') : 'draft';
  const isReady = deck.status === 'ready';

  return (
    <article className={`deck-card ${selected ? 'deck-card--selected' : ''}`}>
      {selected && (
        <span className="deck-card__check">
          <Icon name="check" size={16} />
        </span>
      )}

      <Link to={deckHref(deckId, deck.status)} className="deck-card__main">
        <div className="deck-card__cover deck-card__cover--blue">
          <span className="deck-card__cover-icon">
            <Icon name="sparkles" size={52} />
          </span>
          <span className="deck-card__slides">{slides} slides</span>
        </div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </Link>

      <div className="deck-card__footer">
        <div className="deck-card__tags">
          <span className={isReady ? 'is-ready' : 'is-draft'}>{status}</span>
          {deck.tone && <span>{deck.tone}</span>}
        </div>

        <div className="deck-card__actions">
          {isReady ? (
            <>
              <Link
                to={`/editor/${deckId}`}
                className="deck-card__action"
                aria-label={`Edit ${title}`}
              >
                <Icon name="edit" size={14} /> Edit
              </Link>
              <Link
                to={`/preview/${deckId}`}
                className="deck-card__action"
                aria-label={`Preview ${title}`}
              >
                <Icon name="eye" size={14} /> Preview
              </Link>
            </>
          ) : (
            <Link
              to={`/outline/${deckId}`}
              className="deck-card__action"
              aria-label={`Open outline for ${title}`}
            >
              <Icon name="list" size={14} /> Outline
            </Link>
          )}

          {onDelete && (
            <button
              type="button"
              className="deck-card__action deck-card__action--danger"
              onClick={() => onDelete(deck)}
              disabled={deleting}
              aria-label={`Delete ${title}`}
            >
              <Icon name="trash" size={14} /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
