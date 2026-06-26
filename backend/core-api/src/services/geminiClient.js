const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL_NAME = 'gemini-2.0-flash';

// FFDS project knowledge for the public chatbot system prompt
const FFDS_SYSTEM_PROMPT = `You are FreshBot, a helpful AI assistant for the FFDS (Food Freshness Detection System) — a machine-learning-powered web app that helps users detect food freshness using AI.

About FFDS:
- FFDS lets users photograph a fruit, vegetable, or common food item with any smartphone and receive a freshness verdict within ~2 seconds.
- The verdict is one of three classes: Fresh, Borderline, or Spoiled.
- It also provides a confidence score, simulated gas-sensor readings (NH3, H2S, ethylene), and an AI chatbot explanation.
- Powered by a MobileNetV2 CNN model (transfer learning) trained on fruit and vegetable images.
- Built as a BSc Final Year Project by Ananthakumar Srilambotharasarma.

Key Features:
1. Scan: Upload or capture a food photo → instant freshness verdict (Fresh/Borderline/Spoiled) + confidence %
2. Gas Sensor Simulation: Realistic NH3, H2S, ethylene readings correlated with the scan result
3. AI Chatbot: Powered by Google Gemini — explains why food is in a certain state, health risks, storage tips
4. Food Inventory: Track your food items, expiry dates, and get "expiring soon" alerts
5. Waste Tracking: Log wasted food and view waste statistics
6. Manager Dashboard: Aggregated team scans and waste reports for shop managers

Technology:
- Frontend: React 18 PWA (Vite), Tailwind CSS, supports English and Sinhala
- Backend: Node.js + Express (Core API) + Python FastAPI (CNN Service)
- CNN Model: MobileNetV2 (TensorFlow/Keras), trained on fresh/rotten fruit & vegetable images
- AI Chatbot: Google Gemini API (gemini-2.0-flash) — free tier: 15 req/min, 1500 req/day
- Database: MongoDB Atlas
- Hosting: Vercel (frontend) + Render (backend)

User Roles:
- Consumer: Scan food, manage personal inventory, chat with bot, view own stats
- Manager: Everything a Consumer can do, plus manage team inventory and view waste reports

Answering Guidelines:
- Answer questions about FFDS features, how it works, food freshness science, and storage advice.
- Keep answers concise and friendly.
- If asked about something completely unrelated to food or FFDS, politely redirect to food/app topics.
- Do NOT answer questions about unrelated topics like politics, coding help for other projects, etc.
- You CAN answer general food safety and food science questions.
- Always respond in the language the user writes in (English or Sinhala).`;

function buildScanPrompt({ foodType, label, confidence, gasReadings, language, role }) {
  let langInstruction = 'Respond in English.';
  if (language === 'si') {
    langInstruction = 'Respond entirely in Sinhala (සිංහල).';
  } else if (language === 'ta') {
    langInstruction = 'Respond entirely in Tamil (தமிழ்).';
  }

  const roleContext =
    role === 'manager'
      ? 'The user is a shop manager. Include a brief waste-risk note for inventory management.'
      : 'The user is a consumer. Focus on health safety and home storage advice.';

  return `You are a food freshness advisor for FFDS (Food Freshness Detection System).

Scan results:
- Food type: ${foodType}
- Freshness label: ${label}
- Confidence: ${confidence}%
- Gas readings (ppm): NH3=${gasReadings.nh3}, H2S=${gasReadings.h2s}, Ethylene=${gasReadings.ethylene}

${roleContext}
${langInstruction}

Provide a concise explanation of why the food appears ${label}, health considerations, and storage/usage advice.`;
}

