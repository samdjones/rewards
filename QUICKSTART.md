# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Two terminal windows

## Installation

1. **Clone or navigate to the project directory**

```bash
cd /home/sam/code/plan909/rewards
```

2. **Install all dependencies**

```bash
cd server && npm install && cd ../client && npm install && cd ..
```

## Running the Application

### Terminal 1: Start the Backend Server

```bash
cd server
npm start
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
2. **Add a Child**: Click "Add Child" and create a profile
3. **Create Tasks**: Go to Tasks page and add some tasks with point values
4. **Create Rewards**: Go to Rewards page and add rewards to work toward
5. **Complete Tasks**: Mark tasks as complete for your children to award points
6. **Redeem Rewards**: When children have enough points, redeem rewards
7. **View Progress**: Click on a child card to see detailed stats and activity

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
cd server && npm install
cd ../client && npm install
```

## Development Mode

Both servers support hot reload:

- **Backend**: Uses Node.js --watch flag (Node 18+)
- **Frontend**: Uses Vite HMR (Hot Module Replacement)

Just save your changes and they'll be reflected immediately!
