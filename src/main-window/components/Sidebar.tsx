import React from 'react';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onToggle }) => {
  return (
    <div className={`relative ${!isOpen ? '-translate-x-sidebar-compact' : ''} transition-transform duration-300`}>
      <div className={`w-sidebar-compact bg-background-sidebar border-r-0 flex flex-col h-full z-10`}>
        {/* Sidebar Navigation - Icon Only */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="flex flex-col items-center space-y-4">
            {/* All Notes */}
            <li className="nav-item">
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 text-primary bg-primary-10 rounded-md hover:bg-primary-20 transition-colors"
                title="All Notes"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </a>
            </li>

            {/* Notebooks */}
            <li className="nav-item">
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 text-text-secondary rounded-md hover:bg-background-tertiary transition-colors"
                title="Notebooks"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </a>
            </li>

            {/* Tags */}
            <li className="nav-item">
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 text-text-secondary rounded-md hover:bg-background-tertiary transition-colors"
                title="Tags"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
              </a>
            </li>

            {/* Archive */}
            <li className="nav-item">
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 text-text-secondary rounded-md hover:bg-background-tertiary transition-colors"
                title="Archive"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8"></polyline>
                  <rect x="1" y="3" width="22" height="5"></rect>
                  <line x1="10" y1="12" x2="14" y2="12"></line>
                </svg>
              </a>
            </li>

            {/* Trash */}
            <li className="nav-item">
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 text-text-secondary rounded-md hover:bg-background-tertiary transition-colors"
                title="Trash"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </a>
            </li>
          </ul>
        </nav>

        {/* Empty footer space */}
        <div className="py-4 flex justify-center border-t-0">
          {/* Settings button removed */}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`absolute top-1/2 -right-6 transform -translate-y-1/2 w-6 h-16 bg-background-sidebar border-0 rounded-r-md flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors z-20 focus:outline-none`}
        title={isOpen ? "Hide sidebar" : "Show sidebar"}
      >
        <svg
          width="8"
          height="12"
          viewBox="0 0 8 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="1 1 6 6 1 11"></polyline>
        </svg>
      </button>
    </div>
  );
};

export default Sidebar;