function getMockExplanation({ foodType, label, confidence, gasReadings, language, role }) {
  const fType = (foodType || 'food item').toLowerCase();
  
  if (language === 'si') {
    if (label === 'Fresh') {
      return `මෙම ${fType} නැවුම් තත්ත්වයේ පවතී (විශ්වාසදායකත්වය: ${confidence}%). වර්ණය සහ පෙනුම ඉතා යහපත්ය. ගෑස් කියවීම් (NH₃: ${gasReadings.nh3} ppm, H₂S: ${gasReadings.h2s} ppm, Ethylene: ${gasReadings.ethylene} ppm) සාමාන්‍ය සීමාවල පවතී. ගබඩා උපදෙස්: ශීතකරණයේ තබන්න.`;
    } else if (label === 'Borderline') {
      return `මෙම ${fType} මධ්‍යස්ථ තත්ත්වයේ පවතී (විශ්වාසදායකත්වය: ${confidence}%). ගෑස් කියවීම් (NH₃: ${gasReadings.nh3} ppm, H₂S: ${gasReadings.h2s} ppm, Ethylene: ${gasReadings.ethylene} ppm). පරිභෝජන උපදෙස්: ඉක්මනින් ආහාරයට ගන්න හෝ පිසීමට භාවිතා කරන්න.`;
    } else {
      return `මෙම ${fType} නරක් වී ඇත (විශ්වාසදායකත්වය: ${confidence}%). ගෑස් කියවීම් ඉහළ මට්ටමක පවතී (NH₃: ${gasReadings.nh3} ppm, H₂S: ${gasReadings.h2s} ppm, Ethylene: ${gasReadings.ethylene} ppm). ආරක්ෂිත උපදෙස්: සෞඛ්‍ය අවදානම් හේතුවෙන් මෙය පරිභෝජනය නොකරන්න.`;
    }
  }

  if (language === 'ta') {
    if (label === 'Fresh') {
      return `இந்த ${fType} புதியதாக (Fresh) உள்ளது (நம்பகத்தன்மை: ${confidence}%). வாயு அளவீடுகள் (NH₃: ${gasReadings.nh3} ppm, H₂S: ${gasReadings.h2s} ppm, Ethylene: ${gasReadings.ethylene} ppm) சாதாரணமாக உள்ளன. சேமிப்பு அறிவுரை: குளிர்சாதன பெட்டியில் அல்லது குளிர்ந்த இடத்தில் வைக்கவும்.`;
    } else if (label === 'Borderline') {
      return `இந்த ${fType} இடைப்பட்ட (Borderline) நிலையில் உள்ளது (நம்பகத்தன்மை: ${confidence}%). வாயு அளவீடுகள் (NH₃: ${gasReadings.nh3} ppm, H₂S: ${gasReadings.h2s} ppm, Ethylene: ${gasReadings.ethylene} ppm) மிதமான அளவில் உள்ளன. அறிவுரை: விரைவில் பயன்படுத்தவும்.`;
    } else {
      return `இந்த ${fType} கெட்டுப்போய் (Spoiled) உள்ளது (நம்பகத்தன்மை: ${confidence}%). வாயு அளவீடுகள் (NH₃: ${gasReadings.nh3} ppm, H₂S: ${gasReadings.h2s} ppm, Ethylene: ${gasReadings.ethylene} ppm) அதிகமாக உள்ளன. எச்சரிக்கை: ஆரோக்கிய பாதிப்பை தவிர்க்க உட்கொள்ள வேண்டாம்.`;
    }
  }

  // Default to English
  if (label === 'Fresh') {
    return `The ${fType} appears to be Fresh (confidence: ${confidence}%). Visual analysis shows healthy color and texture. Simulated gas sensor readings (NH₃: ${gasReadings.nh3} ppm, H₂S: ${gasReadings.h2s} ppm, Ethylene: ${gasReadings.ethylene} ppm) are in normal ranges. Storage Advice: Store in a cool, dry place or refrigerate to maintain freshness.`;
  } else if (label === 'Borderline') {
    return `The ${fType} is assessed as Borderline fresh (confidence: ${confidence}%). There are slight signs of ripening or minor superficial blemishes. Simulated gas sensor readings (NH₃: ${gasReadings.nh3} ppm, H₂S: ${gasReadings.h2s} ppm, Ethylene: ${gasReadings.ethylene} ppm) suggest moderate organic emission. Storage/Usage Advice: Consume soon or use in cooked dishes/smoothies.`;
  } else {
    return `The ${fType} is identified as Spoiled (confidence: ${confidence}%). Significant degradation, mold, or discoloration is detected. Simulated gas sensor readings (NH₃: ${gasReadings.nh3} ppm, H₂S: ${gasReadings.h2s} ppm, Ethylene: ${gasReadings.ethylene} ppm) are elevated. Safety Warning: Do not consume due to potential health risks. Please discard safely.`;
  }
}

function getMockFollowUp({ scanContext, question, language }) {
  const label = scanContext.label || 'Fresh';
  const food = (scanContext.foodType || 'food').toLowerCase();
  
  if (language === 'si') {
    return `[Offline Mode] මම දැනට නොබැඳි මාදිලියේ ක්‍රියාත්මක වෙමි. ඔබගේ ${food} අයිතමය ${label === 'Fresh' ? 'නැවුම්' : label === 'Borderline' ? 'මධ්‍යස්ථ' : 'නරක් වූ'} කාණ්ඩයට අයත් වේ. වැඩිදුර තොරතුරු සඳහා පසුව නැවත උත්සාහ කරන්න.`;
  }
  if (language === 'ta') {
    return `[Offline Mode] நான் தற்போது ஆஃப்லைன் பயன்முறையில் இயங்குகிறேன். உங்கள் ${food} உருப்படி ${label === 'Fresh' ? 'புதியதாக' : label === 'Borderline' ? 'இடைப்பட்ட நிலையில்' : 'கெட்டுப்போய்'} உள்ளது. மேலும் தகவலுக்கு பின்னர் மீண்டும் முயற்சிக்கவும்.`;
  }
  return `[Offline Mode] The Gemini AI service is currently at capacity or rate-limited. Under local analysis, this ${food} was classified as ${label} (${scanContext.confidence}% confidence). Storage and health advice: For ${label.toLowerCase()} items, it is generally recommended to ${label === 'Fresh' ? 'store in cool temperatures to retain vitamins' : label === 'Borderline' ? 'use immediately in baking, smoothies or cooking' : 'discard to avoid bacterial or fungal ingestion'}.`;
}

