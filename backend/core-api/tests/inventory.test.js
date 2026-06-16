const request = require('supertest');
const app = require('../src/app');

describe('Inventory API', () => {
  let token;
  let otherToken;
  let itemId;

  beforeEach(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Inv User',
        email: 'inv@test.com',
        password: 'pass1234',
        role: 'consumer',
        language: 'en',
      });
    token = reg.body.token;

    const other = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Other Inv',
        email: 'invother@test.com',
        password: 'pass1234',
        role: 'consumer',
        language: 'en',
      });
    otherToken = other.body.token;
  });

  it('creates inventory item', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${token}`)
      .send({
        foodName: 'Apple',
        category: 'fruit',
        quantity: 5,
        unit: 'pcs',
        purchaseDate: new Date().toISOString(),
        expiryDate: tomorrow.toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.foodName).toBe('Apple');
    itemId = res.body._id;
  });

  it('lists inventory items', async () => {
    const res = await request(app)
      .get('/api/inventory')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('updates inventory item', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const created = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${token}`)
      .send({
        foodName: 'Milk',
        category: 'dairy',
        quantity: 1,
        unit: 'L',
        purchaseDate: new Date().toISOString(),
        expiryDate: tomorrow.toISOString(),
      });

    const res = await request(app)
      .put(`/api/inventory/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 2, status: 'consumed' });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(2);
    expect(res.body.status).toBe('consumed');
  });

  it('deletes inventory item', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 5);

    const created = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${token}`)
      .send({
        foodName: 'Bread',
        category: 'bakery',
        quantity: 1,
        unit: 'loaf',
        purchaseDate: new Date().toISOString(),
        expiryDate: tomorrow.toISOString(),
      });

    const res = await request(app)
      .delete(`/api/inventory/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('/expiring returns only items within 2 days', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${token}`)
      .send({
        foodName: 'Soon',
        category: 'fruit',
        quantity: 1,
        unit: 'kg',
        purchaseDate: new Date().toISOString(),
        expiryDate: tomorrow.toISOString(),
        status: 'active',
      });

    await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${token}`)
      .send({
        foodName: 'Later',
        category: 'fruit',
        quantity: 1,
        unit: 'kg',
        purchaseDate: new Date().toISOString(),
        expiryDate: nextWeek.toISOString(),
        status: 'active',
      });

    const res = await request(app)
      .get('/api/inventory/expiring')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.every((i) => i.foodName !== 'Later' || i.expiryDate <= tomorrow)).toBeTruthy();
    expect(res.body.some((i) => i.foodName === 'Soon')).toBe(true);
  });

  it('consumer cannot update another user item (403)', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);

    const created = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${token}`)
      .send({
        foodName: 'Private',
        category: 'other',
        quantity: 1,
        unit: 'pcs',
        purchaseDate: new Date().toISOString(),
        expiryDate: tomorrow.toISOString(),
      });

    const res = await request(app)
      .put(`/api/inventory/${created.body._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ quantity: 99 });

    expect(res.status).toBe(403);
  });
});
