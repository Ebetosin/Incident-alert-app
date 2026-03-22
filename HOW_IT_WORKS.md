# Incident Alert Hub — How It Works

## Where Incidents Come From (3 Sources)

1. **Manual Creation** — The frontend has a form where you type a service name, severity, and message, then hit submit. That POSTs to `/api/incidents`.

2. **Event Simulator (Auto-Generated)** — A `@Scheduled` background job creates a realistic incident every ~45 seconds from a pool of 10 services (like `payments-api`, `auth-service`, `api-gateway`) with real-world messages (like "Response time exceeded 5000ms", "Database connection pool exhausted"). This is what makes the app look alive for your portfolio.

3. **External Webhooks** — Any system can POST to `/api/webhooks/alerts` with `{"service": "...", "severity": "...", "message": "..."}` and it creates an incident. This is how real monitoring tools (Datadog, PagerDuty, etc.) would integrate.

## Full Flow When an Incident Is Created

```
Source (form / simulator / webhook)
  ↓
POST /api/incidents (or /api/webhooks/alerts)
  ↓
IncidentServiceImpl.create()
  ├── Save to PostgreSQL
  ├── Log to audit table
  ├── Cache last ID in Redis
  ├── Evict dashboard stats cache
  └── Broadcast via WebSocket → ws.convertAndSend("/topic/incidents")
      ↓
  All connected browsers receive the message instantly
      ↓
  React hook (useIncidents) updates state → UI re-renders
```

## The Stack

| Layer | What It Does |
|-------|-------------|
| **React Frontend** | Login/register, create incidents, view live feed, dashboard analytics |
| **WebSocket (STOMP/SockJS)** | Real-time push — every browser sees new incidents instantly without refreshing |
| **Spring Boot REST API** | CRUD operations, JWT auth, rate limiting |
| **Redis** | Caches dashboard stats (30s), caches individual incidents (3min), rate limits IPs (100 req/min) |
| **PostgreSQL** | Stores all incidents, users, audit logs permanently |
| **Event Simulator** | Generates realistic demo data so the app looks active |

## What a Visitor to Your Portfolio Sees

1. They open the app → login/register page
2. They register → land on the incidents feed
3. Incidents are already flowing in (simulator creates one every 45 seconds)
4. They see them appear in real-time (WebSocket, no page refresh)
5. They can create their own incidents via the form
6. They can change incident status (OPEN → ACKNOWLEDGED → INVESTIGATING → RESOLVED)
7. They click "Dashboard" → see live stats (total, open, critical, resolved today, breakdown by status/severity/service)
8. All status changes are audit-logged

## API Endpoints

### Auth
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login (returns JWT token)
- `GET /api/auth/me` — Get current user info

### Incidents
- `GET /api/incidents` — List incidents (paginated, filterable by `status`, `severity`, `search`)
- `GET /api/incidents/{id}` — Get single incident
- `POST /api/incidents` — Create incident (authenticated)
- `PATCH /api/incidents/{id}/status` — Update status (authenticated)

### Dashboard
- `GET /api/dashboard/stats` — Aggregated stats (cached in Redis for 30s)
- `GET /api/dashboard/audit-log` — Paginated audit trail

### Webhooks
- `POST /api/webhooks/alerts` — Receive external alerts (no auth required)

## Configuration

### Event Simulator
The simulator is **enabled by default**. To disable:
```properties
app.simulator.enabled=false
```
Or via environment variable:
```bash
SIMULATOR_ENABLED=false
```

### Redis
Default local config (Homebrew):
```properties
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=<set-locally-if-needed>
```
The app works without Redis — caching and rate limiting degrade gracefully.

### Database
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/<your-db-name>
spring.datasource.username=<your-db-user>
spring.datasource.password=<your-db-password>
```

### Local-only secrets
Keep real values only in ignored local files:
```text
backend/src/main/resources/application.properties
backend/infra/.env
```

## Running the App

```bash
# 1. Start Redis (optional but recommended)
brew services start redis

# 2. Start the backend
cd backend
./mvnw spring-boot:run

# 3. Start the frontend
cd frontend
npm install && npm run dev
```

Frontend runs on `http://localhost:5180`, backend on `http://localhost:8090`.
