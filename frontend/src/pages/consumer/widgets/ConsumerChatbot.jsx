import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axiosClient';

const DEEP_QUESTIONS_KNOWLEDGE = [
  {
    category: '🔬 AI Science',
    question: '🔬 How does CNN Computer Vision detect produce decay stage?',
    answer: `**Computer Vision Decay Detection Model:**\n\nOur Deep Convolutional Neural Network (CNN) analyzes multi-spectral visual attributes of produce surface photos:\n\n1. **Color Degradation Mapping:** Tracks chlorophyll breakdown (green to yellow/brown) and anthocyanin shifts.\n2. **Surface Texture & Softening:** Identifies necrotic lesions, skin wrinkling, stem shrinkage, and fungal mycelium mold spots.\n3. **Confidence Matrix:** Combines visual feature scores with produce geometry to output 3 freshness classes: **Fresh** (>85% integrity), **Borderline** (40-84%), and **Spoiled** (<40%).`,
  },
  {
    category: '🧪 Gas Telemetry',
    question: '🧪 What do Ammonia (NH₃), H₂S, and Ethylene gas metrics indicate?',
    answer: `**Gas Sensor Telemetry Breakdown:**\n\n- **Ammonia (NH₃):** Released during protein degradation and nitrogenous tissue decomposition (common in meats, seafood, and legumes). Values above **25 ppm** indicate bacterial decay.\n- **Hydrogen Sulfide (H₂S):** Produced by anaerobic microbial sulfur reduction (rotten egg smell). Values above **5 ppm** signal high spoilage risk.\n- **Ethylene (C₂H₄):** A natural plant hormone triggering ripening in climacteric fruits (apples, bananas, tomatoes). High concentrations (>10 ppm) accelerate decay of nearby non-climacteric produce.`,
  },
  {
    category: '🌡️ Storage Tips',
    question: '🌡️ What are the optimal temperature & humidity zones for storage?',
    answer: `**Ideal Produce Storage Micro-environments:**\n\n- **Leafy Greens & Berries:** 0°C – 2°C (32°F – 35°F) at **90–95% High Humidity** (Crisper Drawer).\n- **Citrus & Apples:** 3°C – 5°C (37°F – 41°F) at medium humidity.\n- **Tropical Produce (Bananas, Mangos, Papayas):** 13°C – 15°C (55°F – 59°F). *Never refrigerate raw bananas as chill injury turns skin black!*\n- **Tomatoes & Potatoes:** 12°C – 15°C in a dark, ventilated pantry. Cold refrigeration degrades flavor volatile compounds (solanine risk).`,
  },
  {
    category: '🧊 Shelf Life',
    question: '🧊 How can I extend the remaining shelf-life of produce?',
    answer: `**Proven Shelf-Life Extension Techniques:**\n\n1. **Ethylene Segregation:** Keep heavy ethylene producers (apples, bananas) separate from sensitive items (carrots, cucumbers, leafy greens).\n2. **Vinegar Wash for Berries:** Rinse strawberries/blueberries in 1:3 vinegar-to-water solution, dry thoroughly, and store in paper-lined containers to eliminate mold spores.\n3. **Herb Preservation:** Trim stems of coriander/parsley and place upright in 1 inch of water like flowers, covered loosely with a plastic bag.`,
  },
  {
    category: '⚡ Gas Absorbers',
    question: '⚡ How do gas absorbers & carbon filters work inside fridge drawers?',
    answer: `**Ethylene & Odor Scrubbing Technology:**\n\n- **Potassium Permanganate (KMnO₄) Absorbers:** Chemically oxidizes gas-phase ethylene into harmless carbon dioxide and water ($C_2H_4 + KMnO_4 \\rightarrow CO_2 + H_2O$), slowing produce respiration rate by up to **300%**.\n- **Activated Carbon Filters:** Adsorbs volatile organic compounds (VOCs), sulfurous gases, and odors, maintaining neutral airflow inside fridge compartments.`,
  },
  {
    category: '🍞 Bakery Science',
    question: '🍞 How do I prevent mold formation on bakery bread without refrigeration?',
    answer: `**Bakery Moisture & Staling Control:**\n\n- **Why avoid fridge for bread?** Cold temps (1°C – 5°C) speed up starch retrogradation, making bread stale 3x faster!\n- **Optimal Storage:** Store in a breathable linen bag or wooden bread box at room temperature (20°C).\n- **Long-term:** Slice fresh bread and freeze immediately in airtight freezer bags. Toast slices directly from frozen for fresh taste.`,
  },
  {
    category: '📊 Risk Thresholds',
    question: '📊 What gas ppm threshold signals dangerous food spoilage?',
    answer: `**Food Safety Risk Matrix:**\n\n- **Fresh / Safe:** NH₃ < 10 ppm, H₂S < 2 ppm, Ethylene < 3 ppm.\n- **Consume Soon (Borderline):** NH₃ 10–25 ppm, H₂S 2–5 ppm, Ethylene 3–15 ppm (Eat within 24–48 hours).\n- **Spoiled / Do Not Eat:** NH₃ > 25 ppm, H₂S > 5 ppm (High risk of foodborne pathogens such as *Salmonella*, *E. coli*, or *Listeria*).`,
  },
];

