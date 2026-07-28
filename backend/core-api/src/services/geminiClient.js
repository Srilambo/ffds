const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL_NAME = 'gemini-2.0-flash';

const GENERIC_FOOD_LABELS = ['detected item', 'food item', 'unknown', 'fresh', 'borderline', 'spoiled', ''];

// The EXACT 10 food classes the CNN model was trained on (Kaggle dataset)
// Fruits: FreshApple, FreshBanana, FreshMango, FreshOrange, FreshStrawberry + Rotten variants
// Vegetables: FreshBellpepper, FreshCarrot, FreshCucumber, FreshPotato, FreshTomato + Rotten variants
const DATASET_FOOD_CLASSES = [
  'Apple', 'Banana', 'Mango', 'Orange', 'Strawberry',
  'Bellpepper', 'Carrot', 'Cucumber', 'Potato', 'Tomato'
];

const DATASET_FOOD_CLASSES_SET = new Set(DATASET_FOOD_CLASSES.map(c => c.toLowerCase()));

const DATASET_CLASS_NAMES = {
  // Exact dataset class names (10 classes from Kaggle Fruits & Vegetables Dataset)
  apple: 'Apple',
  apples: 'Apple',
  banana: 'Banana',
  bananas: 'Banana',
  mango: 'Mango',
  mangos: 'Mango',
  mangoes: 'Mango',
  orange: 'Orange',
  oranges: 'Orange',
  strawberry: 'Strawberry',
  strawberries: 'Strawberry',
  bellpepper: 'Bellpepper',
  bellpeppers: 'Bellpepper',
  'bell pepper': 'Bellpepper',
  'bell peppers': 'Bellpepper',
  capsicum: 'Bellpepper',
  carrot: 'Carrot',
  carrots: 'Carrot',
  cucumber: 'Cucumber',
  cucumbers: 'Cucumber',
  potato: 'Potato',
  potatoes: 'Potato',
  tomato: 'Tomato',
  tomatoes: 'Tomato',
};

