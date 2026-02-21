# Application Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           Browser                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │             React Frontend (Port 5173)                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │ │
│  │  │   Pages      │  │  Components  │  │     Context      │ │ │
│  │  │ - Dashboard  │  │ - ChildCard  │  │ - Auth           │ │ │
│  │  │ - Tasks      │  │ - Modal      │  │                  │ │ │
│  │  │ - Rewards    │  │ - Layout     │  │                  │ │ │
│  │  │ - Family     │  │              │  │                  │ │ │
│  │  │ - Detail     │  │              │  │                  │ │ │
│  │  └──────┬───────┘  └──────────────┘  └──────────────────┘ │ │
│  │         │                                                   │ │
│  │         │ API Calls                                         │ │
│  │         ▼                                                   │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │              API Client Layer                         │  │ │
│  │  │  auth, families, children, tasks, rewards, activity  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP/JSON + Cookies
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│           TypeScript Express Backend (Port 3000)                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     Middleware                              │ │
│  │  - CORS                                                     │ │
│  │  - Cookie Parser                                            │ │
│  │  - authenticateToken (JWT validation)                       │ │
│  │  - attachFamilyInfo (loads user's family context)           │ │
│  │  - requireFamily (ensures user has a family)                │ │
│  │  - requireFamilyAdmin (admin-only endpoints)                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                       Routes                                │ │
│  │  /api/auth       → authController                           │ │
│  │  /api/families   → familyController                         │ │
│  │  /api/children   → childrenController                       │ │
│  │  /api/tasks      → tasksController                          │ │
│  │  /api/rewards    → rewardsController                        │ │
│  │  /api/children   → activityController (activity & stats)    │ │
│  │  /api/uploads    → uploadController, photoController        │ │
│  │  /api/kiosk      → kioskController, photoController         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Controllers                              │ │
│  │  - Business Logic                                           │ │
│  │  - Input Validation                                         │ │
│  │  - Family-scoped queries (using req.familyId)               │ │
│  │  - Response Formatting                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                Database Wrapper                             │ │
│  │  - prepare<T>() for typed queries                           │ │
│  │  - run(), get(), all() methods                              │ │
│  │  - Transaction support                                      │ │
│  │  - Test database injection                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SQLite Database (sql.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐                │
│  │  users   │  │ families │  │ family_members │                │
│  └──────────┘  └──────────┘  └────────────────┘                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ children │  │  tasks   │  │ rewards  │  │ completions  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────┐      │
│  │ redemptions │  │  point_adjusts   │  │ family_photos  │      │
│  └─────────────┘  └──────────────────┘  └────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
rewards/
├── package.json              # Workspace root with npm workspaces
├── packages/
│   └── shared/               # @rewards/shared - TypeScript types
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts      # Main exports
│           ├── enums.ts      # FamilyRole, ActivityType
│           ├── entities/     # Entity type definitions
│           │   ├── user.ts
│           │   ├── family.ts
│           │   ├── familyPhoto.ts
│           │   ├── child.ts
│           │   ├── task.ts
│           │   └── reward.ts
│           └── api/          # API request/response types
│               ├── auth.ts
│               ├── families.ts
│               ├── children.ts
│               ├── tasks.ts
│               ├── rewards.ts
│               └── activity.ts
├── server/                   # TypeScript Express server
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── types/            # TypeScript declarations
│       │   ├── express.d.ts  # Express Request augmentation
│       │   ├── database.ts   # Database wrapper types
│       │   └── sql.js.d.ts   # sql.js type declarations
│       ├── db/
│       │   ├── schema.sql
│       │   ├── init.ts
│       │   └── wrapper.ts
│       ├── middleware/
│       │   ├── auth.ts
│       │   └── familyAuth.ts
│       ├── controllers/
│       │   ├── authController.ts
│       │   ├── familyController.ts
│       │   ├── childrenController.ts
│       │   ├── tasksController.ts
│       │   ├── rewardsController.ts
│       │   ├── activityController.ts
│       │   ├── uploadController.ts
│       │   ├── photoController.ts
│       │   └── kioskController.ts
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── families.ts
│       │   ├── children.ts
│       │   ├── tasks.ts
│       │   ├── rewards.ts
│       │   └── activity.ts
│       ├── utils/
│       │   └── inviteCode.ts
│       ├── app.ts
│       └── server.ts
└── client/                   # React frontend
    └── src/
        ├── api/
        ├── components/
        ├── context/
        └── pages/
```

## Database Relationships

```
                            ┌─────────────┐
                            │    users    │
                            │ ─────────── │
                            │ id          │
                            │ email       │
                            │ password    │
                            │ name        │
                            └──────┬──────┘
                                   │
                                   │ 1:1 (via family_members)
                                   ▼
                            ┌──────────────────┐
                            │  family_members  │
                            │ ──────────────── │
                            │ id               │
                            │ family_id (FK)   │◄──┐
                            │ user_id (FK)     │   │
                            │ role (admin/     │   │
                            │       member)    │   │
                            └──────────────────┘   │
                                                   │
                            ┌─────────────┐        │
                            │  families   │        │
                            │ ─────────── │        │
                            │ id          │────────┘
                            │ name        │
                            │ invite_code │
                            └──────┬──────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
   ┌──────────────┐         ┌──────────┐            ┌──────────┐
   │   children   │         │  tasks   │            │ rewards  │
   │ ──────────── │         │ ──────── │            │ ──────── │
   │ id           │         │ id       │            │ id       │
   │ family_id    │         │ family_id│            │ family_id│
   │ created_by   │         │ created_by│           │ created_by│
   │ name         │         │ name     │            │ name     │
   │ current_pts  │         │ points   │            │ cost     │
   └──────┬───────┘         └────┬─────┘            └────┬─────┘
          │                      │                       │
          │         ┌────────────┴───┐                   │
          │         │                │                   │
          ▼         ▼                │                   ▼
┌────────────────┐ ┌────────────────┐│          ┌────────────────┐
│ point_adjust   │ │ completions    ││          │  redemptions   │
│ ────────────── │ │ ────────────── ││          │ ────────────── │
│ child_id (FK)  │ │ task_id (FK)   ││          │ reward_id (FK) │
│ amount         │ │ child_id (FK)  │◄──────────│ child_id (FK)  │
│ reason         │ │ points_earned  │           │ points_spent   │
└────────────────┘ └────────────────┘           └────────────────┘
```

## Family-Based Data Isolation

All data queries are scoped by `family_id`:

```typescript
// Middleware attaches family info to every authenticated request
export const attachFamilyInfo = (req, res, next) => {
  const membership = db.prepare<FamilyMembershipRow>(
    `SELECT fm.family_id, fm.role, f.name as family_name
     FROM family_members fm
     JOIN families f ON fm.family_id = f.id
     WHERE fm.user_id = ?`
  ).get(req.userId);

  req.familyId = membership?.family_id ?? null;
  req.familyRole = membership?.role ?? null;
  next();
};

// Controllers use req.familyId for all queries
const children = db.prepare<Child>(
  'SELECT * FROM children WHERE family_id = ?'
).all(req.familyId);
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Initial Page Load                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  AuthContext useEffect      │
              │  GET /api/auth/me           │
              └──────────────┬──────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌───────────────┐        ┌──────────────┐
        │ JWT Valid     │        │ No JWT       │
        │ Return user + │        │ Return 401   │
        │ family info   │        │              │
        └───────┬───────┘        └──────┬───────┘
                │                       │
                ▼                       ▼
        ┌───────────────┐        ┌──────────────┐
        │ Has family?   │        │ Redirect to  │
        │               │        │ /login       │
        └───────┬───────┘        └──────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌───────────────┐ ┌──────────────┐
│ Yes: Show     │ │ No: Show     │
│ Dashboard     │ │ Family Setup │
└───────────────┘ └──────────────┘
```

## Data Flow: Complete Task

```
User clicks "Complete" → TasksPage → Modal opens
    ↓
Select child + optional notes → Submit form
    ↓
POST /api/tasks/:id/complete → tasksController.completeTask()
    ↓
Middleware chain:
  1. authenticateToken → sets req.userId
  2. attachFamilyInfo → sets req.familyId, req.familyRole
  3. requireFamily → ensures user has a family
    ↓
Controller validates:
  - Task exists AND belongs to req.familyId
  - Child exists AND belongs to req.familyId
    ↓
Transaction:
  1. INSERT into task_completions
  2. UPDATE children.current_points (+points)
  3. Save database
    ↓
Return updated child → Refresh UI
```

## Type Safety Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    @rewards/shared                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Entities   │  │   API Types  │  │     Enums        │   │
│  │  - User      │  │  - Request   │  │  - FamilyRole    │   │
│  │  - Family    │  │  - Response  │  │  - ActivityType  │   │
│  │  - Child     │  │              │  │                  │   │
│  │  - Task      │  │              │  │                  │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                        Server                                │
│  import type { Child, Task } from '@rewards/shared';         │
│  import type { FamilyRole } from '@rewards/shared';          │
│                                                              │
│  // Typed database queries                                   │
│  const child = db.prepare<Child>(                            │
│    'SELECT * FROM children WHERE id = ?'                     │
│  ).get(id);                                                  │
│                                                              │
│  // Typed request augmentation                               │
│  interface Request {                                         │
│    userId?: number;                                          │
│    familyId?: number | null;                                 │
│    familyRole?: FamilyRole | null;                           │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                        Client                                │
│  import type { Child } from '@rewards/shared';               │
│                                                              │
│  const [children, setChildren] = useState<Child[]>([]);      │
│                                                              │
│  // Type-safe API responses                                  │
│  const response = await api.getChildren();                   │
│  setChildren(response.children);                             │
└─────────────────────────────────────────────────────────────┘
```

## Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Environment                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │               vitest.config.ts                          │ │
│  │  - setupFiles: ['./tests/setup.ts']                     │ │
│  │  - environment: 'node'                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 tests/setup.ts                          │ │
│  │  - Initialize sql.js                                    │ │
│  │  - beforeEach: Create fresh in-memory database          │ │
│  │  - Inject test DB via setTestDb()                       │ │
│  │  - afterAll: Clean up                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 tests/helpers.ts                        │ │
│  │  - getApp() → creates Express app                       │ │
│  │  - registerUser() → register + get cookie               │ │
│  │  - setupUserWithFamily() → user + family in one step    │ │
│  │  - createChild(), createTask(), createReward()          │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Test Files                           │ │
│  │  - auth.test.ts (15 tests)                              │ │
│  │  - families.test.ts (31 tests)                          │ │
│  │  - children.test.ts (21 tests)                          │ │
│  │  - tasks.test.ts (41 tests)                             │ │
│  │  - rewards.test.ts (21 tests)                           │ │
│  │  - photos.test.ts (10 tests)                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Security Layers

```
1. Frontend
   ├── HTTP-only cookies (no JS access to JWT)
   ├── CSRF protection via SameSite cookie attribute
   └── Client-side route protection + family guard

2. Network
   ├── CORS configuration (specific origin)
   └── Secure cookie flag (production)

3. Backend Middleware
   ├── authenticateToken - JWT verification
   ├── attachFamilyInfo - Load family context
   ├── requireFamily - Block users without family
   └── requireFamilyAdmin - Admin-only endpoints

4. Database
   ├── Parameterized queries (SQL injection prevention)
   ├── Foreign key constraints with CASCADE
   ├── Family-based data isolation (all queries scoped by family_id)
   └── User data never crosses family boundaries

5. Authentication
   ├── bcrypt password hashing (10 rounds)
   ├── Token expiration (7 days)
   └── Invite code validation (8 chars, specific charset)
```

## API Request/Response Examples

### POST /api/auth/register
**Request:**
```json
{
  "email": "parent@example.com",
  "password": "securepass123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "parent@example.com",
    "name": "John Doe"
  }
}
```
**Cookie Set:** `token=eyJhbGc...` (HTTP-only)

### POST /api/families
**Request:**
```json
{
  "name": "Smith Family"
}
```

**Response:**
```json
{
  "family": {
    "id": 1,
    "name": "Smith Family",
    "invite_code": "ABCD2345",
    "created_at": "2026-01-31T..."
  },
  "role": "admin"
}
```

### POST /api/tasks/5/complete
**Request:**
```json
{
  "child_id": 2,
  "notes": "Great job!"
}
```

**Response:**
```json
{
  "message": "Task completed successfully",
  "child": {
    "id": 2,
    "name": "Alice",
    "current_points": 45
  },
  "points_earned": 15
}
```

### GET /api/children/2/stats
**Response:**
```json
{
  "stats": {
    "totalTasksCompleted": 12,
    "totalPointsEarned": 180,
    "totalRewardsRedeemed": 3,
    "totalPointsSpent": 135,
    "currentPoints": 45
  },
  "pointsOverTime": [
    { "date": "2026-01-20", "points": 25 },
    { "date": "2026-01-21", "points": 30 }
  ],
  "tasksByCategory": [
    { "category": "Chores", "count": 7 },
    { "category": "Homework", "count": 5 }
  ],
  "badges": [
    { "name": "First 100 Points", "icon": "🌟" },
    { "name": "10 Tasks Complete", "icon": "✅" }
  ]
}
```
