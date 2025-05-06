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
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">Keyboard Shortcuts</h3>
        <button
          className="text-sm text-primary hover:text-primary/80 transition-colors"
          onClick={handleResetToDefaults}
        >
          Reset to defaults
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Category tabs */}
        <div className="w-full md:w-1/4">
          <div className="flex flex-col space-y-1">
            {Object.entries(HOTKEY_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                className={`
                  text-left px-3 py-2 rounded-md text-sm transition-colors
                  ${activeCategory === key 
                    ? 'bg-primary/20 text-primary' 
                    : 'hover:bg-background-tertiary/50 text-text-secondary'}
                `}
                onClick={() => setActiveCategory(key)}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>

        {/* Hotkey editors */}
        <div className="w-full md:w-3/4 bg-background-tertiary/30 rounded-lg p-4">
          <div className="space-y-1">
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
