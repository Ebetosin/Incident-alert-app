# Incident Alert Hub

A production-grade incident monitoring and alerting platform featuring real-time WebSocket notifications, webhook ingestion from external monitoring systems, and full incident lifecycle management.

## Architecture

```
Client (React) → Nginx LB → Spring Boot API → PostgreSQL / Redis
       ↑                          │
       └─── WebSocket (STOMP) ────┘
```

## Tech Stack

| Layer         | Technology                               |
|---------------|------------------------------------------|
| Frontend      | React 19, Vite 6, SockJS/STOMP           |
| Backend       | Java 21, Spring Boot 3.3, Spring WebSocket |
| Database      | PostgreSQL 16                            |
| Cache         | Redis 7                                  |
| Blob Storage  | MinIO (S3-compatible)                    |
| Load Balancer | Nginx                                    |
| Containers    | Docker, Docker Compose                   |
| Orchestration | Kubernetes                               |
| API Docs      | SpringDoc OpenAPI / Swagger UI           |

## Key Features

- **Real-time alerts** — WebSocket push via STOMP for live incident board updates
- **Webhook ingestion** — `/api/webhooks/alerts` endpoint for Prometheus, Grafana, PagerDuty etc.
- **Incident lifecycle** — Status transitions: OPEN → ACKNOWLEDGED → INVESTIGATING → RESOLVED → CLOSED
- **Severity classification** — LOW, MEDIUM, HIGH, CRITICAL with visual indicators
- **Pagination** — Paginated API responses with configurable page size
- **Rate limiting** — Redis-backed per-IP rate limiting with graceful degradation
- **Input validation** — Bean Validation on all request DTOs
- **Global error handling** — Consistent error responses via `@RestControllerAdvice`
- **Health monitoring** — Spring Actuator endpoints for health, metrics, and Prometheus
- **Graceful shutdown** — Configurable shutdown phase for zero-downtime deploys

## Quick Start

### With Docker Compose
```bash
cd backend/infra
docker compose up --build
```
- **UI:** http://localhost:81
- **Swagger:** http://localhost:81/swagger
- **API:** http://localhost:81/api/incidents
- **Health:** http://localhost:81/actuator/health

### Local Development
```bash
# Backend
cd backend && ./mvnw spring-boot:run

# Frontend
cd frontend && npm install && npm run dev
```

## API Endpoints

| Method  | Path                          | Description                  |
|---------|-------------------------------|------------------------------|
| GET     | `/api/incidents?page=0&size=20` | List incidents (paginated)  |
| GET     | `/api/incidents/{id}`          | Get incident by ID           |
| POST    | `/api/incidents`               | Create incident              |
| PATCH   | `/api/incidents/{id}/status`   | Update incident status       |
| POST    | `/api/webhooks/alerts`         | Receive external alert       |
| GET     | `/actuator/health`             | Health check                 |

## Project Structure

```
backend/
├── src/main/java/com/ebenn/incidenthub/
│   ├── config/          # CORS, WebSocket, Rate limiting
│   ├── controller/      # REST endpoints
│   ├── dto/             # Request/Response DTOs with validation
│   ├── exception/       # Global exception handling
│   ├── model/           # JPA entities, enums
│   ├── repo/            # Spring Data JPA repositories
│   └── service/         # Business logic layer
├── infra/
│   ├── docker-compose.yml
│   ├── nginx/nginx.conf
│   └── k8s/app.yaml
└── docs/
    ├── swagger.yaml
    └── README.md

frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── App.jsx
│   └── styles.css
└── Dockerfile
```
