import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/SideBar/SideBar';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import Topbar from '../../components/Topbar/Topbar';
import { api } from '../../service/apiClient';
import './CreatePresentationPage.css';

export default function CreatePresentationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get('deckId');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('Professional');
  const [slideCount, setSlideCount] = useState(6);
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
        setTone(deck.tone ? deck.tone[0].toUpperCase() + deck.tone.slice(1) : 'Professional');
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

  const submit = async (event) => {
    event.preventDefault();
    setNotice('');
    setLoading(true);
    try {
      const payload = {
        topic,
        description,
        language: 'English',
        tone: tone.toLowerCase(),
        slideCount
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
      <main className="create-main">
        <Topbar
          title={deckId ? 'Edit Draft' : 'New Deck'}
          subtitle={deckId ? 'Update your saved topic before generating slides' : 'Create a structured AI presentation from your topic'}
          showSearch={false}
        />

        {notice && <div className="create-message">{notice}</div>}

        <form className="create-card" onSubmit={submit}>
          <div className="create-card__hero">
            <span><Icon name="sparkles" size={26} /></span>
            <h1>{deckId ? 'Edit presentation draft' : 'Create new presentation'}</h1>
            <p>{deckId ? 'Your draft is saved. Update the topic details, then regenerate the outline when ready.' : "Tell us about your topic and we'll generate a structured outline using AI."}</p>
          </div>

          <div className="form-group">
            <label htmlFor="topic">Topic <em>*</em></label>
            <input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g., Machine Learning in Healthcare" required />
            <small>Enter the main subject of your presentation</small>
          </div>

          <div className="form-group">
            <div className="form-group__row"><label htmlFor="description">Description</label><span>{description.length} / 500</span></div>
            <textarea id="description" value={description} onChange={(event) => setDescription(event.target.value.slice(0, 500))} placeholder="Add context, specific areas to cover, or target audience..." rows="5" />
          </div>

          <div className="create-options">
            <div className="form-group">
              <label htmlFor="tone">Tone</label>
              <select id="tone" value={tone} onChange={(event) => setTone(event.target.value)}>
                <option>Professional</option><option>Academic</option><option>Simple</option><option>Persuasive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Slide Count</label>
              <div className="slide-stepper">
                <button type="button" onClick={() => setSlideCount((value) => Math.max(3, value - 1))}><Icon name="minus" size={18} /></button>
                <strong>{slideCount}</strong>
                <button type="button" onClick={() => setSlideCount((value) => Math.min(10, value + 1))}><Icon name="plus" size={18} /></button>
              </div>
              <small>Max 10 slides</small>
            </div>
            <div className="form-group">
              <label>Language</label>
              <div className="disabled-field"><Icon name="globe" size={18} /> English <Icon name="lock" size={15} /></div>
              <small>More coming soon</small>
            </div>
          </div>

          <div className="ai-info"><Icon name="sparkles" /><p><strong>Powered by Gemini AI.</strong> AI will create a structured outline based on your topic. You can review and edit it before generating slides.</p></div>

          <footer className="create-card__footer">
            <Button type="button" variant="outline" onClick={() => (deckId ? navigate(`/outline/${deckId}`) : navigate('/dashboard'))}>Cancel</Button>
            <Button type="submit" icon="sparkles" disabled={loading || loadingDraft}>{loading ? 'Saving...' : deckId ? 'Update Outline' : 'Generate Outline'}</Button>
          </footer>
        </form>
        <p className="create-trust">Trusted by 10k+ researchers and creators</p>
      </main>
    </div>
  );
}
