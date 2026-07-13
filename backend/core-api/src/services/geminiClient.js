const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL_NAME = 'gemini-2.0-flash';

// These are generic labels the CNN fallback returns when no real model is loaded
const GENERIC_FOOD_LABELS = ['detected item', 'food item', 'unknown', 'fresh', 'borderline', 'spoiled', ''];

/**
 * Use Gemini vision to identify the real food in the uploaded image.
 * Called when the CNN fallback returns a generic label like "Detected Item".
 * Returns a plain string e.g. "Apple", "Banana", "Tomato".
 */
async function identifyFoodFromImage(imageBuffer, mimeType) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent([
      `You are a food recognition expert. Carefully examine this image and identify the single food item shown.

Look closely at:
- The shape (round, elongated, irregular)
- The size cues in the image
- The colour (inside and outside if visible)
- The texture and surface (smooth skin, rough skin, leafy)
- Any distinctive features (seeds visible, stem, leaves attached)

Common foods to consider: Apple, Banana, Orange, Mango, Strawberry, Tomato, Carrot, Cucumber, Broccoli, Potato, Onion, Lemon, Grape, Watermelon, Pineapple, Avocado, Bell Pepper, Pear, Peach, Plum, Cherry, Blueberry, Lettuce, Spinach, Corn, Garlic.

IMPORTANT: Reply with ONLY the single food item name in English. Do not add any other words, punctuation, or explanation.`,
      {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBuffer.toString('base64'),
        },
      },
    ]);
    const identified = result.response.text().trim().replace(/[^a-zA-Z\s]/g, '').trim();
    // Take only the first word/two words in case Gemini returns extra text
    const words = identified.split(/\s+/).slice(0, 2).join(' ');
    return words || 'Food Item';
  } catch (err) {
    console.error('Gemini identifyFoodFromImage failed:', err.message);
    return 'Food Item';
  }
}

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

Provide a concise explanation of why the food appears ${label}, health considerations, and storage/usage advice. Keep the response under 120 words.`;
}

/**
 * Generate a chatbot explanation for a scan result.
 * Returns { text, foodType } where foodType is the Gemini-identified food name
 * if the CNN returned a generic label.
 */
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
    const isGeneric = GENERIC_FOOD_LABELS.includes((foodType || '').toLowerCase().trim());
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
    throw new Error(`Gemini explainScan failed: ${err.message}`);
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
    throw new Error(`Gemini answerFollowUp failed: ${err.message}`);
  }
}

module.exports = { identifyFoodFromImage, explainScan, answerFollowUp };
