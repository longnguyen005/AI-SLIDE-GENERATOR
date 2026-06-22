import React, { useState } from 'react';
import Icon from '../Icon/Icon';
import Button from '../Button/Button';
import './RegenerateModal.css';

const presets = ['Make it clearer', 'More professional', 'Add more detail', 'Simplify'];

export default function RegenerateModal({ open, onClose, onRegenerate }) {
  const [selected, setSelected] = useState('');
  const [instruction, setInstruction] = useState('');
  if (!open) return null;

  const submit = () => {
    onRegenerate?.(instruction || selected || 'Improve this slide');
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="regenerate-modal" role="dialog" aria-modal="true" aria-labelledby="regenerate-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="regenerate-modal__header">
          <span className="regenerate-modal__icon"><Icon name="wand" size={19} /></span>
          <h2 id="regenerate-title">Regenerate this slide</h2>
          <button onClick={onClose} aria-label="Đóng"><Icon name="close" size={20} /></button>
        </header>
        <div className="regenerate-modal__body">
          <div className="regenerate-modal__presets">
            {presets.map((preset) => (
              <button key={preset} className={selected === preset ? 'is-selected' : ''} onClick={() => setSelected(preset)}>{preset}</button>
            ))}
          </div>
          <label htmlFor="custom-instruction">Custom instruction</label>
          <textarea
            id="custom-instruction"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="Or write your own instruction... e.g., 'Rewrite this to focus on the competitive advantages in the European market'"
          />
        </div>
        <footer className="regenerate-modal__footer">
          <button className="regenerate-modal__cancel" onClick={onClose}>Cancel</button>
          <Button icon="wand" onClick={submit}>Regenerate</Button>
        </footer>
      </section>
    </div>
  );
}
