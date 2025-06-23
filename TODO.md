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
- [x] Configure macOS native window with hiddenInset titlebar
- [x] Create minimalist macOS UI/UX with proper color scheme
- [x] Set up system font stack and smooth animations
- [x] Test initial build: `bun run tauri dev`
- [x] Create README.md with project description

## ✅ Day 2-3: Layout System (COMPLETED)
- [x] Create AppLayout.tsx main layout component
- [x] Implement split-pane structure (sidebar, main area, bottom panel)
- [x] Create TabManager.tsx for tab handling
- [x] Build Sidebar.tsx with mode toggle (Developer/Studio)
- [x] Create Zustand store for layout state (layoutStore.ts)
- [x] Implement layout persistence with localStorage
- [x] Add dark theme CSS variables (extend existing theme)
- [x] Create responsive breakpoints
- [x] Test layout resizing and tab functionality
- [x] Add comprehensive error boundaries
- [x] Implement accessibility features (ARIA, keyboard navigation)
- [x] Create custom hooks for media queries and shortcuts
- [x] Add theme toggle functionality

## ✅ Day 4-5: Terminal Implementation (COMPLETED)
- [x] Create Terminal.tsx component with xterm.js
- [x] Integrate xterm.js with fit addon
- [x] Style terminal with dark theme
- [x] Create terminal toolbar (clear, copy, paste buttons)
- [x] Create Rust file: src-tauri/src/terminal.rs
- [x] Implement shell process spawning in Rust
- [x] Add IPC communication for terminal I/O
- [x] Create multiple terminal session support
- [x] Add custom commands (edit, preview)
- [x] Test terminal with basic commands

## ✅ Day 6-8: Code Editor (COMPLETED)
- [x] Create CodeEditor.tsx with Monaco integration
- [x] Configure Monaco for Vite environment with custom themes
- [x] Set up syntax highlighting for 30+ languages (comprehensive language support)
- [x] Create comprehensive editor toolbar (save, format, settings, find/replace)
- [x] Create Rust file: src-tauri/src/editor.rs with full file operations
- [x] Implement file read/write operations in Rust with error handling
- [x] Add file watcher for external changes with event system
- [x] Create multi-tab file editing with state management
- [x] Implement find/replace functionality with regex support
- [x] Add dirty state tracking and unsaved changes prompt
- [x] Create EditorStore for state management
- [x] Implement comprehensive file operations (create, delete, rename, copy)
- [x] Add backup and restore functionality
- [x] Create editor session management
- [x] Add Monaco themes (forge-dark, forge-light) matching app design
- [x] Implement advanced editor features (minimap, word wrap, line numbers)
- [x] Add keyboard shortcuts and accessibility features

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

## 🌐 Day 11-12: Browser
- [ ] Allow user, code preveiws and agent to visit websites
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
- Tauri Docs: https://v2.tauri.app
- shadcn/ui: https://ui.shadcn.com/
- Langchain Docs: https://js.langchain.com/
- fal.ai Docs: https://docs.fal.ai/
- MCP Protocol: https://modelcontextprotocol.io/

## 🐛 Known Issues
- None yet

## 🚀 Layout System Enhancements

### Layout Improvements
1. **Index Files & Organization**
   - [ ] Create layout components index file for cleaner imports
   - [ ] Organize component exports for better developer experience

2. **Advanced Tab Management**
   - [ ] Add tab drag-and-drop reordering functionality
   - [ ] Implement tab duplication feature
   - [ ] Add tab grouping and organizing
   - [ ] Create tab preview on hover
   - [ ] Add tab context menu (close others, close to right)

3. **Layout Presets & Customization**
   - [ ] Implement layout presets functionality (coding, debugging, design)
   - [ ] Add custom layout themes beyond light/dark
   - [ ] Create layout export/import functionality
   - [ ] Add layout animation preferences
   - [ ] Implement custom panel configurations

4. **Enhanced Responsiveness**
   - [ ] Add tablet-specific layout optimizations
   - [ ] Implement swipe gestures for mobile navigation
   - [ ] Add collapsible panel headers for small screens
   - [ ] Create adaptive toolbar sizing

5. **Performance & Polish**
   - [ ] Add layout change animations
   - [ ] Implement virtualized rendering for large lists
   - [ ] Add layout performance monitoring
   - [ ] Create layout state compression for storage

6. **Developer Experience**
   - [ ] Add layout debugging tools
   - [ ] Create layout component documentation
   - [ ] Add layout performance metrics
   - [ ] Implement layout A/B testing framework

## 🚀 Terminal Improvements & Future Enhancements

### Terminal Enhancements
1. **Toolbar Integration**
   - Wire up TerminalToolbar buttons with actual terminal actions
   - Add keyboard shortcut handlers for toolbar actions
   - Implement clipboard API for secure copy/paste operations

2. **Performance Optimizations**
   - Implement virtual scrolling for terminal output
   - Add output throttling for high-volume commands
   - Optimize memory usage for long-running sessions

3. **Advanced Features**
   - Add terminal profiles (bash, zsh, fish, powershell)
   - Implement split terminal panes
   - Add terminal search functionality (Ctrl+F)
   - Create terminal themes selector
   - Add command history navigation
   - Implement auto-completion for custom commands

4. **Developer Experience**
   - Add terminal command palette
   - Create snippets for common commands
   - Implement SSH connection support
   - Add terminal session persistence across app restarts
   - Create terminal replay/recording feature

5. **AI Integration**
   - Add AI-powered command suggestions
   - Implement natural language to command translation
   - Create intelligent error explanation and fixes
   - Add command safety checker

6. **Testing & Quality**
   - Add comprehensive E2E tests for terminal
   - Create performance benchmarks
   - Add telemetry for terminal usage analytics
   - Implement crash reporting for terminal processes

## 💡 Ideas & Notes
- Consider using Tanstack Table for data views
- Look into Comlink for web worker communication
- Research WASM for performance-critical operations
- Consider adding GitHub Copilot integration
- Explore local LLM support (Ollama integration)