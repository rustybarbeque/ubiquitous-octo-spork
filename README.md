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
  Macrocenter.Api/             Controllers, DTOs, services, auth, DI — the web layer
  Macrocenter.Domain/          Entities, enums, and pricing rules, no infrastructure
  Macrocenter.Infrastructure/  EF Core DbContext, configurations, migrations, seeding
  Macrocenter.Api.Tests/       xUnit tests
```

Dependencies point one direction only: `Api → Infrastructure → Domain`. Requests
flow `Controllers → Services → DbContext`, and DTOs — never EF entities — cross
the HTTP boundary.

The API is a conventional controller-based ASP.NET Core Web API. Seven tables
(`users`, `items`, `carts`, `cart_items`, `discount_codes`, `orders`,
`order_lines`), JWT bearer authentication with an `Admin` role, RFC 7807 problem
responses, and the same paged envelope on every list endpoint.

The one idea worth knowing before reading any of it: **a cart stores no prices.**
Cart rows hold only an item id and a quantity, and every figure is recalculated
from the live product and discount rows on each read — which is why an
administrator's price change or new sale appears instantly in carts that already
exist. Prices freeze exactly once, at checkout, onto the order. So a cart is a
live query and an order is an immutable receipt.

Full write-ups:

| Document | Contents |
| --- | --- |
| [`docs/architecture.md`](docs/architecture.md) | Data model, relationships, pricing rules, auth, and the deliberate shortcuts |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | Every endpoint, with request and response examples |
| [`docs/TEAMMATE_TASKS.md`](docs/TEAMMATE_TASKS.md) | The two teammate assignments |

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

On startup in Development the API **applies any pending migrations and seeds
the database itself**, so there is nothing to run by hand. You get the same
twelve products the storefront shows, two discount codes, and two accounts:

| Email | Password | Role |
| ----- | -------- | ---- |
| `admin@macrocenter.test` | `admin` | Admin |
| `student@macrocenter.test` | `password` | Customer |

Seeded discount codes are `SAVE10` (10% off) and `TAKE25` ($25 off orders of
$100 or more). Passwords are stored in plaintext on purpose — see the
deliberate shortcuts in [`docs/architecture.md`](docs/architecture.md).

The quickest way to drive the API is Swagger UI at
<http://localhost:8080/swagger>: call `POST /auth/login` with one of the
accounts above, copy the `token` from the response, then click **Authorize** and
paste it in.

### Database migrations

Seeding and migrating happen automatically, so you only need these commands
when you are **changing the schema**. The EF Core CLI comes from a tool
manifest in the repository, so everyone gets the same version:

```
dotnet tool restore
```

Then, after editing entities or their configurations:

```
dotnet ef migrations add YourMigrationName --project backend/Macrocenter.Infrastructure --startup-project backend/Macrocenter.Api
```

Restarting the API applies it. To apply one against the containerized database
from your own machine instead:

```
docker compose up -d db
dotnet ef database update --project backend/Macrocenter.Infrastructure --startup-project backend/Macrocenter.Api
```

To wipe the database and reseed from scratch:

```
docker compose down -v
docker compose up --build
```

One Windows gotcha: while the `api` container is running, it shares the backend
folder and keeps rewriting the `obj/` directories for Linux, which can make a
host-side `dotnet ef` command fail with `NETSDK1064`. Either stop the container
first (`docker compose stop api`), or just let the container apply the
migration for you by restarting it.


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

The build should report `0 Error(s)`, and the tests:

```
Failed: 0, Passed: 60, Skipped: 7
```

**The seven skipped tests are expected.** They are the pre-written
specifications for the two teammate assignments below, and they stay skipped
until someone picks those up. With both assignments done it reads
`Passed: 67, Skipped: 0`.

In Visual Studio, use Build → **Rebuild Solution** and Test → **Run All
Tests**.

The tests cover the business logic — cart line math, sale pricing, discount
rules and amounts, sales tax, cart totals, and the paging envelope. They need
no database and no running containers, and the whole suite finishes in well
under a second.

**6. Does the API actually work end to end?**

Open <http://localhost:8080/swagger>, authorize as the seeded customer, and:

```
GET  /items?q=rtx&sort=price-asc     a paged catalog, with stock and sale prices
POST /cart/items                     add something to the cart
GET  /cart                           subtotal, discount, tax, and total, all computed
POST /cart/discount                  apply SAVE10 and watch the total drop
POST /orders                         place the order; the cart empties, stock drops
```

Two behaviors are worth checking deliberately, because they are the point of
the whole design:

- **Order history does not move.** Note a line's `unitPrice` on a placed order,
  change that product's price as an admin, then re-read the order. The recorded
  price is unchanged.
- **Cart pricing is live.** Put something in a cart, change its sale price as an
  admin, then re-read the cart. The new price is already there.

### The two teammate assignments

This is a group project, and two small tasks are deliberately left open for
teammates who are newer to full-stack work. Each is **one method that already
works**; the task is a single specific improvement to it, with the expected
behavior already written as skipped tests.

| Task | File | Method |
| --- | --- | --- |
| 1. A sale price should actually be a discount | `backend/Macrocenter.Domain/Pricing/CartCalculator.cs` | `IsOnSale` |
| 2. Round sales tax the way a cash register does | `backend/Macrocenter.Domain/Pricing/SalesTaxCalculator.cs` | `CalculateTax` |

Find them by searching the repository for `TEAM TASK`. Each one is marked with
a comment banner saying what to implement and which tests to un-skip.

**Read [`docs/TEAMMATE_TASKS.md`](docs/TEAMMATE_TASKS.md) first** — it has the
expected inputs and outputs for both, and a step-by-step checklist.

These are genuine but small contributions, not missing features. The site works
correctly whether or not either is finished, and the test suite is green before
and after.

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
| `dotnet ef` is not a recognized command | Run `dotnet tool restore` from the repository root. |
| `dotnet ef` fails with `NETSDK1064: Package ... was not found` | The running `api` container keeps rewriting `obj/` for Linux. Either `docker compose stop api` then `dotnet restore backend/Macrocenter.slnx`, or let the container apply the migration with `docker compose restart api`. |
| `dotnet test` reports 7 skipped tests | Expected — those are the two teammate assignments. See above. |
| A request returns 401 | No bearer token. Sign in via `POST /auth/login` and send `Authorization: Bearer <token>`. |
| A request returns 403 | The token is valid but belongs to a customer, and the endpoint needs an administrator. |

---

## Contributing

One feature branch per module, opened as a pull request and reviewed before it
merges to `main`.

| Document | Read it for |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | The coding conventions this project follows |
| [`docs/architecture.md`](docs/architecture.md) | The data model, pricing rules, auth, and why each decision was made |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | The endpoint-by-endpoint API contract |
| [`docs/TEAMMATE_TASKS.md`](docs/TEAMMATE_TASKS.md) | The two open teammate assignments |

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