export function ConsumerChatbot() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '👋 Hello! I am your AI Food Freshness & Storage Assistant. Ask me any written question below or select a deep question chip to learn about food decay science, gas telemetry, or storage tips!',
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

    // Check if question matches pre-built deep questions
    const matchedKnowledge = DEEP_QUESTIONS_KNOWLEDGE.find(
      (item) => item.question.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(item.question.toLowerCase().slice(3, 15))
    );

    if (matchedKnowledge) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'assistant', text: matchedKnowledge.answer }]);
        setLoading(false);
      }, 400);
      return;
    }

    // Otherwise query backend / API endpoint
    try {
      const { data } = await api.post('/chat', { question: q, language: user?.language || 'en' });
      const replyText = data.reply || data.answer || data.message || 'Analysis complete: Keep stored in a cool dry area and inspect visual freshness daily.';
      setMessages((prev) => [...prev, { role: 'assistant', text: replyText }]);
    } catch {
      // Fallback response with AI advice
      const fallbackReply = generateFallbackAIAnswer(q);
      setMessages((prev) => [...prev, { role: 'assistant', text: fallbackReply }]);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackAIAnswer = (query) => {
    const lower = query.toLowerCase();
    if (lower.includes('milk') || lower.includes('dairy')) {
      return `🥛 **Dairy Preservation Tip:** Keep milk in the main fridge body (2°C – 4°C), not in the door shelf where temperatures fluctuate whenever opened. Once opened, consume within 5–7 days.`;
    }
    if (lower.includes('apple') || lower.includes('banana') || lower.includes('fruit')) {
      return `🍎 **Fruit Storage Rule:** Separate climacteric fruits (apples, bananas, avocados) from non-climacteric produce. Ethylene emission will ripen surrounding items twice as fast.`;
    }
    if (lower.includes('meat') || lower.includes('fish') || lower.includes('chicken')) {
      return `🥩 **Poultry & Meat Safety:** Store on the lowest fridge shelf in a sealed container to prevent raw juice drips. Freeze within 2 days of purchase if not cooking immediately.`;
    }
    if (lower.includes('gas') || lower.includes('ppm') || lower.includes('sensor')) {
      return `🧪 **Gas Telemetry Advice:** Elevated NH₃ and H₂S levels indicate bacterial tissue breakdown. If readings exceed 20 ppm, discard item immediately to prevent cross-contamination.`;
    }
    return `🤖 **AI Freshness Advisor:** For "${query}", we recommend storing at 3°C – 5°C in high humidity, isolating from high-ethylene emitters, and tracking expiry dates in your Fridge Inventory tracker.`;
  };

  const categories = ['All', '🔬 AI Science', '🧪 Gas Telemetry', '🌡️ Storage Tips', '🧊 Shelf Life'];

  const filteredQuestions = activeCategory === 'All'
    ? DEEP_QUESTIONS_KNOWLEDGE
    : DEEP_QUESTIONS_KNOWLEDGE.filter((q) => q.category === activeCategory);

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🤖</span> AI Freshness & Science Assistant
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ask any custom food preservation question or tap a deep science topic below.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-extrabold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            Gemini AI Active
          </span>
        </div>
      </div>

      {/* Deep Questions Selector Bar */}
      <div className="glass p-3.5 rounded-2xl border border-white/10 space-y-2.5 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <span>💡</span> Tap Deep Question to Ask:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-glow'
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
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span>{item.question}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="glass rounded-3xl border border-white/15 overflow-hidden h-[500px] sm:h-[540px] flex flex-col shadow-2xl bg-slate-900/90">
        {/* Sub Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-base font-bold text-emerald-300">
              🥦
            </div>
            <div>
              <span className="text-xs font-extrabold text-white">FFDS Produce Intelligence</span>
              <p className="text-[10px] text-slate-400">Trained on food preservation chemistry & gas telemetry</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setMessages([
                {
                  role: 'assistant',
                  text: 'Chat history cleared. What food preservation or storage question can I help answer?',
                },
              ])
            }
            className="text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
          >
            🧹 Clear Chat
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-950/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-sm mr-2.5 shrink-0 shadow-sm">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[78%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-br-none shadow-glow'
                    : 'bg-slate-900 border border-white/15 text-slate-200 rounded-bl-none shadow-md'
                }`}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xs ml-2.5 shrink-0 text-white font-bold">
                  👤
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs p-2">
              <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              <span>Analyzing food science & gas telemetry...</span>
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
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type any food safety, decay, temperature, or storage question..."
            className="input-dark flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl font-medium"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-glow px-5 py-3 rounded-xl text-white text-xs sm:text-sm font-extrabold disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-glow transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>Ask</span>
            <span>🚀</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default ConsumerChatbot;
