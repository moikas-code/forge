# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Forge MOI is a multi-modal AI-powered development studio built with Tauri, React, TypeScript, and Langchain. It combines traditional development tools (terminal, code editor, file explorer, browser preview) with AI-powered creative features (image/video generation, 3D modeling).

## Development Commands

```bash
# Install dependencies
bun install

# Run development server
bun run tauri dev

# Build for production
bun run tauri build

# Run frontend only (Vite)
bun run dev

# Preview production build
bun run preview
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS v4 + shadcn/ui components
- **Desktop Framework**: Tauri v2 (Rust backend)
- **State Management**: Zustand
- **AI Integration**: Langchain + OpenAI + fal.ai
- **Terminal**: xterm.js
- **Code Editor**: Monaco Editor

### Project Structure
- `/src` - React frontend application
  - `/components` - React components organized by feature
  - `/lib` - Utilities and helpers
  - `/services` - API and service layers
  - `/stores` - Zustand state management
- `/src-tauri` - Rust backend for Tauri
- `/mcp-server` - MCP (Model Context Protocol) server (to be implemented)

### Key Design Decisions

1. **macOS Native UI**: The app uses a minimalist macOS-style design with:
   - Overlay titlebar style for native traffic lights
   - System font stack (-apple-system, SF Pro)
   - Custom color scheme matching macOS design language
   - Blur effects and subtle shadows

2. **Secure API Architecture**: All API keys (OpenAI, fal.ai, studio API) are stored in the Tauri backend, never exposed to frontend. API calls go through a Rust proxy layer.

3. **Plugin System**: The app uses Tauri plugins for:
   - `tauri-plugin-shell` - Terminal command execution
   - `tauri-plugin-fs` - File system operations
   - `tauri-plugin-store` - Persistent storage
   - `tauri-plugin-opener` - Opening external links

4. **Two Modes**:
   - **Developer Mode**: Terminal, code editor, file explorer, browser preview
   - **Studio Mode**: AI-powered image/video generation, 3D modeling

## Tauri Configuration Notes

- Window uses `titleBarStyle: "Overlay"` for macOS native look
- CSP is configured to allow necessary resources while maintaining security
- File system access is scoped to `$HOME` and `$APPDATA` directories
- Shell execution is enabled with validators for security

## AI Integration Plan

The app will integrate three AI services:
1. **OpenAI**: GPT models for code assistance, DALL-E for images
2. **fal.ai**: Fast image generation (FLUX), video generation, 3D conversion
3. **Studio API**: Custom API for specialized features

All API communication happens through the Tauri backend for security.

## Current Status

Day 1 of development is complete with:
- Project initialization
- Dependencies installed
- macOS-style UI implemented
- Basic layout structure
- Tauri plugins configured

Next steps involve implementing the layout system with split panes and beginning work on the terminal component.

## Documentation Links
- Tauri Documentation: https://v2.tauri.app/start/