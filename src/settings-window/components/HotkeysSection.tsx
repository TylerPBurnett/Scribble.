import { useState } from 'react';
import {
  HotkeyAction,
  HOTKEY_CATEGORIES,
  HOTKEY_LABELS,
  DEFAULT_HOTKEYS
} from '../../shared/services/hotkeyService';
import { HotkeyEditor } from './HotkeyEditor';

interface HotkeysSectionProps {
  hotkeys: Record<HotkeyAction, string>;
  onChange: (hotkeys: Record<HotkeyAction, string>) => void;
}

export function HotkeysSection({ hotkeys, onChange }: HotkeysSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>(Object.keys(HOTKEY_CATEGORIES)[0]);

  // Handle hotkey change
  const handleHotkeyChange = (action: HotkeyAction, value: string) => {
    onChange({
      ...hotkeys,
      [action]: value
    });
  };

  // Handle reset to defaults
  const handleResetToDefaults = () => {
    onChange(DEFAULT_HOTKEYS);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-white border-b border-gray-800 pb-4 flex items-center justify-between">
        <span>Keyboard Shortcuts</span>
        <button
          className="px-3 py-1.5 text-sm bg-gradient-to-b from-[#333333] to-[#252525] hover:from-[#3a3a3a] hover:to-[#2a2a2a] text-primary font-medium border border-gray-700/50 rounded-md shadow-sm transition-all duration-200 active:scale-95 flex items-center gap-1"
          onClick={handleResetToDefaults}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-80">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          Reset to defaults
        </button>
      </h3>

      <div className="flex flex-col md:flex-row gap-6 mt-6">
        {/* Category tabs */}
        <div className="w-full md:w-1/4">
          <div className="flex flex-col space-y-2 bg-[#0a0a0a] rounded-lg p-2 border border-gray-800/30">
            {Object.entries(HOTKEY_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                className={`
                  text-left px-4 py-3 rounded-md text-sm transition-all duration-200 border
                  ${activeCategory === key
                    ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-primary font-medium border-primary/30 shadow-sm'
                    : 'hover:bg-[#1a1a1a] text-gray-300 border-transparent hover:border-gray-800/50'}
                `}
                onClick={() => setActiveCategory(key)}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>

        {/* Hotkey editors */}
        <div className="w-full md:w-3/4 bg-[#1a1a1a] rounded-lg p-5 border border-gray-800/30">
          <div className="space-y-3">
            {HOTKEY_CATEGORIES[activeCategory as keyof typeof HOTKEY_CATEGORIES]?.actions.map((action) => (
              <HotkeyEditor
                key={action}
                action={action}
                label={HOTKEY_LABELS[action]}
                currentValue={hotkeys[action]}
                onChange={handleHotkeyChange}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
