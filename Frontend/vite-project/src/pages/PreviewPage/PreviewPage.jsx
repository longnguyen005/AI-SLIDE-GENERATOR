import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/SideBar/SideBar';
import Topbar from '../../components/Topbar/Topbar';
import Button from '../../components/Button/Button';
import Icon from '../../components/Icon/Icon';
import SlideCanvas from '../../components/SlideCanvas/SlideCanvas';
import RegenerateModal from '../../components/RegenerateModal/RegenerateModal';
import { normalizeDeckTheme } from '../../constants/deckThemes';
import { api } from '../../service/apiClient';
import './PreviewPage.css';

function formatElapsed(totalSeconds = 0) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function PreviewPage() {
  const { deckId } = useParams();
  const [deck, setDeck] = useState(null);
  const [slides, setSlides] = useState([]);
  const [slideNav, setSlideNav] = useState({ index: 0, dir: 0 });
  const [notesOpen, setNotesOpen] = useState(true);
  const [presenterMode, setPresenterMode] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [largeNotes, setLargeNotes] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const isPrintingRef = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(Boolean(deckId));
  const [exporting, setExporting] = useState(false);

  const index = slideNav.index;
  const slideDir = slideNav.dir;
  const deckTheme = normalizeDeckTheme(deck?.theme);

  const previous = () => {
    setSlideNav((prev) => (prev.index <= 0 ? prev : { index: prev.index - 1, dir: -1 }));
  };
  const next = () => {
    setSlideNav((prev) =>
      prev.index >= slides.length - 1 ? prev : { index: prev.index + 1, dir: 1 }
    );
  };
  const activeSlide = slides[index];
  const nextSlide = index + 1 < slides.length ? slides[index + 1] : null;
  const progressRatio = slides.length > 0 ? (index + 1) / slides.length : 0;

  useEffect(() => {
    if (!deckId) return undefined;
    let active = true;

    async function loadPreviewWorkspace() {
      setLoading(true);
      setMessage('');
      setElapsedSeconds(0);
      try {
        const [slidesResult, deckResult] = await Promise.all([
          api.getSlides(deckId),
          api.getDeck(deckId).catch(() => ({ deck: null })),
        ]);
        if (active) {
          setDeck(deckResult?.deck || null);
          setSlides(slidesResult.slides || []);
          setSlideNav({ index: 0, dir: 0 });
        }
      } catch (error) {
        if (active) setMessage(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPreviewWorkspace();
    return () => {
      active = false;
    };
  }, [deckId]);

  useEffect(() => {
    if (!presenterMode || !timerRunning) return undefined;
    const intervalId = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [presenterMode, timerRunning]);

  useEffect(() => {
    const onBeforePrint = () => {
      if (isPrintingRef.current) return;
      isPrintingRef.current = true;
      flushSync(() => {
        setIsPrinting(true);
      });
    };
    const onAfterPrint = () => {
      if (!isPrintingRef.current) return;
      isPrintingRef.current = false;
      flushSync(() => {
        setIsPrinting(false);
      });
    };
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (
        loading ||
        slides.length === 0 ||
        modalOpen ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        Boolean(document.querySelector('[role="dialog"]'))
      ) {
        return;
      }
      const target = event.target;
      const tag = target?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }

      const isInteractiveControl =
        tag === 'BUTTON' ||
        tag === 'A' ||
        Boolean(target?.closest?.('button, a, [role="button"], [role="tab"], [role="radio"]'));

      if (event.key === 'ArrowLeft') {
        setSlideNav((prev) => (prev.index <= 0 ? prev : { index: prev.index - 1, dir: -1 }));
      } else if (event.key === 'ArrowRight') {
        setSlideNav((prev) =>
          prev.index >= slides.length - 1 ? prev : { index: prev.index + 1, dir: 1 }
        );
      } else if (event.key === ' ' && !isInteractiveControl) {
        event.preventDefault();
        setSlideNav((prev) =>
          prev.index >= slides.length - 1 ? prev : { index: prev.index + 1, dir: 1 }
        );
      } else if ((event.key === 'p' || event.key === 'P') && !isInteractiveControl) {
        setPresenterMode((value) => !value);
      } else if ((event.key === 'n' || event.key === 'N') && !isInteractiveControl) {
        setNotesOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loading, slides.length, modalOpen]);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      setMessage('Browser could not enter full screen.');
    }
  };

  const handlePrintPdf = () => {
    if (!slides.length) return;
    isPrintingRef.current = true;
    flushSync(() => {
      setIsPrinting(true);
    });
    try {
      window.print?.();
    } finally {
      isPrintingRef.current = false;
      flushSync(() => {
        setIsPrinting(false);
      });
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
          subtitle={deck?.title || deck?.topic || undefined}
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
            <div className={presenterMode ? 'preview-workspace preview-workspace--presenter' : 'preview-workspace'}>
              <div className="preview-stage">
                <SlideCanvas
                  key={`${activeSlide._id || index}:${activeSlide.layout || 'content'}`}
                  slide={activeSlide}
                  direction={slideDir}
                  theme={deckTheme}
                />
                <div className="preview-progress" aria-hidden="true">
                  <span
                    className="preview-progress__fill"
                    style={{ transform: `scaleX(${progressRatio})` }}
                  />
                </div>
              </div>

              {presenterMode && (
                <aside
                  className="presenter-console"
                  role="region"
                  aria-label="Presenter console"
                >
                  <div className="presenter-timer">
                    <div className="presenter-timer__meta">
                      <span>Elapsed Time</span>
                      <strong className="presenter-timer__readout">
                        {formatElapsed(elapsedSeconds)}
                      </strong>
                    </div>
                    <div className="presenter-timer__actions">
                      <button
                        type="button"
                        className="presenter-icon-btn"
                        onClick={() => setTimerRunning((running) => !running)}
                        aria-label={timerRunning ? 'Pause timer' : 'Resume timer'}
                        title={timerRunning ? 'Pause timer' : 'Resume timer'}
                      >
                        <Icon name={timerRunning ? 'pause' : 'play'} size={16} />
                      </button>
                      <button
                        type="button"
                        className="presenter-icon-btn"
                        onClick={() => setElapsedSeconds(0)}
                        aria-label="Reset timer"
                        title="Reset timer"
                      >
                        <Icon name="refresh" size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="presenter-next">
                    <div className="presenter-next__head">
                      <span>Up Next</span>
                      <small>
                        {nextSlide
                          ? `Slide ${String(index + 2).padStart(2, '0')}`
                          : 'Final slide'}
                      </small>
                    </div>
                    {nextSlide ? (
                      <div className="presenter-next__card">
                        <em>{String(nextSlide.layout || 'content').replace('_', ' ')}</em>
                        <strong>
                          {String(nextSlide.title || '').trim() || 'Untitled slide'}
                        </strong>
                      </div>
                    ) : (
                      <p className="presenter-next__end">End of presentation</p>
                    )}
                  </div>

                  <div className="presenter-notes">
                    <div className="presenter-notes__head">
                      <span>Teleprompter Notes</span>
                      <button
                        type="button"
                        className={`presenter-notes__scale ${largeNotes ? 'is-active' : ''}`}
                        aria-pressed={largeNotes}
                        onClick={() => setLargeNotes((value) => !value)}
                      >
                        Large notes
                      </button>
                    </div>
                    <div
                      className={`presenter-notes__body ${largeNotes ? 'presenter-notes__body--large' : ''}`}
                    >
                      {activeSlide.speakerNotes || 'No speaker notes yet.'}
                    </div>
                  </div>
                </aside>
              )}
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
                    <kbd>Space</kbd>
                  </span>
                  <span>Navigate slides</span>
                </span>
                <button
                  type="button"
                  className={`preview-mode-btn ${presenterMode ? 'is-active' : ''}`}
                  aria-pressed={presenterMode}
                  onClick={() => setPresenterMode((value) => !value)}
                >
                  <Icon name="slide" size={16} />
                  <span>Presenter View</span>
                </button>
                <Button type="button" variant="outline" icon="fullscreen" onClick={enterFullscreen}>
                  Full Screen
                </Button>
              </div>
            </div>

            {!presenterMode && (
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
            )}

            <section className="export-card">
              <div className="export-card__copy">
                <strong>Export your presentation</strong>
                <p>Ready to share? Download a themed PowerPoint file or print a clean PDF handout.</p>
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
                <Button
                  type="button"
                  variant="outline"
                  icon="printer"
                  onClick={handlePrintPdf}
                >
                  Print / PDF
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
                    onClick={() => {
                      setSlideNav((prev) =>
                        slideIndex === prev.index
                          ? prev
                          : { index: slideIndex, dir: slideIndex > prev.index ? 1 : -1 }
                      );
                    }}
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

        {isPrinting && slides.length > 0 && (
          <div className="preview-print-deck" aria-label="Printable slide deck">
            {slides.map((slide, slideIdx) => (
              <div className="preview-print-page" key={slide._id || `print-${slideIdx}`}>
                <SlideCanvas slide={slide} direction={0} theme={deckTheme} />
              </div>
            ))}
          </div>
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
