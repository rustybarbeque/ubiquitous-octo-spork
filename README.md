# Macrocenter

A full-stack e-commerce site for computer parts — a comedic spoof of Micro Center.
Group 8, Software Engineering.

**Stack:** Next.js 16 (TypeScript/React) · ASP.NET Core 10 Web API (C#) ·
PostgreSQL 17 · Docker Compose

---

## How it fits together

Three containers, started together by Docker Compose:

```
browser  ──>  web   (Next.js, :3000)
              │
              └──>  api  (ASP.NET Core, :8080)  ──>  db  (Postgres, :5432)
                                                      │
                                                   pgdata volume
```

- **`web`** serves the storefront. It talks to the API at `NEXT_PUBLIC_API_URL`
  from the browser, and at `API_URL` (`http://api:8080`) from server components.
  It currently renders from mock data in `frontend/lib/mock-data.ts` and does not
  call the API yet.
- **`api`** is the only thing that touches the database. It finds Postgres at
  hostname `db` — Compose gives every service a DNS name on its private network,
  so no IP addresses are ever hardcoded.
- **`db`** stores its data in the named volume `pgdata`, which survives
  `docker compose down`. Only `docker compose down -v` deletes it.

Startup is ordered: `api` waits for `db` to pass its `pg_isready` healthcheck
before it starts, so the API never comes up against a database that is not
accepting connections yet. The API then has its own healthcheck on `/health`.

All configuration is environment variables, read from `.env`. Nothing is
hardcoded, which is what keeps the stack portable to a cloud host later.

### Backend layout

```
backend/
  Macrocenter.Api/             Controllers, DTOs, DI setup — the web layer
  Macrocenter.Domain/          Entities and domain rules, no infrastructure
  Macrocenter.Infrastructure/  EF Core DbContext, configurations, migrations
  Macrocenter.Api.Tests/       xUnit tests
```

Dependencies point one direction only: `Api → Infrastructure → Domain`. Requests
flow `Controllers → Services → DbContext`, and DTOs — never EF entities — cross
the HTTP boundary.

---

## A note on shells

Commands below are written to work **as-is in Windows PowerShell** (including the
Developer PowerShell terminal inside Visual Studio), Command Prompt, and Git Bash.

One Windows gotcha worth knowing: in Windows PowerShell, **`curl` is an alias for
`Invoke-WebRequest`**, not the real curl. So a normal curl command fails:

```
PS> curl -I http://localhost:3000
Cannot process command because of one or more missing mandatory parameters: Uri.
```

Write **`curl.exe`** instead. That bypasses the alias and runs the real curl that
ships with Windows, and it behaves identically in every shell. Every command in
this README uses `curl.exe` for that reason.

---

## Local development

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes
  Docker Compose). This is the only hard requirement — the containers carry the
  .NET SDK and Node.
- Optionally the [.NET 10 SDK](https://dotnet.microsoft.com/download) and
  [Node 22+](https://nodejs.org/), if you want to build or run either app outside
  of Docker. Visual Studio 2022+ works too.

### First run

Create your local environment file — never commit it:

```
Copy-Item .env.example .env     # PowerShell
cp .env.example .env            # Git Bash / macOS / Linux
```

Then build and start all three services:

```
docker compose up --build
```

| Service    | URL                           |
| ---------- | ----------------------------- |
| Frontend   | http://localhost:3000         |
| API        | http://localhost:8080         |
| API health | http://localhost:8080/health  |
| Swagger UI | http://localhost:8080/swagger |
| Postgres   | `localhost:5432`              |

A cold first run takes a little longer, because the API waits for Postgres to
report healthy before it starts.

### Everyday commands

```
docker compose up                 # start (hot reload for both apps)
docker compose up --build         # rebuild images first
docker compose down               # stop; database contents are kept
docker compose down -v            # stop and DELETE the database volume
docker compose logs -f api        # follow one service's logs
docker compose ps                 # service + healthcheck status
```

`docker compose up` applies `docker-compose.override.yml` automatically, which
bind-mounts the source and runs `dotnet watch` and `next dev` so your edits are
picked up live. To run the production-shaped images instead:

```
docker compose -f docker-compose.yml up --build
```

### Running the API outside Docker (Visual Studio F5)

The API can run on your machine against the containerized database. Start the
database first — it publishes port 5432 to the host:

```
docker compose up -d db
```

Then press **F5** in Visual Studio with the `http` profile, or:

```
dotnet run --project backend/Macrocenter.Api
```

The API comes up on http://localhost:5203, with Swagger at
http://localhost:5203/swagger. The localhost connection string lives in
`backend/Macrocenter.Api/appsettings.Development.json`; Compose overrides it via
`ConnectionStrings__DefaultConnection`, so the containerized API still reaches
the `db` service instead.

---

## Verifying everything works

Five checks. If all five pass, the project is working.

**1. Does the whole stack come up?**

```
docker compose up --build -d
docker compose ps
```

`db` and `api` should both report `(healthy)`:

```
NAME                SERVICE   STATUS
macrocenter-api-1   api       Up 2 minutes (healthy)
macrocenter-db-1    db        Up 2 minutes (healthy)
macrocenter-web-1   web       Up 2 minutes
```

**2. Can the API reach the database?**

```
curl.exe http://localhost:8080/health
```

```json
{"status":"healthy","database":"reachable"}
```

**3. Does the frontend serve?**

```
curl.exe -I http://localhost:3000
```

Expect `HTTP/1.1 200 OK`. Or just open http://localhost:3000 in a browser — you
should see the storefront with product cards.

**4. Does `/health` actually detect a broken database?**

This proves the check is real rather than always reporting success.

```
docker compose stop db
curl.exe -i http://localhost:8080/health
```

```
HTTP/1.1 503 Service Unavailable
{"status":"unhealthy","database":"unreachable"}
```

Then bring it back:

```
docker compose start db
curl.exe http://localhost:8080/health
```

It returns to `{"status":"healthy","database":"reachable"}` within a few seconds.

**5. Do the backend build and tests pass?**

```
dotnet build backend/Macrocenter.slnx
dotnet test backend/Macrocenter.slnx
```

Both should report `0 Error(s)` and all tests passing. In Visual Studio, use
Build → **Rebuild Solution** and Test → **Run All Tests**.

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Cannot process command because of one or more missing mandatory parameters: Uri` | You ran `curl` in PowerShell, where it is an alias for `Invoke-WebRequest`. Use `curl.exe` instead. |
| `ConnectionStrings:DefaultConnection is not configured` | Running outside Development with no connection string. Use Docker Compose, or set `ASPNETCORE_ENVIRONMENT=Development`. |
| API cannot reach the database on F5 | The database container is not running: `docker compose up -d db`. |
| Visual Studio build errors after a `git pull` or branch switch | Build → **Clean Solution**, then **Rebuild Solution**. Stale `bin/`/`obj/` is the usual cause. |
| Visual Studio shows an old version of a file | It caches open tabs. Close and reopen the file. Also confirm you are on the branch you expect: `git branch --show-current`. |
| Port already in use | Change `WEB_PORT`, `API_PORT`, or `POSTGRES_PORT` in `.env`, then `docker compose up -d`. |
| "The current user is not in the docker-users group" | Add your Windows account to the local **docker-users** group, then sign out and back in. |
| Frontend shows stale content | `docker compose down`, then `docker compose up --build web`. |

---

## Contributing

One feature branch per module, opened as a pull request and reviewed before it
merges to `main`. See `CLAUDE.md` for the coding conventions this project
follows, and `docs/architecture.md` for the architecture write-up.

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