function normalizeFoodTypeName(name) {
  if (!name) return 'Food Item';
  const key = name.toLowerCase().trim();
  if (DATASET_CLASS_NAMES[key]) return DATASET_CLASS_NAMES[key];

  if (key.includes('carrot')) return 'Carrot';
  if (key.includes('apple')) return 'Apple';
  if (key.includes('banana')) return 'Banana';
  if (key.includes('mango')) return 'Mango';
  if (key.includes('orange')) return 'Orange';
  if (key.includes('strawberr')) return 'Strawberry';
  if (key.includes('bellpepper') || key.includes('bell pepper') || key.includes('capsicum')) return 'Bellpepper';
  if (key.includes('cucumber')) return 'Cucumber';
  if (key.includes('potato')) return 'Potato';
  if (key.includes('tomato')) return 'Tomato';

  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Returns true only if the name is one of the 10 FFDS dataset classes.
 * Used to validate Gemini Vision output against trained model classes.
 */
function isDatasetClass(name) {
  if (!name) return false;
  const normalized = normalizeFoodTypeName(name);
  return DATASET_FOOD_CLASSES_SET.has(normalized.toLowerCase().trim());
}

function isGenericFoodLabel(name) {
  return GENERIC_FOOD_LABELS.includes((name || '').toLowerCase().trim());
}

/**
 * Resolve food name using cross-validation between Gemini Vision and CNN/ImageNet.
 *
 * Strategy:
 *  1. Ask Gemini Vision first (accurate pixel-level analysis from actual image)
 *  2. If Gemini succeeds → always use it (Gemini reads the actual pixels)
 *  3. If Gemini fails and CNN is NOT mock → use CNN result
 *  4. If both fail → 'Food Item' fallback
 *
 * IMPORTANT: When CNN is in mock mode (isMock: true), its foodType is randomly
 * generated from file size — it does NOT reflect the actual image content.
 * In that case we MUST rely on Gemini Vision only.
 */
async function resolveFoodType(imageBuffer, mimeType, cnnInput) {
  const isMockCnn = typeof cnnInput === 'object' && cnnInput?.isMock === true;
  const rawFoodType = typeof cnnInput === 'object' ? cnnInput?.foodType : cnnInput;
  const cnnResolved = normalizeFoodTypeName(rawFoodType || 'Food Item');
  // Treat CNN result as generic if it is a mock (random) or is a generic label
  const cnnIsGeneric = isMockCnn || isGenericFoodLabel(cnnResolved);

  let geminiResult = null;

  // Step 1: Always try Gemini Vision when image is available — it reads actual pixels
  if (imageBuffer) {
    try {
      const identified = await identifyFoodFromImage(imageBuffer, mimeType);
      const normalized = normalizeFoodTypeName(identified);
      if (!isGenericFoodLabel(normalized)) {
        geminiResult = normalized;
      }
    } catch (err) {
      console.warn('[resolveFoodType] Gemini Vision failed:', err.message);
    }
  }

  // Step 2: If Gemini succeeded, always use it (it saw the actual image)
  if (geminiResult) {
    if (!cnnIsGeneric && geminiResult.toLowerCase() !== cnnResolved.toLowerCase()) {
      console.log(`[resolveFoodType] Gemini="${geminiResult}" vs CNN="${cnnResolved}" → using Gemini (actual image analysis)`);
    } else {
      console.log(`[resolveFoodType] ✓ Gemini result: "${geminiResult}"${isMockCnn ? ' (CNN was mock/random)' : ''}`);
    }
    return geminiResult;
  }

  // Step 3: Gemini failed — fallback to CNN only if it is NOT a mock result
  if (!cnnIsGeneric) {
    console.log(`[resolveFoodType] Gemini failed, fallback to CNN: "${cnnResolved}"`);
    return cnnResolved;
  }

  // Step 4: Both failed — return generic placeholder
  console.log('[resolveFoodType] Both Gemini and CNN failed, returning Food Item');
  return 'Food Item';
}

/**
 * Use Gemini Vision to identify the exact food item in the image.
 * STRICTLY constrained to the 10 FFDS dataset classes:
 *   Fruits:     Apple, Banana, Mango, Orange, Strawberry
 *   Vegetables: Bellpepper, Carrot, Cucumber, Potato, Tomato
 * Returns a plain string matching one of the 10 dataset class names.
 * Tries multiple Gemini model versions as fallback for reliability on live.
 */
async function identifyFoodFromImage(imageBuffer, mimeType) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const VISION_PROMPT = `You are a food image classifier for the FFDS system. Look at this image and identify the food.

This system ONLY handles these 10 specific food items. You MUST choose from exactly this list:

FRUITS:
- Apple: Round fruit, smooth waxy skin, red/green/yellow color, small stem at top, dimple at both ends
- Banana: Long, curved, yellow fruit with elongated shape
- Mango: Kidney/oval shaped fruit, smooth skin, yellow-orange-red gradient, tropical, has a stem at one end
- Orange: Round citrus fruit, textured/bumpy orange-colored peel all over
- Strawberry: Small heart-shaped red fruit with tiny yellow seeds on the surface, short green leafy cap at top

VEGETABLES:
- Bellpepper: Blocky bell-shaped vegetable with 3-4 lobes at the bottom, green/red/yellow color
- Carrot: Long, thin, tapered, bright orange root vegetable
- Cucumber: Long, cylindrical, smooth dark green skin vegetable
- Potato: Irregular oval, rough brown/beige skin with small "eye" indentations
- Tomato: Round, smooth shiny red skin, green star-shaped stem on top

IMPORTANT RULES:
1. You MUST reply with ONLY ONE word from this exact list: Apple, Banana, Mango, Orange, Strawberry, Bellpepper, Carrot, Cucumber, Potato, Tomato
2. No other words, no sentences, no punctuation.
3. If the image shows strawberries (small red heart-shaped fruits with tiny seeds) → answer: Strawberry
4. If the image shows tomatoes (round red smooth fruit with green star stem) → answer: Tomato
5. If the image shows oranges (round bumpy orange citrus) → answer: Orange
6. If you are unsure, pick the CLOSEST match from the 10 options above.

What food is in this image? (one word only)`;

  const imagePart = {
    inlineData: {
      mimeType: mimeType || 'image/jpeg',
      data: imageBuffer.toString('base64'),
    },
  };

  // Try multiple models in order — some keys have quotas or restrictions per model
  const VISION_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  let lastErr = null;
  for (const modelName of VISION_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([VISION_PROMPT, imagePart]);
      const rawText = result.response.text().trim();
      const normalized = normalizeFoodTypeName(rawText);
      console.log(`[identifyFoodFromImage] ${modelName} raw: "${rawText}" → normalized: "${normalized}" → dataset valid: ${isDatasetClass(normalized)}`);
      // Only accept if it's a valid dataset class name
      if (isDatasetClass(normalized)) {
        return normalized;
      }
      // Gemini returned something outside the 10 classes — try next model
      console.warn(`[identifyFoodFromImage] "${normalized}" is NOT a dataset class via ${modelName} — trying next model`);
    } catch (err) {
      lastErr = err;
      console.warn(`[identifyFoodFromImage] ${modelName} failed: ${err.message} — trying next model`);
    }
  }

  // All models failed
  console.error('[identifyFoodFromImage] All Gemini models failed:', lastErr?.message);
  throw lastErr || new Error('All Gemini Vision models failed');
}

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

  let roleContext;
  switch (role) {
    case 'manager':
      roleContext = 'The user is a shop manager. Include a brief waste-risk note for inventory management and cost impact.';
      break;
    case 'farmer':
      roleContext = 'The user is a farmer. Focus on harvest quality, post-harvest handling, transport recommendations, and sell/hold decision support.';
      break;
    default:
      roleContext = 'The user is a consumer. Focus on health safety and home storage advice.';
  }

  return `You are a food freshness advisor for FFDS (Food Freshness Detection System).

Scan results:
- Food type: ${foodType}
- Freshness label: ${label}
- Confidence: ${confidence}%
- Gas readings (ppm): NH3=${gasReadings.nh3}, H2S=${gasReadings.h2s}, Ethylene=${gasReadings.ethylene}

${roleContext}
${langInstruction}

Provide a concise explanation of why the food appears ${label}, health considerations, and storage/usage advice. Keep the response under 120 words.`;
}

