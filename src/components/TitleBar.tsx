import React, { useState } from 'react';
import './TitleBar.css';

interface TitleBarProps {
  title: string;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ title, onMinimize, onMaximize, onClose }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="title-bar">
      <div className="title-bar-drag-area">
        <div className="title-bar-left">
          <button className="hamburger-menu" onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="app-logo">
            <span className="logo-icon">S</span>
            <h1>{title}</h1>
          </div>
        </div>
        <div className="title-bar-controls">
          <button className="control-button minimize" onClick={onMinimize}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2" y="5" width="8" height="2" fill="currentColor" />
            </svg>
          </button>
          <button className="control-button maximize" onClick={onMaximize}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2" y="2" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </button>
          <button className="control-button close" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" />
              <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>
      
      {menuOpen && (
        <div className="app-menu">
          <div className="menu-item">
            <span>New Note</span>
          </div>
          <div className="menu-item">
            <span>Settings</span>
          </div>
          <div className="menu-item">
            <span>About</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TitleBar;
