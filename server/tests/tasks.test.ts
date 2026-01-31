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
} from './helpers.js';

describe('Tasks API', () => {
  let app: Express;

  beforeEach(() => {
    app = getApp();
  });

  describe('POST /api/tasks', () => {
    it('should create a task', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookie)
        .send({
          name: 'Clean room',
          description: 'Make your bed and tidy up',
          point_value: 20,
          category: 'chores',
          is_recurring: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.task).toBeDefined();
      expect(res.body.task.name).toBe('Clean room');
      expect(res.body.task.point_value).toBe(20);
      expect(res.body.task.category).toBe('chores');
      expect(res.body.task.is_recurring).toBe(1);
    });

    it('should return 400 if name is missing', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookie)
        .send({ point_value: 10 });

      expect(res.status).toBe(400);
    });

    it('should return 400 if point_value is missing', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookie)
        .send({ name: 'Test Task' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if point_value is negative', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookie)
        .send({ name: 'Test Task', point_value: -10 });

      expect(res.status).toBe(400);
    });

    it('should return 403 if user has no family', async () => {
      const registerRes = await registerUser(app);
      const cookie = getCookie(registerRes);

      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookie)
        .send({ name: 'Test Task', point_value: 10 });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/tasks', () => {
    it('should list all tasks in family', async () => {
      const { cookie } = await setupUserWithFamily(app);

      await createTask(app, cookie, { name: 'Task 1', point_value: 10 });
      await createTask(app, cookie, { name: 'Task 2', point_value: 20 });

      const res = await request(app).get('/api/tasks').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.tasks).toHaveLength(2);
    });

    it('should show same tasks to all family members', async () => {
      const { family, cookie: adminCookie } = await setupUserWithFamily(app, {
        email: 'admin@example.com',
      });
      await createTask(app, adminCookie, { name: 'Shared Task' });

      // Add second parent
      const user2Res = await registerUser(app, { email: 'parent2@example.com' });
      const user2Cookie = getCookie(user2Res);
      await request(app)
        .post('/api/families/join')
        .set('Cookie', user2Cookie)
        .send({ invite_code: family.invite_code });

      const res = await request(app).get('/api/tasks').set('Cookie', user2Cookie);

      expect(res.status).toBe(200);
      expect(res.body.tasks).toHaveLength(1);
      expect(res.body.tasks[0].name).toBe('Shared Task');
    });

    it('should not show tasks from other families', async () => {
      const { cookie: family1Cookie } = await setupUserWithFamily(app, {
        email: 'family1@example.com',
      });
      await createTask(app, family1Cookie, { name: 'Family1 Task' });

      const { cookie: family2Cookie } = await setupUserWithFamily(app, {
        email: 'family2@example.com',
      });
      await createTask(app, family2Cookie, { name: 'Family2 Task' });

      const res = await request(app)
        .get('/api/tasks')
        .set('Cookie', family1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.tasks).toHaveLength(1);
      expect(res.body.tasks[0].name).toBe('Family1 Task');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get a specific task', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const taskRes = await createTask(app, cookie, {
        name: 'My Task',
        point_value: 15,
      });
      const taskId = taskRes.body.task.id;

      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.task.name).toBe('My Task');
      expect(res.body.task.point_value).toBe(15);
    });

    it('should return 404 for task in different family', async () => {
      const { cookie: family1Cookie } = await setupUserWithFamily(app, {
        email: 'family1@example.com',
      });
      const taskRes = await createTask(app, family1Cookie, { name: 'Task' });
      const taskId = taskRes.body.task.id;

      const { cookie: family2Cookie } = await setupUserWithFamily(app, {
        email: 'family2@example.com',
      });

      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Cookie', family2Cookie);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const taskRes = await createTask(app, cookie, {
        name: 'Old Name',
        point_value: 10,
      });
      const taskId = taskRes.body.task.id;

      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Cookie', cookie)
        .send({
          name: 'New Name',
          point_value: 25,
          is_recurring: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.task.name).toBe('New Name');
      expect(res.body.task.point_value).toBe(25);
      expect(res.body.task.is_recurring).toBe(1);
    });

    it('should allow partial updates', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const taskRes = await createTask(app, cookie, {
        name: 'Task',
        point_value: 10,
      });
      const taskId = taskRes.body.task.id;

      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Cookie', cookie)
        .send({ point_value: 50 });

      expect(res.status).toBe(200);
      expect(res.body.task.name).toBe('Task'); // Unchanged
      expect(res.body.task.point_value).toBe(50);
    });

    it('should return 400 for negative point value', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const taskRes = await createTask(app, cookie, {
        name: 'Task',
        point_value: 10,
      });
      const taskId = taskRes.body.task.id;

      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Cookie', cookie)
        .send({ point_value: -5 });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const taskRes = await createTask(app, cookie, { name: 'Task to delete' });
      const taskId = taskRes.body.task.id;

      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);

      // Verify task is deleted
      const getRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Cookie', cookie);
      expect(getRes.status).toBe(404);
    });
  });

  describe('POST /api/tasks/:id/complete', () => {
    it('should complete a task and award points to child', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;
      const taskRes = await createTask(app, cookie, {
        name: 'Homework',
        point_value: 25,
      });
      const taskId = taskRes.body.task.id;

      const res = await request(app)
        .post(`/api/tasks/${taskId}/complete`)
        .set('Cookie', cookie)
        .send({ child_id: childId, notes: 'Great job!' });

      expect(res.status).toBe(200);
      expect(res.body.points_earned).toBe(25);
      expect(res.body.child.current_points).toBe(25);
    });

    it('should accumulate points for multiple completions', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;
      const taskRes = await createTask(app, cookie, {
        name: 'Task',
        point_value: 10,
      });
      const taskId = taskRes.body.task.id;

      // Complete task twice
      await request(app)
        .post(`/api/tasks/${taskId}/complete`)
        .set('Cookie', cookie)
        .send({ child_id: childId });

      const res = await request(app)
        .post(`/api/tasks/${taskId}/complete`)
        .set('Cookie', cookie)
        .send({ child_id: childId });

      expect(res.status).toBe(200);
      expect(res.body.child.current_points).toBe(20);
    });

    it('should return 400 if child_id is missing', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const taskRes = await createTask(app, cookie, {
        name: 'Task',
        point_value: 10,
      });
      const taskId = taskRes.body.task.id;

      const res = await request(app)
        .post(`/api/tasks/${taskId}/complete`)
        .set('Cookie', cookie)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent task', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      const res = await request(app)
        .post('/api/tasks/999/complete')
        .set('Cookie', cookie)
        .send({ child_id: childId });

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent child', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const taskRes = await createTask(app, cookie, {
        name: 'Task',
        point_value: 10,
      });
      const taskId = taskRes.body.task.id;

      const res = await request(app)
        .post(`/api/tasks/${taskId}/complete`)
        .set('Cookie', cookie)
        .send({ child_id: 999 });

      expect(res.status).toBe(404);
    });

    it('should return 404 for child in different family', async () => {
      // Create task in family 1
      const { cookie: family1Cookie } = await setupUserWithFamily(app, {
        email: 'family1@example.com',
      });
      const taskRes = await createTask(app, family1Cookie, { name: 'Task' });
      const taskId = taskRes.body.task.id;

      // Create child in family 2
      const { cookie: family2Cookie } = await setupUserWithFamily(app, {
        email: 'family2@example.com',
      });
      const childRes = await createChild(app, family2Cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;

      // Try to complete family 1's task for family 2's child
      const res = await request(app)
        .post(`/api/tasks/${taskId}/complete`)
        .set('Cookie', family1Cookie)
        .send({ child_id: childId });

      expect(res.status).toBe(404);
    });
  });
});
