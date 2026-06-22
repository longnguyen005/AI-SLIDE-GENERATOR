import React from 'react';
import './SlideCanvas.css';

export default function SlideCanvas({ slide }) {
  return (
    <section className="slide-canvas">
      <div className="slide-canvas__content">
        <h2>{slide.title}</h2>
        <ul>
          {slide.points.map((point) => <li key={point}>{point}</li>)}
        </ul>
      </div>
      <span className="slide-canvas__watermark">✧ DeckAI Generation</span>
    </section>
  );
}
