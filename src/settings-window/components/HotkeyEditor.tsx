import { useState, useEffect, useRef, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { HotkeyAction, formatHotkeyForDisplay } from '../../shared/services/hotkeyService';

interface HotkeyEditorProps {
  action: HotkeyAction;
  label: string;
  currentValue: string;
  onChange: (action: HotkeyAction, value: string) => void;
}

export function HotkeyEditor({ action, label, currentValue, onChange }: HotkeyEditorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [displayValue, setDisplayValue] = useState(formatHotkeyForDisplay(currentValue));
  const inputRef = useRef<HTMLInputElement>(null);

  // Update display value when currentValue changes
  useEffect(() => {
    setDisplayValue(formatHotkeyForDisplay(currentValue));
  }, [currentValue]);

  // Start recording when the input is focused
  const handleFocus = () => {
    setIsRecording(true);
    setDisplayValue('Press keys...');
  };

  // Stop recording when the input is blurred
  const handleBlur = () => {
    setIsRecording(false);
    setDisplayValue(formatHotkeyForDisplay(currentValue));
  };

  // Handle key down events to record hotkeys
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!isRecording) return;

    e.preventDefault();

    // Get the key combination
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('ctrl');
    if (e.altKey) keys.push('alt');
    if (e.shiftKey) keys.push('shift');
    if (e.metaKey) keys.push('meta');

    // Add the key if it's not a modifier
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      keys.push(e.key.toLowerCase());
    }

    // If there's at least one key, update the value
    if (keys.length > 0) {
      const newValue = keys.join('+');
      onChange(action, newValue);
      setDisplayValue(formatHotkeyForDisplay(newValue));
      setIsRecording(false);
      inputRef.current?.blur();
    }
  };

  // Handle click to focus the input
  const handleClick = () => {
    inputRef.current?.focus();
  };

  // Handle clear button click
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(action, '');
    setDisplayValue('');
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800/30 last:border-0">
      <div className="text-sm font-medium text-white">{label}</div>
      <div className="flex items-center gap-2">
        <div
          className={`
            px-4 py-2 rounded-md border bg-gradient-to-b from-[#2a2a2a] to-[#222222]
            text-sm font-mono cursor-pointer min-w-[150px] text-center shadow-sm
            ${isRecording
              ? 'border-primary text-primary ring-1 ring-primary/30 from-[#2a2a2a]/80 to-[#222222]/80'
              : 'border-gray-700/30 text-gray-300 hover:border-gray-600/50 hover:from-[#333333] hover:to-[#252525]'}
            transition-all duration-200
          `}
          onClick={handleClick}
        >
          <input
            ref={inputRef}
            type="text"
            className="sr-only"
            value={displayValue}
            onChange={() => {}}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          <span>{displayValue || 'Not set'}</span>
        </div>
        {currentValue && (
          <button
            className="text-gray-500 hover:text-gray-300 transition-all duration-200 p-1.5 rounded-full hover:bg-[#333333] active:scale-90 shadow-sm border border-transparent hover:border-gray-700/30"
            onClick={handleClear}
            title="Clear hotkey"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
