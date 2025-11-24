import React from 'react';
import { ChatMessage, Part } from '../types';
import { User, Sparkles } from 'lucide-react';

interface Props {
  message: ChatMessage;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';

  const renderPart = (part: Part, index: number) => {
    if (part.text) {
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed break-words">
          {part.text}
        </div>
      );
    }
    
    if (part.inlineData) {
      return (
        <div key={index} className="mt-3 overflow-hidden rounded-xl border border-gray-700/50 bg-gray-950/50">
          <img
            src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
            alt="Generated or uploaded content"
            className="h-auto max-w-full object-contain"
            loading="lazy"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`flex w-full gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20 mt-1">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={`flex max-w-[85%] flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative rounded-2xl px-5 py-3.5 shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
          }`}
        >
          {message.parts.map((part, i) => renderPart(part, i))}
          
          {message.isError && (
             <div className="mt-2 text-xs text-red-300 font-medium">
                Failed to generate response. Please check your API key or connection.
             </div>
          )}
        </div>
        
        <span className="text-[10px] text-gray-500 font-medium px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 mt-1">
          <User className="h-4 w-4 text-gray-300" />
        </div>
      )}
    </div>
  );
};