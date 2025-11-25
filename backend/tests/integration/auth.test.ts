import request from 'supertest';
import app from '../../src/app.js';

describe('Auth API', () => {
  let createdUser: any;

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `testuser_${Date.now()}@example.com`,
        password: 'password123',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('uid');
    createdUser = response.body;
  });

  it('should log in an existing user', async () => {
    // First, sign up a user
    const userEmail = `testuser_${Date.now()}@example.com`;
    const userPassword = 'password123';
    await request(app)
      .post('/api/auth/signup')
      .send({
        email: userEmail,
        password: userPassword,
      });

    // Then, log in with the same credentials
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: userEmail,
        password: userPassword,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
