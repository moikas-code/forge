# Terminal Developer Experience Enhancements

This document describes the comprehensive developer experience enhancements implemented for the Forge MOI terminal system, focusing on productivity, persistence, and convenience features.

## Features Overview

### 1. Terminal Session Persistence 🔄

**Automatic State Saving**
- Sessions are automatically saved when `auto_save_enabled` is true
- Saves current directory, command history, environment variables
- Tracks session metadata (creation time, last active, exit status)
- Configurable maximum number of saved sessions (default: 10)

**Session Restoration**
- Restore previous terminal sessions with complete state
- Recreate working directory and environment
- Replay command history for context
- Optional auto-restoration on app startup

**Key Components:**
- `TerminalPersistenceStore` - Central state management
- `get_terminal_session_info()` - Backend session info retrieval
- `create_terminal_with_state()` - Restore sessions with saved state

### 2. Command Palette 🎨

**Global Access**
- Triggered with `Cmd/Ctrl + Shift + P`
- Available from any terminal session
- Searchable interface with keyboard navigation
- Categorized actions for better organization

**Available Actions:**
- **Terminal Management**: New terminal, close terminal, close all
- **Command Snippets**: Execute pre-defined command snippets
- **SSH Connections**: Quick connect to saved SSH profiles
- **Session Restoration**: Restore previously saved sessions
- **Quick Actions**: Copy current path, create snippets

**Key Features:**
- Real-time search with fuzzy matching
- Keyboard navigation (arrow keys, enter, escape)
- Action categories with visual grouping
- Shortcut display for quick reference

### 3. Command Snippets System 📝

**Pre-defined Snippets**
- Git commands (`git status`, `git commit -m "${message}"`)
- Node.js operations (`npm install`, `bun install`)
- Docker commands (`docker ps`, `docker logs ${container}`)
- System utilities (`find`, `du -sh`, `ps aux`)
- Network diagnostics (`netstat -tlnp`)

**Custom Snippets**
- Create custom command templates
- Support for template variables (`${variable_name}`)
- Categorization and tagging system
- Usage tracking and sorting by frequency
- Import/export functionality

**Snippet Features:**
- Search and filter by name, description, tags
- Category-based organization
- Usage statistics and analytics
- Template variable substitution
- Quick execution via command palette

### 4. SSH Connection Manager 🌐

**Connection Profiles**
- Save SSH connection details securely
- Support for custom ports and SSH keys
- Connection options (StrictHostKeyChecking, timeout)
- Favorite connections for quick access
- Connection testing and validation

**Security Features**
- SSH key path storage (not the keys themselves)
- Secure credential handling through Tauri backend
- Connection timeout and retry policies
- Host key verification options

**Management Interface**
- Visual connection manager with search
- Quick connect buttons
- Connection status indicators
- Bulk operations and favorites system

### 5. Global Keyboard Shortcuts ⌨️

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + Shift + P` | Command Palette | Open the global command palette |
| `Cmd/Ctrl + T` | New Terminal | Create a new terminal session |
| `Cmd/Ctrl + W` | Close Terminal | Close current terminal session |
| `Cmd/Ctrl + Shift + W` | Close All | Close all terminal sessions |
| `Cmd/Ctrl + Shift + C` | Copy Path | Copy current working directory |

## Architecture

### Store Structure

```typescript
// Terminal Persistence Store
interface TerminalPersistenceState {
  // Session persistence
  saved_sessions: TerminalSessionState[];
  auto_save_enabled: boolean;
  restore_on_startup: boolean;
  
  // Command snippets
  snippets: CommandSnippet[];
  snippet_categories: string[];
  
  // SSH connections
  ssh_connections: SSHConnection[];
  default_ssh_key_path: string;
  
  // Command palette
  is_command_palette_open: boolean;
  last_palette_query: string;
}
```

### Component Hierarchy

```
DeveloperTools/
├── CommandPalette/           # Global command interface
├── SnippetManager/           # Command snippets CRUD
├── SSHManager/               # SSH connection management
└── SessionManager/           # Saved session management
```

### Backend Integration

**Tauri Commands:**
- `get_terminal_session_info()` - Retrieve session state
- `get_terminal_history()` - Get command history
- `get_terminal_cwd()` - Current working directory
- `create_terminal_with_state()` - Restore session
- `test_ssh_connection()` - Validate SSH connection
- `select_ssh_key_file()` - File picker for SSH keys

## Usage Examples

### Creating a Custom Snippet

```typescript
const snippet = {
  name: "Deploy to Production",
  description: "Deploy current branch to production",
  command: "git push origin main && npm run deploy:prod",
  category: "Deployment",
  tags: ["git", "deploy", "production"],
  is_custom: true,
};

