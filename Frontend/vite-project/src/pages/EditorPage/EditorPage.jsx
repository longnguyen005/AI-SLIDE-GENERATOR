import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Sidebar from '../../components/SideBar/SideBar';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import SlideCanvas from '../../components/SlideCanvas/SlideCanvas';
import RegenerateModal from '../../components/RegenerateModal/RegenerateModal';
import { DECK_THEME_OPTIONS, normalizeDeckTheme } from '../../constants/deckThemes';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../service/apiClient';
import './EditorPage.css';

const LAYOUT_OPTIONS = [
  { value: 'title', label: 'Title Cover', hint: 'Hero intro', icon: 'sparkles' },
  { value: 'section', label: 'Section Divider', hint: 'Chapter break', icon: 'layers' },
  { value: 'content', label: 'Standard Content', hint: 'Points + visual', icon: 'slide' },
  { value: 'two_column', label: 'Two Column', hint: 'Split comparison', icon: 'template' },
  { value: 'summary', label: 'Executive Summary', hint: 'Key takeaways', icon: 'check' },
];

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatVersionDate(value) {
  if (!value) return 'Saved snapshot';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function layoutIcon(layout) {
  const match = LAYOUT_OPTIONS.find((item) => item.value === layout);
  return match ? match.icon : 'slide';
}

export default function EditorPage() {
  const { deckId } = useParams();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [deck, setDeck] = useState(null);
  const [slides, setSlides] = useState([]);
  const [activeSlideId, setActiveSlideId] = useState(null);
  const [slideDir, setSlideDir] = useState(0);
  const [draftsBySlideId, setDraftsBySlideId] = useState({});

  const [isRenamingDeck, setIsRenamingDeck] = useState(false);
  const [deckTitleInput, setDeckTitleInput] = useState('');
  const [renamingDeck, setRenamingDeck] = useState(false);

  const [loading, setLoading] = useState(Boolean(deckId));
  const [saving, setSaving] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versionError, setVersionError] = useState('');
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState('');

  useEffect(() => {
    if (!deckId) return undefined;
    let active = true;

    async function loadEditorWorkspace() {
      setLoading(true);
      setErrorMessage('');
      setToast('');
      setIsRenamingDeck(false);
      try {
        const [deckResult, slidesResult] = await Promise.all([
          api.getDeck(deckId),
          api.getSlides(deckId),
        ]);
        if (!active) return;
        const loadedSlides = slidesResult.slides || [];
        setDeck(deckResult.deck || null);
        setSlides(loadedSlides);
        setActiveSlideId(loadedSlides[0]?._id || null);
        setDraftsBySlideId({});
      } catch (error) {
        if (active) {
          setDeck(null);
          setSlides([]);
          setActiveSlideId(null);
          setDraftsBySlideId({});
          setErrorMessage(error.message || 'Unable to load deck editor.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadEditorWorkspace();
    return () => {
      active = false;
    };
  }, [deckId]);

  const avatar = useMemo(() => initials(user?.fullName || user?.email || ''), [user]);
  const deckTheme = normalizeDeckTheme(deck?.theme);

  const activeIndex = useMemo(() => {
    if (!slides.length) return -1;
    const found = slides.findIndex((slide) => slide._id === activeSlideId);
    return found >= 0 ? found : 0;
  }, [slides, activeSlideId]);

  const activeSlide = activeIndex >= 0 ? slides[activeIndex] : null;
  const activeDraft = activeSlide ? draftsBySlideId[activeSlide._id] || null : null;
  const isCurrentDraft = Boolean(activeDraft);
  const hasAnyUnsavedDraft = Object.keys(draftsBySlideId).length > 0;

  const currentTitle = isCurrentDraft ? activeDraft.title : (activeSlide?.title ?? '');
  const currentBullets = useMemo(() => {
    if (isCurrentDraft) return activeDraft.bullets;
    return activeSlide?.content?.length ? activeSlide.content : [''];
  }, [isCurrentDraft, activeDraft, activeSlide]);
  const currentLayout = isCurrentDraft ? activeDraft.layout : (activeSlide?.layout || 'content');
  const currentNotes = isCurrentDraft
    ? activeDraft.speakerNotes
    : (activeSlide?.speakerNotes ?? '');

  const previewSlide = useMemo(() => {
    if (!activeSlide) return null;
    return {
      ...activeSlide,
      slideNumber: activeSlide.slideNumber || activeIndex + 1,
      title: currentTitle || 'Untitled slide',
      content: currentBullets.map((item) => item.trim()).filter(Boolean),
      layout: currentLayout,
      speakerNotes: currentNotes,
    };
  }, [activeSlide, activeIndex, currentTitle, currentBullets, currentLayout, currentNotes]);

  const clearSlideDraft = (slideId) => {
    if (!slideId) return;
    setDraftsBySlideId((prev) => {
      if (!prev[slideId]) return prev;
      const next = { ...prev };
      delete next[slideId];
      return next;
    });
  };

  const updateDraft = (patch) => {
    if (!activeSlide) return;
    const slideId = activeSlide._id;
    setDraftsBySlideId((prev) => {
      const base = prev[slideId] || {
        slideId,
        title: activeSlide.title ?? '',
        bullets: activeSlide.content?.length ? [...activeSlide.content] : [''],
        layout: activeSlide.layout || 'content',
        speakerNotes: activeSlide.speakerNotes ?? '',
      };
      return {
        ...prev,
        [slideId]: { ...base, ...patch },
      };
    });
  };

  const selectSlide = (slideId) => {
    const nextIdx = slides.findIndex((slide) => slide._id === slideId);
    if (nextIdx >= 0 && activeIndex >= 0 && nextIdx !== activeIndex) {
      setSlideDir(nextIdx > activeIndex ? 1 : -1);
    }
    setActiveSlideId(slideId);
    setErrorMessage('');
  };

  const handleBulletChange = (bulletIndex, value) => {
    const nextBullets = currentBullets.map((item, idx) => (idx === bulletIndex ? value : item));
    updateDraft({ bullets: nextBullets });
  };

  const handleAddBullet = () => {
    if (currentBullets.length >= 8) return;
    updateDraft({ bullets: [...currentBullets, ''] });
  };

  const handleRemoveBullet = (bulletIndex) => {
    if (currentBullets.length <= 1) {
      updateDraft({ bullets: [''] });
      return;
    }
    updateDraft({
      bullets: currentBullets.filter((_, idx) => idx !== bulletIndex),
    });
  };

  const handleSaveSlide = async () => {
    if (!activeSlide || saving) return;
    const targetSlideId = activeSlide._id;
    setSaving(true);
    setErrorMessage('');
    setToast('');
    try {
      const payload = {
        title: currentTitle.trim() || 'Untitled slide',
        content: currentBullets.map((item) => item.trim()).filter(Boolean),
        layout: currentLayout,
        speakerNotes: currentNotes,
      };
      const result = await api.updateSlide(targetSlideId, payload);
      setSlides((prev) =>
        prev.map((slide) => (slide._id === result.slide._id ? result.slide : slide))
      );
      clearSlideDraft(targetSlideId);
      setToast('Slide changes saved.');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save slide changes.');
    } finally {
      setSaving(false);
    }
  };

  const saveHandlerRef = useRef(handleSaveSlide);
  saveHandlerRef.current = handleSaveSlide;

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        if (modalOpen || versionModalOpen) return;
        event.preventDefault();
        saveHandlerRef.current?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, versionModalOpen]);

  const startRenameDeck = () => {
    if (!deck || renamingDeck) return;
    setDeckTitleInput(deck.title || deck.topic || '');
    setIsRenamingDeck(true);
  };

  const cancelRenameDeck = () => {
    if (renamingDeck) return;
    setIsRenamingDeck(false);
    setDeckTitleInput('');
  };

  const commitRenameDeck = async () => {
    if (!deckId || !deck || renamingDeck) return;
    const nextTitle = deckTitleInput.trim();
    const existingTitle = String(deck.title || deck.topic || '').trim();
    if (!nextTitle || nextTitle === existingTitle) {
      setIsRenamingDeck(false);
      return;
    }
    setRenamingDeck(true);
    setErrorMessage('');
    try {
      const result = await api.updateDeck(deckId, { title: nextTitle.slice(0, 200) });
      setDeck(result.deck);
      setIsRenamingDeck(false);
      setToast('Presentation title updated.');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to rename presentation.');
    } finally {
      setRenamingDeck(false);
    }
  };

  const handleDeckTitleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitRenameDeck();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelRenameDeck();
    }
  };

  const handleSelectDeckTheme = async (nextThemeValue) => {
    if (!deckId || !deck) return;
    const normalized = normalizeDeckTheme(nextThemeValue);
    if (normalized === deckTheme) return;

    const previousTheme = deck.theme;
    setDeck((prev) => (prev ? { ...prev, theme: normalized } : prev));
    setErrorMessage('');
    try {
      const result = await api.updateDeck(deckId, { theme: normalized });
      setDeck(result.deck);
      setToast(`Applied ${DECK_THEME_OPTIONS.find((item) => item.value === normalized)?.label || normalized} theme.`);
    } catch (error) {
      setDeck((prev) => (prev ? { ...prev, theme: previousTheme } : prev));
      setErrorMessage(error.message || 'Failed to update deck theme.');
    }
  };

  const handleThemeRadioKeyDown = (event, index) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % DECK_THEME_OPTIONS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + DECK_THEME_OPTIONS.length) % DECK_THEME_OPTIONS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = DECK_THEME_OPTIONS.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    const targetOption = DECK_THEME_OPTIONS[nextIndex];
    handleSelectDeckTheme(targetOption.value);
    const radios = event.currentTarget.parentElement?.querySelectorAll('[role="radio"]');
    radios?.[nextIndex]?.focus();
  };

  const handleAddSlide = async () => {
    if (!deckId || slides.length >= 10 || mutating) return;
    setMutating(true);
    setErrorMessage('');
    setToast('');
    try {
      const result = await api.createSlide(deckId, {
        title: `New Slide ${slides.length + 1}`,
        content: ['Add your primary takeaway for this slide.'],
        speakerNotes: '',
        layout: 'content',
      });
      setSlides((prev) => [...prev, result.slide]);
      setSlideDir(1);
      setActiveSlideId(result.slide._id);
      setToast('Added a new slide.');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to add slide.');
    } finally {
      setMutating(false);
    }
  };

  const handleDuplicateSlide = async () => {
    if (!activeSlide || slides.length >= 10 || mutating) return;
    setMutating(true);
    setErrorMessage('');
    setToast('');
    try {
      const result = await api.duplicateSlide(activeSlide._id);
      if (Array.isArray(result.slides)) {
        setSlides(result.slides);
      } else if (result.slide) {
        setSlides((prev) => [...prev, result.slide]);
      }
      if (result.slide?._id) {
        setSlideDir(1);
        setActiveSlideId(result.slide._id);
      }
      setToast('Slide duplicated.');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to duplicate slide.');
    } finally {
      setMutating(false);
    }
  };

  const handleMoveSlide = async (direction) => {
    if (!deckId || !activeSlide || mutating) return;
    const targetIndex = activeIndex + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    setMutating(true);
    setErrorMessage('');
    setToast('');
    try {
      const reordered = [...slides];
      const [moved] = reordered.splice(activeIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      const slideIds = reordered.map((item) => item._id);

      const result = await api.reorderSlides(deckId, slideIds);
      const updatedSlides =
        result?.slides ||
        reordered.map((item, idx) => ({
          ...item,
          slideNumber: idx + 1,
        }));
      setSlides(updatedSlides);
      setActiveSlideId(activeSlide._id);
      setToast(`Moved slide to position ${targetIndex + 1}.`);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to reorder slides.');
    } finally {
      setMutating(false);
    }
  };

  const handleDeleteSlide = async () => {
    if (!activeSlide || slides.length <= 1 || mutating) return;
    setMutating(true);
    setErrorMessage('');
    setToast('');
    try {
      const removedIndex = activeIndex;
      const removedId = activeSlide._id;
      await api.deleteSlide(removedId);

      const remaining = slides
        .filter((item) => item._id !== removedId)
        .map((item, idx) => ({
          ...item,
          slideNumber: idx + 1,
        }));
      const nextSelected = remaining[Math.min(removedIndex, remaining.length - 1)] || null;
      setSlides(remaining);
      setActiveSlideId(nextSelected?._id || null);
      clearSlideDraft(removedId);
      setToast('Slide removed.');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete slide.');
    } finally {
      setMutating(false);
    }
  };

  const handleRegenerate = async (instruction) => {
    if (!activeSlide) return;
    const targetSlideId = activeSlide._id;
    setErrorMessage('');
    const result = await api.regenerateSlide(targetSlideId, instruction);
    setSlides((prev) =>
      prev.map((slide) => (slide._id === result.slide._id ? result.slide : slide))
    );
    clearSlideDraft(targetSlideId);
    setToast('Slide regenerated with AI. Previous snapshot saved to Version history.');
  };

  const openVersionHistory = async () => {
    if (!activeSlide) return;
    setVersionModalOpen(true);
    setLoadingVersions(true);
    setVersionError('');
    setVersions([]);
    try {
      const result = await api.getSlideVersions(activeSlide._id);
      setVersions(result.versions || []);
    } catch (error) {
      setVersionError(error.message || 'Failed to load slide versions.');
      setVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const closeVersionHistory = () => {
    if (restoringVersionId) return;
    setVersionModalOpen(false);
    setVersionError('');
  };

  const handleRestoreVersion = async (versionId) => {
    if (!activeSlide || restoringVersionId) return;
    const targetSlideId = activeSlide._id;
    setRestoringVersionId(versionId);
    setVersionError('');
    try {
      const result = await api.restoreSlideVersion(targetSlideId, versionId);
      setSlides((prev) =>
        prev.map((slide) => (slide._id === result.slide._id ? result.slide : slide))
      );
      clearSlideDraft(targetSlideId);
      setVersionModalOpen(false);
      setVersionError('');
      setToast('Restored slide snapshot from version history.');
    } catch (error) {
      setVersionError(error.message || 'Failed to restore version.');
    } finally {
      setRestoringVersionId('');
    }
  };

  const handleExportPptx = async () => {
    if (!deckId || exporting) return;
    setExporting(true);
    setErrorMessage('');
    setToast('');
    try {
      const result = await api.exportPptx(deckId);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setToast(`Exported ${result.fileName}`);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to export PPTX.');
    } finally {
      setExporting(false);
    }
  };

  const busy = saving || mutating;
  const deckTitle = deck?.title || deck?.topic || 'Presentation Editor';

  return (
    <div className="editor-page">
      <Sidebar active="editor" />
      <main className="editor-workspace">
        <header className="editor-topbar">
          <div className="editor-topbar__identity">
            <Link to="/dashboard" className="editor-topbar__back" aria-label="Back to dashboard">
              <Icon name="arrowLeft" size={18} />
            </Link>
            <div className="editor-topbar__titles">
              {isRenamingDeck ? (
                <div className="editor-topbar__rename-row">
                  <input
                    type="text"
                    className="editor-topbar__rename-input"
                    aria-label="Deck title"
                    value={deckTitleInput}
                    maxLength={200}
                    autoFocus
                    onChange={(event) => setDeckTitleInput(event.target.value)}
                    onKeyDown={handleDeckTitleKeyDown}
                  />
                  <button
                    type="button"
                    className="editor-topbar__rename-action"
                    onClick={commitRenameDeck}
                    disabled={renamingDeck}
                    aria-label="Confirm rename"
                  >
                    <Icon name="check" size={15} />
                  </button>
                  <button
                    type="button"
                    className="editor-topbar__rename-action"
                    onClick={cancelRenameDeck}
                    disabled={renamingDeck}
                    aria-label="Cancel rename"
                  >
                    <Icon name="close" size={15} />
                  </button>
                </div>
              ) : (
                <div className="editor-topbar__title-row">
                  <strong>{deckTitle}</strong>
                  {!loading && deck && (
                    <button
                      type="button"
                      className="editor-topbar__rename-btn"
                      onClick={startRenameDeck}
                      aria-label="Rename deck title"
                      title="Rename presentation"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                  )}
                </div>
              )}

              <small className="editor-topbar__meta">
                {loading ? (
                  'Loading slides...'
                ) : !deck ? (
                  'Presentation unavailable'
                ) : (
                  <>
                    <span>
                      {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
                    </span>
                    <span className="editor-topbar__sep" aria-hidden="true">
                      •
                    </span>
                    <span
                      className={`editor-status ${hasAnyUnsavedDraft ? 'editor-status--unsaved' : 'editor-status--saved'}`}
                    >
                      <span className="editor-status__dot" aria-hidden="true" />
                      {hasAnyUnsavedDraft ? 'Unsaved edits' : 'All changes saved'}
                    </span>
                  </>
                )}
              </small>
            </div>
          </div>

          <div className="editor-topbar__actions">
            {deckId && (
              <Button to={`/preview/${deckId}`} variant="outline" icon="eye">
                Preview
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              icon="download"
              onClick={handleExportPptx}
              disabled={!slides.length || exporting}
            >
              {exporting ? 'Exporting...' : 'Export PPTX'}
            </Button>
            <Button
              type="button"
              icon="save"
              onClick={handleSaveSlide}
              disabled={!activeSlide || saving}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
            <button
              type="button"
              className="editor-topbar__theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              <Icon name={isDark ? 'sun' : 'moon'} size={17} />
            </button>
            <span className="editor-avatar" title={user?.email || 'Account'}>
              {avatar}
            </span>
          </div>
        </header>

        {loading && (
          <div className="editor-state-card">
            <strong>Loading slide editor...</strong>
            <p>Fetching your deck structure and slide layouts.</p>
          </div>
        )}

        {!loading && !deck && (
          <div className="editor-state-card editor-state-card--error" role="alert">
            <strong>Unable to load presentation</strong>
            <p>{errorMessage || 'Deck not found.'}</p>
            <div className="editor-state-card__actions">
              <Button to="/dashboard" variant="outline" icon="arrowLeft">
                Back to dashboard
              </Button>
            </div>
          </div>
        )}

        {!loading && deck && !slides.length && (
          <div className="editor-state-card">
            {errorMessage && (
              <div className="editor-toast editor-toast--error" role="alert">
                {errorMessage}
              </div>
            )}
            <strong>No slides in this deck yet</strong>
            <p>Generate slides from your outline or add a blank slide to begin editing.</p>
            <div className="editor-state-card__actions">
              {deckId && (
                <Button to={`/outline/${deckId}`} variant="outline" icon="list">
                  Open Outline
                </Button>
              )}
              <Button type="button" icon="plus" onClick={handleAddSlide} disabled={mutating}>
                Add slide
              </Button>
            </div>
          </div>
        )}

        {!loading && slides.length > 0 && activeSlide && (
          <section className="editor-grid">
            <aside className="editor-thumbs" aria-label="Slide thumbnails">
              {slides.map((slide, index) => {
                const slideDraft = draftsBySlideId[slide._id];
                const thumbLayout = slideDraft ? slideDraft.layout : slide.layout || 'content';
                const thumbTitle =
                  (slideDraft ? slideDraft.title : slide.title)?.trim() || 'Untitled slide';

                return (
                  <button
                    type="button"
                    key={slide._id}
                    className={slide._id === activeSlide._id ? 'is-active' : ''}
                    onClick={() => selectSlide(slide._id)}
                  >
                    <span>
                      {slide.slideNumber || index + 1}
                      {slideDraft && <i className="editor-thumb__unsaved" aria-hidden="true" />}
                    </span>
                    <div className={`thumb thumb--${thumbLayout}`} aria-hidden="true">
                      <Icon name={layoutIcon(thumbLayout)} size={24} />
                      <em>{thumbLayout.replace('_', ' ')}</em>
                    </div>
                    <small>{thumbTitle}</small>
                  </button>
                );
              })}
              <button
                type="button"
                className="editor-add"
                onClick={handleAddSlide}
                disabled={slides.length >= 10 || busy}
              >
                <Icon name="plus" size={18} /> Add slide
              </button>
            </aside>

            <section className="editor-canvas-area">
              {errorMessage && (
                <div className="editor-toast editor-toast--error" role="alert">
                  {errorMessage}
                </div>
              )}
              {toast && !errorMessage && (
                <div className="editor-toast" role="status">
                  {toast}
                </div>
              )}

              <div className="editor-canvas-card">
                <div className="editor-canvas-toolbar">
                  <span className="editor-canvas-toolbar__meta">
                    Slide {activeIndex + 1} of {slides.length}
                  </span>
                  <div className="editor-canvas-toolbar__buttons">
                    <Button
                      type="button"
                      variant="outline"
                      icon="clock"
                      onClick={openVersionHistory}
                      disabled={busy}
                    >
                      Version history
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      icon="wand"
                      onClick={() => setModalOpen(true)}
                      disabled={busy}
                    >
                      Regenerate slide
                    </Button>
                  </div>
                </div>

                <SlideCanvas
                  key={`${activeSlide._id}:${currentLayout}`}
                  slide={previewSlide}
                  direction={slideDir}
                  theme={deckTheme}
                />

                <div className="editor-inline-card">
                  <div className="editor-field">
                    <label htmlFor="editor-slide-title">Slide title</label>
                    <input
                      id="editor-slide-title"
                      type="text"
                      value={currentTitle}
                      onChange={(event) => updateDraft({ title: event.target.value })}
                      placeholder="Enter a clear, action-oriented headline..."
                    />
                  </div>

                  <div className="editor-field">
                    <div className="editor-field__header">
                      <span>Bullet points</span>
                      <button
                        type="button"
                        className="editor-bullet-add"
                        onClick={handleAddBullet}
                        disabled={currentBullets.length >= 8}
                      >
                        <Icon name="plus" size={15} /> Add bullet
                      </button>
                    </div>
                    <div className="editor-bullets">
                      {currentBullets.map((bullet, bulletIndex) => (
                        <div className="editor-bullet-row" key={`bullet-${bulletIndex}`}>
                          <span className="editor-bullet-row__num">
                            {String(bulletIndex + 1).padStart(2, '0')}
                          </span>
                          <input
                            type="text"
                            aria-label={`Bullet ${bulletIndex + 1}`}
                            value={bullet}
                            onChange={(event) =>
                              handleBulletChange(bulletIndex, event.target.value)
                            }
                            placeholder={`Talking point ${bulletIndex + 1}...`}
                          />
                          <button
                            type="button"
                            className="editor-bullet-row__remove"
                            onClick={() => handleRemoveBullet(bulletIndex)}
                            aria-label={`Remove bullet ${bulletIndex + 1}`}
                          >
                            <Icon name="close" size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="editor-properties" aria-label="Slide properties">
              <h2>Deck theme</h2>
              <div
                className="editor-theme-grid"
                role="radiogroup"
                aria-label="Deck color theme"
              >
                {DECK_THEME_OPTIONS.map((option, index) => {
                  const selected = deckTheme === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      role="radio"
                      aria-checked={selected}
                      tabIndex={selected ? 0 : -1}
                      className={`editor-theme-chip ${selected ? 'is-active' : ''}`}
                      onClick={() => handleSelectDeckTheme(option.value)}
                      onKeyDown={(event) => handleThemeRadioKeyDown(event, index)}
                    >
                      <span
                        className={`editor-theme-swatch editor-theme-swatch--${option.value}`}
                        aria-hidden="true"
                      />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <h2>Slide layout</h2>
              <div className="layout-grid">
                {LAYOUT_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={currentLayout === option.value ? 'is-active' : ''}
                    aria-pressed={currentLayout === option.value}
                    onClick={() => {
                      if (option.value !== currentLayout) {
                        setSlideDir(0);
                      }
                      updateDraft({ layout: option.value });
                    }}
                  >
                    <Icon name={option.icon} size={18} />
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </button>
                ))}
              </div>

              <label className="editor-section-label" htmlFor="editor-speaker-notes">
                Speaker notes
              </label>
              <textarea
                id="editor-speaker-notes"
                rows="5"
                value={currentNotes}
                onChange={(event) => updateDraft({ speakerNotes: event.target.value })}
                placeholder="Add presenter cues, transitions, or key data callouts..."
              />

              <Button
                type="button"
                icon="save"
                className="editor-save-btn"
                onClick={handleSaveSlide}
                disabled={!activeSlide || saving}
              >
                {saving ? 'Saving...' : 'Save changes'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                icon="wand"
                onClick={() => setModalOpen(true)}
                disabled={!activeSlide || busy}
              >
                Regenerate with AI
              </Button>

              <Button
                type="button"
                variant="outline"
                icon="clock"
                onClick={openVersionHistory}
                disabled={!activeSlide || busy}
              >
                Version history
              </Button>

              <h2>Slide order &amp; actions</h2>
              <div className="editor-properties__row">
                <button
                  type="button"
                  onClick={() => handleMoveSlide(-1)}
                  disabled={activeIndex <= 0 || busy}
                  aria-label="Move slide up"
                >
                  <Icon name="upload" size={16} /> Move up
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveSlide(1)}
                  disabled={activeIndex >= slides.length - 1 || busy}
                  aria-label="Move slide down"
                >
                  <Icon name="download" size={16} /> Move down
                </button>
              </div>

              <button
                type="button"
                className="editor-duplicate"
                onClick={handleDuplicateSlide}
                disabled={slides.length >= 10 || busy}
              >
                <Icon name="copy" size={16} /> Duplicate slide
              </button>

              <button
                type="button"
                className="editor-remove"
                onClick={handleDeleteSlide}
                disabled={slides.length <= 1 || busy}
              >
                <Icon name="trash" size={17} /> Remove slide
              </button>
            </aside>
          </section>
        )}
      </main>

      <RegenerateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRegenerate={handleRegenerate}
      />

      {versionModalOpen && (
        <div
          className="sidebar-popup-backdrop"
          role="presentation"
          onMouseDown={closeVersionHistory}
        >
          <section
            className="sidebar-popup editor-version-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="version-history-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="sidebar-popup__header">
              <div>
                <strong id="version-history-title">Version history</strong>
                <small>
                  {activeSlide
                    ? `Saved snapshots for Slide ${activeIndex + 1}`
                    : 'Slide snapshots'}
                </small>
              </div>
              <button
                type="button"
                onClick={closeVersionHistory}
                disabled={Boolean(restoringVersionId)}
                aria-label="Close version history"
              >
                <Icon name="close" size={20} />
              </button>
            </header>

            <div className="sidebar-popup__body editor-version-modal__body">
              {versionError && (
                <div
                  className="editor-toast editor-toast--error editor-version-modal__error"
                  role="alert"
                >
                  {versionError}
                </div>
              )}

              {loadingVersions && (
                <p className="editor-version-modal__empty">Loading version history...</p>
              )}

              {!loadingVersions && !versionError && versions.length === 0 && (
                <p className="editor-version-modal__empty">
                  No saved snapshots for this slide yet. Regenerate with AI to automatically
                  archive the current slide before updating it.
                </p>
              )}

              {!loadingVersions &&
                versions.map((version) => (
                  <article key={version._id} className="editor-version-item">
                    <div className="editor-version-item__meta">
                      <span className="editor-version-item__badge">
                        v{version.versionNumber}
                      </span>
                      <small>{formatVersionDate(version.createdAt)}</small>
                      {version.layout && (
                        <span className="editor-version-item__layout">
                          {version.layout.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <strong>{version.title}</strong>
                    {version.reason && (
                      <p className="editor-version-item__reason">{version.reason}</p>
                    )}
                    <div className="editor-version-item__footer">
                      <small>
                        {Array.isArray(version.content) ? version.content.length : 0} bullets
                      </small>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleRestoreVersion(version._id)}
                        disabled={Boolean(restoringVersionId)}
                      >
                        {restoringVersionId === version._id ? 'Restoring...' : 'Restore'}
                      </Button>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
