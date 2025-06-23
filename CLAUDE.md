# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Forge MOI is a multi-modal AI-powered development studio built with **Electron**, React, Next.js, TypeScript, and Langchain. It combines traditional development tools (terminal, code editor, file explorer, browser preview) with AI-powered creative features (image/video generation, 3D modeling).

## ✅ MIGRATION COMPLETED: Tauri → Electron

**STATUS**: **MIGRATION COMPLETE** - Successfully migrated from Tauri to Electron with native BrowserView embedding and full Node.js integration.

### Migration Completed ✅
- ✅ Phase 1: Project Setup (COMPLETE)
- ✅ Phase 2: Backend Migration (COMPLETE)
- ✅ Phase 3: Frontend Updates (COMPLETE)
- ✅ Phase 4: Build & Test (COMPLETE)
- ✅ Phase 5: Cleanup & Documentation (COMPLETE)

### Why We Migrated
- Tauri cannot embed native browsers within the app window
- Electron's BrowserView provides **true browser embedding** ✨
- Better Node.js ecosystem integration
- Mature plugin ecosystem

## Development Commands

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# ELECTRON COMMANDS (FULLY IMPLEMENTED):
bun run electron:dev      # Development mode
bun run electron:build    # Build for production
bun run electron:dist     # Create distribution packages

# Run tests
bun test
bun test:e2e

# Run Storybook
bun run storybook
```

## Architecture (Electron Complete!)

### Tech Stack ✅
- **Frontend**: React 18 + Next.js + TypeScript
- **UI Framework**: Tailwind CSS v4 + shadcn/ui components
- **Desktop Framework**: **Electron** (migration complete!)
- **State Management**: Zustand + electron-store
- **AI Integration**: Langchain + OpenAI + fal.ai
- **Terminal**: xterm.js + node-pty
- **Code Editor**: Monaco Editor
- **Browser**: **Electron BrowserView** (native embedding working!)

### Project Structure ✅
- `/src` - React frontend application
  - `/components` - React components organized by feature
  - `/lib` - Utilities and helpers
  - `/services` - API and service layers
    - `/services/electron` - **Electron IPC API layer (COMPLETE)**
  - `/stores` - Zustand state management
- `/electron` - **Electron main process (COMPLETE)**
  - `main.js` - Main process entry ✅
  - `preload.js` - Secure context bridge ✅
  - `terminal.js` - Terminal backend ✅
  - `filesystem.js` - File operations ✅
  - `browser.js` - BrowserView management ✅
  - `ipc.js` - IPC handlers ✅

### Key Design Decisions

1. **Cyberpunk UI Theme**: 
   - Black (#000000), Purple (#9333EA), Jade Green (#10B981)
   - Futuristic fonts (Orbitron, JetBrains Mono)
   - Gradient animations, glitch effects, particle systems
   - Minimalist sidebar (50px), browser-focused layout

2. **Secure Architecture**: 
   - API keys stored in main process
   - Secure IPC communication via context bridge
   - Path validation for file system access

3. **Native Browser Embedding**:
   - Using Electron's BrowserView (not iframes!)
   - Full browser capabilities without restrictions
   - Embedded within app window layout
   - DevTools, console capture, navigation history

4. **Two Modes**:
   - **Developer Mode**: Terminal, code editor, file explorer, browser preview
   - **Studio Mode**: AI-powered image/video generation, 3D modeling

## Migration Completed! ✅

### Backend Functions Ported Successfully ✅

1. **Terminal** (`terminal.rs` → `electron/terminal.js`) ✅:
   - ✅ PTY management with node-pty
   - ✅ Shell detection (bash, PowerShell, cmd, sh)
   - ✅ SSH support and key management
   - ✅ Terminal session persistence
   - ✅ Event streaming for output/exit/error

2. **File System** (`editor.rs` → `electron/filesystem.js`) ✅:
   - ✅ File CRUD operations
   - ✅ File watching with chokidar
   - ✅ Backup and restore functionality
   - ✅ Editor session management
   - ✅ Directory listing with metadata

3. **Browser** (`browser.rs` → `electron/browser.js`) ✅:
   - ✅ BrowserView creation and management
   - ✅ Navigation controls (back/forward/refresh)
   - ✅ DevTools integration
   - ✅ Console log capture
   - ✅ Screenshot functionality
   - ✅ Viewport presets

4. **IPC** (`lib.rs` → `electron/ipc.js`) ✅:
   - ✅ Replaced Tauri commands with Electron IPC
   - ✅ Type-safe IPC contracts
   - ✅ Event emitter for real-time updates

### Frontend Updates Completed ✅

1. ✅ Replaced all `@tauri-apps/*` imports
2. ✅ Created `window.electronAPI` interface
3. ✅ Updated browser components for BrowserView
4. ✅ Migrated from Tauri store to electron-store
5. ✅ Updated file system API calls
6. ✅ Updated terminal integration

### Build Configuration ✅
- ✅ Set up electron-builder
- ✅ Configured platform-specific builds (Windows, macOS, Linux)
- ✅ Icon generation
- 🔄 Code signing for macOS (pending)
- 🔄 Auto-updater implementation (pending)

## Browser Implementation - NATIVE EMBEDDING! ✨

**Migration Complete**: All browser implementations now use native Electron BrowserView!

- **ElectronBrowser**: Native BrowserView embedding (NO IFRAMES!)
- **Full browser capabilities**: No CSP/X-Frame-Options restrictions
- **Embedded within app window**: True native integration
- **DevTools support**: Full debugging capabilities

## AI Integration Plan

The app integrates three AI services:
1. **OpenAI**: GPT models for code assistance, DALL-E for images
2. **fal.ai**: Fast image generation (FLUX), video generation, 3D conversion
3. **Studio API**: Custom API for specialized features

All API communication happens through the Electron main process for security.

## Current Focus

**NEXT PHASE**: Browser Enhancement & AI Integration

1. 🎯 Phase 2: Browser Enhancement (Week 2)
   - AI-powered browsing features
   - Split view and tab groups
   - Advanced DevTools integration

2. 🤖 Phase 3: LangChain Agent Core (Week 3)
   - Integrate LangChain.js for code assistance
   - Context-aware AI interactions
   - Code generation and analysis

## Accomplishments ✅

**Migration Completed**:
- ✅ Full Electron migration from Tauri
- ✅ Native BrowserView embedding (NO IFRAMES!)
- ✅ Complete backend port to Node.js
- ✅ All frontend components updated
- ✅ Electron-store integration
- ✅ Full IPC communication layer

**Core Features**:
- ✅ Cyberpunk UI theme with animations
- ✅ Layout system with resizable panes  
- ✅ Terminal with xterm.js + node-pty integration
- ✅ Monaco editor with multi-tab support
- ✅ File explorer with search and operations
- ✅ Command palette (Cmd+K)
- ✅ **Native browser embedding with BrowserView**

## Documentation Links
- Electron Documentation: https://www.electronjs.org/docs/latest
- Previous Tauri Documentation: https://v2.tauri.app/start/
- Node-pty: https://github.com/microsoft/node-pty
- Electron Builder: https://www.electron.build/