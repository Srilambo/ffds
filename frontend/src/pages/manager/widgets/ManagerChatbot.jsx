import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axiosClient';

export function ManagerChatbot() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Business Advisor. Ask me about reducing spoilage loss, optimizing warehouse rotation, or supplier quality controls.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;
    setInput('');
    setLoading(true);
    setMessages((p) => [...p, { role: 'user', text: q }]);
    try {
      const { data } = await api.post('/manager/chat', { question: q, language: user?.language || 'en' });
      setMessages((p) => [...p, { role: 'assistant', text: data.reply }]);
    } catch {
      setMessages((p) => [...p, { role: 'assistant', text: 'Error: Could not establish connection with AI advisor.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'How to minimize fruit spoilage?',
    'Optimal cold storage temperatures',
    'High spoilage risk items in stock',
  ];

  return (
    <div className="space-y-4 fade-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>🤖</span> AI Business Advisor
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Gemini-powered executive AI consultant for inventory optimization and waste prevention.
        </p>
      </div>

      <div className="glass rounded-2xl border border-white/10 overflow-hidden h-[620px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <span className="text-xs font-bold text-white">Gemini Business Consultant</span>
              <p className="text-[10px] text-slate-400">Trained on food preservation & logistics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Online</span>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/40">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {msg.role === 'assistant' && (
                <div className="h-7 w-7 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs mr-2 shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none shadow-md font-medium'
                    : 'bg-white/10 text-slate-200 rounded-bl-none border border-white/10'
                }`}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="h-7 w-7 rounded-xl bg-slate-700 flex items-center justify-center text-xs ml-2 shrink-0">
                  👤
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs">
                🤖
              </div>
              <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex items-center gap-2 overflow-x-auto">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-[10px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-brand-500/20 border border-white/10 text-slate-300 hover:text-brand-300 transition-all shrink-0 font-medium"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 p-3 bg-white/5 border-t border-white/10"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI advisor about inventory strategies..."
            className="input-dark flex-1 px-3.5 py-2.5 text-xs rounded-xl"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-glow px-4 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5"
          >
            {loading ? <span className="spinner w-4 h-4" /> : 'Send ↑'}
          </button>
        </form>
      </div>
    </div>
  );
}
export default ManagerChatbot;
