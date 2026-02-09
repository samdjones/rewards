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

## Quick Start (Production with Podman)

The easiest way to run the app is with Podman (or Docker):

```bash
# Build the container
podman build -t rewards-app .

# Run with persistent database
podman run -d \
  --name rewards-app \
  -p 3000:3000 \
  -v rewards-data:/data \
  -e JWT_SECRET="your-secret-key-here" \
  rewards-app
```

Access the app at http://localhost:3000

### Using Podman Compose

```bash
# Set your JWT secret
export JWT_SECRET="your-secret-key-here"

# Start the app
podman-compose up -d

# View logs
podman logs -f rewards-app

# Stop
podman-compose down
```

### Updating to a New Version

Your data is stored in a persistent volume, so it survives container updates:

```bash
podman-compose down
podman-compose build --no-cache
podman-compose up -d
```

## Development Setup

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

### Running for Development

Development uses two servers for hot reload:

1. **Start the Backend Server**

```bash
npm run server
```

The API server will start on http://localhost:3000

2. **Start the Frontend Development Server**

In a new terminal:

```bash
npm run client
```

The frontend will start on http://localhost:5173 with hot module replacement.

3. **Access the Application**

Open your browser and navigate to http://localhost:5173

### Development Commands

```bash
# Install all dependencies
npm install

# Build shared types package
npm run build:shared

# Start server with hot reload
npm run server

# Start client with hot reload
npm run client

# Run server tests
npm test

# Type check server
npm run typecheck -w server

# Build everything for production
npm run build:all

# Start production server (after build:all)
npm start
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
- 126 automated tests across 5 test files
- Auth API tests (15 tests)
- Families API tests (28 tests)
- Children API tests (21 tests)
- Tasks API tests (41 tests)
- Rewards API tests (21 tests)

### Functional API Tests

The `scripts/functional-tests.sh` script runs end-to-end API tests. It handles everything automatically:
- Builds the container image
- Stops any existing test container
- Starts a fresh container
- Runs all API tests
- Cleans up on exit

```bash
# Just run it - handles everything
./scripts/functional-tests.sh
```

The functional tests verify:
- Health check endpoint
- User registration and authentication
- Family creation
- Child, task, and reward CRUD operations
- Logout and session invalidation

## Continuous Integration

The project uses GitHub Actions for CI. The workflow runs on every push and pull request.

### CI Pipeline Stages

1. **Unit Tests**: Installs dependencies, builds the shared package, and runs all Vitest tests
2. **Functional API Tests**: Runs the functional test script (which builds and tests the container)

### Viewing CI Results

Check the Actions tab in the GitHub repository to see workflow runs and results.

### Running CI Locally

```bash
# Run unit tests
npm test

# Run functional tests (builds container automatically)
./scripts/functional-tests.sh
```

## Database

### Technology

The application uses **SQLite** via **sql.js**, a pure JavaScript implementation of SQLite. This means:

- No native dependencies or compilation required
- Database runs entirely in Node.js memory
- Automatically persists to disk after each write
- Works seamlessly in containers

### Database Location

| Environment | Location |
|-------------|----------|
| Development | `./database.db` in project root |
| Production (Container) | `/data/database.db` (mount a volume to `/data`) |

The location can be configured via the `DATABASE_PATH` environment variable.

### Schema

The database includes the following tables:

- **users**: Parent accounts with email/password
- **families**: Family groups with invite codes
- **family_members**: Links users to families with roles (admin/member)
- **children**: Child profiles with point balances (scoped by family)
- **tasks**: Available tasks with point values and repeat schedules (scoped by family)
- **task_completions**: History of completed tasks with timestamps
- **rewards**: Available rewards with point costs (scoped by family)
- **redemptions**: History of redeemed rewards
- **point_adjustments**: Manual point adjustments with reasons

See `server/src/db/schema.sql` for the complete schema.

### Migrations

Database migrations run automatically on server startup. The app checks for missing columns/tables and adds them while preserving existing data. This means you can update the app without losing your data.

### Backup

To backup your database:

```bash
# If running with Podman
podman cp rewards-app:/data/database.db ./backup.db

# If running locally
cp database.db backup.db
```

### Reset

To reset all points and history without deleting kids/tasks/rewards, use the "Reset All History" button in Family Settings (admin only).

To completely reset the database, delete the `database.db` file (or the volume) and restart the app.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret key for JWT tokens | `dev-secret-key...` (change in production!) |
| `DATABASE_PATH` | Path to SQLite database file | `database.db` |
| `NODE_ENV` | Environment (`development` or `production`) | `development` |
| `APP_VERSION` | Application version (set automatically during Docker build) | Read from `package.json` |

## Versioning

The app version is defined in the root `package.json` and flows to git tags, Docker image tags, the server health API, and the frontend UI.

### Release Workflow

1. Bump the version in root `package.json`
2. Commit: `git commit -am "Bump version to X.Y.Z"`
3. Tag: `npm run tag-release`
4. Push: `git push && git push origin vX.Y.Z`
5. Deploy: `./scripts/deploy.sh`

### Checking the Running Version

- **API**: `curl -sk https://localhost:3000/api/health` returns `{ "status": "ok", "version": "1.0.0" }`
- **UI**: Version is displayed in the page footer
- **Container label**: `podman inspect rewards-app --format '{{index .Config.Labels "org.opencontainers.image.version"}}'`

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
