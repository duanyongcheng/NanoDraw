import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ChatInterface } from './components/ChatInterface';
import { SettingsPanel } from './components/SettingsPanel';
import { Settings, MessageSquare, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const { apiKey, isSettingsOpen, toggleSettings } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full flex-col bg-gray-950 text-gray-100 overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900/50 px-6 py-4 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Gemini 3 Pro</h1>
            <p className="text-xs text-gray-400">Client-Side AI • Image Preview</p>
          </div>
        </div>
        
        {apiKey && (
          <button
            onClick={toggleSettings}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Settings"
          >
            <Settings className="h-6 w-6" />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-row">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface />
        </div>

        {/* Settings Sidebar (Desktop/Mobile Overlay) */}
        {isSettingsOpen && (
          <div className="absolute inset-0 z-20 flex justify-end bg-black/50 backdrop-blur-sm sm:static sm:bg-transparent sm:backdrop-blur-none sm:w-80 sm:border-l sm:border-gray-800">
             <div className="w-full h-full sm:w-80 bg-gray-900 border-l border-gray-800 shadow-2xl p-4 overflow-y-auto">
                <SettingsPanel />
             </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {!apiKey && <ApiKeyModal />}
    </div>
  );
};

export default App;