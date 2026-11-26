import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/SideBar/SideBar';
import ProgressSteps from '../../components/ProgressSteps/ProgressSteps';
import OutlineCard from '../../components/OutlineCard/OutlineCard';
import Button from '../../components/Button/Button';
import Icon from '../../components/Icon/Icon';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../service/apiClient';
import './OutlinePage.css';

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
}

function createSectionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `sec-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureSectionIds(rawSections = []) {
  return rawSections.map((section, index) => ({
    ...section,
    id: section.id ? String(section.id) : createSectionId(),
    title: typeof section.title === 'string' ? section.title : `Section ${index + 1}`,
    summary: typeof section.summary === 'string' ? section.summary : '',
    order: index + 1,
  }));
}

function normalizeSectionsForSave(list = []) {
  return list.map((section, idx) => {
    const trimmedTitle = String(section.title ?? '').trim();
    return {
      id: section.id ? String(section.id).trim() : createSectionId(),
      title: trimmedTitle ? trimmedTitle.slice(0, 200) : `Section ${idx + 1}`,
      summary: String(section.summary ?? '').trim().slice(0, 1000),
      order: idx + 1,
    };
  });
}

export default function OutlinePage() {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sections, setSections] = useState([]);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [generatingSlides, setGeneratingSlides] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [panel, setPanel] = useState('');
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [highlightedId, setHighlightedId] = useState('');

  useEffect(() => {
    if (!highlightedId) return undefined;
    const timerId = window.setTimeout(() => {
      setHighlightedId('');
    }, 700);
    return () => window.clearTimeout(timerId);
  }, [highlightedId]);

  useEffect(() => {
    if (!deckId) return;
    let active = true;

    async function loadOutline() {
      try {
        const current = await api.getOutline(deckId);
        const currentSections = current.outline?.sections || [];
        if (currentSections.length) {
          if (active) {
            setSections(ensureSectionIds(currentSections));
            setDraftDirty(false);
          }
          return;
        }

        const generated = await api.generateOutline(deckId);
        if (active) {
          setSections(ensureSectionIds(generated.outline?.sections || []));
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

  const saveDraft = async () => {
    const hasBlankTitle = sections.some((section) => !String(section.title ?? '').trim());
    if (!deckId || (!draftDirty && !hasBlankTitle)) return;
    const normalizedSections = normalizeSectionsForSave(sections);
    setSections(normalizedSections);
    setSavingDraft(true);
    try {
      await api.updateOutline(deckId, normalizedSections);
      setDraftDirty(false);
    } finally {
      setSavingDraft(false);
    }
  };

  const updateSection = (index, field, value) => {
    setSections((current) =>
      current.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section
      )
    );
    setDraftDirty(true);
  };

  const addSection = () => {
    if (sections.length >= 10) return;
    const newId = createSectionId();
    setSections((current) => {
      if (current.length >= 10) return current;
      const nextNumber = current.length + 1;
      return [
        ...current,
        {
          id: newId,
          title: `Section ${nextNumber}`,
          summary: '',
          order: nextNumber,
        },
      ];
    });
    setHighlightedId(newId);
    setDraftDirty(true);
  };

  const moveSection = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const movedId = sections[index]?.id || '';
    setSections((current) => {
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
    if (movedId) setHighlightedId(movedId);
    setDraftDirty(true);
  };

  const removeSection = (index) => {
    if (sections.length <= 1) return;
    setSections((current) => {
      if (current.length <= 1) return current;
      return current
        .filter((_, sectionIndex) => sectionIndex !== index)
        .map((item, idx) => ({ ...item, order: idx + 1 }));
    });
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
          <div>
            <h1>Outline Editor</h1>
            <p>Review, reorder, and refine sections before generating slides</p>
          </div>
          <div className="outline-header__actions">
            <button
              type="button"
              className="outline-pill"
              onClick={() => setPanel('ai')}
              aria-label="AI status"
            >
              AI
            </button>
            <button
              type="button"
              className="outline-theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              <Icon name={isDark ? 'sun' : 'moon'} size={17} />
            </button>
            <button
              type="button"
              className="outline-avatar-btn"
              onClick={() => setPanel('account')}
              aria-label="Account details"
            >
              {userInitials}
            </button>
          </div>
          <Button
            className="outline-header__generate"
            iconRight="arrowRight"
            onClick={() => setConfirmGenerate(true)}
            disabled={loading || generatingSlides || !sections.length}
          >
            {generatingSlides ? 'Generating...' : 'Generate Slides'}
          </Button>
        </header>

        <ProgressSteps active={2} />

        {notice && (
          <div className="outline-message" role="alert">
            {notice}
          </div>
        )}
        {loading && <div className="outline-empty">Generating outline...</div>}

        {!loading && (
          <div className="outline-toolbar">
            <div className="outline-toolbar__meta">
              <strong>Sections</strong>
              <span className="outline-toolbar__count">{`${sections.length} / 10`}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              icon="plus"
              onClick={addSection}
              disabled={sections.length >= 10}
            >
              Add section
            </Button>
          </div>
        )}

        {!loading && !sections.length && (
          <div className="outline-empty">
            <strong>No outline available</strong>
            <small>Add a section above or go back to update your deck topic.</small>
          </div>
        )}

        <section className="outline-list">
          {sections.map((section, index) => (
            <OutlineCard
              key={section.id}
              number={index + 1}
              title={section.title}
              summary={section.summary || ''}
              highlighted={section.id === highlightedId}
              staggerIndex={Math.min(index, 7)}
              onTitleChange={(value) => updateSection(index, 'title', value)}
              onSummaryChange={(value) => updateSection(index, 'summary', value)}
              onMoveUp={() => moveSection(index, -1)}
              onMoveDown={() => moveSection(index, 1)}
              onRemove={() => removeSection(index)}
              disableMoveUp={index === 0}
              disableMoveDown={index === sections.length - 1}
              disableRemove={sections.length <= 1}
            />
          ))}
        </section>

        <footer className="outline-sticky">
          <div className="outline-sticky__summary">
            <strong>{`${sections.length} ${sections.length === 1 ? 'section' : 'sections'}`}</strong>
            <small>{`Estimated ${sections.length} ${sections.length === 1 ? 'slide' : 'slides'}`}</small>
          </div>
          <span className="outline-sticky__status">
            <Icon name="clock" size={16} />
            {savingDraft
              ? 'Saving draft...'
              : draftDirty
                ? 'Unsaved changes'
                : 'Synced with backend'}
          </span>
          <Button variant="outline" icon="back" onClick={backToTopic} disabled={savingDraft}>
            Back to Topic
          </Button>
          <Button
            icon="wand"
            onClick={() => setConfirmGenerate(true)}
            disabled={loading || generatingSlides || !sections.length}
          >
            {generatingSlides ? 'Generating...' : 'Generate Slides'}
          </Button>
        </footer>
      </main>

      {confirmGenerate && (
        <div className="sidebar-popup-backdrop">
          <section className="sidebar-popup outline-popup" role="dialog" aria-modal="true">
            <header className="sidebar-popup__header">
              <div>
                <strong>Generate slides?</strong>
                <small>Your draft outline is saved. This will create the slide deck from it.</small>
              </div>
              <button
                type="button"
                onClick={() => setConfirmGenerate(false)}
                aria-label="Close popup"
              >
                <Icon name="close" size={20} />
              </button>
            </header>
            <div className="sidebar-popup__body">
              <div className="outline-status-card">
                <Icon name="slide" size={24} />
                <div>
                  <strong>{`${sections.length} slides will be generated`}</strong>
                  <small>
                    {draftDirty ? 'Your latest outline edits will be saved first. ' : ''}
                    You can still go back to topic without generating slides. Once generated, the
                    deck moves to preview and edit mode.
                  </small>
                </div>
              </div>
              <div className="outline-popup__actions">
                <Button type="button" variant="outline" onClick={() => setConfirmGenerate(false)}>
                  Keep Draft
                </Button>
                <Button
                  type="button"
                  icon="wand"
                  onClick={generateSlides}
                  disabled={generatingSlides}
                >
                  {generatingSlides ? 'Generating...' : 'Generate Slides'}
                </Button>
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
                <strong>{panel === 'account' ? 'Account details' : 'AI status'}</strong>
                <small>
                  {panel === 'account' ? 'Your DeckAI profile' : 'Gemini generation status'}
                </small>
              </div>
              <button type="button" onClick={() => setPanel('')} aria-label="Close popup">
                <Icon name="close" size={20} />
              </button>
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
                  <div>
                    <dt>Account ID</dt>
                    <dd>{user?.id || 'Unknown'}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{user?.email || 'Unknown'}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatDate(user?.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            )}

            {panel === 'ai' && (
              <div className="sidebar-popup__body">
                <div className="outline-status-card">
                  <Icon name="sparkles" size={24} />
                  <div>
                    <strong>Gemini AI is ready</strong>
                    <small>
                      {sections.length
                        ? `${sections.length} outline sections are ready to generate into slides.`
                        : 'Create or load an outline before generating slides.'}
                    </small>
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
