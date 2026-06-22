import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/SideBar/SideBar';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import './CreatePresentationPage.css';

export default function CreatePresentationPage() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('Professional');
  const [slideCount, setSlideCount] = useState(6);

  const submit = (event) => {
    event.preventDefault();
    navigate('/outline');
  };

  return (
    <div className="page-shell create-page">
      <Sidebar active="create" variant="tool" />
      <main className="create-main">
        <header className="create-topbar">
          <span>/</span>
          <strong>New Deck</strong>
          <div><button><Icon name="bell" /></button><button><Icon name="help" /></button><span className="create-avatar">AR</span></div>
        </header>

        <form className="create-card" onSubmit={submit}>
          <div className="create-card__hero">
            <span><Icon name="sparkles" size={26} /></span>
            <h1>Create new presentation</h1>
            <p>Tell us about your topic and we'll generate a structured outline using AI.</p>
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
                <option>Professional</option><option>Academic</option><option>Creative</option><option>Persuasive</option>
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
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>Cancel</Button>
            <Button type="submit" icon="sparkles">Generate Outline</Button>
          </footer>
        </form>
        <p className="create-trust">Trusted by 10k+ researchers and creators</p>
      </main>
    </div>
  );
}
