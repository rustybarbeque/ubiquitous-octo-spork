# Macrocenter

A full-stack e-commerce site for computer parts — a comedic spoof of Micro Center.
Group 8, Software Engineering.

**Stack:** Next.js 16 (TypeScript/React) · ASP.NET Core 10 Web API (C#) ·
PostgreSQL 17 · Docker Compose

---

## Local development

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes
  Docker Compose). This is the only hard requirement — the containers carry the
  .NET SDK and Node.
- Optionally the [.NET 10 SDK](https://dotnet.microsoft.com/download) and
  [Node 22+](https://nodejs.org/), if you want to build or run either app outside
  of Docker.

> **Common Docker Desktop error on Windows:** *"The current user is not in the
> docker-users group."* Add your Windows account to the local **docker-users**
> group, then sign out and back in.

### First run

```sh
# 1. Create your local environment file (never commit it)
cp .env.example .env            # PowerShell: Copy-Item .env.example .env

# 2. Build and start all three services
docker compose up --build
```

| Service    | URL                             |
| ---------- | ------------------------------- |
| Frontend   | http://localhost:3000           |
| API        | http://localhost:8080           |
| API health | http://localhost:8080/health    |
| Swagger UI | http://localhost:8080/swagger   |
| Postgres   | `localhost:5432`                |

`GET /health` returns `{"status":"healthy","database":"reachable"}` once the API
has connected to Postgres, and `503` if it cannot. The API waits for the database
to pass its own healthcheck before starting, so a cold first run is expected to
take a few seconds longer.

### Everyday commands

```sh
docker compose up                 # start (hot reload for both apps)
docker compose up --build         # rebuild images first
docker compose down               # stop; database contents are kept
docker compose down -v            # stop and DELETE the database volume
docker compose logs -f api        # follow one service's logs
docker compose ps                 # service + healthcheck status
```

`docker compose up` applies `docker-compose.override.yml` automatically, which
bind-mounts the source and runs `dotnet watch` and `next dev` for hot reload. To
run the production-shaped images instead:

```sh
docker compose -f docker-compose.yml up --build
```

### Ports already in use?

Every published port is configurable in `.env` — `WEB_PORT`, `API_PORT`,
`POSTGRES_PORT`. Change the value and `docker compose up -d` again.

---

## Repository layout

```
backend/
  Macrocenter.Api/             ASP.NET Core Web API — controllers, DTOs, DI setup
  Macrocenter.Domain/          Entities and domain rules, no infrastructure
  Macrocenter.Infrastructure/  EF Core DbContext, configurations, migrations
  Macrocenter.Api.Tests/       xUnit tests
frontend/                      Next.js 16 App Router, Ant Design, Tailwind
docs/architecture.md           Architecture, data model, pricing and API conventions
docker-compose.yml             Production-shaped stack: web, api, db
docker-compose.override.yml    Development overrides (hot reload)
```

---

## Contributing

One feature branch per module, opened as a pull request and reviewed before it
merges to `main`.

## Project goals

Develop an online shopping site that can perform the following:

- Intuitive UI/UX, delivered as a web application
- Database driven
- **Create/modify user information** — registration, and letting users change
  their account information
- **Create/modify items for sale** — images, price, and the available quantity
  shown *on the main sale page*, not only after clicking through to detail;
  plus the ability to add new items
- **Search** by item/description, sort by price, sort by availability
- **Create/modify shopping cart** — show items in the cart, calculate tax at
  8.25%, display discount codes and the amount discounted, indicate when a price
  is a sale price, and show an order summary that can be placed as an order
- **Administrative back end** — a dedicated admin UI that can modify all items,
  create discount codes and sale items (both reflected in the shopping cart),
  modify users, show currently placed orders, and show order history sortable by
  order date, customer, and order size in dollars

Hosting on the cloud is worth extra credit and is tracked as a stretch goal.
