# Kids Reward Tracking App

A web-based application that helps parents manage tasks, points, and rewards for their children. Parents can create profiles for each child, assign tasks, track completions, and manage a reward catalog.

## Features

- **User Authentication**: Secure registration and login for parents
- **Child Profile Management**: Create and manage multiple child profiles with customizable avatars
- **Task System**: Create tasks with point values, mark them complete, and automatically award points
- **Reward Catalog**: Define rewards with point costs and redeem them for children
- **Activity Tracking**: View complete history of tasks completed, rewards redeemed, and point adjustments
- **Visual Progress**: Charts showing points earned over time and achievement badges
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- Node.js with Express
- SQLite database with sql.js (pure JavaScript implementation)
- JWT authentication with HTTP-only cookies
- bcrypt for password hashing

### Frontend
- React 18 with React Router
- Vite for fast development
- CSS Modules for styling
- Recharts for data visualization

## Project Structure

```
rewards/
├── server/                 # Backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Auth middleware
│   │   ├── db/            # Database setup
│   │   └── server.js      # Main server file
│   └── package.json
├── client/                # Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Auth context
│   │   ├── api/           # API client
│   │   └── App.jsx        # Main app component
│   └── package.json
├── database.db            # SQLite database (created on first run)
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install Backend Dependencies**

```bash
cd server
npm install
```

2. **Install Frontend Dependencies**

```bash
cd client
npm install
```

3. **Configure Environment Variables**

The server/.env file is already configured for development:
```
PORT=3000
JWT_SECRET=dev-secret-key-change-in-production-12345
NODE_ENV=development
```

For production, change the JWT_SECRET to a secure random string.

### Running the Application

1. **Start the Backend Server**

```bash
cd server
npm start
```

The server will start on http://localhost:3000

2. **Start the Frontend Development Server**

In a new terminal:

```bash
cd client
npm run dev
```

The frontend will start on http://localhost:5173

3. **Access the Application**

Open your browser and navigate to http://localhost:5173

## Next Steps - Getting Started

### Option 1: Use Test Data (Recommended for Quick Demo)

The application has been tested and includes sample data. You can login with:

**Test Account:**
- Email: `test@example.com`
- Password: `password123`

**What's included:**
- 2 children: Alice (10 points) and Bob (15 points)
- 3 tasks: Make Your Bed, Homework, Help with Dishes
- 2 rewards: Ice Cream, Movie Night
- Sample activity history and completed transactions

This allows you to immediately see the app in action with data already populated.

### Option 2: Start Fresh

1. **Delete the test database** (if you want to start from scratch):
   ```bash
   rm server/database.db
   ```

2. **Restart the server** - a new empty database will be created

3. **Register your own account** at http://localhost:5173/register

4. **Follow the usage guide below** to create your own children, tasks, and rewards

### What to Expect

When you first access the application:

1. **Login/Register Page** - Create an account or use test credentials
2. **Dashboard** - See all your children with their current point balances
3. **Tasks Page** - Create and manage tasks, mark them as complete
4. **Rewards Page** - Create rewards and redeem them for children
5. **Child Detail** - Click any child card to see detailed stats, activity history, and charts

### Quick Test Workflow

1. Start both servers (backend on port 3000, frontend on port 5173)
2. Open http://localhost:5173 in your browser
3. Login with test@example.com / password123
4. Click on Alice's or Bob's card to see their detailed stats
5. Go to Tasks and complete a task for one of the children
6. Check the Dashboard to see updated points
7. Go to Rewards and try to redeem a reward

### Troubleshooting

**Port already in use:**
- Kill any processes on port 3000: `lsof -ti:3000 | xargs kill -9`
- Kill any processes on port 5173: `lsof -ti:5173 | xargs kill -9`

**Database errors:**
- Delete `server/database.db` and restart the server

**Module not found:**
- Re-run `npm install` in both server and client directories

## Usage Guide

### Getting Started

1. **Register an Account**
   - Click "Register" on the login page
   - Enter your name, email, and password
   - You'll be automatically logged in

2. **Add Children**
   - Click "Add Child" on the dashboard
   - Enter the child's name, optional age, and choose an avatar color
   - The child will appear on the dashboard with 0 points

3. **Create Tasks**
   - Navigate to the "Tasks" page
   - Click "Add Task"
   - Enter task name, description, point value, and category
   - Mark as recurring if it's a daily/weekly task

4. **Complete Tasks**
   - On the Tasks page, click "Complete" on a task
   - Select which child completed it
   - Add optional notes
   - Points are automatically awarded

5. **Create Rewards**
   - Navigate to the "Rewards" page
   - Click "Add Reward"
   - Enter reward name, description, point cost, and category

6. **Redeem Rewards**
   - On the Rewards page, click "Redeem" on a reward
   - Select which child is redeeming it
   - The system checks if they have enough points
   - Points are automatically deducted

7. **View Progress**
   - Click on a child card in the dashboard
   - View detailed statistics, activity history, and achievements
   - See charts of points earned over time

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Children
- `GET /api/children` - Get all children
- `POST /api/children` - Create child
- `GET /api/children/:id` - Get child details
- `PUT /api/children/:id` - Update child
- `DELETE /api/children/:id` - Delete child
- `POST /api/children/:id/adjust-points` - Manually adjust points

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/complete` - Mark task complete

### Rewards
- `GET /api/rewards` - Get all rewards
- `POST /api/rewards` - Create reward
- `GET /api/rewards/:id` - Get reward details
- `PUT /api/rewards/:id` - Update reward
- `DELETE /api/rewards/:id` - Delete reward
- `POST /api/rewards/:id/redeem` - Redeem reward

### Activity
- `GET /api/children/:id/activity` - Get child's activity history
- `GET /api/children/:id/stats` - Get child's statistics

## Database Schema

The application uses SQLite with the following tables:

- **users**: Parent accounts
- **children**: Child profiles
- **tasks**: Available tasks
- **task_completions**: History of completed tasks
- **rewards**: Available rewards
- **redemptions**: History of redeemed rewards
- **point_adjustments**: Manual point adjustments

See `server/src/db/schema.sql` for the complete schema.

## Development

### Backend Development

```bash
cd server
npm run dev  # Auto-restarts on file changes
```

### Frontend Development

```bash
cd client
npm run dev  # Hot module replacement enabled
```

### Building for Production

```bash
cd client
npm run build
```

The production build will be in `client/dist/`

## Security Features

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens stored in HTTP-only cookies
- CORS configured for frontend origin
- SQL injection protection via parameterized queries
- Foreign key constraints for data integrity

## Testing

The application has been thoroughly tested with all core functionality verified working correctly.

**Test Status:** ✅ All core features passing

See **[TEST_RESULTS.md](TEST_RESULTS.md)** for detailed test results including:
- API endpoint testing results
- Point calculation verification
- Validation testing
- Activity tracking verification
- Final test data state

For manual testing instructions, see **[TEST.md](TEST.md)**

## Additional Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide with minimal steps
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and data flow diagrams
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Complete implementation details
- **[TEST_RESULTS.md](TEST_RESULTS.md)** - Comprehensive test results

## Future Enhancements

- Multiple parent accounts per family
- Kid-facing read-only view
- Email notifications for milestones
- Photo uploads for tasks/rewards
- Import/export functionality
- Mobile app versions
- Task scheduling and reminders
- Custom achievement badge creation

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
