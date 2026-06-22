import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/SideBar/SideBar';
import Topbar from '../../components/Topbar/Topbar';
import Button from '../../components/Button/Button';
import Icon from '../../components/Icon/Icon';
import SlideCanvas from '../../components/SlideCanvas/SlideCanvas';
import RegenerateModal from '../../components/RegenerateModal/RegenerateModal';
import { previewSlides } from '../../data/desks';
import './PreviewPage.css';

export default function PreviewPage() {
  const [index, setIndex] = useState(2);
  const [notesOpen, setNotesOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  const previous = () => setIndex((value) => Math.max(0, value - 1));
  const next = () => setIndex((value) => Math.min(previewSlides.length - 1, value + 1));

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      setMessage('Trình duyệt không cho phép mở toàn màn hình.');
    }
  };

  return (
    <div className="page-shell preview-page">
      <Sidebar active="preview" />
      <main className="page-content preview-main">
        <Topbar title="Neural Networks Overview" />

        {message && <div className="preview-message">{message}</div>}
        <SlideCanvas slide={previewSlides[index]} />

        <div className="preview-controls">
          <div>
            <Button variant="outline" icon="arrowLeft" onClick={previous} disabled={index === 0}>Previous</Button>
            <span className="preview-counter">{index + 1} / {previewSlides.length}</span>
            <Button iconRight="arrowRight" onClick={next} disabled={index === previewSlides.length - 1}>Next</Button>
          </div>
          <span className="preview-hint">Use ← → arrow keys to navigate</span>
          <Button variant="outline" icon="fullscreen" onClick={enterFullscreen}>Full Screen</Button>
        </div>

        <section className="speaker-notes">
          <button className="speaker-notes__header" onClick={() => setNotesOpen((value) => !value)}>
            <span>Speaker Notes</span>
            <Icon name="chevronDown" className={notesOpen ? 'is-open' : ''} />
          </button>
          {notesOpen && <div className="speaker-notes__body">Emphasize that while we've seen exponential growth in parameter counts, the next frontier isn't just “bigger” but “smarter” connectivity. Mention the biological parallels to synaptic pruning and use this transition to tease the upcoming section on ethics and transparency.</div>}
        </section>

        <section className="export-card">
          <div><strong>Export your presentation</strong><p>Ready to share? Generate a production-ready PowerPoint file.</p></div>
          <div className="export-card__actions">
            <Button variant="secondary" icon="wand" onClick={() => setModalOpen(true)}>Regenerate slide</Button>
            <Button icon="download" onClick={() => setMessage('Demo export: file PPTX sẽ được tạo khi kết nối backend.')}>Export PPTX</Button>
          </div>
        </section>

        <section className="export-history">
          <h2>Export History</h2>
          {['AI in Higher Education.pptx', 'Quarterly Roadmap.pptx'].map((file, fileIndex) => (
            <article key={file}>
              <span><Icon name="file" size={21} /></span>
              <div><strong>{file}</strong><small>Generated Oct {24 - fileIndex * 9}, 2023 • {12.4 - fileIndex * 4.3} MB</small></div>
              <b>PPTX</b>
              <button><Icon name="dots" size={20} /></button>
            </article>
          ))}
        </section>

        <div className="preview-thumbnails">
          {previewSlides.map((slide, slideIndex) => (
            <button key={slide.title} className={slideIndex === index ? 'is-active' : ''} onClick={() => setIndex(slideIndex)}>
              <span /><span /><span />
              <small>{slideIndex + 1}</small>
            </button>
          ))}
        </div>
      </main>
      <RegenerateModal open={modalOpen} onClose={() => setModalOpen(false)} onRegenerate={(instruction) => setMessage(`Đã áp dụng yêu cầu: ${instruction}`)} />
    </div>
  );
}
