/**
 * Reusable test data for E2E tests
 */

export const validUser = {
  name: 'John Doe',
  password: 'password123'
};

export const invalidCredentials = {
  email: 'invalid@example.com',
  password: 'wrongpassword'
};

export const testFamily = {
  name: 'Smith Family'
};

export const testKids = [
  {
    name: 'Alice',
    pointsPerTask: 10
  },
  {
    name: 'Bob',
    pointsPerTask: 15
  },
  {
    name: 'Charlie',
    pointsPerTask: 20
  }
];

export const testTasks = [
  {
    name: 'Make Bed',
    description: 'Make your bed in the morning'
  },
  {
    name: 'Brush Teeth',
    description: 'Brush teeth twice a day'
  },
  {
    name: 'Do Homework',
    description: 'Complete all homework assignments'
  }
];

export const testRewards = [
  {
    name: 'Ice Cream',
    cost: 50
  },
  {
    name: 'Movie Night',
    cost: 100
  },
  {
    name: 'New Toy',
    cost: 200
  }
];

/**
 * Generate unique email for test
 */
export function generateTestEmail() {
  return `test-${Date.now()}@example.com`;
}

/**
 * Generate unique family name for test
 */
export function generateFamilyName() {
  return `Test Family ${Date.now()}`;
}
