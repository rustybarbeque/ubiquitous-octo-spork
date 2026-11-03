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
hardcoded.

### Backend layout

```
backend/
  Macrocenter.Api/             Controllers, DTOs, services, auth, DI — the web layer
  Macrocenter.Domain/          Entities, enums, and pricing rules, no infrastructure
  Macrocenter.Infrastructure/  EF Core DbContext, configurations, migrations, seeding
  Macrocenter.Api.Tests/       xUnit tests
```

Dependencies point one direction only: `Api → Infrastructure → Domain`. Requests
flow `Controllers → Services → DbContext`, and DTOs (never EF entities) cross
the HTTP boundary.

The API is a controller-based ASP.NET Core Web API. Seven tables
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

## Local development

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes
  Docker Compose). This is the only hard requirement — the containers carry the
  .NET SDK and Node.
- OPTIONALLY the [.NET 10 SDK](https://dotnet.microsoft.com/download) and
  [Node 22+](https://nodejs.org/), if you want to build or run either app outside
  of Docker (I don't recommend).

### First run

Create your local environment file, PLEASE never commit it:

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

The first run right take awhile because the API needs to make sure it can connect to the database.

On startup in Development the API **applies any pending migrations and seeds
the database itself**, so there is nothing to run by hand. You get the same
twelve products the storefront shows, two discount codes, and two accounts. Let's not change these to make devleopment between us easier (migrations are a pain).

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
paste it in. See [Testing the API](#testing-the-api) for the token flow in full,
and for the API client worth installing.

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

### Running the API outside Docker (Not Recommended)

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

## Testing the API

Almost every endpoint makes you sign in first, and that is the single thing that
trips everyone up. Here is the whole pattern.

Almost every endpoint requires you to sign in first to see if you have authorization first. This can make testing tricky if you don't undertand. Here is how to use the API with authentication.

### Which endpoints are open

| Endpoints | Who can call them |
| --- | --- |
| `/health`, `GET /items`, `GET /items/categories`, `GET /items/{id}` | Anyone, no token needed |
| `GET /auth/me`, all of `/cart`, all of `/orders`, `PUT /users/me` | Any signed-in user |
| All of `/admin/orders` and `/discount-codes`, the rest of `/users`, and the `POST`/`PUT`/`DELETE` writes on `/items` | Administrators only |

This is why typing <http://localhost:8080/users> into a browser returns `401`
instead of a list of users — a browser address bar cannot attach a token. It is
the API working correctly, not a bug. Open <http://localhost:8080/items>
instead and you get JSON immediately, because the catalog is public.

### Step 1 — trade your password for a token

Send one of the seeded accounts above to `POST /auth/login`:

```
POST http://localhost:8080/auth/login
Content-Type: application/json

{
  "email": "admin@macrocenter.test",
  "password": "admin"
}
```

You get back a token, when it expires, and who you are:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1... (about 400 characters in all) ...JXwpQlcgYFRthjOdigObnxLyJO9V9hwOcY0slYkAWjE",
  "expiresAt": "2026-12-02T22:09:14.5186962+00:00",
  "user": {
    "id": "01a19e1b-57f4-7803-810f-c10daf3c731b",
    "email": "admin@macrocenter.test",
    "fullName": "Ada Admin",
    "role": "Admin",
    "isAdmin": true
  }
}
```

### What the token is

A JSON Web Token: one long string, roughly 400 characters, in three parts
separated by dots.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwL... . JXwpQlcgYFRthjOdigObnxLyJO9V9hwOcY0slYkAWjE
└──────────── header ──────────────┘   └──────── payload ───────────────┘   └──────────── signature ─────────────────┘
```

The middle part is only Base64-encoded, not encrypted, so you can paste the
whole token into <https://jwt.io> and read what it says. Inside are your user
id, your email, your **role**, and an expiry. That role claim is exactly how
`[Authorize(Roles = "Admin")]` decides whether to let you through, so an admin
token and a customer token behave differently on the same URL.

Three practical notes:

- **It lasts 30 days** (`expiresAt` tells you when), so you get one per project
  session, not one per request.
- **There are no refresh tokens.** When it expires, log in again.
- **Copy the whole thing** — no quotes around it, no line breaks in the middle.
  A truncated token fails the same way a missing one does.

### Step 2 — send it on every other request

Add one header. The word `Bearer`, a single space, then the token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRw...
```

That is the entire mechanism. From PowerShell:

```
curl.exe http://localhost:8080/users -H "Authorization: Bearer eyJhbGciOi..."
```

### Reading what comes back

| Status | What it means | What to do |
| --- | --- | --- |
| `401 Unauthorized` | No token, a malformed one, or an expired one | Log in and add the `Authorization` header |
| `403 Forbidden` | Your token is valid, but you are a customer and the endpoint needs an admin | Log in as `admin@macrocenter.test` |
| `400 Bad Request` | Your JSON failed validation | Read the `errors` object in the response; it names the offending fields |
| `404 Not Found` | No row with that id | Re-read the id from a list endpoint; ids are GUIDs and easy to mistype |

Telling `401` from `403` is the useful habit here: `401` means "I don't know who
you are", `403` means "I know who you are and you may not do this."

### Pick a tool

#### Bruno (I recommend Bruno)

[Bruno](https://www.usebruno.com) is a free, open-source API client. It is the
one worth installing: no account or sign-in, it works entirely offline, and it
stores a collection as plain text files you can store on your computer so you can save and reuse them easily

First-time setup, about two minutes:

1. **Collection** → New Collection, name it `Macrocenter`.
2. Create an **Environment** called `Local` with a variable
   `baseUrl` = `http://localhost:8080`, and an empty one called `token`.
3. New request, `POST`, URL `{{baseUrl}}/auth/login`, Body → JSON, paste the
   login body from Step 1. Send it.
4. Copy the `token` from the response into the `token` environment variable.
5. On every other request, open the **Auth** tab, choose **Bearer Token**, and
   enter `{{token}}`.

Now switching between admin and customer is just editing one variable.

You can also skip step 4 permanently. Put this in the login request's
**Script → Post Response** tab and the token stores itself every time you log
in:

```js
bru.setEnvVar("token", res.body.token);
```

#### Swagger UI (runs in browser, you don't have to install)

Already running at <http://localhost:8080/swagger>. Call `POST /auth/login`,
copy the `token`, click the **Authorize** button at the top right, and paste it
in. Every request on the page then carries it.

One gotcha: paste the **raw token with no `Bearer ` prefix**. Swagger adds that
itself, and `Bearer Bearer eyJ...` is a `401`.

Swagger is the fastest way to explore, since it lists every endpoint with its
documentation and example bodies. It is clumsier than Bruno for repeating a
sequence of calls.

You also can't save your work nearly as easy.

#### The `.http` files in this repo

Checked in at `backend/Macrocenter.Api/http/`, one request per endpoint:

| File | Contents |
| --- | --- |
| `customer.http` | The public and customer endpoints — auth, catalog, cart, orders, profile |
| `admin.http` | The admin-only endpoints — catalog writes, users, discount codes, order queue |

Open either one in Visual Studio and click **Send request** above any entry. Run
the login at the top first, then paste its token over `PASTE_TOKEN_HERE` in the
variables block; the rest of the file works off that. A few requests also need
an id — each has a comment naming the request whose response supplies it.

Visual Studio's `.http` editor cannot copy a value out of one response into the
next request, which is why the token is a manual paste. VS Code with the REST
Client extension can, if you prefer that.

This is more of a relic from an earlier time in development before I added authentication to the program, I'm leaving it in because it's an easy way to explore API endpoints and example requests.

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
