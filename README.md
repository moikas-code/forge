# Forge MOI - AI-Powered Multi-Modal Development Studio

A powerful desktop application combining development tools with AI-powered creative features, built with **Electron**, React, and Langchain.

**🎉 MIGRATION COMPLETE**: Successfully migrated from Tauri to Electron for native browser embedding!

## 🚀 Features

### Core Tools (Available in Both Modes)
- **🌐 Native Web Browser**: **Electron BrowserView** for true native embedding
  - Navigate any website with smart URL/search detection
  - **NO IFRAME LIMITATIONS** - Full CSP and X-Frame-Options support
  - Embedded directly within app window (not separate windows!)
  - Full DevTools integration
  - Multiple viewport presets (mobile, tablet, desktop)
  - Screenshot and screen recording
  - Console output capture and real-time monitoring

### Developer Mode
- **💻 Integrated Terminal**: Full-featured terminal with xterm.js + node-pty
  - Multi-shell support (bash, PowerShell, cmd, sh)
  - SSH connection management
  - Session persistence and restoration
  - Real-time output streaming
- **📝 Code Editor**: Monaco-based editor with advanced features
  - Multi-tab editing with unsaved changes tracking
  - Syntax highlighting for all major languages
  - IntelliSense and code completion
  - File watching and auto-reload
- **📁 File Explorer**: Advanced file management
  - Tree-view browser with drag-and-drop operations
  - File search and filtering
  - Context menus for file operations
  - Backup and restore functionality
- **🤖 AI Code Assistant**: Powered by Langchain for intelligent code help

### Studio Mode  
- **Image Generation**: Create images with fal.ai (FLUX) and OpenAI (DALL-E)
- **Video Generation**: Generate videos using state-of-the-art models
- **3D Model Creation**: Convert 2D images to 3D models
- **LoRA Training**: Fine-tune AI models with custom styles

## 🛠️ Tech Stack

- **Frontend**: React 18 + Next.js + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Desktop**: **Electron** (migrated from Tauri for native BrowserView!)
- **Terminal**: xterm.js + node-pty
- **Code Editor**: Monaco Editor
- **AI Integration**: Langchain + OpenAI + fal.ai
- **State Management**: Zustand + electron-store
- **Build Tool**: Bun

## 📋 Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Node.js](https://nodejs.org/) (v18+)
- ~~[Rust](https://www.rust-lang.org/)~~ (No longer needed after Electron migration!)

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/forge-moi.git
cd forge-moi

# Install dependencies
bun install

# Run Next.js dev server (required for Electron)
bun run dev

# In another terminal, run Electron app
bun run electron:dev

# Or run both together (recommended)
bun run dev && bun run electron:dev

# Build for production
bun run electron:build

# Create distribution packages
bun run electron:dist
```

## 🔐 API Configuration

Create a `.env.local` file in the root directory:

```env
# Your API keys (stored securely in Electron main process)
OPENAI_API_KEY=your_openai_key
FAL_API_KEY=your_fal_ai_key
STUDIO_API_KEY=your_studio_api_key
```

**Security Note**: API keys are now stored in the Electron main process (not the renderer) for enhanced security.

## 📚 Documentation

See [TODO.md](./TODO.md) for the complete development roadmap and task list.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://electronjs.org/) (migrated from Tauri)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Terminal powered by [xterm.js](https://xtermjs.org/) + [node-pty](https://github.com/microsoft/node-pty)
- Code editor powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- AI powered by [Langchain](https://langchain.com/), [OpenAI](https://openai.com/), and [fal.ai](https://fal.ai/)