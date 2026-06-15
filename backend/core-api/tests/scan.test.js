const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/cnnClient');
jest.mock('../src/services/geminiClient');

const cnnClient = require('../src/services/cnnClient');
const geminiClient = require('../src/services/geminiClient');

describe('Scan API', () => {
  let token;
  let otherToken;
  let scanId;

  beforeEach(async () => {
    cnnClient.classifyImage.mockResolvedValue({
      foodType: 'Apple',
      label: 'Fresh',
      confidence: 92.5,
    });
    geminiClient.explainScan.mockResolvedValue('This apple looks fresh and safe to eat.');

    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Scanner',
        email: 'scanner@test.com',
        password: 'pass1234',
        role: 'consumer',
        language: 'en',
      });
    token = reg.body.token;

    const other = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Other',
        email: 'other@test.com',
        password: 'pass1234',
        role: 'consumer',
        language: 'en',
      });
    otherToken = other.body.token;
  });

  it('POST /api/scan returns 201 with correct shape', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('fake-image'), {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(res.body.foodType).toBe('Apple');
    expect(res.body.label).toBe('Fresh');
    expect(res.body.confidence).toBe(92.5);
    expect(res.body.gasReadings).toBeDefined();
    expect(res.body.chatbotExplanation).toBeDefined();
    scanId = res.body._id;
  });

  it('POST /api/scan returns 400 without image', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('GET /api/scans returns an array', async () => {
    await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('fake'), { filename: 't.jpg', contentType: 'image/jpeg' });

    const res = await request(app)
      .get('/api/scans')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/scans/:id returns 404 for another user scan', async () => {
    const created = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('fake'), { filename: 't.jpg', contentType: 'image/jpeg' });

    const res = await request(app)
      .get(`/api/scans/${created.body._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
