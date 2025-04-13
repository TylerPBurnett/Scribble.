import { useState, useEffect } from 'react';
import './SettingsWindow.css';

interface SettingsWindowProps {
  onClose: () => void;
  initialSettings: {
    saveLocation: string;
    autoSave: boolean;
    autoSaveInterval: number;
    darkMode: boolean;
  };
  onSave: (settings: {
    saveLocation: string;
    autoSave: boolean;
    autoSaveInterval: number;
    darkMode: boolean;
  }) => void;
}

const SettingsWindow = ({ onClose, initialSettings, onSave }: SettingsWindowProps) => {
  const [settings, setSettings] = useState(initialSettings);

  const handleSaveLocationSelect = async () => {
    try {
      const result = await window.settings.selectDirectory();
      if (result.canceled) return;
      
      setSettings({
        ...settings,
        saveLocation: result.filePaths[0]
      });
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="settings-overlay">
      <div className="settings-window">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-content">
          <div className="settings-section">
            <h3>Storage</h3>
            <div className="settings-item">
              <label>Save Location:</label>
              <div className="file-path-selector">
                <input 
                  type="text" 
                  value={settings.saveLocation} 
                  readOnly 
                />
                <button onClick={handleSaveLocationSelect}>Browse...</button>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Editor</h3>
            <div className="settings-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
                />
                Auto-save notes
              </label>
            </div>
            
            {settings.autoSave && (
              <div className="settings-item">
                <label>Auto-save interval (seconds):</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.autoSaveInterval}
                  onChange={(e) => setSettings({
                    ...settings, 
                    autoSaveInterval: parseInt(e.target.value) || 1
                  })}
                />
              </div>
            )}
          </div>

          <div className="settings-section">
            <h3>Appearance</h3>
            <div className="settings-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => setSettings({...settings, darkMode: e.target.checked})}
                />
                Dark Mode
              </label>
            </div>
          </div>
        </div>
        
        <div className="settings-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsWindow;
