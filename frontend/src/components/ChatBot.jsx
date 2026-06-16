import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function ChatBot({ scanId, initialExplanation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: initialExplanation },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput(''); setError('');
    setMessages((p) => [...p, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const { data } = await api.post('/chat', {
        scanId, question, language: user?.language || 'en',
      });
      setMessages((p) => [...p, { role: 'assistant', text: data.reply }]);
    } catch {
      setError(t('chat.error'));
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/3 border-b border-white/8">
        <div className="h-6 w-6 rounded-md bg-brand-600/30 flex items-center justify-center text-xs">🤖</div>
        <span className="text-sm font-semibold text-white">{t('result.explanation')}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse-slow" />
          <span className="text-xs text-slate-500">Gemini AI</span>
        </div>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-surface-2/30">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {msg.role === 'assistant' && (
              <div className="h-6 w-6 rounded-full bg-brand-700/40 border border-brand-600/30 flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0">
                🤖
              </div>
            )}
            <div
              className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-white/8 text-slate-200 rounded-bl-sm border border-white/5'
              }`}
            >
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs ml-2 mt-0.5 shrink-0">
                👤
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="h-6 w-6 rounded-full bg-brand-700/40 border border-brand-600/30 flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0">🤖</div>
            <div className="bg-white/8 border border-white/5 px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs px-4 py-2">⚠️ {error}</p>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 p-3 bg-white/2 border-t border-white/8">
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat.placeholder')}
          className="input-dark flex-1 px-3 py-2 text-sm rounded-lg"
          disabled={loading}
        />
        <button
          id="chat-send-btn"
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-glow px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-1.5"
        >
          {loading ? <span className="spinner w-4 h-4" /> : '↑'}
        </button>
      </form>
    </div>
  );
}
