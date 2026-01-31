# Kids Reward Tracking App

A web-based application that helps families manage tasks, points, and rewards for their children. Multiple parents can share the same family, creating and managing children, tasks, and rewards together.

## Features

- **Family System**: Create a family or join via invite code - multiple parents share the same children, tasks, and rewards
- **User Authentication**: Secure registration and login with JWT
- **Child Profile Management**: Create and manage multiple child profiles with customizable avatars
- **Task System**: Create tasks with point values, mark them complete, and automatically award points
- **Reward Catalog**: Define rewards with point costs and redeem them for children
- **Activity Tracking**: View complete history of tasks completed, rewards redeemed, and point adjustments
- **Visual Progress**: Charts showing points earned over time and achievement badges
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- **TypeScript** with Node.js and Express
- **SQLite** database with sql.js (pure JavaScript implementation)
- **JWT** authentication with HTTP-only cookies
- **bcrypt** for password hashing
- **Vitest + Supertest** for automated testing

### Frontend
- React 18 with React Router
- Vite for fast development
- CSS Modules for styling
- Recharts for data visualization

### Shared Types
- **@rewards/shared** package for type definitions shared between client and server
- Entity types, API request/response types, and enums

## Project Structure

```
rewards/
├── packages/
│   └── shared/                # Shared TypeScript types
│       └── src/
│           ├── enums.ts       # FamilyRole, ActivityType
│           ├── entities/      # User, Family, Child, Task, Reward types
│           └── api/           # Request/response types per endpoint
├── server/                    # TypeScript Express backend
│   ├── src/
│   │   ├── types/             # Express augmentation, database types
│   │   ├── db/                # Database setup and wrapper
│   │   ├── middleware/        # Auth and family middleware
│   │   ├── controllers/       # Route handlers
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Utilities (invite codes)
│   │   ├── app.ts             # Express app setup
│   │   └── server.ts          # Entry point
│   └── tests/                 # Automated API tests
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── context/           # Auth context
│   │   └── api/               # API client
│   └── package.json
├── package.json               # Workspace root
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm package manager

### Installation

From the project root:

```bash
npm install
```

This installs dependencies for all workspaces (shared, server, client).

### Build Shared Types

```bash
npm run build:shared
```

### Running the Application

1. **Start the Backend Server**

```bash
npm run server
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

## Development Commands

```bash
# Install all dependencies
npm install

# Build shared types package
npm run build:shared

# Start server with hot reload
npm run server

# Run server tests
npm test

# Type check server
npm run typecheck -w server

# Start client dev server
cd client && npm run dev
```

## Family System

### Creating a Family
1. Register a new account
2. You'll be prompted to either create a family or join an existing one
3. Creating a family makes you an admin with an 8-character invite code

### Joining a Family
1. Register a new account
2. Enter the invite code shared by a family admin
3. You'll join as a member and see all the family's children, tasks, and rewards

### Family Roles
- **Admin**: Can invite others, manage members, update family settings, regenerate invite codes
- **Member**: Can manage children, tasks, and rewards, but cannot manage other members

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user with family info

### Families
- `POST /api/families` - Create a new family
- `GET /api/families/current` - Get current family
- `PUT /api/families/current` - Update family (admin)
- `DELETE /api/families/current` - Delete family (admin)
- `POST /api/families/join` - Join family via invite code
- `POST /api/families/leave` - Leave current family
- `GET /api/families/current/members` - List family members
- `PUT /api/families/current/members/:userId/role` - Update member role (admin)
- `DELETE /api/families/current/members/:userId` - Remove member (admin)
- `GET /api/families/current/invite-code` - Get invite code (admin)
- `POST /api/families/current/invite-code/regenerate` - Regenerate code (admin)

### Children
- `GET /api/children` - Get all children in family
- `POST /api/children` - Create child
- `GET /api/children/:id` - Get child details
- `PUT /api/children/:id` - Update child
- `DELETE /api/children/:id` - Delete child
- `POST /api/children/:id/adjust-points` - Manually adjust points

### Tasks
- `GET /api/tasks` - Get all tasks in family
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/complete` - Mark task complete for a child

### Rewards
- `GET /api/rewards` - Get all rewards in family
- `POST /api/rewards` - Create reward
- `GET /api/rewards/:id` - Get reward details
- `PUT /api/rewards/:id` - Update reward
- `DELETE /api/rewards/:id` - Delete reward
- `POST /api/rewards/:id/redeem` - Redeem reward for a child

### Activity
- `GET /api/children/:id/activity` - Get child's activity history
- `GET /api/children/:id/stats` - Get child's statistics

## Testing

The server includes comprehensive automated tests using Vitest and Supertest.

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

**Test Coverage:**
- 105 automated tests across 5 test files
- Auth API tests (15 tests)
- Families API tests (28 tests)
- Children API tests (21 tests)
- Tasks API tests (20 tests)
- Rewards API tests (21 tests)

## Database Schema

The application uses SQLite with the following tables:

- **users**: Parent accounts
- **families**: Family groups with invite codes
- **family_members**: Links users to families with roles
- **children**: Child profiles (scoped by family)
- **tasks**: Available tasks (scoped by family)
- **task_completions**: History of completed tasks
- **rewards**: Available rewards (scoped by family)
- **redemptions**: History of redeemed rewards
- **point_adjustments**: Manual point adjustments

See `server/src/db/schema.sql` for the complete schema.

## Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens stored in HTTP-only cookies
- CORS configured for frontend origin
- SQL injection protection via parameterized queries
- Foreign key constraints for data integrity
- Family-based data isolation

## Using Shared Types

The `@rewards/shared` package provides TypeScript types for both server and client:

```typescript
// Import entity types
import type { User, Child, Task, Family } from '@rewards/shared';

// Import API types
import type { LoginRequest, AuthResponse } from '@rewards/shared/api';

// Import enums
import type { FamilyRole, ActivityType } from '@rewards/shared';
```

## Additional Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide with minimal steps
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and data flow diagrams
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Complete implementation details
- **[TEST.md](TEST.md)** - Manual testing guide
- **[TEST_RESULTS.md](TEST_RESULTS.md)** - Automated test results

## Future Enhancements

- Kid-facing read-only view
- Email notifications for milestones
- Photo uploads for tasks/rewards
- Import/export functionality
- Mobile app versions
- Task scheduling and reminders
- Custom achievement badge creation

## License

MIT
