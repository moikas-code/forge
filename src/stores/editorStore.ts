import { create } from 'zustand';

export interface EditorState {
  content: string;
  path?: string;
  language?: string;
  cursorPosition?: { line: number; column: number };
  scrollPosition?: { top: number; left: number };
}

interface EditorStoreState {
  editors: Record<string, EditorState>;
  dirtyStates: Record<string, boolean>;
  
  getEditorState: (tabId: string) => EditorState | undefined;
  setEditorState: (tabId: string, state: Partial<EditorState>) => void;
  removeEditorState: (tabId: string) => void;
  
  getDirtyState: (tabId: string) => boolean;
  setDirtyState: (tabId: string, isDirty: boolean) => void;
  
  saveAll: () => Promise<void>;
}

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  editors: {},
  dirtyStates: {},
  
  getEditorState: (tabId) => get().editors[tabId],
  
  setEditorState: (tabId, state) => set((prev) => ({
    editors: {
      ...prev.editors,
      [tabId]: {
        ...prev.editors[tabId],
        ...state,
      },
    },
  })),
  
  removeEditorState: (tabId) => set((prev) => {
    const { [tabId]: removed, ...rest } = prev.editors;
    const { [tabId]: removedDirty, ...restDirty } = prev.dirtyStates;
    return {
      editors: rest,
      dirtyStates: restDirty,
    };
  }),
  
  getDirtyState: (tabId) => get().dirtyStates[tabId] || false,
  
  setDirtyState: (tabId, isDirty) => set((prev) => ({
    dirtyStates: {
      ...prev.dirtyStates,
      [tabId]: isDirty,
    },
  })),
  
  saveAll: async () => {
    // This would be implemented to save all dirty editors
    // For now, it's a placeholder
    console.log('Saving all dirty editors...');
  },
}));