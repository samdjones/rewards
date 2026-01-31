# Testing Guide

This guide covers both automated and manual testing of the application.

## Automated Tests

The server includes comprehensive automated tests using Vitest and Supertest.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with verbose output
npm test -- --reporter=verbose

# Run specific test file
npm test -- tests/auth.test.ts

# Run tests matching a pattern
npm test -- -t "should create a new family"
```

### Test Coverage

| Test File | Tests | Description |
|-----------|-------|-------------|
| auth.test.ts | 15 | Registration, login, logout, session |
| families.test.ts | 28 | Create, join, leave, members, invite codes |
| children.test.ts | 21 | CRUD, points, family isolation |
| tasks.test.ts | 20 | CRUD, completion, point awards |
| rewards.test.ts | 21 | CRUD, redemption, point validation |
| **Total** | **105** | |

### Test Categories

#### Authentication Tests
- User registration with validation
- Login with valid/invalid credentials
- Logout and cookie clearing
- Session retrieval (/me endpoint)
- Family info included in session

#### Family Tests
- Create family (becomes admin)
- Join family via invite code
- Leave family (with admin succession)
- Delete family when last member leaves
- List family members
- Update member roles (admin only)
- Remove members (admin only)
- Get/regenerate invite codes (admin only)
- Update family name (admin only)
- Delete family (admin only)

#### Children Tests
- Create child with validation
- List children (family-scoped)
- Get single child
- Update child
- Delete child
- Point adjustments (add/subtract)
- Family isolation (can't access other family's children)

#### Tasks Tests
- Create task with validation
- List tasks (family-scoped)
- Get single task
- Update task
- Delete task
- Complete task (awards points)
- Point accumulation
- Family isolation

#### Rewards Tests
- Create reward with validation
- List rewards (family-scoped)
- Get single reward
- Update reward
- Delete reward
- Redeem reward (deducts points)
- Insufficient points validation
- Family isolation

---

## Manual Testing Guide

### 1. User Registration & Login

#### Test Registration
1. Navigate to http://localhost:5173
2. Click "Register"
3. Fill in:
   - Name: "Test Parent"
   - Email: "parent@test.com"
   - Password: "password123"
4. Click "Register"
5. ✓ Should be redirected to Family Setup page

#### Test Login
1. Click "Logout" in the header
2. Click "Login"
3. Fill in:
   - Email: "parent@test.com"
   - Password: "password123"
4. Click "Login"
5. ✓ Should be logged in

### 2. Family Setup

#### Create a Family
1. After registration, you'll see the Family Setup page
2. Click "Create a Family"
3. Enter family name: "Smith Family"
4. Click "Create Family"
5. ✓ Should see success message with invite code
6. ✓ Should be redirected to Dashboard

#### Join a Family (Second User)
1. Open an incognito window or different browser
2. Register a new account: "parent2@test.com"
3. On Family Setup, click "Join a Family"
4. Enter the invite code from the first user
5. Click "Join Family"
6. ✓ Should see the same family
7. ✓ Should see children created by first user

### 3. Child Management

#### Create Children
1. On Dashboard, click "+ Add Child"
2. Create first child:
   - Name: "Alice"
   - Age: 8
   - Color: Blue (#3B82F6)
3. Click "Add Child"
4. ✓ Alice should appear on dashboard with 0 points

5. Create second child:
   - Name: "Bob"
   - Age: 6
   - Color: Green (#10b981)
6. ✓ Bob should appear with 0 points

#### Test Family Sharing
1. Switch to the second user (parent2)
2. Go to Dashboard
3. ✓ Should see Alice and Bob (same children)

### 4. Task Management

#### Create Tasks
1. Go to "Tasks" page
2. Click "+ Add Task"
3. Create task:
   - Name: "Make Your Bed"
   - Description: "Make bed neatly with pillows arranged"
   - Points: 10
   - Category: "Chores"
   - Recurring: Yes
4. Click "Add Task"
5. ✓ Task should appear in list

6. Create more tasks:
   - "Homework" (15 points, Homework category)
   - "Help with Dishes" (20 points, Chores category)

#### Complete Tasks
1. Click "Complete" on "Make Your Bed"
2. Select "Alice"
3. Add note: "Did a great job!"
4. Click "Mark Complete"
5. ✓ Should see success message
6. Go to Dashboard
7. ✓ Alice should now have 10 points

### 5. Reward System

#### Create Rewards
1. Go to "Rewards" page
2. Click "+ Add Reward"
3. Create reward:
   - Name: "Ice Cream"
   - Description: "Trip to ice cream shop"
   - Cost: 50
   - Category: "Treats"
4. Click "Add Reward"
5. ✓ Reward should appear in list

#### Test Insufficient Points
1. Click "Redeem" on "Ice Cream" (50 points)
2. Select "Alice" (has only 10 points)
3. Click "Redeem Reward"
4. ✓ Should see error "Insufficient points"

#### Redeem Reward (After Earning Points)
1. Complete more tasks until Alice has 50+ points
2. Click "Redeem" on "Ice Cream"
3. Select "Alice"
4. Click "Redeem Reward"
5. ✓ Should see success message
6. ✓ Alice's points should decrease by 50

### 6. Family Administration

#### Test Invite Code (Admin Only)
1. As the admin user, go to Family Settings
2. ✓ Should see the invite code
3. Click "Regenerate"
4. ✓ Should get a new invite code

#### Test Member Management
1. As admin, go to Family Settings > Members
2. ✓ Should see both parents listed
3. Try promoting parent2 to admin
4. ✓ Role should update
5. Try removing a member
6. ✓ Member should be removed from family

#### Test Admin Restrictions
1. As a non-admin member, go to Family Settings
2. ✓ Should NOT see invite code
3. ✓ Should NOT be able to remove members
4. ✓ Should NOT be able to change roles

### 7. Activity & Progress

#### View Activity
1. Click on Alice's card
2. ✓ Should see:
   - Current points
   - Total tasks completed
   - Total points earned
   - Rewards redeemed
   - Points spent
   - Recent activity feed

#### Check Badges
1. ✓ Badges appear as milestones are reached:
   - "First 100 Points"
   - "10 Tasks Complete"
   - etc.

### 8. Data Isolation Tests

#### Cross-Family Isolation
1. Create a completely separate user/family
2. Create children, tasks, rewards
3. ✓ Should NOT see data from other families
4. ✓ API calls to other family's resources should return 404

### 9. Edge Cases

#### Last Admin Leave
1. With only one admin, try to leave
2. ✓ Should show error if other members exist
3. ✓ Should delete family if you're the only member

#### Delete Child with History
1. Complete tasks for a child
2. Delete the child
3. ✓ Child and all history should be deleted (cascade)

### Expected Results Summary

After completing manual tests:
- ✓ Multiple users can share a family
- ✓ Invite codes work correctly
- ✓ Admin-only features are protected
- ✓ Points calculate correctly
- ✓ Data isolation works between families
- ✓ Activity history is accurate
- ✓ All CRUD operations work

## Common Issues

### "Authentication required" errors
- Make sure you're logged in
- Check that cookies are enabled in your browser

### Points not updating
- Refresh the Dashboard page
- Check browser console for errors

### Family not showing
- Complete family setup first
- Check /api/auth/me response

### Database errors
- Stop the server
- Delete `server/database.db`
- Restart server (database will be recreated)

### TypeScript errors
```bash
npm run typecheck -w server
```

### Test failures
```bash
# Run with verbose output
npm test -- --reporter=verbose

# Check specific test
npm test -- -t "test name pattern"
```
