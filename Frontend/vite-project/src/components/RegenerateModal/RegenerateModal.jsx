import React, { useState } from 'react';
import Icon from '../Icon/Icon';
import Button from '../Button/Button';
import './RegenerateModal.css';

const presets = ['Make it clearer', 'More professional', 'Add more detail', 'Simplify'];

export default function RegenerateModal({ open, onClose, onRegenerate }) {
  const [selected, setSelected] = useState('');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!open) return null;

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      await onRegenerate?.(instruction || selected || 'Improve this slide');
      setSelected('');
      setInstruction('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to regenerate slide. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError('');
    setSelected('');
    setInstruction('');
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={handleClose}>
      <section className="regenerate-modal" role="dialog" aria-modal="true" aria-labelledby="regenerate-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="regenerate-modal__header">
          <span className="regenerate-modal__icon"><Icon name="wand" size={19} /></span>
          <h2 id="regenerate-title">Regenerate this slide</h2>
          <button onClick={handleClose} disabled={loading} aria-label="Đóng"><Icon name="close" size={20} /></button>
        </header>
        <div className="regenerate-modal__body">
          {error && <div className="regenerate-modal__error">{error}</div>}
          <div className="regenerate-modal__presets">
            {presets.map((preset) => (
              <button key={preset} className={selected === preset ? 'is-selected' : ''} onClick={() => setSelected(preset)} disabled={loading}>{preset}</button>
            ))}
          </div>
          <label htmlFor="custom-instruction">Custom instruction</label>
          <textarea
            id="custom-instruction"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="Or write your own instruction... e.g., 'Rewrite this to focus on the competitive advantages in the European market'"
            disabled={loading}
          />
        </div>
        <footer className="regenerate-modal__footer">
          <button className="regenerate-modal__cancel" onClick={handleClose} disabled={loading}>Cancel</button>
          <Button icon="wand" onClick={submit} disabled={loading}>{loading ? 'Regenerating...' : 'Regenerate'}</Button>
        </footer>
      </section>
    </div>
  );
}
