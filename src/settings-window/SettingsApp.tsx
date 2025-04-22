import { useState, useEffect } from 'react'
import SettingsWindow from './SettingsWindow'
import { initSettings, saveSettings, AppSettings } from '../shared/services/settingsService'

function SettingsApp() {
  const [appSettings, setAppSettings] = useState<AppSettings>({
    saveLocation: '',
    autoSave: true,
    autoSaveInterval: 5,
    darkMode: true,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load settings on startup
  useEffect(() => {
    const init = async () => {
      try {
        console.log('=== SettingsApp Initialization Start ===');
        
        // Initialize settings
        const settings = await initSettings()
        console.log('SettingsApp - Settings initialized:', settings)
        setAppSettings(settings)
      } catch (error) {
        console.error('Error during initialization:', error)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  // Handle saving settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    console.log('SettingsApp - Saving new settings:', newSettings)
    setAppSettings(newSettings)
    saveSettings(newSettings)
    console.log('SettingsApp - Settings saved, current state:', newSettings)
  }

  // Show loading state
  if (isLoading) {
    return <div className="settings-window-container loading">Loading settings...</div>
  }

  // Render the settings window
  return (
    <div className="settings-window-container">
      <SettingsWindow
        onClose={() => window.close()}
        initialSettings={appSettings}
        onSave={handleSaveSettings}
      />
    </div>
  )
}

export default SettingsApp