/**
 * Generate a chatbot explanation for a scan result.
 * Returns { text, foodType } where foodType is the Gemini-identified food name
 * if the CNN returned a generic label.
 */
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
    return `ඔබගේ ${food} අයිතමය ${label === 'Fresh' ? 'නැවුම්' : label === 'Borderline' ? 'මධ්‍යස්ථ' : 'නරක් වූ'} කාණ්ඩයට අයත් වේ. ධාරිතාව: ${scanContext.confidence}%.`;
  }
  if (language === 'ta') {
    return `உங்கள் ${food} உருப்படி ${label === 'Fresh' ? 'புதியதாக' : label === 'Borderline' ? 'இடைப்பட்ட நிலையில்' : 'கெட்டுப்போய்'} உள்ளது. நம்பகத்தன்மை: ${scanContext.confidence}%.`;
  }
  return `Under detailed food quality analysis, this ${food} was classified as ${label} (${scanContext.confidence}% confidence). Storage and health advice: For ${label.toLowerCase()} items, it is generally recommended to ${label === 'Fresh' ? 'store in cool temperatures to retain vitamins' : label === 'Borderline' ? 'use immediately in baking, smoothies or cooking' : 'discard to avoid bacterial or fungal ingestion'}.`;
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
  
  return `I am your FFDS AI Assistant! I can help you with:
- What FFDS is and its core features
- The CNN MobileNetV2 model and accuracy
- Simulated gas sensors (NH3, H2S, Ethylene)
- The technology stack and project developer (Ananthakumar Srilambotharasarma)

Feel free to ask any questions regarding fruit rotation, inventory layout, or storage conditions!`;
}

