import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

/**
 * A button component styled with Tailwind CSS.
 * This is an example of how to convert a component from plain CSS to Tailwind CSS.
 * 
 * Original CSS classes:
 * .new-note-btn, .settings-btn {
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   padding: 8px 16px;
 *   border-radius: 20px;
 *   font-size: 14px;
 *   font-weight: 500;
 *   cursor: pointer;
 *   transition: all 0.2s ease;
 * }
 * 
 * .new-note-btn {
 *   background-color: #2196f3;
 *   color: white;
 *   border: none;
 * }
 * 
 * .new-note-btn:hover {
 *   background-color: #1976d2;
 *   transform: translateY(-2px);
 *   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
 * }
 * 
 * .settings-btn {
 *   background-color: rgba(255, 255, 255, 0.1);
 *   color: #e0e0e0;
 *   border: none;
 * }
 * 
 * .settings-btn:hover {
 *   background-color: rgba(255, 255, 255, 0.2);
 *   transform: translateY(-2px);
 * }
 */
const TailwindButton: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  onClick 
}) => {
  // Base classes that apply to all button variants
  const baseClasses = "flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200";
  
  // Variant-specific classes
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg",
    secondary: "bg-white/10 text-text hover:bg-white/20 hover:-translate-y-0.5"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default TailwindButton;
