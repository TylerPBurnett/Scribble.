import React from 'react';

const TailwindTest: React.FC = () => {
  return (
    <div className="p-6 max-w-sm mx-auto bg-background-secondary rounded-xl shadow-md flex items-center space-x-4 border border-border">
      <div className="shrink-0">
        <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>
      <div>
        <div className="text-xl font-medium text-text">Tailwind Test</div>
        <p className="text-text-muted">Tailwind CSS is working!</p>
      </div>
    </div>
  );
};

export default TailwindTest;
