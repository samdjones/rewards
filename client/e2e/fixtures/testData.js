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
    age: 8
  },
  {
    name: 'Bob',
    age: 10
  },
  {
    name: 'Charlie',
    age: 6
  }
];

export const testTasks = [
  {
    name: 'Make Bed',
    description: 'Make your bed in the morning',
    point_value: 5,
    category: 'Chores',
    repeat_schedule: 'daily'
  },
  {
    name: 'Brush Teeth',
    description: 'Brush teeth twice a day',
    point_value: 3,
    category: 'Hygiene',
    repeat_schedule: 'weekdays'
  },
  {
    name: 'Do Homework',
    description: 'Complete all homework assignments',
    point_value: 10,
    category: 'Homework',
    repeat_schedule: 'none'
  }
];

export const testRewards = [
  {
    name: 'Ice Cream',
    cost: 50,
    description: 'A scoop of your favorite flavor',
    category: 'Treats'
  },
  {
    name: 'Movie Night',
    cost: 100,
    description: 'Pick a movie to watch together',
    category: 'Activities'
  },
  {
    name: 'New Toy',
    cost: 200,
    description: 'Choose a new toy from the store',
    category: 'Toys'
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
