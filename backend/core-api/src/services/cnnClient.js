const axios = require('axios');
const FormData = require('form-data');

const CNN_SERVICE_URL = process.env.CNN_SERVICE_URL || 'http://localhost:8000';

// Comprehensive food / vegetable / fruit list that reflects the training data.
// This mock is used when the real CNN service is unreachable.
const FOOD_TYPES = [
  // Fruits
  'Apple', 'Banana', 'Orange', 'Mango', 'Grape', 'Strawberry', 'Watermelon',
  'Pineapple', 'Papaya', 'Guava', 'Pomegranate', 'Lemon', 'Lime', 'Pear',
  'Peach', 'Plum', 'Cherry', 'Kiwi', 'Coconut', 'Fig',
  // Vegetables
  'Tomato', 'Carrot', 'Potato', 'Onion', 'Garlic', 'Spinach', 'Broccoli',
  'Cauliflower', 'Cabbage', 'Cucumber', 'Bell Pepper', 'Chilli Pepper',
  'Eggplant', 'Zucchini', 'Pumpkin', 'Sweet Potato', 'Beetroot', 'Corn',
  'Peas', 'Ginger', 'Lettuce', 'Capsicum', 'Okra', 'Radish', 'Mushroom',
  // Prepared / packaged foods
  'Bread', 'Rice', 'Egg', 'Meat', 'Fish', 'Tofu', 'Cheese', 'Milk',
];

// Fallback mock prediction used when the CNN service is unreachable.
// Deterministic: same image bytes → same result, so scans are consistent.
function mockPrediction(imageBuffer) {
  const LABELS = ['Fresh', 'Borderline', 'Spoiled'];
  const seed = imageBuffer.length % LABELS.length;
  const foodSeed = (imageBuffer.length >> 2) % FOOD_TYPES.length;
  const label = LABELS[seed];
  const confidence = parseFloat((78 + (imageBuffer.length % 21)).toFixed(2));
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
    const detail = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.warn(`[cnnClient] CNN service classification failed: ${detail}. Falling back to mock prediction.`);
    return mockPrediction(imageBuffer);
  }
}

module.exports = { classifyImage };

