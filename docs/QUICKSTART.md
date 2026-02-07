# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Two terminal windows

## Installation

1. **Navigate to the project directory**

```bash
cd /home/sam/code/plan909/rewards
```

2. **Install all dependencies**

```bash
npm install
```

3. **Build shared types**

```bash
npm run build:shared
```

## Running the Application

### Terminal 1: Start the Backend Server

```bash
npm run server
```

You should see:
```
Database loaded successfully
Server running on http://localhost:3000
```

### Terminal 2: Start the Frontend

```bash
cd client
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Access the Application

Open your browser and go to: **http://localhost:5173**

## First Steps

1. **Register**: Create a new account with your email and password
2. **Create or Join Family**: 
   - Create a new family to become an admin
   - Or enter an invite code to join an existing family
3. **Add a Child**: Click "Add Child" and create a profile
4. **Create Tasks**: Go to Tasks page and add some tasks with point values
5. **Create Rewards**: Go to Rewards page and add rewards to work toward
6. **Complete Tasks**: Mark tasks as complete for your children to award points
7. **Redeem Rewards**: When children have enough points, redeem rewards
8. **View Progress**: Click on a child card to see detailed stats and activity

## Running Tests

```bash
npm test
```

This runs all 105 automated tests covering authentication, families, children, tasks, and rewards.

## Development Commands

```bash
# Install dependencies
npm install

# Build shared types
npm run build:shared

# Start server with hot reload
npm run server

# Run tests
npm test

# Type check
npm run typecheck -w server

# Start frontend dev server
cd client && npm run dev
```

## Stopping the Application

- Press `Ctrl+C` in each terminal window to stop the servers

## Troubleshooting

### Port Already in Use

If port 3000 or 5173 is already in use:

**Backend (port 3000)**: Edit `server/.env` and change PORT=3000 to another port

**Frontend (port 5173)**: Edit `client/vite.config.js` and change the server port

### Database Issues

If you need to reset the database:
```bash
rm server/database.db
```

The database will be recreated when you restart the server.

### Cannot Find Modules

Make sure you've installed dependencies:
```bash
npm install
npm run build:shared
```

### TypeScript Errors

Run the type checker:
```bash
npm run typecheck -w server
```

## Family Setup

### Creating a Family
After registering, you'll be prompted to set up your family:
1. Click "Create a Family"
2. Enter a family name
3. You'll receive an 8-character invite code to share with other parents

### Joining a Family
If another parent shared an invite code with you:
1. Register your account
2. Click "Join a Family"
3. Enter the invite code
4. You'll join as a member with access to all family data

### Invite Code Format
- 8 characters
- Uses letters A-Z (except I, L, O) and numbers 2-9 (except 0, 1)
- Case-insensitive

## Project Structure

```
rewards/
├── packages/shared/    # Shared TypeScript types (@rewards/shared)
├── server/             # TypeScript Express backend
│   ├── src/            # Source files
│   └── tests/          # Automated tests
└── client/             # React frontend
```
