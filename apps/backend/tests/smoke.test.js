import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import prisma from '../src/prisma';

const ADMIN_CREDENTIALS = {
  email: 'admin@restaurante.com',
  password: 'Admin123456',
};

let token;

beforeAll(async () => {
  const res = await request(app).post('/auth/login').send(ADMIN_CREDENTIALS);

  if (res.status !== 200) {
    throw new Error(
      `Login failed (${res.status}): ${JSON.stringify(res.body)}. ` +
        'Check that Docker Postgres is running and seed scripts were applied.'
    );
  }

  token = res.body.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('health', () => {
  it('GET / responds', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});

describe('auth', () => {
  it('POST /auth/login returns token and user for valid credentials', async () => {
    const res = await request(app).post('/auth/login').send(ADMIN_CREDENTIALS);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user.email).toBe(ADMIN_CREDENTIALS.email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('POST /auth/login rejects invalid password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('POST /auth/login requires email and password', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('protected route rejects missing token', async () => {
    const res = await request(app).get('/tables');
    expect(res.status).toBe(401);
  });
});

describe('core resources', () => {
  it('GET /tables returns a list', async () => {
    const res = await request(app)
      .get('/tables')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /orders returns a list', async () => {
    const res = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /products returns a list', async () => {
    const res = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /categories returns a list', async () => {
    const res = await request(app)
      .get('/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /payments returns a list (ADMIN role)', async () => {
    const res = await request(app)
      .get('/payments')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /kitchen/orders returns a list', async () => {
    const res = await request(app)
      .get('/kitchen/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
