import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import {
  getApp,
  registerUser,
  getCookie,
  setupUserWithFamily,
} from './helpers.js';

describe('Auth API', () => {
  let app: Express;

  beforeEach(() => {
    app = getApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('newuser@example.com');
      expect(res.body.user.name).toBe('New User');
      expect(res.body.user.password_hash).toBeUndefined(); // Should not expose password
      expect(res.headers['set-cookie']).toBeDefined(); // Should set auth cookie
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app).post('/api/auth/register').send({
        password: 'password123',
        name: 'Test User',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 if email already exists', async () => {
      // Register first user
      await registerUser(app, { email: 'duplicate@example.com' });

      // Try to register with same email
      const res = await request(app).post('/api/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password456',
        name: 'Another User',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user to login with
      await registerUser(app, {
        email: 'login@example.com',
        password: 'password123',
        name: 'Login User',
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('login@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app).post('/api/auth/login').send({
        password: 'password123',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and clear cookie', async () => {
      // First login
      const loginRes = await registerUser(app);
      const cookie = getCookie(loginRes);

      // Then logout
      const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Logged out');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const registerRes = await registerUser(app, {
        email: 'me@example.com',
        name: 'Me User',
      });
      const cookie = getCookie(registerRes);

      const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('me@example.com');
      expect(res.body.user.name).toBe('Me User');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should include family info when user has a family', async () => {
      const { cookie } = await setupUserWithFamily(
        app,
        {
          email: 'family@example.com',
          name: 'Family User',
        },
        'My Family'
      );

      const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.user.family).toBeDefined();
      expect(res.body.user.family.name).toBe('My Family');
      expect(res.body.user.family.role).toBe('admin');
    });

    it('should return null family when user has no family', async () => {
      const registerRes = await registerUser(app);
      const cookie = getCookie(registerRes);

      const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.user.family).toBeNull();
    });
  });
});
