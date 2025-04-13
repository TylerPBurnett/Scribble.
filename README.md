# Scribble App

A modern, cross-platform note-taking application built with Electron, React, and TypeScript. Scribble provides a clean, intuitive interface for creating, editing, and organizing your notes with rich text formatting capabilities.

<!-- Add a screenshot of your application here -->
<!-- ![Scribble App Screenshot](screenshot.png) -->

## Features

### Core Functionality
- **Multi-window Architecture**: Create and edit notes in separate windows for better multitasking
- **Rich Text Editing**: Full-featured text editor with formatting options including:
  - Text styling (bold, italic, underline, strikethrough)
  - Headings and text alignment
  - Lists (bulleted, numbered, and task lists)
  - Code blocks with syntax highlighting
  - Links and images
  - Text highlighting and typography enhancements
- **Auto-save**: Automatically saves your notes as you type
- **Local Storage**: All notes are stored locally on your device
- **Search**: Quickly find notes by searching through titles and content

### User Interface
- **Dark Mode**: Easy on the eyes with a modern dark interface
- **Responsive Design**: Adapts to different window sizes with responsive breakpoints
- **Customizable Notes**: Notes with different color options for better organization
- **Confirmation Dialogs**: Prevents accidental deletion of notes
- **Modern UI Elements**: Clean design with subtle animations and visual feedback

### Settings & Customization
- **Custom Save Location**: Choose where to store your notes
- **Auto-save Configuration**: Enable/disable auto-save and adjust the interval
- **Appearance Settings**: Toggle between light and dark modes

## Tech Stack

### Core Technologies
- **Electron**: Cross-platform desktop application framework
- **React**: UI library for building the user interface
- **TypeScript**: Type-safe JavaScript for better code quality and developer experience
- **Vite**: Modern, fast build tool and development server

### Key Libraries
- **TipTap**: Rich text editor built on ProseMirror
  - Multiple extensions for advanced editing capabilities
  - Floating menus and bubble menus for contextual editing
- **Electron Builder**: Packaging and distribution tool for Electron applications

### Architecture
- **Multi-process Design**: Separate main and renderer processes following Electron's architecture
- **Component-based UI**: Modular React components for maintainability
- **Service-based Logic**: Separation of concerns with dedicated services for notes and settings
- **IPC Communication**: Inter-process communication between main and renderer processes

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/TylerPBurnett/Scribble.git
cd Scribble
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Project Structure
```
scribble-app/
├── electron/           # Electron main process code
├── src/
│   ├── components/     # React components
│   ├── services/       # Business logic services
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── public/             # Static assets
└── dist-electron/      # Compiled Electron code
```

## Building

To build the application for distribution:

```bash
npm run build
```

This will create platform-specific installers in the `release` directory.

## Supported Platforms

- Windows
- macOS
- Linux

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)
