import request, { Response } from 'supertest';
import { Express } from 'express';
import { createApp } from '../src/app.js';

// Create app instance for testing
export const getApp = (): Express => createApp();

interface UserData {
  email?: string;
  password?: string;
  name?: string;
}

interface ChildData {
  name?: string;
  age?: number;
  avatar_color?: string;
}

interface TaskData {
  name?: string;
  description?: string;
  point_value?: number;
  category?: string;
  is_recurring?: boolean;
}

interface RewardData {
  name?: string;
  description?: string;
  point_cost?: number;
  category?: string;
}

interface SetupResult {
  user: { id: number; email: string; name: string };
  family: { id: number; name: string; invite_code: string };
  role: string;
  cookie: string;
}

// Helper to register a user and return the response with cookies
export const registerUser = async (
  app: Express,
  userData: UserData = {}
): Promise<Response> => {
  const defaults = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  };

  const data = { ...defaults, ...userData };

  return request(app).post('/api/auth/register').send(data);
};

// Helper to login and return the response with cookies
export const loginUser = async (
  app: Express,
  credentials: { email?: string; password?: string } = {}
): Promise<Response> => {
  const defaults = {
    email: 'test@example.com',
    password: 'password123',
  };

  const data = { ...defaults, ...credentials };

  return request(app).post('/api/auth/login').send(data);
};

// Helper to extract cookie from response
export const getCookie = (res: Response): string => {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return '';
  return Array.isArray(cookies) ? cookies[0] : cookies;
};

// Helper to create a family and return the response
export const createFamily = async (
  app: Express,
  cookie: string,
  name: string = 'Test Family'
): Promise<Response> => {
  return request(app).post('/api/families').set('Cookie', cookie).send({ name });
};

// Helper to register user and create family in one step
export const setupUserWithFamily = async (
  app: Express,
  userData: UserData = {},
  familyName: string = 'Test Family'
): Promise<SetupResult> => {
  const registerRes = await registerUser(app, userData);
  const cookie = getCookie(registerRes);

  const familyRes = await createFamily(app, cookie, familyName);

  return {
    user: registerRes.body.user,
    family: familyRes.body.family,
    role: familyRes.body.role,
    cookie,
  };
};

// Helper to create a child
export const createChild = async (
  app: Express,
  cookie: string,
  childData: ChildData = {}
): Promise<Response> => {
  const defaults = {
    name: 'Test Child',
    age: 8,
    avatar_color: '#3B82F6',
  };

  const data = { ...defaults, ...childData };

  return request(app).post('/api/children').set('Cookie', cookie).send(data);
};

// Helper to create a task
export const createTask = async (
  app: Express,
  cookie: string,
  taskData: TaskData = {}
): Promise<Response> => {
  const defaults = {
    name: 'Test Task',
    description: 'A test task',
    point_value: 10,
    category: 'chores',
  };

  const data = { ...defaults, ...taskData };

  return request(app).post('/api/tasks').set('Cookie', cookie).send(data);
};

// Helper to create a reward
export const createReward = async (
  app: Express,
  cookie: string,
  rewardData: RewardData = {}
): Promise<Response> => {
  const defaults = {
    name: 'Test Reward',
    description: 'A test reward',
    point_cost: 50,
    category: 'treats',
  };

  const data = { ...defaults, ...rewardData };

  return request(app).post('/api/rewards').set('Cookie', cookie).send(data);
};
