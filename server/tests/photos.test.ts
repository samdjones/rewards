import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { getApp, setupUserWithFamily } from './helpers.js';

describe('Photos API', () => {
  let app: Express;
  let cookie: string;

  beforeEach(async () => {
    app = getApp();
    const setup = await setupUserWithFamily(app);
    cookie = setup.cookie;
  });

  describe('Slideshow Settings', () => {
    it('should update slideshow mode', async () => {
      const res = await request(app)
        .put('/api/families/current/slideshow-settings')
        .set('Cookie', cookie)
        .send({ slideshow_mode: 'dedicated' });

      expect(res.status).toBe(200);
      expect(res.body.slideshow_mode).toBe('dedicated');
    });

    it('should update slideshow interval', async () => {
      const res = await request(app)
        .put('/api/families/current/slideshow-settings')
        .set('Cookie', cookie)
        .send({ slideshow_interval: 60 });

      expect(res.status).toBe(200);
      expect(res.body.slideshow_interval).toBe(60);
    });

    it('should reject invalid slideshow mode', async () => {
      const res = await request(app)
        .put('/api/families/current/slideshow-settings')
        .set('Cookie', cookie)
        .send({ slideshow_mode: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('should reject interval out of range', async () => {
      const res = await request(app)
        .put('/api/families/current/slideshow-settings')
        .set('Cookie', cookie)
        .send({ slideshow_interval: 1 });

      expect(res.status).toBe(400);
    });

    it('should reject interval over 300', async () => {
      const res = await request(app)
        .put('/api/families/current/slideshow-settings')
        .set('Cookie', cookie)
        .send({ slideshow_interval: 500 });

      expect(res.status).toBe(400);
    });
  });

  describe('Photo CRUD', () => {
    // Create a minimal valid PNG (1x1 pixel)
    const minimalPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    it('should upload a photo', async () => {
      const res = await request(app)
        .post('/api/uploads/families/current/photos')
        .set('Cookie', cookie)
        .attach('image', minimalPng, 'test.png');

      expect(res.status).toBe(201);
      expect(res.body.photo).toBeDefined();
      expect(res.body.photo.image_data).toMatch(/^data:image\/webp;base64,/);
    });

    it('should list photos', async () => {
      // Upload a photo first
      await request(app)
        .post('/api/uploads/families/current/photos')
        .set('Cookie', cookie)
        .attach('image', minimalPng, 'test.png');

      const res = await request(app)
        .get('/api/uploads/families/current/photos')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.photos).toHaveLength(1);
    });

    it('should delete a photo', async () => {
      // Upload a photo first
      const uploadRes = await request(app)
        .post('/api/uploads/families/current/photos')
        .set('Cookie', cookie)
        .attach('image', minimalPng, 'test.png');

      const photoId = uploadRes.body.photo.id;

      const res = await request(app)
        .delete(`/api/uploads/families/current/photos/${photoId}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);

      // Verify deleted
      const listRes = await request(app)
        .get('/api/uploads/families/current/photos')
        .set('Cookie', cookie);

      expect(listRes.body.photos).toHaveLength(0);
    });

    it('should upload photo with caption', async () => {
      const res = await request(app)
        .post('/api/uploads/families/current/photos')
        .set('Cookie', cookie)
        .field('caption', 'Summer vacation')
        .attach('image', minimalPng, 'test.png');

      expect(res.status).toBe(201);
      expect(res.body.photo.caption).toBe('Summer vacation');
    });

    it('should return 404 for deleting non-existent photo', async () => {
      const res = await request(app)
        .delete('/api/uploads/families/current/photos/9999')
        .set('Cookie', cookie);

      expect(res.status).toBe(404);
    });
  });
});
