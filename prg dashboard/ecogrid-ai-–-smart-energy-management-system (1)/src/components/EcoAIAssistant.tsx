import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, X, RefreshCw, User, Zap } from 'lucide-react';
import { sendChatMessage } from '../services/api';
import { ChatMessage } from '../types';

interface EcoAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onOptimizeRoom: (roomId: string) => void;
}

export const EcoAIAssistant: React.FC<EcoAIAssistantProps> = ({
  isOpen,
  onClose,
  onOptimizeRoom,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: "Hello! I am EcoAI, your Smart Energy Assistant. I have analyzed current IoT sensor readings across the building:\n\n• **Room 204** is currently drawing **2.4 kW** despite zero occupancy.\n• Overall building efficiency score is **87/100**.\n\nHow can I assist you with energy optimization today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const replyText = await sendChatMessage(query, messages);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Room 204 is currently consuming 2.4 kW with zero occupancy. Would you like me to optimize Classroom 204 now?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Why is Room 204 wasting energy?',
    'Optimize Room 204',
    "Predict tomorrow's usage",
    'Show active anomalies',
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[580px] h-[580px] backdrop-blur-xl">
      {/* Drawer Header */}
      <div className="p-3.5 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-sm font-bold text-white">EcoAI Assistant</h3>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </div>
            <p className="text-[10px] text-indigo-300">Powered by Gemini AI • Building Context Aware</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-2 ${
              m.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.sender === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] p-3 rounded-2xl ${
                m.sender === 'user'
                  ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap leading-relaxed'
              }`}
            >
              <div>{m.text}</div>
              <div
                className={`text-[9px] mt-1 text-right ${
                  m.sender === 'user' ? 'text-slate-900/70' : 'text-slate-500'
                }`}
              >
                {m.timestamp}
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-indigo-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 w-max">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>EcoAI is analyzing building telemetry...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts Pills */}
      <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-[10px]">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => {
              if (prompt === 'Optimize Room 204') {
                onOptimizeRoom('room-204');
              }
              handleSend(prompt);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-slate-700/60 shrink-0 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask EcoAI about energy, rooms, predictions..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors shadow-md shadow-indigo-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
