# Forge MOI - AI-Powered Multi-Modal Development Studio

A powerful desktop application combining development tools with AI-powered creative features, built with Tauri, React, and Langchain.

## 🚀 Features

### Core Tools (Available in Both Modes)
- **Web Browser**: Full-featured browser with bookmarks, history, and developer tools
  - Navigate any website with smart URL/search detection
  - Bookmark management with folders
  - Browsing history tracking
  - DevTools integration
  - Multiple viewport presets (mobile, tablet, desktop)
  - Screenshot and screen recording
  - Console output capture

### Developer Mode
- **Integrated Terminal**: Full-featured terminal with xterm.js
- **Code Editor**: Monaco-based editor with syntax highlighting
- **File Explorer**: Tree-view file browser with drag-and-drop
- **AI Code Assistant**: Powered by Langchain for intelligent code help

### Studio Mode  
- **Image Generation**: Create images with fal.ai (FLUX) and OpenAI (DALL-E)
- **Video Generation**: Generate videos using state-of-the-art models
- **3D Model Creation**: Convert 2D images to 3D models
- **LoRA Training**: Fine-tune AI models with custom styles

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Desktop**: Tauri (Rust)
- **AI Integration**: Langchain + OpenAI + fal.ai
- **State Management**: Zustand
- **Build Tool**: Vite + Bun

## 📋 Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Rust](https://www.rust-lang.org/) (for Tauri)
- [Node.js](https://nodejs.org/) (v18+)

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/forge-moi.git
cd forge-moi

# Install dependencies
bun install

# Run in development mode
bun run tauri dev

# Build for production
bun run tauri build
```

## 🔐 API Configuration

Create a `.env.local` file in the root directory:

```env
# Your API keys (stored securely in Tauri backend)
VITE_OPENAI_API_KEY=your_openai_key
VITE_FAL_API_KEY=your_fal_ai_key
VITE_STUDIO_API_KEY=your_studio_api_key
```

## 📚 Documentation

See [TODO.md](./TODO.md) for the complete development roadmap and task list.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [Langchain](https://langchain.com/), [OpenAI](https://openai.com/), and [fal.ai](https://fal.ai/)