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
    it('should create a task with repeat schedule', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookie)
        .send({
          name: 'Clean room',
          description: 'Make your bed and tidy up',
          point_value: 20,
          category: 'chores',
          repeat_schedule: 'weekdays',
        });

      expect(res.status).toBe(201);
      expect(res.body.task).toBeDefined();
      expect(res.body.task.name).toBe('Clean room');
      expect(res.body.task.point_value).toBe(20);
      expect(res.body.task.category).toBe('chores');
      expect(res.body.task.repeat_schedule).toBe('weekdays');
    });

    it('should default to none if no schedule provided', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookie)
        .send({ name: 'One-time task', point_value: 10 });

      expect(res.status).toBe(201);
      expect(res.body.task.repeat_schedule).toBe('none');
    });

    it('should create a task with daily schedule', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookie)
        .send({
          name: 'Daily task',
          point_value: 5,
          repeat_schedule: 'daily',
        });

      expect(res.status).toBe(201);
      expect(res.body.task.repeat_schedule).toBe('daily');
    });

    it('should create a task with weekends schedule', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookie)
        .send({
          name: 'Weekend task',
          point_value: 15,
          repeat_schedule: 'weekends',
        });

      expect(res.status).toBe(201);
      expect(res.body.task.repeat_schedule).toBe('weekends');
    });

    it('should default to none for invalid schedule', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', cookie)
        .send({
          name: 'Task with invalid schedule',
          point_value: 10,
          repeat_schedule: 'invalid',
        });

      expect(res.status).toBe(201);
      expect(res.body.task.repeat_schedule).toBe('none');
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
          repeat_schedule: 'daily',
        });

      expect(res.status).toBe(200);
      expect(res.body.task.name).toBe('New Name');
      expect(res.body.task.point_value).toBe(25);
      expect(res.body.task.repeat_schedule).toBe('daily');
    });

    it('should update repeat schedule', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const taskRes = await createTask(app, cookie, {
        name: 'Task',
        point_value: 10,
      });
      const taskId = taskRes.body.task.id;

      // Default should be 'none'
      expect(taskRes.body.task.repeat_schedule).toBe('none');

      // Update to weekdays
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Cookie', cookie)
        .send({ repeat_schedule: 'weekdays' });

      expect(res.status).toBe(200);
      expect(res.body.task.repeat_schedule).toBe('weekdays');
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

  describe('Task Ordering', () => {
    it('should return tasks in sort_order', async () => {
      const { cookie } = await setupUserWithFamily(app);

      // Create tasks - they should be assigned increasing sort_order
      await createTask(app, cookie, { name: 'Task A', point_value: 10 });
      await createTask(app, cookie, { name: 'Task B', point_value: 10 });
      await createTask(app, cookie, { name: 'Task C', point_value: 10 });

      const res = await request(app).get('/api/tasks').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.tasks).toHaveLength(3);
      // Tasks should be in order A, B, C (by sort_order ASC)
      expect(res.body.tasks[0].name).toBe('Task A');
      expect(res.body.tasks[1].name).toBe('Task B');
      expect(res.body.tasks[2].name).toBe('Task C');
    });

    it('should assign correct sort_order to new tasks', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const task1Res = await createTask(app, cookie, { name: 'First', point_value: 10 });
      const task2Res = await createTask(app, cookie, { name: 'Second', point_value: 10 });
      const task3Res = await createTask(app, cookie, { name: 'Third', point_value: 10 });

      expect(task1Res.body.task.sort_order).toBe(0);
      expect(task2Res.body.task.sort_order).toBe(1);
      expect(task3Res.body.task.sort_order).toBe(2);
    });
  });

  describe('Daily task duplicate prevention', () => {
    it('should prevent completing a daily task twice on the same day', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;
      const taskRes = await createTask(app, cookie, {
        name: 'Daily Task',
        point_value: 10,
        repeat_schedule: 'daily',
      });
      const taskId = taskRes.body.task.id;

      // First completion should succeed
      const res1 = await request(app)
        .post(`/api/tasks/${taskId}/complete`)
        .set('Cookie', cookie)
        .send({ child_id: childId });

      expect(res1.status).toBe(200);

      // Second completion should fail
      const res2 = await request(app)
        .post(`/api/tasks/${taskId}/complete`)
        .set('Cookie', cookie)
        .send({ child_id: childId });

      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('Task already completed for today');
    });

    it('should allow completing non-repeating tasks multiple times', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;
      const taskRes = await createTask(app, cookie, {
        name: 'One-time Task',
        point_value: 10,
        repeat_schedule: 'none',
      });
      const taskId = taskRes.body.task.id;

      // First completion
      const res1 = await request(app)
        .post(`/api/tasks/${taskId}/complete`)
        .set('Cookie', cookie)
        .send({ child_id: childId });

      expect(res1.status).toBe(200);

      // Second completion should also work for non-repeating tasks
      const res2 = await request(app)
        .post(`/api/tasks/${taskId}/complete`)
        .set('Cookie', cookie)
        .send({ child_id: childId });

      expect(res2.status).toBe(200);
      expect(res2.body.child.current_points).toBe(20);
    });
  });

  describe('GET /api/tasks/completions', () => {
    it('should get completions for a specific date', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;
      const taskRes = await createTask(app, cookie, {
        name: 'Task',
        point_value: 10,
      });
      const taskId = taskRes.body.task.id;

      // Complete task
      await request(app)
        .post(`/api/tasks/${taskId}/complete`)
        .set('Cookie', cookie)
        .send({ child_id: childId });

      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/tasks/completions?date=${today}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.completions).toHaveLength(1);
      expect(res.body.completions[0].task_id).toBe(taskId);
      expect(res.body.completions[0].child_id).toBe(childId);
    });

    it('should return empty array for date with no completions', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .get('/api/tasks/completions?date=2020-01-01')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.completions).toHaveLength(0);
    });

    it('should return 400 if date is missing', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .get('/api/tasks/completions')
        .set('Cookie', cookie);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/tasks/:id/complete-for-date', () => {
    it('should complete a task for a specific date', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;
      const taskRes = await createTask(app, cookie, {
        name: 'Task',
        point_value: 15,
      });
      const taskId = taskRes.body.task.id;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const res = await request(app)
        .post(`/api/tasks/${taskId}/complete-for-date`)
        .set('Cookie', cookie)
        .send({ child_id: childId, date: yesterdayStr });

      expect(res.status).toBe(200);
      expect(res.body.points_earned).toBe(15);

      // Verify completion shows up for that date
      const completionsRes = await request(app)
        .get(`/api/tasks/completions?date=${yesterdayStr}`)
        .set('Cookie', cookie);

      expect(completionsRes.body.completions).toHaveLength(1);
    });

    it('should prevent duplicate completions for daily tasks on same date', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;
      const taskRes = await createTask(app, cookie, {
        name: 'Daily Task',
        point_value: 10,
        repeat_schedule: 'daily',
      });
      const taskId = taskRes.body.task.id;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // First completion
      const res1 = await request(app)
        .post(`/api/tasks/${taskId}/complete-for-date`)
        .set('Cookie', cookie)
        .send({ child_id: childId, date: yesterdayStr });

      expect(res1.status).toBe(200);

      // Second completion should fail
      const res2 = await request(app)
        .post(`/api/tasks/${taskId}/complete-for-date`)
        .set('Cookie', cookie)
        .send({ child_id: childId, date: yesterdayStr });

      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('Task already completed for this day');
    });
  });

  describe('POST /api/tasks/:id/uncomplete-for-date', () => {
    it('should uncomplete a task for a specific date', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;
      const taskRes = await createTask(app, cookie, {
        name: 'Task',
        point_value: 15,
      });
      const taskId = taskRes.body.task.id;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Complete the task for yesterday
      await request(app)
        .post(`/api/tasks/${taskId}/complete-for-date`)
        .set('Cookie', cookie)
        .send({ child_id: childId, date: yesterdayStr });

      // Uncomplete it
      const res = await request(app)
        .post(`/api/tasks/${taskId}/uncomplete-for-date`)
        .set('Cookie', cookie)
        .send({ child_id: childId, date: yesterdayStr });

      expect(res.status).toBe(200);

      // Verify completion is gone
      const completionsRes = await request(app)
        .get(`/api/tasks/completions?date=${yesterdayStr}`)
        .set('Cookie', cookie);

      expect(completionsRes.body.completions).toHaveLength(0);
    });

    it('should return 404 if no completion exists for date', async () => {
      const { cookie } = await setupUserWithFamily(app);
      const childRes = await createChild(app, cookie, { name: 'Emma' });
      const childId = childRes.body.child.id;
      const taskRes = await createTask(app, cookie, {
        name: 'Task',
        point_value: 10,
      });
      const taskId = taskRes.body.task.id;

      const res = await request(app)
        .post(`/api/tasks/${taskId}/uncomplete-for-date`)
        .set('Cookie', cookie)
        .send({ child_id: childId, date: '2020-01-01' });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/tasks/reorder', () => {
    it('should reorder tasks', async () => {
      const { cookie } = await setupUserWithFamily(app);

      // Create 3 tasks
      const task1Res = await createTask(app, cookie, { name: 'Task A', point_value: 10 });
      const task2Res = await createTask(app, cookie, { name: 'Task B', point_value: 10 });
      const task3Res = await createTask(app, cookie, { name: 'Task C', point_value: 10 });

      const task1Id = task1Res.body.task.id;
      const task2Id = task2Res.body.task.id;
      const task3Id = task3Res.body.task.id;

      // Reorder: C, A, B
      const res = await request(app)
        .put('/api/tasks/reorder')
        .set('Cookie', cookie)
        .send({ task_ids: [task3Id, task1Id, task2Id] });

      expect(res.status).toBe(200);
      expect(res.body.tasks).toHaveLength(3);
      expect(res.body.tasks[0].name).toBe('Task C');
      expect(res.body.tasks[1].name).toBe('Task A');
      expect(res.body.tasks[2].name).toBe('Task B');
    });

    it('should persist reordered tasks', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const task1Res = await createTask(app, cookie, { name: 'Task A', point_value: 10 });
      const task2Res = await createTask(app, cookie, { name: 'Task B', point_value: 10 });

      // Reorder: B, A
      await request(app)
        .put('/api/tasks/reorder')
        .set('Cookie', cookie)
        .send({ task_ids: [task2Res.body.task.id, task1Res.body.task.id] });

      // Fetch tasks again
      const getRes = await request(app).get('/api/tasks').set('Cookie', cookie);

      expect(getRes.body.tasks[0].name).toBe('Task B');
      expect(getRes.body.tasks[1].name).toBe('Task A');
    });

    it('should return 400 for empty task_ids', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .put('/api/tasks/reorder')
        .set('Cookie', cookie)
        .send({ task_ids: [] });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing task_ids', async () => {
      const { cookie } = await setupUserWithFamily(app);

      const res = await request(app)
        .put('/api/tasks/reorder')
        .set('Cookie', cookie)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 for task IDs from different family', async () => {
      const { cookie: family1Cookie } = await setupUserWithFamily(app, {
        email: 'family1@example.com',
      });
      const task1Res = await createTask(app, family1Cookie, { name: 'Task 1' });

      const { cookie: family2Cookie } = await setupUserWithFamily(app, {
        email: 'family2@example.com',
      });
      const task2Res = await createTask(app, family2Cookie, { name: 'Task 2' });

      // Try to reorder with task from different family
      const res = await request(app)
        .put('/api/tasks/reorder')
        .set('Cookie', family1Cookie)
        .send({ task_ids: [task1Res.body.task.id, task2Res.body.task.id] });

      expect(res.status).toBe(400);
    });
  });
});
