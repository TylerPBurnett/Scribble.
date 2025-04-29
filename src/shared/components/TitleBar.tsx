import React, { useState, useEffect, CSSProperties } from 'react';
import logoIcon from '../../assets/icon-64.png';

// Define custom CSS properties for Electron app region
interface AppRegionStyle extends CSSProperties {
  WebkitAppRegion?: 'drag' | 'no-drag';
}

interface TitleBarProps {
  title: string;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ title, onMinimize, onMaximize, onClose }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [platform, setPlatform] = useState<'win32' | 'darwin' | 'other'>('other');

  // Detect platform on component mount
  useEffect(() => {
    // Use navigator.platform as a fallback in the renderer
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('windows')) {
      setPlatform('win32');
    } else if (userAgent.includes('mac')) {
      setPlatform('darwin');
    } else {
      setPlatform('other');
    }
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Define app region styles
  const dragStyle: AppRegionStyle = { WebkitAppRegion: 'drag' };
  const noDragStyle: AppRegionStyle = { WebkitAppRegion: 'no-drag' };

  // Render platform-specific window controls
  const renderWindowControls = () => {
    // Only render custom window controls for non-macOS platforms
    // For macOS, we're using the native traffic lights via Electron's titleBarStyle: 'hiddenInset'
    if (platform !== 'darwin') {
      // Windows-style controls (right-aligned, monochrome)
      return (
        <div className="flex items-center">
          <button
            className="flex items-center justify-center w-10 h-8 text-text-secondary hover:bg-background-tertiary transition-colors"
            style={noDragStyle}
            onClick={onMinimize}
            title="Minimize"
          >
            <svg width="10" height="1" viewBox="0 0 10 1">
              <rect width="10" height="1" fill="currentColor" />
            </svg>
          </button>
          <button
            className="flex items-center justify-center w-10 h-8 text-text-secondary hover:bg-background-tertiary transition-colors"
            style={noDragStyle}
            onClick={onMaximize}
            title="Maximize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0" y="0" width="10" height="10" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </button>
          <button
            className="flex items-center justify-center w-10 h-8 text-text-secondary hover:bg-danger hover:text-white transition-colors"
            style={noDragStyle}
            onClick={onClose}
            title="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1" />
              <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>
      );
    }

    // Return null for macOS since we're using native controls
    return null;
  };

  return (
    <div
      className="relative flex flex-col h-12 bg-background-secondary border-b border-border z-20 select-none w-full"
      style={dragStyle}
    >
      <div className="flex justify-between items-center w-full h-full px-4">
        {platform === 'darwin' ? (
          // macOS layout - we need to leave space for the native traffic lights
          // and center the title in the remaining space
          <>
            {/* Empty space for traffic lights (80px) - increased for better spacing */}
            <div className="w-[80px]"></div>

            {/* Centered title and logo */}
            <div className="flex items-center justify-center flex-grow">
              <img src={logoIcon} alt="Scribble Logo" className="w-7 h-7 mr-3 object-contain" />
              <h1 className="text-lg font-semibold text-text m-0">{title}</h1>
            </div>

            {/* Empty space to balance the layout */}
            <div className="w-[80px]"></div>
          </>
        ) : (
          // Windows layout (menu/title on left, controls on right)
          <>
            <div className="flex items-center">
              <button
                className="flex flex-col justify-between w-5 h-4 bg-transparent border-none cursor-pointer p-0 mr-4"
                onClick={toggleMenu}
                style={noDragStyle}
              >
                <span className="block w-full h-0.5 bg-text-secondary rounded-sm transition-all duration-300"></span>
                <span className="block w-full h-0.5 bg-text-secondary rounded-sm transition-all duration-300"></span>
                <span className="block w-full h-0.5 bg-text-secondary rounded-sm transition-all duration-300"></span>
              </button>
              <div className="flex items-center">
                <img src={logoIcon} alt="Scribble Logo" className="w-7 h-7 mr-3 object-contain" />
                <h1 className="text-lg font-semibold text-text m-0">{title}</h1>
              </div>
            </div>
            {renderWindowControls()}
          </>
        )}
      </div>

      {menuOpen && (
        <div
          className="absolute top-12 left-0 w-56 bg-background-secondary border border-border border-t-0 shadow-lg z-10 rounded-b-lg"
          style={noDragStyle}
        >
          <div className="py-3 px-4 cursor-pointer transition-all duration-200 flex items-center hover:bg-background-tertiary">
            <span className="mr-2 text-sm">+</span>
            <span className="text-text">New Note</span>
          </div>
          <div className="py-3 px-4 cursor-pointer transition-all duration-200 flex items-center hover:bg-background-tertiary">
            <span className="mr-2 text-sm">⚙</span>
            <span className="text-text">Settings</span>
          </div>
          <div className="py-3 px-4 cursor-pointer transition-all duration-200 flex items-center hover:bg-background-tertiary rounded-b-lg">
            <span className="mr-2 text-sm">ℹ</span>
            <span className="text-text">About</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TitleBar;
