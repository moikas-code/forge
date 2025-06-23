import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { forgeDarkTheme, forgeLightTheme } from './monaco-themes';

export function configureMonaco(monaco: Monaco): void {
  // Define custom themes
  monaco.editor.defineTheme('forge-dark', forgeDarkTheme);
  monaco.editor.defineTheme('forge-light', forgeLightTheme);

  // Configure TypeScript compiler options
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types'],
  });

  // Configure JavaScript compiler options
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    allowJs: true,
    checkJs: false,
  });

  // Configure TypeScript diagnostics
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: false,
  });

  // Configure JavaScript diagnostics
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: false,
  });

  // Add extra libraries for common web APIs
  const libSource = `
declare global {
  interface Window {
    __TAURI__: any;
    __TAURI_INVOKE__: any;
  }
}

declare const window: Window & typeof globalThis;
`;

  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    libSource,
    'file:///node_modules/@types/tauri.d.ts'
  );

  // Configure JSON language features
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: true,
    schemas: [
      {
        uri: 'http://json.schemastore.org/package',
        fileMatch: ['package.json'],
      },
      {
        uri: 'http://json.schemastore.org/tsconfig',
        fileMatch: ['tsconfig.json'],
      },
    ],
  });
}

export function getEditorOptions(theme: 'light' | 'dark'): editor.IStandaloneEditorConstructionOptions {
  return {
    fontSize: 14,
    fontFamily: 'SF Mono, Monaco, Consolas, "Courier New", monospace',
    lineHeight: 1.6,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    wordWrap: 'off',
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    suggestOnTriggerCharacters: true,
    tabSize: 2,
    insertSpaces: true,
    automaticLayout: true,
    fixedOverflowWidgets: true,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    renderLineHighlight: 'all',
    selectionHighlight: true,
    occurrencesHighlight: 'singleFile',
    find: {
      seedSearchStringFromSelection: 'selection',
      autoFindInSelection: 'never',
    },
    links: true,
    multiCursorModifier: 'ctrlCmd',
    showFoldingControls: 'always',
    foldingStrategy: 'indentation',
    lightbulb: {
      enabled: 'on',
    },
    hover: {
      enabled: true,
      delay: 500,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'on',
    dragAndDrop: true,
    formatOnPaste: true,
    formatOnType: true,
    autoIndent: 'full',
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    inlineSuggest: {
      enabled: true,
    },
    unicodeHighlight: {
      ambiguousCharacters: true,
      invisibleCharacters: true,
    },
    padding: {
      top: 16,
      bottom: 16,
    },
  };
}

export function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    mts: 'typescript',
    cts: 'typescript',
    py: 'python',
    pyw: 'python',
    rb: 'ruby',
    rs: 'rust',
    go: 'go',
    java: 'java',
    kt: 'kotlin',
    scala: 'scala',
    cpp: 'cpp',
    cxx: 'cpp',
    cc: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    hxx: 'cpp',
    cs: 'csharp',
    php: 'php',
    swift: 'swift',
    r: 'r',
    m: 'objective-c',
    mm: 'objective-c',
    vue: 'vue',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'ini',
    xml: 'xml',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    jsonc: 'jsonc',
    md: 'markdown',
    mdx: 'markdown',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    dockerignore: 'ignore',
    gitignore: 'ignore',
    sql: 'sql',
    graphql: 'graphql',
    gql: 'graphql',
    lua: 'lua',
    pl: 'perl',
    pm: 'perl',
    dart: 'dart',
    clj: 'clojure',
    cljs: 'clojure',
    cljc: 'clojure',
    elm: 'elm',
    ex: 'elixir',
    exs: 'elixir',
    erl: 'erlang',
    hrl: 'erlang',
    fs: 'fsharp',
    fsi: 'fsharp',
    fsx: 'fsharp',
    hs: 'haskell',
    lhs: 'haskell',
    jl: 'julia',
    nim: 'nim',
    nims: 'nim',
    pas: 'pascal',
    pp: 'pascal',
    ini: 'ini',
    cfg: 'ini',
    conf: 'ini',
    properties: 'properties',
    log: 'log',
  };
  
  return languageMap[extension.toLowerCase()] || 'plaintext';
}