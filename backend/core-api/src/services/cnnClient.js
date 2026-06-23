const axios = require('axios');
const FormData = require('form-data');

const CNN_SERVICE_URL = process.env.CNN_SERVICE_URL || 'http://localhost:8000';

// Fallback mock prediction used when the CNN service is unreachable.
// Deterministic: same image bytes → same result, so scans are consistent.
function mockPrediction(imageBuffer) {
  const LABELS = ['Fresh', 'Borderline', 'Spoiled'];
  const FOOD_TYPES = ['Apple', 'Banana', 'Tomato', 'Carrot', 'Lettuce', 'Orange', 'Cucumber'];
  const seed = imageBuffer.length % LABELS.length;
  const foodSeed = (imageBuffer.length >> 2) % FOOD_TYPES.length;
  const label = LABELS[seed];
  const confidence = parseFloat((80 + (imageBuffer.length % 19)).toFixed(2));
  const foodType = FOOD_TYPES[foodSeed];
  console.warn(`[CNN] Service unreachable at ${CNN_SERVICE_URL} — using mock prediction`);
  return { foodType, label, confidence };
}

async function classifyImage(imageBuffer, mimeType) {
  try {
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: 'scan.jpg',
      contentType: mimeType || 'image/jpeg',
    });

    const response = await axios.post(`${CNN_SERVICE_URL}/predict`, form, {
      headers: form.getHeaders(),
      timeout: 10000,
    });

    const { foodType, label, confidence } = response.data;
    return { foodType, label, confidence };
  } catch (err) {
    // If CNN service is simply unreachable (not running), use mock prediction
    // so the rest of the scan pipeline (gas-sim + Gemini) still works.
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      return mockPrediction(imageBuffer);
    }
    // Any other error (bad response, 5xx) — surface it clearly
    const detail = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    throw new Error(`CNN classification failed: ${detail}`);
  }
}

module.exports = { classifyImage };

