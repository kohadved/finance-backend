# Finance Backend API

A backend for a finance dashboard system with role-based access control, financial record management, and aggregated analytics.

**Stack:** Node.js · Express · SQLite (better-sqlite3) · JWT · express-validator · Swagger UI

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env     # edit JWT_SECRET for production

# 3. Seed demo data (creates DB + sample users and records)
npm run seed

# 4. Start the server
npm start          # production
npm run dev        # development (auto-reload with nodemon)
```

Server runs at **http://localhost:3000**  
Swagger UI at **http://localhost:3000/api/docs**

---

## Demo Accounts

| Email                    | Password     | Role    |
|--------------------------|--------------|---------|
| admin@finance.com        | Admin123!    | admin   |
| analyst@finance.com      | Analyst123!  | analyst |
| viewer@finance.com       | Viewer123!   | viewer  |

---

## Role Permissions

| Action                              | viewer | analyst | admin |
|-------------------------------------|:------:|:-------:|:-----:|
| Login / view own profile            | ✓      | ✓       | ✓     |
| GET /records (list + filter)        | ✓      | ✓       | ✓     |
| GET /dashboard/summary              | ✓      | ✓       | ✓     |
| GET /dashboard/recent               | ✓      | ✓       | ✓     |
| GET /dashboard/by-category          |        | ✓       | ✓     |
| GET /dashboard/trends               |        | ✓       | ✓     |
| POST / PATCH / DELETE /records      |        |         | ✓     |
| All /users endpoints                |        |         | ✓     |

---

## API Reference

### Authentication

#### `POST /api/auth/login`
Returns a JWT token.

```json
// Request
{ "email": "admin@finance.com", "password": "Admin123!" }

