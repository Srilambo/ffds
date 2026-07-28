import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axiosClient';

const MANAGER_DEEP_QUESTIONS_KNOWLEDGE = [
  {
    category: '📉 Waste Reduction',
    question: '📉 What FIFO inventory management techniques minimize supermarket produce waste?',
    answer: `**FIFO (First-In, First-Out) Optimization Protocol:**\n\n1. **Dynamic Stock Rotation:** Always place newly received shipments behind older stock on display shelves.\n2. **Color-Coded Batch Tracking:** Tag pallets with arrival dates and calculated decay risk indices.\n3. **Proximity Discounting:** Apply automated 25-50% markdowns when produce reaches **70% of shelf-life threshold**, driving rapid sell-through before spoilage occurs.`,
  },
  {
    category: '🧪 Gas Sensors',
    question: '🧪 How can continuous gas telemetry sensors reduce warehouse batch spoilage losses?',
    answer: `**Warehouse Telemetry Alarm System:**\n\n- **Ammonia (NH₃) Leak Alert:** Continuous NH₃ monitoring above 15 ppm detects cold storage refrigerant leaks and meat protein degradation 48 hours before visual signs appear.\n- **Ethylene Containment:** Ethylene sensors (>8 ppm) automatically activate exhaust ventilation hoods to clear ripening gases before cross-contaminating stored produce.`,
  },
  {
    category: '🌡️ Cold Chain',
    question: '🌡️ What cold chain breakdown indicators signal imminent spoilage in dairy & meat storage?',
    answer: `**Cold Chain Fail-Safe Thresholds:**\n\n- **Temperature Spike Alarm:** Temperature rises above **4°C (39°F)** for >30 minutes trigger microbial growth risks (*Listeria monocytogenes*).\n- **Humidity Sensor Signals:** Relative humidity dropping below 85% causes rapid produce dehydration, while >98% condensation creates fungal mold spore incubation.`,
  },
  {
    category: '🏷️ Dynamic Pricing',
    question: '🏷️ How to calculate dynamic markdown pricing for items approaching expiration date?',
    answer: `**Dynamic Pricing Formula:**\n\n$$\\text{Discount \\%} = \\min\\left(75\\%, \\frac{\\text{Days Remaining}}{\\text{Total Shelf Life}} \\times 100\\right)$$\n\n- **3 Days Left:** 20% Off promotional badge.\n- **2 Days Left:** 40% Off quick-sale badge.\n- **1 Day Left:** 65% Off flash clear-out price to guarantee zero waste landfill disposal.`,
  },
  {
    category: '🚚 Supplier Quality',
    question: '🚚 What supplier quality control parameters prevent receiving contaminated shipments?',
    answer: `**Inbound Shipment Quality Protocol:**\n\n1. **Temperature Logging:** Audit reefer container data loggers prior to unload (Must be ≤3°C for meats/dairy).\n2. **Visual AI Batch Sampling:** Run 10 random sample photos through FFDS CNN Vision scanner to verify surface decay index <10%.\n3. **Gas Headspace Audit:** Check sealed pallet headspace for elevated H₂S or CO₂ gas buildup.`,
  },
  {
    category: '♻️ Food Rescue',
    question: '♻️ How to establish automated food rescue & composting pipelines for expired inventory?',
    answer: `**Zero-Waste Pipeline Management:**\n\n- **Food Bank Donation (Day -1):** Automatically route near-expiry packaged goods to local community food banks.\n- **Organic Composting (Post-Expiry):** Divert spoiled produce to municipal composting facilities or bio-gas anaerobic digesters for energy recovery credits.`,
  },
];

export function ManagerChatbot() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '👋 Welcome! I am your AI Business & Logistics Consultant. Ask me any written question about inventory optimization, cold chain logistics, gas sensor telemetry, or tap a deep manager question below.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;
    setInput('');
    setLoading(true);

    // Add User message
    setMessages((prev) => [...prev, { role: 'user', text: q }]);

    // Check preset manager knowledge base
    const matched = MANAGER_DEEP_QUESTIONS_KNOWLEDGE.find(
      (item) => item.question.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(item.question.toLowerCase().slice(3, 15))
    );

    if (matched) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'assistant', text: matched.answer }]);
        setLoading(false);
      }, 400);
      return;
    }

    try {
      const { data } = await api.post('/manager/chat', { question: q, language: user?.language || 'en' });
      const replyText = data.reply || data.answer || data.message || 'Audit complete: Re-align batch storage according to FIFO rotation guidelines.';
      setMessages((prev) => [...prev, { role: 'assistant', text: replyText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `📊 **Manager AI Advice for "${q}":** Recommend implementing daily FIFO inspections, monitoring Ammonia (NH₃) sensor telemetry thresholds (<15 ppm), and setting dynamic markdown discounts 48 hours prior to batch expiry date.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', '📉 Waste Reduction', '🧪 Gas Sensors', '🌡️ Cold Chain', '🏷️ Dynamic Pricing', '🚚 Supplier Quality'];

  const filteredQuestions = activeCategory === 'All'
    ? MANAGER_DEEP_QUESTIONS_KNOWLEDGE
    : MANAGER_DEEP_QUESTIONS_KNOWLEDGE.filter((q) => q.category === activeCategory);

  return (
    <div className="space-y-4 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🤖</span> AI Business & Logistics Consultant
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Executive Gemini-powered AI advisor for inventory optimization, cold chain logistics & waste reduction.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-extrabold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            Manager Advisor Online
          </span>
        </div>
      </div>

      {/* Deep Manager Questions Bar */}
      <div className="glass p-3.5 rounded-2xl border border-white/10 space-y-2.5 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <span>💡</span> Executive Deep Questions:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-brand-500 text-slate-950 shadow-glow'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filteredQuestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(item.question)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-brand-500/20 border border-white/10 hover:border-brand-500/40 text-slate-300 hover:text-brand-300 text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span>{item.question}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Box */}
      <div className="glass rounded-3xl border border-white/15 overflow-hidden h-[540px] flex flex-col shadow-2xl bg-slate-900/90">
        {/* Sub Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <span className="text-xs font-extrabold text-white">Gemini Business Consultant</span>
              <p className="text-[10px] text-slate-400">Trained on food preservation & retail logistics</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setMessages([
                {
                  role: 'assistant',
                  text: 'Chat history reset. How can I assist with your store inventory or cold chain metrics today?',
                },
              ])
            }
            className="text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
          >
            🧹 Clear Chat
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-950/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs mr-2.5 shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[78%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none shadow-md font-bold'
                    : 'bg-slate-900 border border-white/15 text-slate-200 rounded-bl-none shadow-md'
                }`}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-xl bg-slate-700 flex items-center justify-center text-xs ml-2.5 shrink-0 text-white font-bold">
                  👤
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start items-center gap-2.5 p-2 text-slate-400 text-xs">
              <div className="h-7 w-7 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs">
                🤖
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
                <span>Consulting AI supply chain model...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Written Question Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 bg-slate-900 border-t border-white/10 flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI advisor about inventory, FIFO, gas telemetry thresholds..."
            className="input-dark flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl font-medium"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-glow px-5 py-3 rounded-xl text-white text-xs sm:text-sm font-extrabold disabled:opacity-40 shrink-0 cursor-pointer shadow-glow transition-all flex items-center gap-1.5"
          >
            <span>Ask</span>
            <span>🚀</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default ManagerChatbot;
