import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import './DeskCard.css';

const TONE_COVERS = {
  professional: {
    key: 'professional',
    eyebrow: 'Executive Brief',
  },
  academic: {
    key: 'academic',
    eyebrow: 'Research Study',
  },
  persuasive: {
    key: 'persuasive',
    eyebrow: 'Pitch Narrative',
  },
  simple: {
    key: 'simple',
    eyebrow: 'Clear Overview',
  },
};

function deckHref(deckId, status) {
  if (status === 'ready') {
    return `/preview/${deckId}`;
  }
  return `/outline/${deckId}`;
}

export default function DeckCard({
  deck,
  selected = false,
  staggerIndex = 0,
  onDelete,
  deleting = false,
}) {
  const deckId = deck?._id || deck?.id || '';
  const title = String(deck?.title || deck?.topic || 'Untitled deck').trim() || 'Untitled deck';
  const statusLabel = deck?.status ? String(deck.status).replace(/_/g, ' ') : 'draft';
  const subtitle =
    String(deck?.description || deck?.topic || statusLabel || 'No description yet').trim() ||
    'No description yet';
  const slides = Math.max(0, Number(deck?.slideCount ?? deck?.slides ?? 0) || 0);
  const isReady = deck?.status === 'ready';

  const normalizedTone = String(deck?.tone || 'professional').trim().toLowerCase();
  const coverVariant = TONE_COVERS[normalizedTone] || TONE_COVERS.professional;

  const firstSectionTitle =
    typeof deck?.outline?.sections?.[0]?.title === 'string'
      ? deck.outline.sections[0].title.trim()
      : '';
  const distinctTopic =
    typeof deck?.topic === 'string' && deck.topic.trim() && deck.topic.trim() !== title
      ? deck.topic.trim()
      : '';
  const coverHeadline = firstSectionTitle || distinctTopic || title;

  return (
    <article
      className={`deck-card ${selected ? 'deck-card--selected' : ''}`}
      style={{ '--stagger-index': staggerIndex }}
    >
      {selected && (
        <span className="deck-card__check" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
      )}

      <Link to={deckHref(deckId, deck?.status)} className="deck-card__main">
        <div
          className={`deck-card__cover deck-card__cover--${coverVariant.key}`}
          aria-hidden="true"
        >
          <div className="deck-card__cover-frame">
            <div className="deck-card__cover-top">
              <span className="deck-card__eyebrow">{coverVariant.eyebrow}</span>
              <span className="deck-card__slides">
                {`${slides} ${slides === 1 ? 'slide' : 'slides'}`}
              </span>
            </div>

            <div className="deck-card__cover-headline">{coverHeadline}</div>

            <div className="deck-card__cover-bars">
              <span className="deck-card__bar deck-card__bar--primary" />
              <span className="deck-card__bar deck-card__bar--secondary" />
            </div>
          </div>
        </div>

        <h3>{title}</h3>
        <p>{subtitle}</p>
      </Link>

      <div className="deck-card__footer">
        <div className="deck-card__tags">
          <span className={isReady ? 'is-ready' : 'is-draft'}>{statusLabel}</span>
          {deck?.tone && <span>{String(deck.tone)}</span>}
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
