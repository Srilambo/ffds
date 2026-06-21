const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  it('registers a user and returns a JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'consumer',
        language: 'en',
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('returns 409 for duplicate email', async () => {
    // Create first user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'consumer',
        language: 'en',
      });

    // Attempt duplicate
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dup',
        email: 'test@example.com',
        password: 'pass',
        role: 'consumer',
        language: 'en',
      });
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bad',
        email: 'bad@example.com',
        password: 'pass',
        role: 'invalid_role',
        language: 'en',
      });
    expect(res.status).toBe(400);
  });

  it('login returns JWT for correct credentials', async () => {
    // Register first
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'consumer',
        language: 'en',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('login returns 401 for wrong password', async () => {
    // Register first
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'consumer',
        language: 'en',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('/me returns profile with valid token', async () => {
    // Register first to get a fresh token
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'consumer',
        language: 'en',
      });
    const userToken = reg.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
  });

  it('/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
