import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/SideBar/SideBar';
import Topbar from '../../components/Topbar/Topbar';
import Button from '../../components/Button/Button';
import Icon from '../../components/Icon/Icon';
import SlideCanvas from '../../components/SlideCanvas/SlideCanvas';
import RegenerateModal from '../../components/RegenerateModal/RegenerateModal';
import { api } from '../../service/apiClient';
import './PreviewPage.css';

export default function PreviewPage() {
  const { deckId } = useParams();
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [notesOpen, setNotesOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(Boolean(deckId));
  const [exporting, setExporting] = useState(false);

  const previous = () => setIndex((value) => Math.max(0, value - 1));
  const next = () => setIndex((value) => Math.min(slides.length - 1, value + 1));
  const activeSlide = slides[index];

  useEffect(() => {
    if (!deckId) return undefined;
    let active = true;

    async function loadSlides() {
      try {
        const result = await api.getSlides(deckId);
        if (active) {
          setSlides(result.slides || []);
          setIndex(0);
        }
      } catch (error) {
        if (active) setMessage(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSlides();
    return () => {
      active = false;
    };
  }, [deckId]);

  useEffect(() => {
    const handler = (event) => {
      if (modalOpen) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1));
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(slides.length - 1, value + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slides.length, modalOpen]);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      setMessage('Browser could not enter full screen.');
    }
  };

  const regenerate = async (instruction) => {
    if (!activeSlide?._id) return;
    const result = await api.regenerateSlide(activeSlide._id, instruction);
    setSlides((current) =>
      current.map((slide) => (slide._id === result.slide._id ? result.slide : slide))
    );
    setMessage('Slide regenerated successfully!');
  };

  const exportPptx = async () => {
    if (!deckId) return;
    setMessage('');
    setExporting(true);
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
      setMessage(`Exported ${result.fileName}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-shell preview-page">
      <Sidebar active="preview" />
      <main className="page-content preview-main">
        <Topbar
          title="Presentation Preview"
          action={
            deckId ? (
              <Button to={`/editor/${deckId}`} variant="outline" icon="edit">
                Edit Slides
              </Button>
            ) : null
          }
        />

        {message && (
          <div className="preview-message" role="status">
            {message}
          </div>
        )}
        {loading && <div className="preview-empty">Loading slides...</div>}

        {!loading && !activeSlide && (
          <div className="preview-empty">
            <strong>No slides found</strong>
            <p>Generate slides for this deck before opening preview.</p>
            <Button to="/dashboard" variant="outline">
              Back to dashboard
            </Button>
          </div>
        )}

        {!loading && activeSlide && (
          <>
            <div className="preview-stage">
              <SlideCanvas slide={activeSlide} />
            </div>

            <div className="preview-controls">
              <div className="preview-controls__nav">
                <Button
                  type="button"
                  variant="outline"
                  icon="arrowLeft"
                  onClick={previous}
                  disabled={index === 0}
                >
                  Previous
                </Button>
                <span className="preview-counter">
                  {index + 1} / {slides.length}
                </span>
                <Button
                  type="button"
                  iconRight="arrowRight"
                  onClick={next}
                  disabled={index === slides.length - 1}
                >
                  Next
                </Button>
              </div>

              <div className="preview-controls__right">
                <span className="preview-hint">
                  <span className="preview-hint__keys" aria-hidden="true">
                    <kbd>&larr;</kbd>
                    <kbd>&rarr;</kbd>
                  </span>
                  <span>Use arrow keys to navigate</span>
                </span>
                <Button type="button" variant="outline" icon="fullscreen" onClick={enterFullscreen}>
                  Full Screen
                </Button>
              </div>
            </div>

            <section className="speaker-notes">
              <button
                type="button"
                className="speaker-notes__header"
                aria-expanded={notesOpen}
                onClick={() => setNotesOpen((value) => !value)}
              >
                <span>Speaker Notes</span>
                <Icon name="chevronDown" className={notesOpen ? 'is-open' : ''} />
              </button>
              {notesOpen && (
                <div className="speaker-notes__body">
                  {activeSlide.speakerNotes || 'No speaker notes yet.'}
                </div>
              )}
            </section>

            <section className="export-card">
              <div className="export-card__copy">
                <strong>Export your presentation</strong>
                <p>Ready to share? Generate a production-ready PowerPoint file.</p>
              </div>
              <div className="export-card__actions">
                <Button
                  type="button"
                  variant="secondary"
                  icon="wand"
                  onClick={() => setModalOpen(true)}
                >
                  Regenerate slide
                </Button>
                <Button type="button" icon="download" onClick={exportPptx} disabled={exporting}>
                  {exporting ? 'Exporting...' : 'Export PPTX'}
                </Button>
              </div>
            </section>

            <div className="preview-thumbnails" role="group" aria-label="Slide filmstrip">
              {slides.map((slide, slideIndex) => {
                const slideTitle = String(slide?.title || '').trim() || 'Untitled slide';
                const layoutLabel = String(slide?.layout || 'content').replace('_', ' ');
                const isActive = slideIndex === index;

                return (
                  <button
                    type="button"
                    key={slide._id || `slide-${slideIndex}`}
                    className={isActive ? 'is-active' : ''}
                    onClick={() => setIndex(slideIndex)}
                    aria-label={`Go to slide ${slideIndex + 1}: ${slideTitle}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span className="preview-thumb__head">
                      <span className="preview-thumb__badge">
                        {String(slideIndex + 1).padStart(2, '0')}
                      </span>
                      <em className="preview-thumb__layout">{layoutLabel}</em>
                    </span>
                    <strong className="preview-thumb__title">{slideTitle}</strong>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>
      <RegenerateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRegenerate={regenerate}
      />
    </div>
  );
}