function getMockPublicReply(question) {
  const q = question.toLowerCase();
  
  if (q.includes('what') && q.includes('ffds')) {
    return `FFDS stands for Food Freshness Detection System. It is an ML-powered application that helps users analyze food freshness instantly. Users can photograph a food item to get a freshness rating (Fresh, Borderline, Spoiled) along with confidence percentage and simulated gas readings.`;
  }
  if (q.includes('model') || q.includes('cnn') || q.includes('accuracy')) {
    return `The system uses a MobileNetV2 CNN model trained on a custom dataset of fresh and rotten fruits/vegetables. In our tests, the pipeline achieves an accuracy of approximately 84-93% depending on the training iterations and synthetic data.`;
  }
  if (q.includes('gas') || q.includes('sensor')) {
    return `The gas sensor simulation models NH3 (Ammonia), H2S (Hydrogen Sulfide), and Ethylene levels. Higher NH3 and H2S levels correspond to spoilage (organic decay), while Ethylene levels indicate the ripening state of fruits like bananas and apples.`;
  }
  if (q.includes('features')) {
    return `Core features of FFDS include: 1. Food scanning using a mobile camera or upload. 2. Real-time gas simulation metrics. 3. AI Freshness analysis and advice. 4. Pantry/Inventory tracking with expiration notifications. 5. Waste tracking and manager dashboards.`;
  }
  if (q.includes('who') || q.includes('creator') || q.includes('author')) {
    return `FFDS is built as a BSc Final Year Project by Ananthakumar Srilambotharasarma.`;
  }
  if (q.includes('tech') || q.includes('stack') || q.includes('built')) {
    return `FFDS is built using:
- Frontend: React 18 (Vite, Tailwind CSS)
- Backend: Express Node.js & Python FastAPI
- Database: MongoDB Atlas
- Model: TensorFlow/Keras MobileNetV2`;
  }
  
  return `[FreshBot Fallback] I am currently responding in offline mode due to Gemini rate limits. I can tell you about:
- What FFDS is and its core features
- The CNN MobileNetV2 model and accuracy
- Simulated gas sensors (NH3, H2S, Ethylene)
- The technology stack and project developer (Ananthakumar Srilambotharasarma)

Feel free to ask a question containing any of those terms!`;
}

async function explainScan({
  foodType,
  label,
  confidence,
  gasReadings,
  language,
  role,
  imageBuffer,
}) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = buildScanPrompt({
      foodType,
      label,
      confidence,
      gasReadings,
      language,
      role,
    });

    const parts = [{ text: prompt }];
    if (imageBuffer) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBuffer.toString('base64'),
        },
      });
    }

    const result = await model.generateContent(parts);
    return result.response.text();
  } catch (err) {
    console.warn(`[Gemini API] explainScan failed: ${err.message}. Returning fallback explanation.`);
    return getMockExplanation({ foodType, label, confidence, gasReadings, language, role });
  }
}

async function answerFollowUp({ scanContext, chatHistory, question, language }) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    let langInstruction = 'Respond in English.';
    if (language === 'si') {
      langInstruction = 'Respond entirely in Sinhala (සිංහල).';
    } else if (language === 'ta') {
      langInstruction = 'Respond entirely in Tamil (தமிழ்).';
    }

    const systemPrompt = `You are a food freshness advisor. Context from the original scan:
- Food: ${scanContext.foodType}
- Label: ${scanContext.label}
- Confidence: ${scanContext.confidence}%
- Gas readings: NH3=${scanContext.gasReadings?.nh3}, H2S=${scanContext.gasReadings?.h2s}, Ethylene=${scanContext.gasReadings?.ethylene}
${langInstruction}`;

    const history = chatHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: msg.parts || [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I will help with food freshness questions.' }] },
        ...history,
      ],
    });

    const result = await chat.sendMessage(question);
    return result.response.text();
  } catch (err) {
    console.warn(`[Gemini API] answerFollowUp failed: ${err.message}. Returning fallback chat message.`);
    return getMockFollowUp({ scanContext, question, language });
  }
}

/**
 * Public chatbot — no auth required.
 * Answers questions about FFDS and food freshness.
 * @param {string} question - User's question
 * @param {Array}  history  - Prior messages [{role:'user'|'assistant', text:string}]
 * @returns {Promise<string>} Gemini reply
 */
async function publicChatbot({ question, history = [] }) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Build prior conversation history for multi-turn support
    const priorHistory = history.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: FFDS_SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Hello! I am FreshBot, your FFDS assistant. I can help you with food freshness questions, how to use the FFDS app, and food safety advice. How can I help you today?' }] },
        ...priorHistory,
      ],
    });

    const result = await chat.sendMessage(question);
    return result.response.text();
  } catch (err) {
    console.warn(`[Gemini API] publicChatbot failed: ${err.message}. Returning fallback public chat response.`);
    return getMockPublicReply(question);
  }
}

module.exports = { explainScan, answerFollowUp, publicChatbot };
