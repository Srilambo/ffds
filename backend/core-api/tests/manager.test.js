const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/cnnClient');
jest.mock('../src/services/geminiClient');

const cnnClient = require('../src/services/cnnClient');
const geminiClient = require('../src/services/geminiClient');

describe('Manager Dashboard API', () => {
  let managerToken;
  let consumerToken;

  beforeEach(async () => {
    cnnClient.classifyImage.mockResolvedValue({
      foodType: 'Tomato',
      label: 'Spoiled',
      confidence: 88,
    });
    geminiClient.explainScan.mockResolvedValue('Tomato is spoiled.');

    const manager = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Manager',
        email: 'manager@test.com',
        password: 'pass1234',
        role: 'manager',
        language: 'en',
      });
    managerToken = manager.body.token;
    const teamId = manager.body.user.teamId;

    const consumer = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Staff',
        email: 'staff@test.com',
        password: 'pass1234',
        role: 'consumer',
        language: 'en',
      });
    consumerToken = consumer.body.token;

    // Manually assign teamId to consumer via re-register workaround
    const User = require('../src/models/User');
    await User.findOneAndUpdate({ email: 'staff@test.com' }, { teamId });

    await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${consumerToken}`)
      .attach('image', Buffer.from('fake'), { filename: 't.jpg', contentType: 'image/jpeg' });
  });

  it('returns 403 for consumer role', async () => {
    const res = await request(app)
      .get('/api/manager/dashboard')
      .set('Authorization', `Bearer ${consumerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns correct aggregation shape for manager role', async () => {
    const res = await request(app)
      .get('/api/manager/dashboard')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalScans');
    expect(res.body).toHaveProperty('scansByLabel');
    expect(res.body.scansByLabel).toHaveProperty('Fresh');
    expect(res.body.scansByLabel).toHaveProperty('Borderline');
    expect(res.body.scansByLabel).toHaveProperty('Spoiled');
    expect(res.body).toHaveProperty('totalInventoryItems');
    expect(res.body).toHaveProperty('wastedItems');
    expect(res.body).toHaveProperty('wasteRate');
    expect(Array.isArray(res.body.recentScans)).toBe(true);
    expect(Array.isArray(res.body.expiringItems)).toBe(true);
  });
});
