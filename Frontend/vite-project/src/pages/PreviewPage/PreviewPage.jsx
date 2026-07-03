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
    if (!deckId) return;
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
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1));
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(slides.length - 1, value + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slides.length]);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      setMessage('Browser could not enter full screen.');
    }
  };

  const regenerate = async (instruction) => {
    if (!activeSlide?._id) return;
    try {
      const result = await api.regenerateSlide(activeSlide._id, instruction);
      setSlides((current) => current.map((slide) => (slide._id === result.slide._id ? result.slide : slide)));
      setMessage('Slide regenerated.');
    } catch (error) {
      setMessage(error.message);
    }
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
        <Topbar title="Presentation Preview" />

        {message && <div className="preview-message">{message}</div>}
        {loading && <div className="preview-empty">Loading slides...</div>}

        {!loading && !activeSlide && (
          <div className="preview-empty">
            <strong>No slides found</strong>
            <p>Generate slides for this deck before opening preview.</p>
            <Button to="/dashboard" variant="outline">Back to dashboard</Button>
          </div>
        )}

        {!loading && activeSlide && (
          <>
            <SlideCanvas slide={activeSlide} />

            <div className="preview-controls">
              <div>
                <Button variant="outline" icon="arrowLeft" onClick={previous} disabled={index === 0}>Previous</Button>
                <span className="preview-counter">{index + 1} / {slides.length}</span>
                <Button iconRight="arrowRight" onClick={next} disabled={index === slides.length - 1}>Next</Button>
              </div>
              <span className="preview-hint">Use arrow keys to navigate</span>
              <Button variant="outline" icon="fullscreen" onClick={enterFullscreen}>Full Screen</Button>
            </div>

            <section className="speaker-notes">
              <button className="speaker-notes__header" onClick={() => setNotesOpen((value) => !value)}>
                <span>Speaker Notes</span>
                <Icon name="chevronDown" className={notesOpen ? 'is-open' : ''} />
              </button>
              {notesOpen && <div className="speaker-notes__body">{activeSlide.speakerNotes || 'No speaker notes yet.'}</div>}
            </section>

            <section className="export-card">
              <div><strong>Export your presentation</strong><p>Ready to share? Generate a production-ready PowerPoint file.</p></div>
              <div className="export-card__actions">
                <Button variant="secondary" icon="wand" onClick={() => setModalOpen(true)}>Regenerate slide</Button>
                <Button icon="download" onClick={exportPptx} disabled={exporting}>{exporting ? 'Exporting...' : 'Export PPTX'}</Button>
              </div>
            </section>

            <div className="preview-thumbnails">
              {slides.map((slide, slideIndex) => (
                <button key={slide._id} className={slideIndex === index ? 'is-active' : ''} onClick={() => setIndex(slideIndex)}>
                  <span /><span /><span />
                  <small>{slideIndex + 1}</small>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
      <RegenerateModal open={modalOpen} onClose={() => setModalOpen(false)} onRegenerate={regenerate} />
    </div>
  );
}
