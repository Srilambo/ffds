const axios = require('axios');
const FormData = require('form-data');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CNN_SERVICE_URL = process.env.CNN_SERVICE_URL || 'http://localhost:8000';

// ONLY the 10 food classes the CNN model was trained on (Kaggle Fruits & Vegetables Dataset).
const FOOD_TYPES = [
  'Apple', 'Banana', 'Mango', 'Orange', 'Strawberry',
  'Bellpepper', 'Carrot', 'Cucumber', 'Potato', 'Tomato',
];

const DATASET_FOOD_SET = new Set(FOOD_TYPES.map(f => f.toLowerCase()));

// Fallback mock prediction when CNN service is unreachable.
// MUST NOT return random fake food names like "Banana" for carrot images.
function mockPrediction(imageBuffer) {
  const LABELS = ['Fresh', 'Borderline', 'Spoiled'];
  const seed = imageBuffer.length % LABELS.length;
  const label = LABELS[seed];
  const confidence = parseFloat((78 + (imageBuffer.length % 21)).toFixed(2));
  console.warn(`[CNN] Service unreachable at ${CNN_SERVICE_URL} — using fallback prediction`);
  return { foodType: 'Food Item', label, confidence, isMock: true };
}

function tryPythonDirect(imageBuffer) {
  try {
    const cnnDir = path.join(__dirname, '../../../cnn-service');
    const venvPython = path.join(cnnDir, '.venv/Scripts/python.exe');
    if (!fs.existsSync(venvPython)) return null;

    const tmpImg = path.join(__dirname, `../../temp-${Date.now()}.jpg`);
    fs.writeFileSync(tmpImg, imageBuffer);

    const pythonCode = "import sys, json; from app.model import predict; data = open(sys.argv[1], 'rb').read(); print(json.dumps(predict(data)))";
    const cmd = `"${venvPython}" -c "${pythonCode}" "${tmpImg}"`;
    const stdout = execSync(cmd, { cwd: cnnDir, timeout: 25000 }).toString();

    try { fs.unlinkSync(tmpImg); } catch {}

    const jsonMatch = stdout.match(/\{"foodType":.*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const name = parsed.foodType || '';
      if (name && name !== 'Food Item' && DATASET_FOOD_SET.has(name.toLowerCase())) {
        console.log(`[CNN Direct Python] Dataset class: "${name}", label: "${parsed.label}", confidence: ${parsed.confidence}%`);
        return {
          foodType: name,
          label: parsed.label || 'Fresh',
          confidence: parsed.confidence || 92.0,
          isMock: false,
        };
      }
    }
  } catch (err) {
    console.warn('[CNN Direct Python] Direct execution fallback failed:', err.message);
  }
  return null;
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
      timeout: 25000, // 25s timeout for CPU TensorFlow inference
    });

    const { foodType, label, confidence } = response.data;
    // Only accept food names that are valid dataset classes
    const validFoodType = (foodType && DATASET_FOOD_SET.has(foodType.toLowerCase()))
      ? foodType
      : 'Food Item';
    return { foodType: validFoodType, label, confidence, isMock: false };
  } catch (err) {
    const detail = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.warn(`[cnnClient] CNN HTTP failed: ${detail}. Trying direct Python execution...`);

    const pythonResult = tryPythonDirect(imageBuffer);
    if (pythonResult) {
      return pythonResult;
    }

    return mockPrediction(imageBuffer);
  }
}

module.exports = { classifyImage, DATASET_FOOD_SET, FOOD_TYPES };
