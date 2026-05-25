# Twitter/X Clone

A full-stack Twitter/X clone built with modern web technologies. This project demonstrates a complete social media application with authentication, real-time updates, and responsive design.

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom JWT-based auth with bcrypt
- **Real-time**: Socket.io for live updates
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Real-time**: Socket.io Client
- **Testing**: Vitest + React Testing Library

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 16

## Stack Justification

### Why Express + Next.js?
- **Separation of Concerns**: Clear boundary between API and UI layers
- **Testability**: Express APIs are easy to test with 80%+ coverage
- **Flexibility**: Each layer can scale independently
- **Industry Standard**: Well-known patterns, easy to maintain

### Why PostgreSQL?
- **Relational Data**: User relationships (follows), likes, and tweets are inherently relational
- **ACID Compliance**: Data integrity for social interactions
- **Prisma Integration**: Excellent type-safety and migration support

### Why Custom JWT Auth?
- **Challenge Requirement**: No Firebase/Supabase Auth allowed
- **Full Control**: Custom validation, token management, and security policies
- **Learning Demonstration**: Shows understanding of auth fundamentals

### Why Socket.io?
- **Real-time Updates**: Timeline and likes update instantly
- **Mature Library**: Battle-tested, well-documented
- **Easy Integration**: Works seamlessly with Express

## Features

### Core Features
- User registration and authentication (email + password)
- Create, delete tweets (max 280 characters)
- Timeline with tweets from followed users
- Infinite scroll pagination
- Follow/unfollow users
- Like/unlike tweets
- User search by name/username
- User profiles with follower/following counts
- Responsive mobile-first design

### Bonus Features
- Real-time updates via WebSockets
- Image uploads for tweets (with Supabase Storage)
- Reply threads with nested conversations
- Notifications system (likes, follows, replies)
- Docker deployment with single command

## Live Demo

The application is deployed on Railway:
- **Frontend**: [Your Railway Frontend URL]
- **Backend API**: [Your Railway Backend URL]

## Architecture Decisions

### Timeline Model
The timeline fetches tweets from followed users plus the current user's own tweets, ordered by creation date (newest first). Cursor-based pagination ensures efficient loading for large datasets.

### Follow Graph
A simple junction table (`Follow`) connects followers and following relationships. Indexes on both `followerId` and `followingId` enable fast lookups for:
- Who follows a user (followers list)
- Who a user follows (following list)
- Timeline generation

### Authentication Flow
1. Registration creates user with hashed password (bcrypt, 12 rounds)
2. Login validates credentials and issues JWT (7-day expiry)
3. Protected routes verify JWT via middleware
4. Token stored in localStorage (client-side)

## Trade-offs & Limitations

- **Timeline Scale**: For millions of users, a fan-out-on-write approach would be better
- **Image Storage**: Local filesystem; production should use S3/Cloudinary
- **Real-time**: Polling would be more reliable for mobile networks
- **Search**: Basic LIKE queries; production needs full-text search (Elasticsearch)

## AI Tools Used

This project was developed using **Claude Code (Claude Opus 4.5)** as the primary AI coding assistant:
- Project scaffolding and architecture decisions
- Implementation of all features
- Test generation
- Documentation

The AI was directed to follow best practices, maintain code consistency, and create production-quality code.

---

# Runbook

## Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | 20.x or higher | `node --version` |
| npm | 10.x or higher | `npm --version` |
| Docker | 25.x or higher | `docker --version` |
| Docker Compose | 2.x or higher | `docker compose version` |
| Git | 2.x or higher | `git --version` |

## Quick Start (Docker)

The fastest way to run the entire stack:

```bash
# Clone the repository
git clone https://github.com/almeidakarla/x-twitter.git
cd x-twitter

# Start all services (database, backend, frontend)
docker compose up -d

# Wait for services to be healthy (~30 seconds)
docker compose ps

# Seed the database with sample data
docker compose exec backend npx tsx src/seed.ts
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## Manual Setup (Development)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/almeidakarla/x-twitter.git
cd x-twitter

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

**Option A: Docker PostgreSQL (Recommended)**
```bash
# Start only the database
docker compose up -d db

# Wait for database to be ready
docker compose logs -f db
# Look for: "database system is ready to accept connections"
```

**Option B: Local PostgreSQL**
- Install PostgreSQL 16
- Create database: `createdb twitter_clone`

### 3. Environment Configuration

**Backend** (`backend/.env`):
```bash
# Copy example env file
cp backend/.env.example backend/.env

# Edit if using local PostgreSQL or different settings
```

Default `.env` values:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/twitter_clone?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
UPLOAD_DIR="uploads"
```

**Frontend** (`frontend/.env.local`):
```bash
# Copy example env file
cp frontend/.env.example frontend/.env.local
```

Default values:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Database Migration

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database
npm run db:seed
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:3000

## Running Tests

### Backend Tests

**Note:** Backend integration tests require a running PostgreSQL database. Start the database with `docker compose up -d db` before running tests.

```bash
cd backend

# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# View coverage report
open coverage/lcov-report/index.html
```

**Expected coverage: 80%+**

### Frontend Tests (Integration)

Frontend tests cover the main user flows:
- **Login flow**: Form validation, API calls, auth state management
- **Create tweet**: Character limits, image upload, form submission
- **Follow/unfollow**: Button states, API interactions, error handling

```bash
cd frontend

# Run tests
npm test
```

## Seed Data

The seed script creates:
- 11 users with realistic profiles
- 20+ tweets per user
- Random follows between users
- Random likes on tweets
- Reply threads

### Test Credentials

| Email | Password | Description |
|-------|----------|-------------|
| `demo@example.com` | `demo1234` | Demo account |
| `john@example.com` | `password123` | Regular user |
| `jane@example.com` | `password123` | Regular user |

All seeded users (except demo) use password: `password123`

## Environment Variables

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiration time |
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `UPLOAD_DIR` | No | `uploads` | Image upload directory |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3001` | Backend API URL |

## Common Commands

```bash
# Backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests with coverage
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Docker
docker compose up -d           # Start all services
docker compose down            # Stop all services
docker compose logs -f         # View logs
docker compose exec backend sh # Access backend container
```

## Troubleshooting

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker compose ps

# Restart database
docker compose restart db

# Check logs
docker compose logs db
```

### Port Already in Use
```bash
# Find process using port
lsof -i :3001  # or :3000

# Kill process
kill -9 <PID>
```

### Prisma Client Not Generated
```bash
cd backend
npx prisma generate
```

### Fresh Start
```bash
# Stop and remove everything
docker compose down -v

# Remove node_modules
rm -rf backend/node_modules frontend/node_modules

# Start fresh
npm install  # in both directories
docker compose up -d
```

---

## License

MIT
