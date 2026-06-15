const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL_NAME = 'gemini-2.0-flash';

function buildScanPrompt({ foodType, label, confidence, gasReadings, language, role }) {
  const langInstruction =
    language === 'si'
      ? 'Respond entirely in Sinhala (සිංහල).'
      : 'Respond in English.';

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
    const text = result.response.text();
    return text;
  } catch (err) {
    throw new Error(`Gemini explainScan failed: ${err.message}`);
  }
}

async function answerFollowUp({ scanContext, chatHistory, question, language }) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const langInstruction =
      language === 'si'
        ? 'Respond entirely in Sinhala (සිංහල).'
        : 'Respond in English.';

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

module.exports = { explainScan, answerFollowUp };
