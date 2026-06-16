const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/cnnClient');
jest.mock('../src/services/geminiClient');

const cnnClient = require('../src/services/cnnClient');
const geminiClient = require('../src/services/geminiClient');

describe('Chat API', () => {
  let token;
  let scanId;

  beforeEach(async () => {
    cnnClient.classifyImage.mockResolvedValue({
      foodType: 'Banana',
      label: 'Borderline',
      confidence: 75,
    });
    geminiClient.explainScan.mockResolvedValue('Banana is slightly overripe.');
    geminiClient.answerFollowUp.mockResolvedValue('Store in a cool dry place.');

    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Chatter',
        email: 'chat@test.com',
        password: 'pass1234',
        role: 'consumer',
        language: 'en',
      });
    token = reg.body.token;

    const scan = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('fake'), { filename: 'b.jpg', contentType: 'image/jpeg' });
    scanId = scan.body._id;
  });

  it('POST /api/chat appends messages and returns reply', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ scanId, question: 'How should I store this?', language: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Store in a cool dry place.');
    expect(res.body.chatLogId).toBeDefined();
  });

  it('returns 404 for unknown scanId', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ scanId: '507f1f77bcf86cd799439011', question: 'Test?', language: 'en' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when question missing', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ scanId, language: 'en' });

    expect(res.status).toBe(400);
  });
});