// Response 200
{
  "user": { "id": 1, "name": "Alice Admin", "role": "admin", ... },
  "token": "<jwt>"
}
```

#### `POST /api/auth/register`
Register a new user. Role defaults to `viewer`.

```json
// Request
{ "name": "Bob", "email": "bob@example.com", "password": "Secret123!", "role": "analyst" }
```

#### `GET /api/auth/me`
Returns the authenticated user's profile.  
Requires: `Authorization: Bearer <token>`

---

### Users  _(admin only)_

| Method | Endpoint        | Description                       |
|--------|-----------------|-----------------------------------|
| GET    | /api/users      | List users (supports `?role=&status=&page=&limit=`) |
| GET    | /api/users/:id  | Get user by ID                    |
| POST   | /api/users      | Create user                       |
| PATCH  | /api/users/:id  | Update name, role, or status      |
| DELETE | /api/users/:id  | Deactivate user (sets `inactive`) |

---

### Financial Records

| Method | Endpoint          | Min Role | Description                         |
|--------|-------------------|----------|-------------------------------------|
| GET    | /api/records      | viewer   | List records with filtering/pagination |
| GET    | /api/records/:id  | viewer   | Get single record                   |
| POST   | /api/records      | admin    | Create record                       |
| PATCH  | /api/records/:id  | admin    | Update record fields                |
| DELETE | /api/records/:id  | admin    | Soft-delete record                  |

**Record fields:**

| Field    | Type              | Required | Notes                          |
|----------|-------------------|----------|--------------------------------|
| amount   | number (> 0)      | ✓        |                                |
| type     | `income`/`expense`| ✓        |                                |
| category | string            | ✓        | Stored lowercase               |
| date     | string (YYYY-MM-DD)| ✓       |                                |
| notes    | string            |          | Optional description           |

**Query filters for `GET /api/records`:**

```
?type=income
?category=salary
?date_from=2026-01-01&date_to=2026-03-31
?search=bonus          # searches notes and category
?sort=amount&order=desc
?page=2&limit=10
```

**Create record example:**
```json
POST /api/records
{ "amount": 1500, "type": "income", "category": "freelance", "date": "2026-04-01", "notes": "Project X" }
```

---

### Dashboard Analytics

| Endpoint                       | Min Role | Description                                 |
|--------------------------------|----------|---------------------------------------------|
| GET /api/dashboard/summary     | viewer   | Total income, expenses, net balance         |
| GET /api/dashboard/recent      | viewer   | Most recent records (`?limit=10`)           |
| GET /api/dashboard/by-category | analyst  | Totals grouped by category (filterable)     |
| GET /api/dashboard/trends      | analyst  | Monthly income/expense trends (`?year=2026`)|

**Summary response:**
```json
{ "total_income": 46700, "total_expenses": 5800, "net_balance": 40900, "record_count": 15 }
```

**Monthly trends response:**
```json
[
  { "month": "2026-01", "income": 15500, "expenses": 1500, "net": 14000 },
  { "month": "2026-02", "income": 14200, "expenses": 1850, "net": 12350 }
]
```

---

## Project Structure

```
src/
├── config/
│   ├── database.js        SQLite connection, schema creation, indexes
│   ├── seed.js            Seed demo users and financial records
│   └── swagger.js         OpenAPI/Swagger spec configuration
├── middleware/
│   ├── authenticate.js    JWT verification → attaches req.user
│   ├── authorize.js       Role guard factory (authorize / authorizeMin)
│   ├── validate.js        express-validator result handler
│   └── errorHandler.js    Global error handler
├── routes/
│   ├── auth.routes.js
│   ├── users.routes.js
│   ├── records.routes.js
│   └── dashboard.routes.js
├── services/
│   ├── auth.service.js    Register, login, profile
│   ├── users.service.js   User CRUD
│   ├── records.service.js Financial record CRUD + filtering
│   └── dashboard.service.js Aggregation queries
├── utils/
│   └── AppError.js        Custom operational error class
├── app.js                 Express app setup
└── server.js              HTTP server entry point
```

---

## Environment Variables

| Variable        | Default               | Description                        |
|-----------------|-----------------------|------------------------------------|
| PORT            | 3000                  | HTTP port                          |
| JWT_SECRET      | _(required)_          | Secret for signing JWTs            |
| JWT_EXPIRES_IN  | 7d                    | JWT expiry                         |
| DB_PATH         | ./data/finance.db     | SQLite database file path          |

---

## Technical Decisions & Trade-offs

### Database: SQLite via better-sqlite3
SQLite is a sensible choice for this project scope. `better-sqlite3` provides synchronous queries which eliminates async boilerplate without sacrificing correctness — the synchronous API is also faster per query than async drivers. The database file is excluded from git; the `seed.js` script recreates it. For production scale, the service layer can be adapted to PostgreSQL with minimal changes since the SQL is straightforward.

### Authentication: JWT (stateless)
JWTs avoid the need for a session store, keeping the service horizontally scalable from day one. Tokens expire in 7 days (configurable). The authenticate middleware re-fetches the user row on every request to catch deactivated accounts immediately — a tradeoff of one DB read per request for correctness over pure statelessness.

### Role model: three tiers (viewer → analyst → admin)
The `authorizeMin('analyst')` helper encodes the hierarchy so adding a new role between existing ones is a one-line change. The `authorize('admin')` variant is used where exact role matching makes more sense (e.g. you don't want an analyst creating records even if you add a super-admin later).

### Soft deletes
Financial records are soft-deleted (a `deleted_at` timestamp) rather than physically removed. This preserves audit trails — a real finance system should never permanently destroy transaction history. An index on `deleted_at` keeps the `WHERE deleted_at IS NULL` filter cheap.

### Architecture: routes → services → DB
Routes handle HTTP concerns (parsing, validation, status codes). Services contain all business logic and speak directly to the database through `better-sqlite3` prepared statements. This separation makes business logic independently testable and keeps routes thin.

### Validation: express-validator
Field-level rules declared inline with routes make the contract self-documenting. Errors are normalized to `{ field, message }` objects so the frontend can map them to form fields.

### Pagination
All list endpoints support `?page=&limit=` and return a `meta` object with `{ total, page, limit, pages }`. The default limit is 20; the maximum is 100.

---

## Known Limitations / Possible Improvements

- **No refresh tokens** — the current implementation issues a single long-lived JWT. A production system should issue short-lived access tokens paired with refresh tokens.
- **No rate limiting** — adding `express-rate-limit` on auth endpoints would prevent brute-force attacks.
- **Password reset flow** not implemented.
- **Tests** — the architecture (services are pure functions over a DB instance) makes unit and integration testing straightforward; adding a test suite with Jest/Supertest would be the next step.
- **SQLite in production** — acceptable for low-traffic deployments; swap the service layer's DB calls to a PostgreSQL client (e.g. `pg` or Prisma) for higher scale.
