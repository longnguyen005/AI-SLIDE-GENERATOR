import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/SideBar/SideBar';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import Topbar from '../../components/Topbar/Topbar';
import { api } from '../../service/apiClient';
import './CreatePresentationPage.css';

const STARTER_TOPICS = [
  'Enterprise AI Governance',
  'Series A Investor Pitch',
  'Grid-Scale Battery Roadmap',
  'Clinical ML Validation',
];

const TONE_OPTIONS = [
  {
    value: 'professional',
    label: 'Professional',
    subtitle: 'Executive clarity, structured KPIs, and board-ready framing.',
    icon: 'layers',
  },
  {
    value: 'academic',
    label: 'Academic',
    subtitle: 'Methodical evidence, structured methodology, and analytical rigor.',
    icon: 'file',
  },
  {
    value: 'simple',
    label: 'Simple',
    subtitle: 'Plain-language takeaways with clean, minimal slide density.',
    icon: 'list',
  },
  {
    value: 'persuasive',
    label: 'Persuasive',
    subtitle: 'High-conviction narrative built for pitches and alignment.',
    icon: 'sparkles',
  },
];

const VALID_TONES = new Set(TONE_OPTIONS.map((option) => option.value));

function normalizeTone(value) {
  const cleaned = String(value || '').trim().toLowerCase();
  return VALID_TONES.has(cleaned) ? cleaned : 'professional';
}

export default function CreatePresentationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get('deckId');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('professional');
  const [slideCount, setSlideCount] = useState(6);
  const [stepDir, setStepDir] = useState('up');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(() => Boolean(deckId));

  useEffect(() => {
    if (!deckId) return;

    let active = true;

    async function loadDraft() {
      try {
        const result = await api.getDeck(deckId);
        const deck = result.deck;
        if (!active) return;
        setTopic(deck.topic || '');
        setDescription(deck.description || '');
        setTone(normalizeTone(deck.tone));
        setSlideCount(Number(deck.slideCount) || 6);
      } catch (error) {
        if (active) setNotice(error.message);
      } finally {
        if (active) setLoadingDraft(false);
      }
    }

    loadDraft();
    return () => {
      active = false;
    };
  }, [deckId]);

  const handleToneKeyDown = (event, index) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % TONE_OPTIONS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + TONE_OPTIONS.length) % TONE_OPTIONS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = TONE_OPTIONS.length - 1;
    } else if (event.key === ' ') {
      event.preventDefault();
      setTone(TONE_OPTIONS[index].value);
      return;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    setTone(TONE_OPTIONS[nextIndex].value);
    const radios = event.currentTarget.parentElement?.querySelectorAll('[role="radio"]');
    radios?.[nextIndex]?.focus();
  };

  const submit = async (event) => {
    event.preventDefault();
    setNotice('');
    setLoading(true);
    try {
      const payload = {
        topic,
        description,
        language: 'English',
        tone: normalizeTone(tone).toLowerCase(),
        slideCount,
      };
      const result = deckId ? await api.updateDeck(deckId, payload) : await api.createDeck(payload);
      const nextDeckId = result.deck._id;
      await api.generateOutline(nextDeckId);
      navigate(`/outline/${nextDeckId}`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell create-page">
      <Sidebar active="create" />
      <main className="page-content create-main">
        <Topbar
          title={deckId ? 'Edit Draft' : 'New Deck'}
          subtitle={
            deckId
              ? 'Update your saved topic before generating slides'
              : 'Create a structured AI presentation from your topic'
          }
          showSearch={false}
        />

        {notice && (
          <div className="create-message" role="alert">
            {notice}
          </div>
        )}

        <form className="create-card" onSubmit={submit}>
          <div className="create-card__hero">
            <span>
              <Icon name="sparkles" size={22} />
            </span>
            <h1>{deckId ? 'Edit presentation draft' : 'Create new presentation'}</h1>
            <p>
              {deckId
                ? 'Your draft is saved. Update the topic details, then regenerate the outline when ready.'
                : "Describe your topic and audience focus — DeckAI will structure a section-by-section outline before building slides."}
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="topic">
              Topic <em>*</em>
            </label>
            <input
              id="topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g., Enterprise AI Governance"
              required
            />
            <div className="starter-chips" aria-label="Starter topic suggestions">
              {STARTER_TOPICS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  className={`starter-chip ${topic === starter ? 'starter-chip--active' : ''}`}
                  aria-label={`Use starter: ${starter}`}
                  onClick={() => setTopic(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <div className="form-group__row">
              <label htmlFor="description">Description &amp; Context</label>
              <span>{description.length} / 500</span>
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, 500))}
              placeholder="Add context, target audience, key metrics, or specific areas to cover..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <span className="form-group__label" id="tone-group-label">
              Presentation Tone
            </span>
            <div
              className="tone-grid"
              role="radiogroup"
              aria-label="Presentation tone"
            >
              {TONE_OPTIONS.map((option, index) => {
                const isSelected = normalizeTone(tone) === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    className={`tone-card ${isSelected ? 'tone-card--selected' : ''}`}
                    onClick={() => setTone(option.value)}
                    onKeyDown={(event) => handleToneKeyDown(event, index)}
                  >
                    <span className="tone-card__icon">
                      <Icon name={option.icon} size={17} />
                    </span>
                    <span className="tone-card__body">
                      <strong>{option.label}</strong>
                      <small>{option.subtitle}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="create-options">
            <div className="form-group">
              <span className="form-group__label">Slide Count</span>
              <div className="slide-stepper">
                <button
                  type="button"
                  aria-label="Decrease slide count"
                  disabled={slideCount <= 3}
                  onClick={() => {
                    setStepDir('down');
                    setSlideCount((value) => Math.max(3, value - 1));
                  }}
                >
                  <Icon name="minus" size={16} />
                </button>
                <strong key={slideCount} data-step-dir={stepDir}>
                  {slideCount}
                </strong>
                <button
                  type="button"
                  aria-label="Increase slide count"
                  disabled={slideCount >= 10}
                  onClick={() => {
                    setStepDir('up');
                    setSlideCount((value) => Math.min(10, value + 1));
                  }}
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
              <small>3 to 10 slides per deck</small>
            </div>

            <div className="form-group">
              <span className="form-group__label">Language</span>
              <div className="disabled-field">
                <Icon name="globe" size={17} /> English <Icon name="lock" size={14} />
              </div>
              <small>English output in current workspace</small>
            </div>
          </div>

          <div className="ai-info">
            <Icon name="sparkles" size={18} />
            <p>
              <strong>Structured AI outline first.</strong> Review, reorder, add, or refine every
              section before generating your 16:9 slide deck.
            </p>
          </div>

          <footer className="create-card__footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => (deckId ? navigate(`/outline/${deckId}`) : navigate('/dashboard'))}
            >
              Cancel
            </Button>
            <Button type="submit" icon="sparkles" disabled={loading || loadingDraft}>
              {loading ? 'Saving...' : deckId ? 'Update Outline' : 'Generate Outline'}
            </Button>
          </footer>
        </form>

        <p className="create-trust">
          Generates an editable section-by-section outline before creating slides.
        </p>
      </main>
    </div>
  );
}
