import React, { useState } from 'react';
import Icon from '../Icon/Icon';
import Button from '../Button/Button';
import './RegenerateModal.css';

const SCOPE_TABS = [
  { id: 'full', label: 'Full Slide' },
  { id: 'bullets', label: 'Bullets Only' },
  { id: 'notes', label: 'Speaker Notes Only' },
];

const SMART_PRESETS = [
  {
    label: 'Make it clearer',
    instruction: 'Make the headline and talking points clearer and sharper',
    target: 'full',
  },
  {
    label: 'Executive Brevity',
    instruction: 'Tighten phrasing for boardroom executive brevity',
    target: 'full',
  },
  {
    label: 'Convert to KPI Metrics',
    instruction: 'Transform this slide into quantifiable KPI stat cards',
    target: 'full',
    preferredLayout: 'metrics',
    allowLayoutChange: true,
  },
  {
    label: 'Convert to Roadmap Timeline',
    instruction: 'Restructure this slide into a phased execution roadmap',
    target: 'full',
    preferredLayout: 'timeline',
    allowLayoutChange: true,
  },
  {
    label: 'Two-Column Tradeoff',
    instruction: 'Contrast primary drivers against governance guardrails side-by-side',
    target: 'full',
    preferredLayout: 'two_column',
    allowLayoutChange: true,
  },
  {
    label: 'Thesis Spotlight Callout',
    instruction: 'Lead with a bold executive thesis spotlight and supporting pillars',
    target: 'full',
    preferredLayout: 'callout',
    allowLayoutChange: true,
  },
  {
    label: 'Expand Presenter Script',
    instruction: 'Write a 3-4 sentence presenter script with smooth slide transitions',
    target: 'notes',
  },
];

export default function RegenerateModal({ open, onClose, onRegenerate }) {
  const [target, setTarget] = useState('full');
  const [selected, setSelected] = useState('');
  const [instruction, setInstruction] = useState('');
  const [allowLayoutChange, setAllowLayoutChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const activePreset = SMART_PRESETS.find((item) => item.label === selected) || null;

  const resetState = () => {
    setError('');
    setSelected('');
    setInstruction('');
    setTarget('full');
    setAllowLayoutChange(false);
  };

  const handleSelectPreset = (preset) => {
    setSelected(preset.label);
    if (preset.target) {
      setTarget(preset.target);
    }
    setAllowLayoutChange(Boolean(preset.allowLayoutChange));
  };

  const handleSelectScope = (nextTarget) => {
    setTarget(nextTarget);
    if (nextTarget === 'notes') {
      setAllowLayoutChange(false);
      if (activePreset?.preferredLayout) {
        setSelected('');
      }
    }
  };

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const effectiveInstruction =
        instruction.trim() ||
        activePreset?.instruction ||
        (target === 'notes'
          ? 'Write presenter coaching notes with smooth transitions'
          : target === 'bullets'
            ? 'Sharpen bullet points with concrete evidence'
            : 'Improve this slide');

      const canSwitchLayout =
        target !== 'notes' && Boolean(allowLayoutChange || activePreset?.allowLayoutChange);

      await onRegenerate?.({
        instruction: effectiveInstruction,
        target,
        allowLayoutChange: canSwitchLayout,
        ...(target !== 'notes' && activePreset?.preferredLayout
          ? { preferredLayout: activePreset.preferredLayout }
          : {}),
      });
      resetState();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to regenerate slide. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    resetState();
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={handleClose}>
      <section
        className="regenerate-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="regenerate-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="regenerate-modal__header">
          <span className="regenerate-modal__icon">
            <Icon name="wand" size={19} />
          </span>
          <h2 id="regenerate-title">Regenerate this slide</h2>
          <button type="button" onClick={handleClose} disabled={loading} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="regenerate-modal__body">
          {error && <div className="regenerate-modal__error">{error}</div>}

          <div className="regenerate-modal__tabs" role="tablist" aria-label="Regeneration scope">
            {SCOPE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={target === tab.id}
                className={target === tab.id ? 'is-active' : ''}
                onClick={() => handleSelectScope(tab.id)}
                disabled={loading}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="regenerate-modal__presets">
            {SMART_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.label}
                className={selected === preset.label ? 'is-selected' : ''}
                onClick={() => handleSelectPreset(preset)}
                disabled={loading}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {target !== 'notes' && (
            <label className="regenerate-modal__toggle" htmlFor="regenerate-allow-layout">
              <input
                id="regenerate-allow-layout"
                type="checkbox"
                checked={Boolean(allowLayoutChange || activePreset?.allowLayoutChange)}
                onChange={(event) => setAllowLayoutChange(event.target.checked)}
                disabled={loading}
              />
              <span>Allow AI to switch to a better slide layout</span>
            </label>
          )}

          <label htmlFor="custom-instruction">Custom instruction</label>
          <textarea
            id="custom-instruction"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="Or write your own instruction... e.g., 'Convert into a 3-phase execution timeline for European launch'"
            disabled={loading}
          />
        </div>

        <footer className="regenerate-modal__footer">
          <button
            type="button"
            className="regenerate-modal__cancel"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <Button type="button" icon="wand" onClick={submit} disabled={loading}>
            {loading ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </footer>
      </section>
    </div>
  );
}
