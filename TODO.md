# Forge MOI - Multi-Modal AI Studio Development TODO

## ✅ Day 1: Project Initialization (COMPLETED)
- [x] Create new Tauri app with React TypeScript template
- [x] Initialize git repository
- [x] Install and configure Tailwind CSS with shadcn/ui
- [x] Install core dependencies:
  - [x] Terminal: xterm, xterm-addon-fit
  - [x] Editor: @monaco-editor/react, monaco-editor
  - [x] Tauri: @tauri-apps/plugin-shell, @tauri-apps/plugin-fs, @tauri-apps/plugin-store
  - [x] UI: react-split-pane, class-variance-authority, clsx, tailwind-merge, lucide-react
  - [x] State: zustand, @tanstack/react-query
  - [x] AI: langchain, @langchain/core, @langchain/community, @langchain/openai
  - [x] AI Services: openai, @fal-ai/serverless-client
  - [x] Utils: zod
- [x] Create folder structure
- [x] Configure tauri.conf.json with security settings
- [ ] Test initial build: `bun run tauri dev`
- [ ] Create README.md with project description

## 📋 Day 2-3: Layout System
- [ ] Create AppLayout.tsx main layout component
- [ ] Implement split-pane structure (sidebar, main area, bottom panel)
- [ ] Create TabManager.tsx for tab handling
- [ ] Build Sidebar.tsx with mode toggle (Developer/Studio)
- [ ] Create Zustand store for layout state (layoutStore.ts)
- [ ] Implement layout persistence with localStorage
- [ ] Add dark theme CSS variables (extend existing theme)
- [ ] Create responsive breakpoints
- [ ] Test layout resizing and tab functionality

## 💻 Day 4-5: Terminal Implementation
- [ ] Create Terminal.tsx component with xterm.js
- [ ] Integrate xterm.js with fit addon
- [ ] Style terminal with dark theme
- [ ] Create terminal toolbar (clear, copy, paste buttons)
- [ ] Create Rust file: src-tauri/src/terminal.rs
- [ ] Implement shell process spawning in Rust
- [ ] Add IPC communication for terminal I/O
- [ ] Create multiple terminal session support
- [ ] Add custom commands (edit, preview)
- [ ] Test terminal with basic commands

## 📝 Day 6-8: Code Editor
- [ ] Create Editor.tsx with Monaco integration
- [ ] Configure Monaco for Vite (no webpack plugin needed)
- [ ] Set up syntax highlighting for 10+ languages
- [ ] Create editor toolbar (save, format, settings)
- [ ] Create Rust file: src-tauri/src/editor.rs
- [ ] Implement file read/write operations in Rust
- [ ] Add file watcher for external changes
- [ ] Create multi-tab file editing
- [ ] Implement find/replace functionality
- [ ] Add dirty state tracking and unsaved changes prompt

## 📁 Day 9-10: File Explorer
- [ ] Create FileExplorer.tsx component
- [ ] Build tree view with expand/collapse using shadcn/ui
- [ ] Add file/folder icons based on extension (lucide-react)
- [ ] Implement Rust directory reading
- [ ] Add context menu (new, rename, delete)
- [ ] Implement drag-and-drop for files
- [ ] Add file search with fuzzy matching
- [ ] Create new file/folder dialogs with shadcn/ui
- [ ] Connect file clicks to editor
- [ ] Test file operations

## 🌐 Day 11-12: Browser Preview
- [ ] Create Browser.tsx component
- [ ] Add navigation toolbar (back, forward, refresh, URL bar)
- [ ] Implement Tauri WebView integration
- [ ] Configure CSP for webview in tauri.conf.json (already done)
- [ ] Add DevTools toggle button
- [ ] Create loading states and error handling
- [ ] Implement hot reload for local development
- [ ] Add viewport size presets (mobile, tablet, desktop)
- [ ] Test with local development server
- [ ] Add console output capture

## 🤖 Day 13-15: MCP Server Setup with Langchain
- [ ] Create mcp-server/ directory
- [ ] Initialize MCP server: `cd mcp-server && bun init`
- [ ] Install MCP dependencies: `bun add @modelcontextprotocol/sdk express`
- [ ] Create base MCP server (mcp-server/src/index.ts)
- [ ] Define tool schemas:
  - [ ] code_assist: AI-powered code help
  - [ ] terminal_helper: Command explanation/generation
  - [ ] file_analyzer: Project structure understanding
  - [ ] debug_assistant: Error analysis
  - [ ] generate_image_fast: fal.ai FLUX integration
  - [ ] generate_image_dalle: OpenAI DALL-E
  - [ ] generate_video: fal.ai video models
  - [ ] create_3d_model: 2D to 3D conversion
- [ ] Implement stdio transport
- [ ] Create Rust file: src-tauri/src/mcp_server.rs
- [ ] Implement MCP process management in Rust
- [ ] Add bidirectional communication
- [ ] Test MCP server connection

## 🎨 Day 16-17: Mode System
- [ ] Create ModeManager.tsx component
- [ ] Implement mode context provider
- [ ] Create DeveloperMode.tsx layout
- [ ] Create StudioMode.tsx layout
- [ ] Add mode toggle in sidebar
- [ ] Implement feature flags per mode
- [ ] Persist mode preference
- [ ] Add smooth transitions between modes
- [ ] Hide/show components based on mode
- [ ] Test mode switching

