import React from 'react'
import ReactDOM from 'react-dom/client'
import NoteApp from './NoteApp'
import '../shared/styles/index.css'
import './note-window.css' // Import the CSS to hide traffic lights

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NoteApp />
  </React.StrictMode>,
)

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
