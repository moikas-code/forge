export interface TerminalTheme {
  id: string;
  name: string;
  author?: string;
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
  selectionForeground?: string;
  // ANSI colors
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export const terminal_themes: Record<string, TerminalTheme> = {
  'macos-default': {
    id: 'macos-default',
    name: 'macOS Default',
    author: 'Apple',
    background: '#1e1e1e',
    foreground: '#cccccc',
    cursor: '#c7c7c7',
    cursorAccent: '#1e1e1e',
    selectionBackground: '#456ca0',
    selectionForeground: '#ffffff',
    black: '#000000',
    red: '#c91b00',
    green: '#00c200',
    yellow: '#c7c400',
    blue: '#0225c7',
    magenta: '#c930c7',
    cyan: '#00c5c7',
    white: '#c7c7c7',
    brightBlack: '#676767',
    brightRed: '#ff6e67',
    brightGreen: '#5ff967',
    brightYellow: '#fefb67',
    brightBlue: '#6871ff',
    brightMagenta: '#ff76ff',
    brightCyan: '#5ffdff',
    brightWhite: '#feffff'
  },
  'solarized-dark': {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    author: 'Ethan Schoonover',
    background: '#002b36',
    foreground: '#839496',
    cursor: '#93a1a1',
    cursorAccent: '#002b36',
    selectionBackground: '#073642',
    selectionForeground: '#93a1a1',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#586e75',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3'
  },
  'solarized-light': {
    id: 'solarized-light',
    name: 'Solarized Light',
    author: 'Ethan Schoonover',
    background: '#fdf6e3',
    foreground: '#657b83',
    cursor: '#586e75',
    cursorAccent: '#fdf6e3',
    selectionBackground: '#eee8d5',
    selectionForeground: '#586e75',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3'
  },
  'monokai': {
    id: 'monokai',
    name: 'Monokai',
    author: 'Wimer Hazenberg',
    background: '#272822',
    foreground: '#f8f8f2',
    cursor: '#f8f8f0',
    cursorAccent: '#272822',
    selectionBackground: '#49483e',
    selectionForeground: '#f8f8f2',
    black: '#272822',
    red: '#f92672',
    green: '#a6e22e',
    yellow: '#f4bf75',
    blue: '#66d9ef',
    magenta: '#ae81ff',
    cyan: '#a1efe4',
    white: '#f8f8f2',
    brightBlack: '#75715e',
    brightRed: '#f92672',
    brightGreen: '#a6e22e',
    brightYellow: '#f4bf75',
    brightBlue: '#66d9ef',
    brightMagenta: '#ae81ff',
    brightCyan: '#a1efe4',
    brightWhite: '#f9f8f5'
  },
  'vscode-dark': {
    id: 'vscode-dark',
    name: 'VS Code Dark',
    author: 'Microsoft',
    background: '#1e1e1e',
    foreground: '#cccccc',
    cursor: '#aeafad',
    cursorAccent: '#1e1e1e',
    selectionBackground: '#264f78',
    selectionForeground: '#cccccc',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#e5e5e5'
  },
  'github-dark': {
    id: 'github-dark',
    name: 'GitHub Dark',
    author: 'GitHub',
    background: '#0d1117',
    foreground: '#f0f6fc',
    cursor: '#f0f6fc',
    cursorAccent: '#0d1117',
    selectionBackground: '#264f78',
    selectionForeground: '#f0f6fc',
    black: '#484f58',
    red: '#ff7b72',
    green: '#3fb950',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#39c5cf',
    white: '#b1bac4',
    brightBlack: '#6e7681',
    brightRed: '#ffa198',
    brightGreen: '#56d364',
    brightYellow: '#e3b341',
    brightBlue: '#79c0ff',
    brightMagenta: '#d2a8ff',
    brightCyan: '#56d4dd',
    brightWhite: '#f0f6fc'
  },
  'dracula': {
    id: 'dracula',
    name: 'Dracula',
    author: 'Dracula Theme',
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#f8f8f2',
    cursorAccent: '#282a36',
    selectionBackground: '#44475a',
    selectionForeground: '#f8f8f2',
    black: '#000000',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#bfbfbf',
    brightBlack: '#4d4d4d',
    brightRed: '#ff6e67',
    brightGreen: '#5af78e',
    brightYellow: '#f4f99d',
    brightBlue: '#caa9fa',
    brightMagenta: '#ff92d0',
    brightCyan: '#9aedfe',
    brightWhite: '#e6e6e6'
  },
  'one-dark': {
    id: 'one-dark',
    name: 'One Dark',
    author: 'Atom',
    background: '#282c34',
    foreground: '#abb2bf',
    cursor: '#528bff',
    cursorAccent: '#282c34',
    selectionBackground: '#3e4451',
    selectionForeground: '#abb2bf',
    black: '#282c34',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
    white: '#abb2bf',
    brightBlack: '#5c6370',
    brightRed: '#e06c75',
    brightGreen: '#98c379',
    brightYellow: '#e5c07b',
    brightBlue: '#61afef',
    brightMagenta: '#c678dd',
    brightCyan: '#56b6c2',
    brightWhite: '#ffffff'
  },
  'nord': {
    id: 'nord',
    name: 'Nord',
    author: 'Arctic Ice Studio',
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#d8dee9',
    cursorAccent: '#2e3440',
    selectionBackground: '#4c566a',
    selectionForeground: '#d8dee9',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
    brightBlack: '#4c566a',
    brightRed: '#bf616a',
    brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1',
    brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb',
    brightWhite: '#eceff4'
  },
  'gruvbox-dark': {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    author: 'Pavel Pertsev',
    background: '#282828',
    foreground: '#ebdbb2',
    cursor: '#ebdbb2',
    cursorAccent: '#282828',
    selectionBackground: '#3c3836',
    selectionForeground: '#ebdbb2',
    black: '#282828',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    magenta: '#b16286',
    cyan: '#689d6a',
    white: '#a89984',
    brightBlack: '#928374',
    brightRed: '#fb4934',
    brightGreen: '#b8bb26',
    brightYellow: '#fabd2f',
    brightBlue: '#83a598',
    brightMagenta: '#d3869b',
    brightCyan: '#8ec07c',
    brightWhite: '#ebdbb2'
  }
};

export const get_theme_by_id = (theme_id: string): TerminalTheme => {
  return terminal_themes[theme_id] || terminal_themes['macos-default'];
};

export const get_all_themes = (): TerminalTheme[] => {
  return Object.values(terminal_themes);
};

export const get_theme_preview_colors = (theme: TerminalTheme) => {
  return {
    background: theme.background,
    foreground: theme.foreground,
    accent: theme.cursor,
    primary: theme.blue,
    secondary: theme.green,
    warning: theme.yellow,
    error: theme.red
  };
};