import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { generateContent } from '../services/geminiService';
import { ChatMessage, Attachment, Part } from '../types';
import { Sparkles } from 'lucide-react';

export const ChatInterface: React.FC = () => {
  const { 
    apiKey, 
    messages, 
    history, 
    settings, 
    addMessage, 
    isLoading, 
    setLoading 
  } = useAppStore();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string, attachments: Attachment[]) => {
    if (!apiKey) return;

    setLoading(true);
    const msgId = Date.now().toString();

    // Construct User UI Message
    const userParts: Part[] = [];
    attachments.forEach(att => {
        userParts.push({
            inlineData: {
                mimeType: att.mimeType,
                data: att.base64Data
            }
        });
    });
    if (text) userParts.push({ text });

    const userMessage: ChatMessage = {
      id: msgId,
      role: 'user',
      parts: userParts,
      timestamp: Date.now()
    };
    
    // We add to store *after* generation starts usually, but for instant UI feedback we can add now.
    // However, the `addMessage` in store updates both UI messages and raw history.
    // The raw history update requires the EXACT structure needed for API.
    // So we'll trigger the API call, then update history on success to ensure sync.
    // Wait, the instructions say "Append... to your history array".
    // Let's optimistic update the UI for the user message, but carefully handle the API.
    
    // We'll dispatch a temporary message to the UI or use a distinct state if we want 100% safety.
    // But for this app, let's use the store action to commit the User Turn immediately.
    
    // Construct Raw Content for History
    const userContent = {
        role: 'user' as const,
        parts: userParts
    };
    
    addMessage(userMessage, userContent);

    try {
      // Prepare images for service
      const imagesPayload = attachments.map(a => ({
          base64Data: a.base64Data,
          mimeType: a.mimeType
      }));

      const { userContent: confirmedUserContent, modelContent } = await generateContent(
        apiKey,
        history, // Pass existing history
        text,
        imagesPayload,
        settings
      );

      // Add Model Response
      const modelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        parts: modelContent.parts || [],
        timestamp: Date.now()
      };

      addMessage(modelMessage, modelContent);

    } catch (error) {
      console.error("Failed to generate", error);
      // Add error message to UI
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        parts: [{ text: "Error generating response." }],
        timestamp: Date.now(),
        isError: true
      };
      // We don't add error to raw history to avoid corrupting the context
       // But we need to see it in UI.
       // Hack: Add a dummy content that we might filter later, or just update UI state manually.
       // For simplicity, we add it to UI but not history in a robust app.
       // Here, the store `addMessage` adds to both. 
       // Ideally we separate `addUiMessage` and `addHistoryItem`. 
       // For this scope, let's just accept the error state on the last message if needed, 
       // but cleaner to not corrupt history.
       
       // Refined approach: Just alert for now or add a visual error. 
       // I'll manually add to messages state only via a hypothetical store method if I had one,
       // but `addMessage` couples them. 
       // Let's rely on the user seeing the error in console/alert or trying again.
       alert("Generation failed. Check API Key and limits.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-8 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-40 select-none">
            <div className="mb-6 rounded-3xl bg-gray-900 p-8 shadow-2xl ring-1 ring-gray-800">
               <Sparkles className="h-16 w-16 text-blue-500 mb-4 mx-auto animate-pulse-fast" />
               <h3 className="text-2xl font-bold text-white mb-2">Gemini 3 Pro</h3>
               <p className="max-w-xs text-sm text-gray-400">
                 Start typing to create images, edit them conversationally, or ask complex questions.
               </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 animate-pulse text-gray-500 text-sm ml-2">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <div className="h-2 w-2 rounded-full bg-blue-500 delay-75"></div>
            <div className="h-2 w-2 rounded-full bg-blue-500 delay-150"></div>
            <span className="ml-2 font-medium">Gemini is thinking...</span>
          </div>
        )}
      </div>

      <InputArea onSend={handleSend} disabled={isLoading} />
    </div>
  );
};