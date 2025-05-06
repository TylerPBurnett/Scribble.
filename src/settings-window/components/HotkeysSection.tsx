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
          className="px-3 py-1.5 text-sm bg-[#252525] hover:bg-[#333333] text-primary border border-gray-700/30 rounded-md transition-colors"
          onClick={handleResetToDefaults}
        >
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
                  text-left px-4 py-3 rounded-md text-sm transition-colors
                  ${activeCategory === key
                    ? 'bg-primary/20 text-primary font-medium'
                    : 'hover:bg-[#1a1a1a] text-gray-300'}
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