async function explainScan({
  foodType,
  label,
  confidence,
  gasReadings,
  language,
  role,
  imageBuffer,
  mimeType,
}) {
  try {
    // If the CNN returned a generic label, ask Gemini to visually identify the food
    const isGeneric = isGenericFoodLabel((foodType || '').toLowerCase().trim());
    let resolvedFoodType = foodType;
    if (imageBuffer && isGeneric) {
      resolvedFoodType = await identifyFoodFromImage(imageBuffer, mimeType);
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = buildScanPrompt({
      foodType: resolvedFoodType,
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
          mimeType: mimeType || 'image/jpeg',
          data: imageBuffer.toString('base64'),
        },
      });
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();
    return { text, foodType: resolvedFoodType };
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

function buildCombinedAdvisorPrompt({
  actionType,
  foodType,
  verdict,
  confidence,
  batchSize,
  qualityScore,
  freshPct,
  borderlinePct,
  spoiledPct,
  inventorySummary,
  userLanguage = 'English',
  predictedDaysLeft,
  tempC,
  humidityPct,
  matchedAllergen,
}) {
  let actionAdvicePrompt = '';
  if (actionType === 'batch_scan') {
    actionAdvicePrompt = `If actionType is "batch_scan":
Batch size: ${batchSize || 0} items, quality score: ${qualityScore || 0}% (${freshPct || 0}% fresh / ${borderlinePct || 0}% borderline / ${spoiledPct || 0}% spoiled)
Advise on: (1) sell now vs. wait, (2) transport/storage handling to reduce further loss, (3) one tip to improve the next harvest.`;
  } else if (actionType === 'single_scan' || actionType === 'inventory_check') {
    actionAdvicePrompt = `If actionType is "single_scan" or "inventory_check":
Current inventory context: ${inventorySummary || 'No specific inventory context provided.'}
Advise on: (1) immediate action for this item, (2) whether this suggests a recurring supplier/storage issue, (3) one cost-saving or compliance tip.`;
  } else if (actionType === 'marketplace') {
    actionAdvicePrompt = `If actionType is "marketplace":
Advise on: (1) fair pricing based on quality score, (2) how to write an honest, appealing listing, or (3) how to evaluate an incoming listing/offer.`;
  } else {
    actionAdvicePrompt = `Context of this interaction: ${actionType}
Advise on immediate action, storage/handling, and cost-efficiency.`;
  }

  const allergenNotice = (matchedAllergen && matchedAllergen !== 'None' && matchedAllergen.trim() !== '')
    ? `Important: this item matches an allergen on the user's saved profile: ${matchedAllergen}. Clearly flag this warning before any other advice.`
    : 'No matched allergen on saved profile.';

  return `You are a food supply chain advisor for a combined farmer and business account on a food freshness platform. This user can act as both a producer (growing/harvesting food) and a business (managing inventory, reducing waste, and selling/buying produce).

Context of this interaction: ${actionType}

${foodType || 'Food item'} was scanned, classified as ${verdict || 'Unknown'} with ${confidence || 0}% confidence.

${actionAdvicePrompt}

Always respond in ${userLanguage}, practical and direct tone, under 150 words. Do not exaggerate quality beyond what the data supports.

Additionally, this item has a predicted shelf life of ${predictedDaysLeft ?? 'N/A'} days based on current storage conditions (${tempC ?? 'N/A'}°C, ${humidityPct ?? 'N/A'}% humidity). Mention this naturally and suggest one action to extend it if applicable.

${allergenNotice}`;
}

function getMockCombinedAdvisorAdvice({
  actionType,
  foodType,
  verdict,
  confidence,
  batchSize,
  qualityScore,
  freshPct,
  borderlinePct,
  spoiledPct,
  inventorySummary,
  predictedDaysLeft,
  tempC,
  humidityPct,
  matchedAllergen,
}) {
  const allergenPrefix = (matchedAllergen && matchedAllergen !== 'None' && matchedAllergen.trim() !== '')
    ? `⚠️ ALLERGEN WARNING: This item matches your saved profile allergen: ${matchedAllergen}.\n\n`
    : '';

  const shelfLifeText = predictedDaysLeft !== undefined
    ? `Current storage at ${tempC ?? 20}°C and ${humidityPct ?? 65}% humidity gives a predicted shelf life of ${predictedDaysLeft} days. Lower storage temp by 3–5°C to extend shelf life further.`
    : '';

  if (actionType === 'batch_scan') {
    return `${allergenPrefix}1. Sell/Hold: Quality score is ${qualityScore || 70}%. Sell borderline stock (${borderlinePct || 20}%) immediately; hold or store fresh stock (${freshPct || 80}%).\n2. Storage & Transport: Maintain cool, well-ventilated transport to prevent heat decay.\n3. Harvest Tip: Harvest in cool early morning hours to preserve freshness.\n${shelfLifeText}`;
  } else if (actionType === 'single_scan' || actionType === 'inventory_check') {
    return `${allergenPrefix}1. Immediate Action: Prioritize this ${verdict || 'scanned'} ${foodType || 'item'} for FIFO usage or immediate discount sale.\n2. Supplier/Storage Issue: Check cold room humidity control if rot is localized.\n3. Cost-Saving Tip: Separate ethylene-producing items from sensitive produce.\n${shelfLifeText}`;
  } else {
    return `${allergenPrefix}1. Pricing: Price fairly based on ${qualityScore || 80}% quality rating.\n2. Listing: Market honestly as Grade-A fresh produce with explicit expiry metrics.\n3. Negotiation: Leverage clean freshness ratings to command top tier wholesale pricing.\n${shelfLifeText}`;
  }
}

async function explainCombinedAdvisor(params) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = buildCombinedAdvisorPrompt(params);

    const result = await model.generateContent([{ text: prompt }]);
    return result.response.text();
  } catch (err) {
    console.warn(`[Gemini API] explainCombinedAdvisor failed: ${err.message}. Returning fallback advice.`);
    return getMockCombinedAdvisorAdvice(params);
  }
}

