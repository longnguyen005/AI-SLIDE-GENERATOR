import React from 'react';
import Icon from '../Icon/Icon';
import './PresentationRow.css';

export default function PresentationRow({ item, onOpen }) {
  return (
    <article className="presentation-row">
      <div className={`presentation-row__thumb presentation-row__thumb--${item.cover}`}>
        <Icon name={item.failed ? 'info' : item.icon || 'slide'} size={34} />
      </div>
      <div className="presentation-row__body">
        <div className="presentation-row__heading">
          <h3>{item.title}</h3>
          <span className={`status status--${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span>
        </div>
        <p>{item.description}</p>
        <div className="presentation-row__meta">
          <span><Icon name="slide" size={15} /> {item.slides} slides</span>
          {!item.failed && <span><Icon name="layers" size={15} /> {item.category}</span>}
          {!item.failed && <span><Icon name="globe" size={15} /> English</span>}
          <span><Icon name="calendar" size={15} /> {item.date}</span>
        </div>
      </div>
      <div className="presentation-row__actions">
        <button onClick={onOpen}>Open</button>
        <button aria-label="Sửa"><Icon name="edit" size={20} /></button>
        {!item.failed && <button aria-label="Tải xuống"><Icon name="download" size={20} /></button>}
        <button className="presentation-row__delete" aria-label="Xóa"><Icon name="trash" size={20} /></button>
      </div>
    </article>
  );
}
