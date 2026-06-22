import React from 'react';
import Icon from '../Icon/Icon';
import './ProgressSteps.css';

const steps = ['Topic', 'Outline', 'Slides', 'Export'];

export default function ProgressSteps({ active = 2 }) {
  return (
    <div className="progress-steps">
      <div className="progress-steps__line"><span style={{ width: `${((active - 1) / (steps.length - 1)) * 100}%` }} /></div>
      {steps.map((step, index) => {
        const position = index + 1;
        const complete = position < active;
        const current = position === active;
        return (
          <div className={`progress-step ${complete ? 'progress-step--complete' : ''} ${current ? 'progress-step--active' : ''}`} key={step}>
            <span className="progress-step__dot">{complete ? <Icon name="check" size={17} /> : <span />}</span>
            <strong>{step}</strong>
          </div>
        );
      })}
    </div>
  );
}