function parseJsonFromText(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
  }
  return JSON.parse(cleaned);
}

function getFallbackRecipes(ingredients) {
  const ingList = Array.isArray(ingredients) && ingredients.length > 0 ? ingredients : ['Fresh Produce'];
  const primary = ingList[0] || 'Produce';
  const secondary = ingList[1] || '';
  const third = ingList[2] || '';

  const recipeList = [
    {
      name: `Sautéed ${primary} & Seasoned Skillet`,
      time: '15 min',
      difficulty: 'Easy',
      uses: [primary, secondary, 'Olive Oil', 'Garlic', 'Salt'].filter(Boolean),
      icon: '🍳',
      steps: [
        `Dice the fresh ${primary} ${secondary ? 'and ' + secondary : ''} into uniform bite-sized pieces.`,
        'Heat 1 tbsp of olive oil or butter in a skillet over medium heat.',
        `Add minced garlic and sauté ${primary} for 6-8 minutes until tender and fragrant.`,
        'Season with salt, pepper, and serve hot as a zero-waste side dish.'
      ]
    },
    {
      name: `Fresh ${primary} Garden Salad`,
      time: '10 min',
      difficulty: 'Easy',
      uses: [primary, secondary, third, 'Lemon Juice', 'Black Pepper'].filter(Boolean),
      icon: '🥗',
      steps: [
        `Thoroughly wash and slice ${primary} ${secondary ? 'and ' + secondary : ''}.`,
        'Toss gently in a bowl with a drizzle of olive oil, fresh lemon juice, salt, and coarse pepper.',
        'Garnish with fresh herbs or seeds if available and serve chilled.'
      ]
    },
    {
      name: `Zero-Waste ${primary} Warm Soup`,
      time: '25 min',
      difficulty: 'Medium',
      uses: [primary, secondary, 'Vegetable Broth', 'Onion', 'Salt'].filter(Boolean),
      icon: '🍲',
      steps: [
        `Roughly chop ${primary} ${secondary ? 'and ' + secondary : ''}.`,
        'Sauté onions in a pot, add chopped produce and vegetable broth or water.',
        'Simmer for 15-20 minutes until tender, then blend smooth and season to taste.'
      ]
    }
  ];

  return recipeList;
}

async function generateRecipesWithGemini({ ingredients = [], language = 'en' }) {
  if (!ingredients || ingredients.length === 0) {
    return getFallbackRecipes(['Fresh Produce']);
  }

  const ingNames = ingredients.map(i => (typeof i === 'string' ? i : i.foodName || i.name)).filter(Boolean);
  if (ingNames.length === 0) return getFallbackRecipes(['Fresh Produce']);

  if (!process.env.GEMINI_API_KEY) {
    console.warn('[generateRecipesWithGemini] No GEMINI_API_KEY, returning tailored fallback recipes');
    return getFallbackRecipes(ingNames);
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `You are an expert zero-waste AI chef.
The user currently has these active food ingredients in their fridge/pantry: ${ingNames.join(', ')}.

Generate 3 to 4 creative, practical zero-waste recipe ideas specifically centered around using these exact fridge ingredients.

Respond ONLY with a valid JSON array. Do not include markdown tags like \`\`\`json.
JSON structure:
[
  {
    "name": "Recipe Name",
    "time": "15 min",
    "difficulty": "Easy",
    "uses": ["Ingredient 1", "Ingredient 2"],
    "icon": "🍳",
    "steps": ["Step 1", "Step 2", "Step 3"]
  }
]`;

    const result = await model.generateContent([{ text: prompt }]);
    const responseText = result.response.text();
    const recipes = parseJsonFromText(responseText);
    if (Array.isArray(recipes) && recipes.length > 0) {
      return recipes;
    }
    return getFallbackRecipes(ingNames);
  } catch (err) {
    console.warn(`[generateRecipesWithGemini] Gemini error: ${err.message}. Returning tailored fallback recipes.`);
    return getFallbackRecipes(ingNames);
  }
}

module.exports = {
  identifyFoodFromImage,
  explainScan,
  answerFollowUp,
  resolveFoodType,
  isGenericFoodLabel,
  normalizeFoodTypeName,
  publicChatbot,
  buildCombinedAdvisorPrompt,
  explainCombinedAdvisor,
  getMockCombinedAdvisorAdvice,
  generateRecipesWithGemini,
};


