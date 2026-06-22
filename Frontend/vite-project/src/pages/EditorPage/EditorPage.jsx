import React, { useState } from 'react';
import Sidebar from '../../components/SideBar/SideBar';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import RegenerateModal from '../../components/RegenerateModal/RegenerateModal';
import './EditorPage.css';

const thumbnails = [
  { title: 'Introduction', type: 'cover' },
  { title: 'Market Analysis', type: 'chart' },
  { title: 'Competitive Position', type: 'dark' },
  { title: 'Our Team', type: 'people' },
];

export default function EditorPage() {
  const [selected, setSelected] = useState(1);
  const [modalOpen, setModalOpen] = useState(true);
  const [toast, setToast] = useState('');

  return (
    <div className="editor-page">
      <Sidebar active="editor" />
      <main className="editor-workspace">
        <header className="editor-topbar">
          <div><strong>Presentation Editor</strong><span>File</span><span>Edit</span><span>View</span><span>Insert</span></div>
          <div className="editor-search"><Icon name="search" size={18} /><input placeholder="Search in project..." /></div>
          <Button variant="outline">Export</Button>
          <Button icon="save">Save</Button>
          <span className="editor-avatar">AR</span>
        </header>

        <section className="editor-grid">
          <aside className="editor-thumbs">
            {thumbnails.map((item, index) => (
              <button key={item.title} className={selected === index ? 'is-active' : ''} onClick={() => setSelected(index)}>
                <span>{index + 1}</span>
                <div className={`thumb thumb--${item.type}`}><Icon name={item.type === 'chart' ? 'chart' : item.type === 'people' ? 'team' : 'slide'} size={30} /></div>
                <small>{item.title}</small>
              </button>
            ))}
            <button className="editor-add"><Icon name="plus" size={19} /> Add slide</button>
          </aside>

          <section className="editor-canvas-area">
            {toast && <div className="editor-toast">{toast}</div>}
            <div className="editor-canvas-card">
              <div className="editor-canvas-toolbar"><Button variant="secondary" icon="wand" onClick={() => setModalOpen(true)}>Regenerate slide</Button></div>
              <div className="editor-slide">
                <h1>Market Analysis: Fintech Growth</h1>
                <ul>
                  <li>Traditional banking shifts toward digital-first experiences.</li>
                  <li>Decentralized finance expands access to programmable services.</li>
                  <li>Customer trust becomes the decisive competitive advantage.</li>
                </ul>
                <div className="editor-chart">
                  {[62, 88, 46, 74].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
                </div>
              </div>
            </div>
          </section>

          <aside className="editor-properties">
            <h2>Layout selection</h2>
            <div className="layout-grid">{[1,2,3,4].map((item) => <button className={item === 2 ? 'is-active' : ''} key={item}><span/><span/></button>)}</div>
            <h2>Speaker notes</h2>
            <textarea defaultValue="Review the audience profile and emphasize the growth of digital finance adoption." rows="6" />
            <Button className="editor-save-btn">Save edits</Button>
            <Button variant="secondary" icon="wand" onClick={() => setModalOpen(true)}>Regenerate with AI</Button>
            <div className="editor-properties__row"><button><Icon name="plus" size={17} /> Add</button><button><Icon name="layers" size={17} /> Move</button></div>
            <button className="editor-remove"><Icon name="trash" size={17} /> Remove slide</button>
            <Button variant="outline" icon="download">Export PPTX</Button>
          </aside>
        </section>
      </main>

      <RegenerateModal open={modalOpen} onClose={() => setModalOpen(false)} onRegenerate={(instruction) => setToast(`AI is regenerating: ${instruction}`)} />
    </div>
  );
}
