import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import {
  getApp,
  registerUser,
  getCookie,
  setupUserWithFamily,
  createChild,
} from './helpers.js';

describe('Children API', () => {
  let app: Express;

  beforeEach(() => {
    app = getApp();
  });

  describe('POST /api/children', () => {
    it('should create a child', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/children')
        .set('Cookie', cookie)
        .send({
          name: 'Emma',
          age: 8,
          avatar_color: '#FF5733',
        });

      expect(res.status).toBe(201);
      expect(res.body.child).toBeDefined();
      expect(res.body.child.name).toBe('Emma');
      expect(res.body.child.age).toBe(8);
      expect(res.body.child.avatar_color).toBe('#FF5733');
      expect(res.body.child.current_points).toBe(0);
    });

    it('should create a child with default avatar color', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/children')
        .set('Cookie', cookie)
        .send({ name: 'Liam' });

      expect(res.status).toBe(201);
      expect(res.body.child.avatar_color).toBe('#3B82F6');
    });

    it('should return 400 if name is missing', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/children')
        .set('Cookie', cookie)
        .send({ age: 10 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Name');
    });

    it('should return 403 if user has no family', async () => {
      const registerRes = await registerUser(app);
      const cookie = getCookie(registerRes);

      const res = await request(app)
        .post('/api/children')
        .set('Cookie', cookie)
        .send({ name: 'Test Child' });

      expect(res.status).toBe(403);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/children')
        .send({ name: 'Test Child' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/children', () => {
    it('should list all children in family', async () => {
      const { cookie } = await setupUserWithFamily(app);

      // Create some children
      await createChild(app, cookie, { name: 'Emma' });
      await createChild(app, cookie, { name: 'Liam' });

      const res = await request(app).get('/api/children').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.children).toHaveLength(2);
      expect(res.body.children.map((c: { name: string }) => c.name)).toContain(
        'Emma'
      );
      expect(res.body.children.map((c: { name: string }) => c.name)).toContain(
        'Liam'
      );
    });

    it('should return empty array when no children', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app).get('/api/children').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.children).toHaveLength(0);
    });

    it('should show same children to all family members', async () => {
      // Create admin with family and child
      const { family, cookie: adminCookie } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
      });
      await createChild(app, adminCookie, { name: 'Shared Child' });

      // Add second parent
      const user2Res = await registerUser(app, { email: 'parent2@example.com' });
      const user2Cookie = getCookie(user2Res);
      await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      // Second parent should see the child
      const res = await request(app)
        .get('/api/children')
        .set('Cookie', user2Cookie);

      expect(res.status).toBe(200);
      expect(res.body.children).toHaveLength(1);
      expect(res.body.children[0].name).toBe('Shared Child');
    });

    it('should not show children from other families', async () => {
      // Create first family with child
      const { cookie: family1Cookie } = await setupUserWithFamily(
        app,
        {
          email: 'family1@example.com',
        },
        'Family 1'
      );
      await createChild(app, family1Cookie, { name: 'Family1 Child' });

      // Create second family with child
      const { cookie: family2Cookie } = await setupUserWithFamily(
        app,
        {
          email: 'family2@example.com',
        },
        'Family 2'
      );
      await createChild(app, family2Cookie, { name: 'Family2 Child' });

      // Family 1 should only see their child
      const res = await request(app)
        .get('/api/children')
        .set('Cookie', family1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.children).toHaveLength(1);
      expect(res.body.children[0].name).toBe('Family1 Child');
    });
  });

  describe('GET /api/children/:id', () => {
    it('should get a specific child', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma', age: 8 });
      const childId = childRes.body.child.id;

      const res = await request(app)
        .get(`/api/children/${childId}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.child.name).toBe('Emma');
      expect(res.body.child.age).toBe(8);
    });

    it('should return 404 for non-existent child', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .get('/api/children/999')
        .set('Cookie', cookie);

      expect(res.status).toBe(404);
    });

    it('should return 404 for child in different family', async () => {
      // Create child in family 1
      const { cookie: family1Cookie } = await setupUserWithFamily(app, {
        email: 'family1@example.com',
      });
      const childRes = await createChild(app, family1Cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      // Try to access from family 2
      const { cookie: family2Cookie } = await setupUserWithFamily(app, {
        email: 'family2@example.com',
      });

      const res = await request(app)
        .get(`/api/children/${childId}`)
        .set('Cookie', family2Cookie);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/children/:id', () => {
    it('should update a child', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma', age: 8 });
      const childId = childRes.body.child.id;

      const res = await request(app)
        .put(`/api/children/${childId}`)
        .set('Cookie', cookie)
        .send({
          name: 'Emma Updated',
          age: 9,
          avatar_color: '#00FF00',
        });

      expect(res.status).toBe(200);
      expect(res.body.child.name).toBe('Emma Updated');
      expect(res.body.child.age).toBe(9);
      expect(res.body.child.avatar_color).toBe('#00FF00');
    });

    it('should allow partial updates', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma', age: 8 });
      const childId = childRes.body.child.id;

      const res = await request(app)
        .put(`/api/children/${childId}`)
        .set('Cookie', cookie)
        .send({ age: 9 });

      expect(res.status).toBe(200);
      expect(res.body.child.name).toBe('Emma'); // Unchanged
      expect(res.body.child.age).toBe(9);
    });

    it('should return 404 for child in different family', async () => {
      const { cookie: family1Cookie } = await setupUserWithFamily(app, {
        email: 'family1@example.com',
      });
      const childRes = await createChild(app, family1Cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      const { cookie: family2Cookie } = await setupUserWithFamily(app, {
        email: 'family2@example.com',
      });

      const res = await request(app)
        .put(`/api/children/${childId}`)
        .set('Cookie', family2Cookie)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/children/:id', () => {
    it('should delete a child', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      const res = await request(app)
        .delete(`/api/children/${childId}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);

      // Verify child is deleted
      const getRes = await request(app)
        .get(`/api/children/${childId}`)
        .set('Cookie', cookie);
      expect(getRes.status).toBe(404);
    });

    it('should return 404 for child in different family', async () => {
      const { cookie: family1Cookie } = await setupUserWithFamily(app, {
        email: 'family1@example.com',
      });
      const childRes = await createChild(app, family1Cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      const { cookie: family2Cookie } = await setupUserWithFamily(app, {
        email: 'family2@example.com',
      });

      const res = await request(app)
        .delete(`/api/children/${childId}`)
        .set('Cookie', family2Cookie);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/children/:id/adjust-points', () => {
    it('should add points to a child', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      const res = await request(app)
        .post(`/api/children/${childId}/adjust-points`)
        .set('Cookie', cookie)
        .send({ amount: 50, reason: 'Bonus points' });

      expect(res.status).toBe(200);
      expect(res.body.child.current_points).toBe(50);
    });

    it('should subtract points from a child', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      // Add some points first
      await request(app)
        .post(`/api/children/${childId}/adjust-points`)
        .set('Cookie', cookie)
        .send({ amount: 100, reason: 'Initial points' });

      // Subtract points
      const res = await request(app)
        .post(`/api/children/${childId}/adjust-points`)
        .set('Cookie', cookie)
        .send({ amount: -30, reason: 'Penalty' });

      expect(res.status).toBe(200);
      expect(res.body.child.current_points).toBe(70);
    });

    it('should return 400 if amount is zero', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      const res = await request(app)
        .post(`/api/children/${childId}/adjust-points`)
        .set('Cookie', cookie)
        .send({ amount: 0, reason: 'No change' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if amount is missing', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      const res = await request(app)
        .post(`/api/children/${childId}/adjust-points`)
        .set('Cookie', cookie)
        .send({ reason: 'No amount' });

      expect(res.status).toBe(400);
    });
  });
});
