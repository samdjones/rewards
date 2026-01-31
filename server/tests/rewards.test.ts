import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import {
  getApp,
  registerUser,
  getCookie,
  setupUserWithFamily,
  createChild,
  createTask,
  createReward,
} from './helpers.js';

describe('Rewards API', () => {
  let app: Express;

  beforeEach(() => {
    app = getApp();
  });

  describe('POST /api/rewards', () => {
    it('should create a reward', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/rewards')
        .set('Cookie', cookie)
        .send({
          name: 'Ice Cream',
          description: 'One scoop of ice cream',
          point_cost: 50,
          category: 'treats',
        });

      expect(res.status).toBe(201);
      expect(res.body.reward).toBeDefined();
      expect(res.body.reward.name).toBe('Ice Cream');
      expect(res.body.reward.point_cost).toBe(50);
      expect(res.body.reward.category).toBe('treats');
    });

    it('should return 400 if name is missing', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/rewards')
        .set('Cookie', cookie)
        .send({ point_cost: 50 });

      expect(res.status).toBe(400);
    });

    it('should return 400 if point_cost is missing', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/rewards')
        .set('Cookie', cookie)
        .send({ name: 'Test Reward' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if point_cost is not positive', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/rewards')
        .set('Cookie', cookie)
        .send({ name: 'Test Reward', point_cost: 0 });

      expect(res.status).toBe(400);
    });

    it('should return 403 if user has no family', async () => {
      const registerRes = await registerUser(app);
      const cookie = getCookie(registerRes);

      const res = await request(app)
        .post('/api/rewards')
        .set('Cookie', cookie)
        .send({ name: 'Test Reward', point_cost: 50 });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/rewards', () => {
    it('should list all rewards in family', async () => {
      const { cookie } = await setupUserWithFamily(app);

      await createReward(app, cookie, { name: 'Reward 1', point_cost: 30 });
      await createReward(app, cookie, { name: 'Reward 2', point_cost: 60 });

      const res = await request(app).get('/api/rewards').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.rewards).toHaveLength(2);
    });

    it('should show same rewards to all family members', async () => {
      const { family, cookie: adminCookie } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
      });
      await createReward(app, adminCookie, { name: 'Shared Reward' });

      // Add second parent
      const user2Res = await registerUser(app, { email: 'parent2@example.com' });
      const user2Cookie = getCookie(user2Res);
      await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      const res = await request(app)
        .get('/api/rewards')
        .set('Cookie', user2Cookie);

      expect(res.status).toBe(200);
      expect(res.body.rewards).toHaveLength(1);
      expect(res.body.rewards[0].name).toBe('Shared Reward');
    });

    it('should not show rewards from other families', async () => {
      const { cookie: family1Cookie } = await setupUserWithFamily(app, {
        email: 'family1@example.com',
      });
      await createReward(app, family1Cookie, { name: 'Family1 Reward' });

      const { cookie: family2Cookie } = await setupUserWithFamily(app, {
        email: 'family2@example.com',
      });
      await createReward(app, family2Cookie, { name: 'Family2 Reward' });

      const res = await request(app)
        .get('/api/rewards')
        .set('Cookie', family1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.rewards).toHaveLength(1);
      expect(res.body.rewards[0].name).toBe('Family1 Reward');
    });
  });

  describe('GET /api/rewards/:id', () => {
    it('should get a specific reward', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const rewardRes = await createReward(app, cookie, {
        name: 'My Reward',
        point_cost: 75,
      });
      const rewardId = rewardRes.body.reward.id;

      const res = await request(app)
        .get(`/api/rewards/${rewardId}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.reward.name).toBe('My Reward');
      expect(res.body.reward.point_cost).toBe(75);
    });

    it('should return 404 for reward in different family', async () => {
      const { cookie: family1Cookie } = await setupUserWithFamily(app, {
        email: 'family1@example.com',
      });
      const rewardRes = await createReward(app, family1Cookie, { name: 'Reward' });
      const rewardId = rewardRes.body.reward.id;

      const { cookie: family2Cookie } = await setupUserWithFamily(app, {
        email: 'family2@example.com',
      });

      const res = await request(app)
        .get(`/api/rewards/${rewardId}`)
        .set('Cookie', family2Cookie);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/rewards/:id', () => {
    it('should update a reward', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const rewardRes = await createReward(app, cookie, {
        name: 'Old Name',
        point_cost: 50,
      });
      const rewardId = rewardRes.body.reward.id;

      const res = await request(app)
        .put(`/api/rewards/${rewardId}`)
        .set('Cookie', cookie)
        .send({
          name: 'New Name',
          point_cost: 100,
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.reward.name).toBe('New Name');
      expect(res.body.reward.point_cost).toBe(100);
      expect(res.body.reward.description).toBe('Updated description');
    });

    it('should allow partial updates', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const rewardRes = await createReward(app, cookie, {
        name: 'Reward',
        point_cost: 50,
      });
      const rewardId = rewardRes.body.reward.id;

      const res = await request(app)
        .put(`/api/rewards/${rewardId}`)
        .set('Cookie', cookie)
        .send({ point_cost: 75 });

      expect(res.status).toBe(200);
      expect(res.body.reward.name).toBe('Reward'); // Unchanged
      expect(res.body.reward.point_cost).toBe(75);
    });

    it('should return 400 for non-positive point cost', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const rewardRes = await createReward(app, cookie, {
        name: 'Reward',
        point_cost: 50,
      });
      const rewardId = rewardRes.body.reward.id;

      const res = await request(app)
        .put(`/api/rewards/${rewardId}`)
        .set('Cookie', cookie)
        .send({ point_cost: 0 });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/rewards/:id', () => {
    it('should delete a reward', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const rewardRes = await createReward(app, cookie, {
        name: 'Reward to delete',
      });
      const rewardId = rewardRes.body.reward.id;

      const res = await request(app)
        .delete(`/api/rewards/${rewardId}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);

      // Verify reward is deleted
      const getRes = await request(app)
        .get(`/api/rewards/${rewardId}`)
        .set('Cookie', cookie);
      expect(getRes.status).toBe(404);
    });
  });

  describe('POST /api/rewards/:id/redeem', () => {
    it('should redeem a reward and deduct points from child', async () => {
      const { cookie } = await setupUserWithFamily(app);

      // Create child with points
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      // Give child some points via task completion
      const taskRes = await createTask(app, cookie, {
        name: 'Task',
        point_value: 100,
      });
      await request(app)
        .post(`/api/tasks/${taskRes.body.task.id}/complete`)
        .set('Cookie', cookie)
        .send({ child_id: childId });

      // Create and redeem reward
      const rewardRes = await createReward(app, cookie, {
        name: 'Ice Cream',
        point_cost: 30,
      });
      const rewardId = rewardRes.body.reward.id;

      const res = await request(app)
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Cookie', cookie)
        .send({ child_id: childId, notes: 'Birthday treat' });

      expect(res.status).toBe(200);
      expect(res.body.points_spent).toBe(30);
      expect(res.body.child.current_points).toBe(70); // 100 - 30
    });

    it('should allow multiple redemptions', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      // Give child points
      const taskRes = await createTask(app, cookie, {
        name: 'Task',
        point_value: 100,
      });
      await request(app)
        .post(`/api/tasks/${taskRes.body.task.id}/complete`)
        .set('Cookie', cookie)
        .send({ child_id: childId });

      const rewardRes = await createReward(app, cookie, {
        name: 'Reward',
        point_cost: 20,
      });
      const rewardId = rewardRes.body.reward.id;

      // Redeem twice
      await request(app)
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Cookie', cookie)
        .send({ child_id: childId });

      const res = await request(app)
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Cookie', cookie)
        .send({ child_id: childId });

      expect(res.status).toBe(200);
      expect(res.body.child.current_points).toBe(60); // 100 - 20 - 20
    });

    it('should return 400 if child has insufficient points', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id; // 0 points

      const rewardRes = await createReward(app, cookie, {
        name: 'Expensive',
        point_cost: 100,
      });
      const rewardId = rewardRes.body.reward.id;

      const res = await request(app)
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Cookie', cookie)
        .send({ child_id: childId });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Insufficient');
      expect(res.body.required).toBe(100);
      expect(res.body.available).toBe(0);
    });

    it('should return 400 if child_id is missing', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const rewardRes = await createReward(app, cookie, {
        name: 'Reward',
        point_cost: 50,
      });
      const rewardId = rewardRes.body.reward.id;

      const res = await request(app)
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Cookie', cookie)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent reward', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      const res = await request(app)
        .post('/api/rewards/999/redeem')
        .set('Cookie', cookie)
        .send({ child_id: childId });

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent child', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const rewardRes = await createReward(app, cookie, {
        name: 'Reward',
        point_cost: 50,
      });
      const rewardId = rewardRes.body.reward.id;

      const res = await request(app)
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Cookie', cookie)
        .send({ child_id: 999 });

      expect(res.status).toBe(404);
    });

    it('should return 404 for child in different family', async () => {
      // Create reward in family 1
      const { cookie: family1Cookie } = await setupUserWithFamily(app, {
        email: 'family1@example.com',
      });
      const rewardRes = await createReward(app, family1Cookie, { name: 'Reward' });
      const rewardId = rewardRes.body.reward.id;

      // Create child in family 2
      const { cookie: family2Cookie } = await setupUserWithFamily(app, {
        email: 'family2@example.com',
      });
      const childRes = await createChild(app, family2Cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      // Try to redeem family 1's reward for family 2's child
      const res = await request(app)
        .post(`/api/rewards/${rewardId}/redeem`)
        .set('Cookie', family1Cookie)
        .send({ child_id: childId });

      expect(res.status).toBe(404);
    });
  });
});