## 🖼️ Day 18-20: Image Generation (Studio Mode)
- [ ] Create ImageGenerator.tsx component
- [ ] Build generation UI with shadcn/ui (prompt, style, parameters)
- [ ] Implement MCP tool for image generation (fal.ai + OpenAI)
- [ ] Add generation history gallery
- [ ] Create canvas editor with Fabric.js
- [ ] Add drawing tools (brush, shapes, text)
- [ ] Implement layers system
- [ ] Add export functionality (PNG, JPG, SVG)
- [ ] Create prompt templates
- [ ] Test image generation pipeline

## 🔐 Day 21-22: API Proxy & Security
- [ ] Create Rust API proxy module (src-tauri/src/api_proxy/)
- [ ] Implement secure storage for API keys:
  - [ ] Your Studio API key
  - [ ] fal.ai API key
  - [ ] OpenAI API key
- [ ] Create API service wrappers:
  - [ ] studio_api.rs
  - [ ] fal_api.rs
  - [ ] openai_api.rs
- [ ] Implement request signing and authentication
- [ ] Add rate limiting and retry logic
- [ ] Create frontend API client services
- [ ] Test API proxy with all services

## 🔌 Day 23-24: Plugin System
- [ ] Design plugin manifest schema
- [ ] Create PluginManager.ts
- [ ] Implement plugin discovery
- [ ] Build plugin loader with dynamic imports
- [ ] Create plugin API interface
- [ ] Add plugin sandboxing
- [ ] Create example game plugin
- [ ] Build plugin settings UI with shadcn/ui
- [ ] Add plugin marketplace mockup
- [ ] Test plugin loading/unloading

## ⚡ Day 25-26: Performance & State Management
- [ ] Complete all Zustand stores:
  - [ ] layoutStore.ts: Window layout, pane sizes
  - [ ] editorStore.ts: Open files, cursor positions
  - [ ] terminalStore.ts: Terminal sessions
  - [ ] studioStore.ts: AI generation history
  - [ ] settingsStore.ts: User preferences
- [ ] Add store persistence with Tauri store plugin
- [ ] Implement lazy loading for components
- [ ] Add code splitting configuration
- [ ] Optimize bundle sizes
- [ ] Add loading states throughout app
- [ ] Implement error boundaries
- [ ] Create performance monitoring

## 🧪 Day 27-28: Testing & Polish
- [ ] Set up testing framework: `bun add -d vitest @testing-library/react`
- [ ] Write unit tests for stores
- [ ] Create component tests
- [ ] Add E2E tests for critical flows
- [ ] Fix UI/UX issues
- [ ] Add tooltips and help text
- [ ] Create onboarding tour
- [ ] Optimize startup time
- [ ] Test on all platforms (Windows, macOS, Linux)

## 📦 Day 29-30: Distribution Prep
- [ ] Configure auto-updater
- [ ] Set up code signing (prepare for later)
- [ ] Update tauri.conf.json for production
- [ ] Create app icons (.ico, .icns, .png)
- [ ] Write comprehensive README
- [ ] Create GitHub Actions workflow
- [ ] Build release versions: `bun run tauri build`
- [ ] Test installers on each platform
- [ ] Create release notes

## 🚀 Post-MVP Features (Future)
- [ ] Audio workspace with WaveSurfer.js
- [ ] Video editor with FFmpeg.wasm
- [ ] Cloud sync functionality
- [ ] Collaboration features
- [ ] API gateway for web services
- [ ] Mobile companion app
- [ ] Advanced AI integrations:
  - [ ] Code review agent
  - [ ] Automated testing agent
  - [ ] Documentation generator
- [ ] Theme marketplace
- [ ] Extension API
- [ ] LoRA training interface for custom AI models

## 🎯 Success Criteria
- [ ] Terminal can run commands
- [ ] Editor can open/edit/save files  
- [ ] Browser can preview localhost
- [ ] File explorer shows project structure
- [ ] Mode switching works smoothly
- [ ] MCP server connects successfully
- [ ] Image generation produces results (fal.ai + OpenAI)
- [ ] App starts in < 2 seconds
- [ ] Memory usage < 300MB
- [ ] App size < 50MB per platform

## 🔗 Critical Path Dependencies
1. Layout system blocks all UI work
2. Terminal + Editor needed before browser
3. MCP server needed for AI features
4. Mode system needed before Studio features
5. API proxy needed before any external API calls
6. Security must be ongoing throughout

## 📚 Resources
- Tauri Docs: https://tauri.app/v1/guides/
- shadcn/ui: https://ui.shadcn.com/
- Langchain Docs: https://js.langchain.com/
- fal.ai Docs: https://docs.fal.ai/
- MCP Protocol: https://modelcontextprotocol.io/

## 🐛 Known Issues
- None yet

## 💡 Ideas & Notes
- Consider using Tanstack Table for data views
- Look into Comlink for web worker communication
- Research WASM for performance-critical operations
- Consider adding GitHub Copilot integration
- Explore local LLM support (Ollama integration)