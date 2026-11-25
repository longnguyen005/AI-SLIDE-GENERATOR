import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Sidebar from '../../components/SideBar/SideBar';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import SlideCanvas from '../../components/SlideCanvas/SlideCanvas';
import RegenerateModal from '../../components/RegenerateModal/RegenerateModal';
import { useAuth } from '../../context/AuthContext';
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

  const [deck, setDeck] = useState(null);
  const [slides, setSlides] = useState([]);
  const [activeSlideId, setActiveSlideId] = useState(null);
  const [draft, setDraft] = useState(null);

  const [loading, setLoading] = useState(Boolean(deckId));
  const [saving, setSaving] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState('');

  useEffect(() => {
    if (!deckId) return undefined;
    let active = true;

    async function loadEditorWorkspace() {
      setLoading(true);
      setErrorMessage('');
      setToast('');
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
        setDraft(null);
      } catch (error) {
        if (active) {
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

  const activeIndex = useMemo(() => {
    if (!slides.length) return -1;
    const found = slides.findIndex((slide) => slide._id === activeSlideId);
    return found >= 0 ? found : 0;
  }, [slides, activeSlideId]);

  const activeSlide = activeIndex >= 0 ? slides[activeIndex] : null;
  const isCurrentDraft = Boolean(activeSlide && draft && draft.slideId === activeSlide._id);

  const currentTitle = isCurrentDraft ? draft.title : (activeSlide?.title ?? '');
  const currentBullets = useMemo(() => {
    if (isCurrentDraft) return draft.bullets;
    return activeSlide?.content?.length ? activeSlide.content : [''];
  }, [isCurrentDraft, draft, activeSlide]);
  const currentLayout = isCurrentDraft ? draft.layout : (activeSlide?.layout || 'content');
  const currentNotes = isCurrentDraft ? draft.speakerNotes : (activeSlide?.speakerNotes ?? '');

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

  const updateDraft = (patch) => {
    if (!activeSlide) return;
    setDraft((prev) => {
      const base =
        prev && prev.slideId === activeSlide._id
          ? prev
          : {
              slideId: activeSlide._id,
              title: activeSlide.title ?? '',
              bullets: activeSlide.content?.length ? [...activeSlide.content] : [''],
              layout: activeSlide.layout || 'content',
              speakerNotes: activeSlide.speakerNotes ?? '',
            };
      return { ...base, ...patch };
    });
  };

  const selectSlide = (slideId) => {
    setActiveSlideId(slideId);
    setDraft(null);
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
      const result = await api.updateSlide(activeSlide._id, payload);
      setSlides((prev) =>
        prev.map((slide) => (slide._id === result.slide._id ? result.slide : slide))
      );
      setDraft(null);
      setToast('Slide changes saved.');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save slide changes.');
    } finally {
      setSaving(false);
    }
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
      setActiveSlideId(result.slide._id);
      setDraft(null);
      setToast('Added a new slide.');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to add slide.');
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
      setDraft(null);
      setToast('Slide removed.');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete slide.');
    } finally {
      setMutating(false);
    }
  };

  const handleRegenerate = async (instruction) => {
    if (!activeSlide) return;
    setErrorMessage('');
    const result = await api.regenerateSlide(activeSlide._id, instruction);
    setSlides((prev) =>
      prev.map((slide) => (slide._id === result.slide._id ? result.slide : slide))
    );
    setDraft(null);
    setToast('Slide regenerated with AI. Previous snapshot saved to Version history.');
  };

  const openVersionHistory = async () => {
    if (!activeSlide) return;
    setVersionModalOpen(true);
    setLoadingVersions(true);
    setErrorMessage('');
    try {
      const result = await api.getSlideVersions(activeSlide._id);
      setVersions(result.versions || []);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load slide versions.');
      setVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!activeSlide || restoringVersionId) return;
    setRestoringVersionId(versionId);
    setErrorMessage('');
    try {
      const result = await api.restoreSlideVersion(activeSlide._id, versionId);
      setSlides((prev) =>
        prev.map((slide) => (slide._id === result.slide._id ? result.slide : slide))
      );
      setDraft(null);
      setVersionModalOpen(false);
      setToast('Restored slide snapshot from version history.');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to restore version.');
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
              <strong>{deckTitle}</strong>
              <small>
                {loading
                  ? 'Loading slides...'
                  : `${slides.length} ${slides.length === 1 ? 'slide' : 'slides'} • ${isCurrentDraft ? 'Unsaved edits' : 'All changes saved'}`}
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

        {!loading && !slides.length && (
          <div className="editor-state-card">
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
              {slides.map((slide, index) => (
                <button
                  type="button"
                  key={slide._id}
                  className={slide._id === activeSlide._id ? 'is-active' : ''}
                  onClick={() => selectSlide(slide._id)}
                >
                  <span>{slide.slideNumber || index + 1}</span>
                  <div className={`thumb thumb--${slide.layout || 'content'}`} aria-hidden="true">
                    <Icon name={layoutIcon(slide.layout)} size={24} />
                    <em>{(slide.layout || 'content').replace('_', ' ')}</em>
                  </div>
                  <small>{slide.title || 'Untitled slide'}</small>
                </button>
              ))}
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

                <SlideCanvas slide={previewSlide} />

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
              <h2>Slide layout</h2>
              <div className="layout-grid">
                {LAYOUT_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={currentLayout === option.value ? 'is-active' : ''}
                    aria-pressed={currentLayout === option.value}
                    onClick={() => updateDraft({ layout: option.value })}
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
          onMouseDown={() => !restoringVersionId && setVersionModalOpen(false)}
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
                onClick={() => setVersionModalOpen(false)}
                disabled={Boolean(restoringVersionId)}
                aria-label="Close version history"
              >
                <Icon name="close" size={20} />
              </button>
            </header>

            <div className="sidebar-popup__body editor-version-modal__body">
              {loadingVersions && (
                <p className="editor-version-modal__empty">Loading version history...</p>
              )}

              {!loadingVersions && versions.length === 0 && (
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
