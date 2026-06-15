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
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setLoading(true);

    try {
      const { data } = await api.post('/chat', {
        scanId,
        question,
        language: user?.language || 'en',
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
    } catch {
      setError(t('chat.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg">
      <div className="bg-gray-50 px-4 py-2 border-b font-medium">
        {t('result.explanation')}
      </div>
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <p className="text-gray-400 text-sm italic">{t('chat.typing')}</p>
        )}
        <div ref={bottomRef} />
      </div>
      {error && <p className="text-red-600 text-sm px-4">{error}</p>}
      <form onSubmit={handleSend} className="flex border-t p-2 gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat.placeholder')}
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {t('chat.send')}
        </button>
      </form>
    </div>
  );
}
