# Manual Testing Guide

This guide will help you test all features of the application.

## 1. User Registration & Login

### Test Registration
1. Navigate to http://localhost:5173
2. Click "Register"
3. Fill in:
   - Name: "Test Parent"
   - Email: "parent@test.com"
   - Password: "password123"
4. Click "Register"
5. ✓ Should be automatically logged in and redirected to Dashboard

### Test Login
1. Click "Logout" in the header
2. Click "Login"
3. Fill in:
   - Email: "parent@test.com"
   - Password: "password123"
4. Click "Login"
5. ✓ Should be logged in and see Dashboard

## 2. Child Management

### Create Children
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

### View Child Details
1. Click on Alice's card
2. ✓ Should see detailed view with:
   - Current points (0)
   - Stats (all zeros)
   - No activity yet

## 3. Task Management

### Create Tasks
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
   - "Brush Teeth" (5 points, Hygiene category)
   - "Help with Dishes" (20 points, Chores category)

### Complete Tasks
1. Click "Complete" on "Make Your Bed"
2. Select "Alice"
3. Add note: "Did a great job!"
4. Click "Mark Complete"
5. ✓ Should see success message
6. Go to Dashboard
7. ✓ Alice should now have 10 points

8. Complete "Homework" for Alice
9. ✓ Alice should now have 25 points total

10. Complete "Brush Teeth" for Bob
11. ✓ Bob should have 5 points

## 4. Reward System

### Create Rewards
1. Go to "Rewards" page
2. Click "+ Add Reward"
3. Create reward:
   - Name: "Ice Cream"
   - Description: "Trip to ice cream shop"
   - Cost: 50
   - Category: "Treats"
4. Click "Add Reward"
5. ✓ Reward should appear in list

6. Create more rewards:
   - "Movie Night" (30 points, Activities)
   - "New Book" (40 points, Toys)
   - "Extra Screen Time" (20 points, Privileges)

### Test Insufficient Points
1. Click "Redeem" on "Ice Cream" (50 points)
2. Select "Alice" (has 25 points)
3. Click "Redeem Reward"
4. ✓ Should see error "Insufficient points"

### Complete More Tasks
1. Go to Tasks
2. Complete "Help with Dishes" for Alice (20 points)
3. Complete "Homework" for Alice (15 points)
4. ✓ Alice should now have 60 points

### Redeem Reward
1. Go to Rewards
2. Click "Redeem" on "Ice Cream" (50 points)
3. Select "Alice"
4. Add note: "Earned it!"
5. Click "Redeem Reward"
6. ✓ Should see success message
7. Go to Dashboard
8. ✓ Alice should now have 10 points (60 - 50)

## 5. Activity & Progress

### View Activity
1. Click on Alice's card
2. ✓ Should see:
   - Current points: 10
   - Total tasks completed: 4
   - Total points earned: 70
   - Rewards redeemed: 1
   - Points spent: 50

3. ✓ Recent activity should show:
   - Redeemed: Ice Cream (-50 pts)
   - Completed: Help with Dishes (+20 pts)
   - Completed: Homework (+15 pts)
   - Completed: Homework (+15 pts)
   - Completed: Make Your Bed (+10 pts)

### Check Badges
1. ✓ Should see badge: "10 Tasks Complete" (if 10+ tasks completed)

### View Chart
1. ✓ Points chart should show points earned per day
2. ✓ Line should show upward trend

## 6. Edge Cases

### Test Delete Child Warning
1. Go to Dashboard
2. Click X on Bob's card
3. ✓ Should see confirmation dialog
4. Click Cancel
5. ✓ Bob should still be there

### Test Delete Task
1. Go to Tasks
2. Click "Delete" on any task
3. ✓ Should see confirmation
4. Confirm deletion
5. ✓ Task should be removed

### Test Logout
1. Click "Logout" in header
2. ✓ Should be redirected to login page
3. Try to go to http://localhost:5173/
4. ✓ Should be redirected to login (protected route)

## 7. Data Persistence

### Test Data Saves
1. Login again
2. ✓ All children, tasks, and rewards should still be there
3. ✓ Points should be preserved
4. ✓ Activity history should be intact

## Expected Results Summary

After completing all tests, you should have:
- ✓ 1 registered user
- ✓ 2 children (Alice & Bob)
- ✓ 3-4 tasks created
- ✓ 3-4 rewards created
- ✓ Multiple task completions
- ✓ At least 1 reward redemption
- ✓ Activity history visible
- ✓ Points calculations correct
- ✓ Data persists across sessions

## Common Issues

### "Authentication required" errors
- Make sure you're logged in
- Check that cookies are enabled in your browser

### Points not updating
- Refresh the Dashboard page
- Check browser console for errors

### Database errors
- Stop the server
- Delete `server/database.db`
- Restart server (database will be recreated)
