const axios = require('axios');
const FormData = require('form-data');

const CNN_SERVICE_URL = process.env.CNN_SERVICE_URL || 'http://localhost:8000';

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
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw new Error(`CNN service unreachable at ${CNN_SERVICE_URL}`);
    }
    throw new Error(`CNN classification failed: ${err.message}`);
  }
}

module.exports = { classifyImage };
