# Hiro Labs Web

Admin site for the Hiro Labs team.

## Stack

- **Frontend**: React 18 + TypeScript (Vite)
- **Backend**: Fastify + TypeScript
- **Database**: PostgreSQL 16 (Prisma ORM)
- **Deployment**: Docker Compose (Nginx + Node + Postgres)

## Repo Structure

```
client/   — React frontend
server/   — Fastify backend
```

Monorepo managed with npm workspaces.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for containerized setup or local Postgres)

## Local Setup

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start Postgres (if you don't have one running locally)
docker compose up db -d

# Run database migrations
npm run db:migrate

# Start dev servers (client on :5173, server on :3001)
npm run dev
```

Visit `http://localhost:5173` — the page will show the API health status.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start client + server with hot reload |
| `npm run build` | Build both packages |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run docker:up` | Build and start all Docker containers |
| `npm run docker:down` | Stop all containers |

## Docker (Production)

```bash
npm run docker:up
```

This starts three containers:
- **db** — PostgreSQL 16 on :5432
- **server** — Fastify API on :3001 (auto-runs migrations on start)
- **client** — Nginx on :80 (serves React app, proxies `/api/*` to server)

## Environment Variables

See `.env.example` for required variables:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/hiro_labs` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
