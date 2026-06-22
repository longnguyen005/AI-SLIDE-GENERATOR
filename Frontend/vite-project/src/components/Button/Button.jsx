import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import './Button.css';

export default function Button({ children, icon, iconRight, to, variant = 'primary', className = '', ...props }) {
  const content = (
    <>
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={18} />}
    </>
  );
  const classes = `btn btn--${variant} ${className}`.trim();
  return to ? <Link to={to} className={classes}>{content}</Link> : <button className={classes} {...props}>{content}</button>;
}
