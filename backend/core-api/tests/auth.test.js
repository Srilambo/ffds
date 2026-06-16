const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  let token;

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
    token = res.body.token;
  });

  it('returns 409 for duplicate email', async () => {
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
        role: 'admin',
        language: 'en',
      });
    expect(res.status).toBe(400);
  });

  it('login returns JWT for correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('login returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('/me returns profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
  });

  it('/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
