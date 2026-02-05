import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import {
  getApp,
  registerUser,
  getCookie,
  setupUserWithFamily,
} from './helpers.js';

describe('Families API', () => {
  let app: Express;

  beforeEach(() => {
    app = getApp();
  });

  describe('POST /api/families', () => {
    it('should create a new family', async () => {
      const registerRes = await registerUser(app);
      const cookie = getCookie(registerRes);

      const res = await request(app)
        .post('/api/families')
        .set('Cookie', cookie)
        .send({ name: 'Smith Family' });

      expect(res.status).toBe(201);
      expect(res.body.family).toBeDefined();
      expect(res.body.family.name).toBe('Smith Family');
      expect(res.body.family.invite_code).toBeDefined();
      expect(res.body.family.invite_code).toHaveLength(8);
      expect(res.body.role).toBe('admin');
    });

    it('should return 400 if name is missing', async () => {
      const registerRes = await registerUser(app);
      const cookie = getCookie(registerRes);

      const res = await request(app)
        .post('/api/families')
        .set('Cookie', cookie)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('name');
    });

    it('should return 400 if user already has a family', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/families')
        .set('Cookie', cookie)
        .send({ name: 'Another Family' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already belong');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/families')
        .send({ name: 'Test Family' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/families/current', () => {
    it('should return current family info', async () => {
      const { cookie } = await setupUserWithFamily(app, {}, 'My Family');

      const res = await request(app)
        .get('/api/families/current')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.family).toBeDefined();
      expect(res.body.family.name).toBe('My Family');
      expect(res.body.family.member_count).toBe(1);
      expect(res.body.role).toBe('admin');
    });

    it('should return null family when user has no family', async () => {
      const registerRes = await registerUser(app);
      const cookie = getCookie(registerRes);

      const res = await request(app)
        .get('/api/families/current')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.family).toBeNull();
    });
  });

  describe('POST /api/families/join', () => {
    it('should join a family via invite code', async () => {
      // Create first user with family
      const { family } = await setupUserWithFamily(
        app,
        {
          email: 'admin@example.com',
        },
        'Test Family'
      );

      // Create second user without family
      const user2Res = await registerUser(app, { email: 'user2@example.com' });
      const user2Cookie = getCookie(user2Res);

      // Join the family
      const res = await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      expect(res.status).toBe(200);
      expect(res.body.family).toBeDefined();
      expect(res.body.family.name).toBe('Test Family');
      expect(res.body.role).toBe('member'); // Not admin
    });

    it('should return 400 for invalid invite code format', async () => {
      const registerRes = await registerUser(app);
      const cookie = getCookie(registerRes);

      const res = await request(app)
        .post('/api/families/join')
        .set('Cookie', cookie)
        .send({ invite_code: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent invite code', async () => {
      const registerRes = await registerUser(app);
      const cookie = getCookie(registerRes);

      // Use a valid format code that doesn't exist (no 0,1,I,L,O chars)
      const res = await request(app)
        .post('/api/families/join')
        .set('Cookie', cookie)
        .send({ invite_code: 'ABCD2345' });

      expect(res.status).toBe(404);
    });

    it('should return 400 if user already has a family', async () => {
      // Create first user with family
      const { family, cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/families/join')
        .set('Cookie', cookie)
        .send({ invite_code: family.invite_code });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already belong');
    });
  });

  describe('POST /api/families/leave', () => {
    it('should allow member to leave family', async () => {
      // Create admin with family
      const { family } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
      });

      // Create and add second user
      const user2Res = await registerUser(app, { email: 'user2@example.com' });
      const user2Cookie = getCookie(user2Res);
      await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      // Second user leaves
      const res = await request(app)
        .post('/api/families/leave')
        .set('Cookie', user2Cookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('left');

      // Verify user no longer has family
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', user2Cookie);
      expect(meRes.body.user.family).toBeNull();
    });

    it('should prevent last admin from leaving without promoting someone', async () => {
      // Create admin with family
      const { family, cookie: adminCookie } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
      });

      // Add second user as member
      const user2Res = await registerUser(app, { email: 'user2@example.com' });
      const user2Cookie = getCookie(user2Res);
      await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      // Admin tries to leave
      const res = await request(app)
        .post('/api/families/leave')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('last admin');
    });

    it('should delete family when last member leaves', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/families/leave')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });

    it('should return 403 if user has no family', async () => {
      const registerRes = await registerUser(app);
      const cookie = getCookie(registerRes);

      const res = await request(app)
        .post('/api/families/leave')
        .set('Cookie', cookie);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/families/current/members', () => {
    it('should list all family members', async () => {
      // Create admin with family
      const {
        family,
        cookie: adminCookie,
      } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
        name: 'Admin User',
      });

      // Add second user
      const user2Res = await registerUser(app, {
        email: 'user2@example.com',
        name: 'Second User',
      });
      const user2Cookie = getCookie(user2Res);
      await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      // Get members
      const res = await request(app)
        .get('/api/families/current/members')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.members).toHaveLength(2);
      expect(res.body.members.map((m: { name: string }) => m.name)).toContain(
        'Admin User'
      );
      expect(res.body.members.map((m: { name: string }) => m.name)).toContain(
        'Second User'
      );
    });
  });

  describe('PUT /api/families/current/members/:userId/role', () => {
    it('should allow admin to promote member to admin', async () => {
      const { family, cookie: adminCookie } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
      });

      // Add second user
      const user2Res = await registerUser(app, { email: 'user2@example.com' });
      const user2Cookie = getCookie(user2Res);
      await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      const user2Id = user2Res.body.user.id;

      // Promote to admin
      const res = await request(app)
        .put(`/api/families/current/members/${user2Id}/role`)
        .set('Cookie', adminCookie)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('admin');
    });

    it('should prevent non-admin from changing roles', async () => {
      const {
        family,
        user: adminUser,
      } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
      });

      // Add second user
      const user2Res = await registerUser(app, { email: 'user2@example.com' });
      const user2Cookie = getCookie(user2Res);
      await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      // Member tries to demote admin
      const res = await request(app)
        .put(`/api/families/current/members/${adminUser.id}/role`)
        .set('Cookie', user2Cookie)
        .send({ role: 'member' });

      expect(res.status).toBe(403);
    });

    it('should prevent last admin from demoting self', async () => {
      const { cookie, user } = await setupUserWithFamily(app);

      const res = await request(app)
        .put(`/api/families/current/members/${user.id}/role`)
        .set('Cookie', cookie)
        .send({ role: 'member' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('only admin');
    });
  });

  describe('DELETE /api/families/current/members/:userId', () => {
    it('should allow admin to remove member', async () => {
      const { family, cookie: adminCookie } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
      });

      // Add second user
      const user2Res = await registerUser(app, { email: 'user2@example.com' });
      const user2Cookie = getCookie(user2Res);
      await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      const user2Id = user2Res.body.user.id;

      // Remove member
      const res = await request(app)
        .delete(`/api/families/current/members/${user2Id}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);

      // Verify member count
      const membersRes = await request(app)
        .get('/api/families/current/members')
        .set('Cookie', adminCookie);
      expect(membersRes.body.members).toHaveLength(1);
    });

    it('should prevent admin from removing self', async () => {
      const { cookie, user } = await setupUserWithFamily(app);

      const res = await request(app)
        .delete(`/api/families/current/members/${user.id}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cannot remove yourself');
    });
  });

  describe('GET /api/families/current/invite-code', () => {
    it('should return invite code for admin', async () => {
      const { cookie, family } = await setupUserWithFamily(app);

      const res = await request(app)
        .get('/api/families/current/invite-code')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.invite_code).toBe(family.invite_code);
    });

    it('should deny access for non-admin', async () => {
      const { family } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
      });

      // Add second user as member
      const user2Res = await registerUser(app, { email: 'user2@example.com' });
      const user2Cookie = getCookie(user2Res);
      await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      const res = await request(app)
        .get('/api/families/current/invite-code')
        .set('Cookie', user2Cookie);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/families/current/invite-code/regenerate', () => {
    it('should generate new invite code', async () => {
      const { cookie, family } = await setupUserWithFamily(app);
      const oldCode = family.invite_code;

      const res = await request(app)
        .post('/api/families/current/invite-code/regenerate')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.invite_code).toBeDefined();
      expect(res.body.invite_code).not.toBe(oldCode);
      expect(res.body.invite_code).toHaveLength(8);
    });

    it('should invalidate old invite code', async () => {
      const { cookie, family } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
      });
      const oldCode = family.invite_code;

      // Regenerate code
      await request(app)
        .post('/api/families/current/invite-code/regenerate')
        .set('Cookie', cookie);

      // New user tries to join with old code
      const user2Res = await registerUser(app, { email: 'user2@example.com' });
      const user2Cookie = getCookie(user2Res);

      const joinRes = await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: oldCode });

      expect(joinRes.status).toBe(404);
    });
  });

  describe('PUT /api/families/current', () => {
    it('should update family name', async () => {
      const { cookie } = await setupUserWithFamily(app, {}, 'Old Name');

      const res = await request(app)
        .put('/api/families/current')
        .set('Cookie', cookie)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.family.name).toBe('New Name');
    });

    it('should deny access for non-admin', async () => {
      const { family } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
      });

      // Add member
      const user2Res = await registerUser(app, { email: 'user2@example.com' });
      const user2Cookie = getCookie(user2Res);
      await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      const res = await request(app)
        .put('/api/families/current')
        .set('Cookie', user2Cookie)
        .send({ name: 'New Name' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/families/current', () => {
    it('should delete family', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .delete('/api/families/current')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);

      // Verify family is gone
      const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);
      expect(meRes.body.user.family).toBeNull();
    });

    it('should deny access for non-admin', async () => {
      const { family } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
      });

      // Add member
      const user2Res = await registerUser(app, { email: 'user2@example.com' });
      const user2Cookie = getCookie(user2Res);
      await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      const res = await request(app)
        .delete('/api/families/current')
        .set('Cookie', user2Cookie);

      expect(res.status).toBe(403);
    });
  });
});