add_snippet(snippet);
```

### Setting up SSH Connection

```typescript
const connection = {
  name: "Production Server",
  host: "prod.example.com",
  port: 22,
  username: "deploy",
  key_path: "~/.ssh/prod_key",
  is_favorite: true,
  connection_options: {
    "StrictHostKeyChecking": "yes",
    "ConnectTimeout": "10",
  },
};

add_ssh_connection(connection);
```

### Saving Current Session

```typescript
// Automatic saving (when enabled)
await save_session_state(active_session_id);

// Manual session restoration
const success = await restore_session(saved_session_id);
```

## Configuration

### Environment Variables

```bash
# Default SSH key path
FORGE_MOI_SSH_KEY_PATH="~/.ssh/id_rsa"

# Maximum saved sessions
FORGE_MOI_MAX_SAVED_SESSIONS=10

# Auto-save interval (seconds)
FORGE_MOI_AUTO_SAVE_INTERVAL=30
```

### Settings Panel

Access settings through Developer Tools > Settings tab:

- **Session Persistence**: Auto-save, restore on startup
- **SSH Configuration**: Default key path, connection options
- **Keyboard Shortcuts**: View and customize shortcuts
- **Performance**: Memory usage, session limits

## Security Considerations

### SSH Key Handling
- Only SSH key **paths** are stored, never the actual keys
- Keys remain in their original location on the filesystem
- Connection validation through secure Tauri backend
- No credential caching or storage

### Session Data
- Command history is sanitized before storage
- Environment variables filtered for sensitive data
- Session data encrypted using Tauri's secure storage
- Automatic cleanup of old session data

### Network Security
- SSH connections use system SSH client
- No custom SSH implementation
- Respect system SSH configuration
- Connection timeouts and retry limits

## Performance Optimizations

### Memory Management
- Automatic cleanup of old sessions
- Configurable history size limits
- Lazy loading of session data
- Efficient search indexing for snippets

### Storage Efficiency
- Compressed session data storage
- Delta compression for similar sessions
- Automatic pruning of old data
- Optimized serialization formats

## Testing

### Unit Tests
- Component rendering and interaction
- Store state management
- Action execution and side effects
- Keyboard shortcut handling

### Integration Tests
- Backend command execution
- SSH connection validation
- Session persistence workflows
- Cross-component communication

### Test Files
- `DeveloperTools.test.tsx` - Main component tests
- `CommandPalette.test.tsx` - Command palette tests
- `SnippetManager.test.tsx` - Snippet CRUD tests
- `SSHManager.test.tsx` - SSH connection tests

## Future Enhancements

### Planned Features
- **AI-Powered Suggestions**: Smart command recommendations
- **Terminal Recording**: Session replay and sharing
- **Collaborative Sessions**: Real-time terminal sharing
- **Plugin System**: Custom command extensions
- **Cloud Sync**: Cross-device session synchronization

### Potential Improvements
- **Natural Language Commands**: Convert text to shell commands
- **Error Analysis**: Intelligent error explanation and fixes
- **Performance Analytics**: Command execution metrics
- **Advanced Search**: Semantic search across history

## Contributing

When adding new features to the terminal system:

1. **Follow Architecture**: Use the established store pattern
2. **Add Tests**: Include comprehensive test coverage
3. **Security First**: Consider security implications
4. **Performance**: Profile memory and CPU usage
5. **Documentation**: Update this README with changes

### Code Standards
- Use TypeScript with strict typing
- Follow React hooks patterns
- Implement proper error handling
- Add JSDoc comments for public APIs
- Use consistent naming conventions

## Troubleshooting

### Common Issues

**Command Palette Not Opening**
- Check if `Cmd/Ctrl + Shift + P` conflicts with other shortcuts
- Verify keyboard event listeners are properly attached
- Check browser dev tools for JavaScript errors

**SSH Connections Failing**
- Verify SSH key file permissions (600 for private keys)
- Check network connectivity to target host
- Validate SSH configuration syntax
- Review Tauri backend logs for detailed errors

**Session Restoration Issues**
- Check if session data is corrupted in storage
- Verify working directory still exists
- Ensure required environment variables are available
- Check backend terminal creation logs

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const debug = process.env.NODE_ENV === 'development';

if (debug) {
  console.log('Terminal session state:', session_state);
  console.log('Command execution:', command_details);
}
```

## License

This terminal enhancement system is part of Forge MOI and follows the project's licensing terms.