import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, ChatMessage, Content } from '../types';

interface AppState {
  apiKey: string | null;
  settings: AppSettings;
  history: Content[]; // Raw history for the API
  messages: ChatMessage[]; // UI representation with IDs
  isLoading: boolean;
  isSettingsOpen: boolean;

  setApiKey: (key: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addMessage: (message: ChatMessage, content: Content) => void;
  setLoading: (loading: boolean) => void;
  toggleSettings: () => void;
  clearHistory: () => void;
  removeApiKey: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      apiKey: null,
      settings: {
        resolution: '1K',
        aspectRatio: '1:1',
        useGrounding: false,
      },
      history: [],
      messages: [],
      isLoading: false,
      isSettingsOpen: false,

      setApiKey: (key) => set({ apiKey: key }),
      
      updateSettings: (newSettings) => 
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      addMessage: (message, content) => 
        set((state) => ({ 
          messages: [...state.messages, message],
          history: [...state.history, content]
        })),

      setLoading: (loading) => set({ isLoading: loading }),
      
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

      clearHistory: () => set({ history: [], messages: [] }),

      removeApiKey: () => set({ apiKey: null, history: [], messages: [] }),
    }),
    {
      name: 'gemini-app-storage',
      partialize: (state) => ({ 
        apiKey: state.apiKey, 
        settings: state.settings 
      }), // Only persist key and settings, not history/messages for privacy/size
    }
  )
);