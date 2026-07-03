import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/SideBar/SideBar';
import ProgressSteps from '../../components/ProgressSteps/ProgressSteps';
import OutlineCard from '../../components/OutlineCard/OutlineCard';
import Button from '../../components/Button/Button';
import Icon from '../../components/Icon/Icon';
import { api } from '../../service/apiClient';
import './OutlinePage.css';

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function formatDate(value) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function OutlinePage() {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const [sections, setSections] = useState([]);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [generatingSlides, setGeneratingSlides] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [user, setUser] = useState(null);
  const [panel, setPanel] = useState('');
  const [confirmGenerate, setConfirmGenerate] = useState(false);

  useEffect(() => {
    if (!deckId) return;
    let active = true;

    async function loadOutline() {
      try {
        const current = await api.getOutline(deckId);
        const currentSections = current.outline?.sections || [];
        if (currentSections.length) {
          if (active) {
            setSections(currentSections);
            setDraftDirty(false);
          }
          return;
        }

        const generated = await api.generateOutline(deckId);
        if (active) {
          setSections(generated.outline?.sections || []);
          setDraftDirty(false);
        }
      } catch (error) {
        if (active) setNotice(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOutline();
    return () => {
      active = false;
    };
  }, [deckId]);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const result = await api.me();
        if (active) setUser(result.user);
      } catch {
        if (active) setUser(null);
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  const saveDraft = async () => {
    if (!deckId || !draftDirty) return;
    setSavingDraft(true);
    try {
      await api.updateOutline(deckId, sections);
      setDraftDirty(false);
    } finally {
      setSavingDraft(false);
    }
  };

  const updateSection = (index, field, value) => {
    setSections((current) => current.map((section, sectionIndex) => (
      sectionIndex === index ? { ...section, [field]: value } : section
    )));
    setDraftDirty(true);
  };

  const backToTopic = async () => {
    setNotice('');
    try {
      await saveDraft();
      navigate(`/create?deckId=${deckId}`);
    } catch (error) {
      setNotice(error.message);
    }
  };

  const generateSlides = async () => {
    setConfirmGenerate(false);
    setNotice('');
    setGeneratingSlides(true);
    try {
      await saveDraft();
      await api.generateSlides(deckId);
      navigate(`/preview/${deckId}`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setGeneratingSlides(false);
    }
  };

  const userName = user?.fullName || user?.email || 'User';
  const userInitials = initials(userName);

  return (
    <div className="page-shell outline-page">
      <Sidebar active="outline" />
      <main className="outline-main">
        <header className="outline-header">
          <div><h1>Outline Editor</h1><p>AI generated outline</p></div>
          <div className="outline-header__actions">
            <button type="button" className="outline-pill" onClick={() => setPanel('ai')} aria-label="AI status">AI</button>
            <button type="button" className="outline-pill" onClick={() => setPanel('account')} aria-label="Account details">{userInitials}</button>
            <button type="button" className="outline-pill outline-pill--light" onClick={() => setPanel('collaborators')} aria-label="Collaborators">+1</button>
          </div>
          <Button className="outline-header__generate" iconRight="arrowRight" onClick={() => setConfirmGenerate(true)} disabled={loading || generatingSlides || !sections.length}>{generatingSlides ? 'Generating...' : 'Generate Slides'}</Button>
        </header>
        <ProgressSteps active={2} />

        {notice && <div className="outline-message">{notice}</div>}
        {loading && <div className="outline-empty">Generating outline...</div>}

        {!loading && !sections.length && (
          <div className="outline-empty">
            <strong>No outline available</strong>
            <small>Go back and create a new deck topic.</small>
          </div>
        )}

        <section className="outline-list">
          {sections.map((section, index) => (
            <OutlineCard
              key={section.id || section.title}
              number={index + 1}
              title={section.title}
              summary={section.summary || ''}
              onTitleChange={(value) => updateSection(index, 'title', value)}
              onSummaryChange={(value) => updateSection(index, 'summary', value)}
            />
          ))}
        </section>
        <footer className="outline-sticky">
          <div><strong>{sections.length} sections</strong><small>Estimated {sections.length} slides</small></div>
          <span><Icon name="clock" size={18} /> {savingDraft ? 'Saving draft...' : draftDirty ? 'Unsaved changes' : 'Synced with backend'}</span>
          <Button variant="outline" icon="back" onClick={backToTopic} disabled={savingDraft}>Back to Topic</Button>
          <Button icon="wand" onClick={() => setConfirmGenerate(true)} disabled={loading || generatingSlides || !sections.length}>{generatingSlides ? 'Generating...' : 'Generate Slides'}</Button>
        </footer>
      </main>

      {confirmGenerate && (
        <div className="sidebar-popup-backdrop">
          <section className="sidebar-popup outline-popup" role="dialog" aria-modal="true">
            <header className="sidebar-popup__header">
              <div>
                <strong>Generate slides?</strong>
                <small>Your draft outline is saved. This will create the first slide deck from it.</small>
              </div>
              <button type="button" onClick={() => setConfirmGenerate(false)} aria-label="Close popup"><Icon name="close" size={20} /></button>
            </header>
            <div className="sidebar-popup__body">
              <div className="outline-status-card">
                <Icon name="slide" size={24} />
                <div>
                  <strong>{sections.length} slides will be generated</strong>
                  <small>{draftDirty ? 'Your latest outline edits will be saved first. ' : ''}You can still go back to topic without generating slides. Once generated, the deck moves to preview/edit mode.</small>
                </div>
              </div>
              <div className="outline-popup__actions">
                <Button type="button" variant="outline" onClick={() => setConfirmGenerate(false)}>Keep Draft</Button>
                <Button type="button" icon="wand" onClick={generateSlides} disabled={generatingSlides}>{generatingSlides ? 'Generating...' : 'Generate Slides'}</Button>
              </div>
            </div>
          </section>
        </div>
      )}

      {panel && (
        <div className="sidebar-popup-backdrop">
          <section className="sidebar-popup outline-popup" role="dialog" aria-modal="true">
            <header className="sidebar-popup__header">
              <div>
                <strong>{panel === 'account' ? 'Account details' : panel === 'ai' ? 'AI status' : 'Collaborators'}</strong>
                <small>{panel === 'account' ? 'Your DeckAI profile' : panel === 'ai' ? 'Gemini generation status' : 'Workspace sharing'}</small>
              </div>
              <button type="button" onClick={() => setPanel('')} aria-label="Close popup"><Icon name="close" size={20} /></button>
            </header>

            {panel === 'account' && (
              <div className="sidebar-popup__body">
                <div className="account-summary">
                  <span className="avatar avatar--photo">{userInitials}</span>
                  <div>
                    <strong>{userName}</strong>
                    <small>{user?.email || 'Signed in'}</small>
                  </div>
                </div>
                <dl className="account-details">
                  <div><dt>Account ID</dt><dd>{user?.id || 'Unknown'}</dd></div>
                  <div><dt>Email</dt><dd>{user?.email || 'Unknown'}</dd></div>
                  <div><dt>Created</dt><dd>{formatDate(user?.createdAt)}</dd></div>
                </dl>
              </div>
            )}

            {panel === 'ai' && (
              <div className="sidebar-popup__body">
                <div className="outline-status-card">
                  <Icon name="sparkles" size={24} />
                  <div>
                    <strong>Gemini AI is ready</strong>
                    <small>{sections.length ? `${sections.length} outline sections are ready to generate into slides.` : 'Create or load an outline before generating slides.'}</small>
                  </div>
                </div>
              </div>
            )}

            {panel === 'collaborators' && (
              <div className="sidebar-popup__body">
                <div className="outline-status-card">
                  <Icon name="team" size={24} />
                  <div>
                    <strong>Personal workspace</strong>
                    <small>Collaboration is not enabled in this MVP. This deck is available to your current account only.</small>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
