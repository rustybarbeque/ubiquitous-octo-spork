# Architecture

See `README.md` for setup and the graded project goals, `CLAUDE.md` for coding
conventions, `docs/API_CONTRACT.md` for the endpoint-by-endpoint contract, and
`docs/TEAMMATE_TASKS.md` for the two teammate assignments.

## The three services

Docker Compose runs `web` (Next.js), `api` (ASP.NET Core), and `db`
(Postgres 17) on a private network. The API reaches Postgres at the hostname
`db` — Compose gives every service a DNS name, so no address is ever
hardcoded. `api` waits for `db` to pass a `pg_isready` healthcheck before it
starts, and then reports its own health at `/health`.

Every setting comes from environment variables sourced from `.env`: the
connection string, the JWT signing key, and the allowed CORS origins.

## Backend project layout

```
backend/
  Macrocenter.Domain/          Entities, enums, and pricing rules. No EF, no HTTP.
  Macrocenter.Infrastructure/  DbContext, entity configurations, migrations, seeder.
  Macrocenter.Api/             Controllers, DTOs, services, auth, DI.
  Macrocenter.Api.Tests/       xUnit tests.
```

Dependencies point one way only: `Api -> Infrastructure -> Domain`. Requests
flow `Controllers -> Services -> MacrocenterDbContext`, and DTOs — never EF
entities — cross the HTTP boundary.

Why the separation earns its keep here: `Domain` has no package references at
all, which is what lets the pricing rules be tested by constructing a class
with `new` and no database in sight. `Infrastructure` is the only project that
knows Postgres exists.

Services live in `Macrocenter.Api/Services/` and are registered as **concrete
classes, not behind interfaces**. There is exactly one implementation of each,
and the logic worth testing lives in `Macrocenter.Domain/Pricing`, which needs
no container — so an interface per service would be ceremony with no payoff.

## The data model

Seven tables. Table and column names are `snake_case`, produced automatically
by `UseSnakeCaseNamingConvention()`.

```
users ──1:1── carts ──1:*── cart_items ──*:1── items
  │             │                                 │
  │             └──*:1(optional)── discount_codes │
  │                                               │
  └──1:*── orders ──1:*── order_lines ──*:0..1────┘
```

| Table | What it holds |
| --- | --- |
| `users` | Accounts. `role` is `Customer` or `Admin` and is the only admin flag. `email` is unique and stored lowercased. |
| `items` | Products: price, optional `sale_price`, stock, image URL, free-form `category`. `is_deleted` archives a product without destroying it. |
| `carts` | One per user. Holds **no money at all** — only a link to the user and an optional applied discount code. |
| `cart_items` | An item id and a quantity. Unique on `(cart_id, item_id)`, so re-adding a product increments it. |
| `discount_codes` | `Percentage` or `FixedAmount`, an optional minimum subtotal, an optional date window, and an `is_active` kill switch. |
| `orders` | A placed order with **frozen** subtotal, discount, tax, total, tax rate, discount details, and customer name and email. |
| `order_lines` | A **frozen snapshot** of each product purchased, including the price charged. |

### Delete behavior, and why each one

| Relationship | On delete | Reason |
| --- | --- | --- |
| `users` → `carts` | Cascade | A cart is scratch space with no historical value. |
| `carts` → `cart_items` | Cascade | Lines belong to the cart. |
| `items` → `cart_items` | Cascade | A deleted product should vanish from live carts, never cause an error. |
| `carts` → `discount_codes` | Set null | Deleting a code must not delete carts; they just recompute without it. |
| `users` → `orders` | **Restrict** | **Orders are never deleted.** The database refuses, and the API turns that into a 409. |
| `orders` → `order_lines` | Cascade | Lines are physically part of the order. Nothing deletes orders, so this never fires. |
| `items` → `order_lines` | Set null | Order history survives a product being removed entirely. |

`orders` deliberately has **no foreign key** to `discount_codes`. It keeps a
copy of the code text, kind, and value instead. An administrator editing or
deleting a code must have no reach into order history.

### Constraints and indexes

Unique: `users.email`, `carts.user_id` (this is what enforces one cart per
user), `discount_codes.code`, and `cart_items(cart_id, item_id)`.

Check constraints keep nonsense out at the database level: non-negative prices
and stock on `items`, positive discount values, and positive quantities on both
`cart_items` and `order_lines`.

Indexes exist where the application actually sorts and filters: `items(name)`,
`items(quantity_available)`, a composite `items(is_deleted, category)` for the
catalog hot path, and on `orders` the `placed_at`, `total`, `customer_name`,
and `status` columns — exactly the set the administrative order list sorts by.

Money is `decimal` in C# and `numeric(10,2)` in Postgres, never `float` or
`double`. The one exception is `orders.tax_rate_percent`, which is
`numeric(5,3)` because `8.250` is a rate, not an amount. Timestamps are
`DateTimeOffset` / `timestamptz`; Npgsql rejects a `DateTime` whose `Kind` is
not UTC, and `DateTimeOffset` sidesteps that trap.

Enums are persisted as strings, so `select status from orders` reads `Shipped`
rather than `2`. They also travel as strings on the wire.

## Pricing is computed, never stored

This is the central idea of the backend, and the whole data model follows from
it.

A **cart** holds only item ids and quantities. Subtotal, per-line prices, sale
decisions, discount, tax, and total are all recalculated from the live `items`
and `discount_codes` rows on **every single read**. That is what makes an
administrator's price change, new sale, or edited discount code show up
immediately in carts that already exist — there is no stale copy to go stale.

An **order** is the opposite: a receipt. At checkout, and only at checkout,
every price is copied onto `orders` and `order_lines`. Each line keeps the
product's name, description, image, category, regular price, sale price, the
unit price actually charged, and whether it was on sale. Changing a product
afterwards cannot alter it.

So: **cart = live query, order = immutable receipt.** The only bridge between
them is `OrderService.PlaceOrderAsync`, which is the single place in the
application where a price stops being live.

Order-level totals (`subtotal`, `discount_amount`, `tax_amount`, `total`) are
stored even though the lines could almost reproduce them. Two reasons. Discount
and tax are order-level, so recomputing would mean snapshotting the code's kind
and value anyway and then re-running the arithmetic on historical inputs — more
code and more risk than storing four numbers. And the administrative "sort by
order total" requirement becomes a plain indexed `ORDER BY total` rather than a
sort over computed values.

The invariants, asserted at checkout and pinned by tests:

```
subtotal == SUM(line_subtotal)
total    == subtotal - discount_amount + tax_amount
```

### Business logic responsibilities

| Class | Responsibility |
| --- | --- |
| `Domain/Pricing/CartCalculator` | Is a line on sale, what is the unit price, what is the saving, what is the line subtotal. |
| `Domain/Pricing/SalesTaxCalculator` | The tax rate, and the tax on an amount. |
| `Api/Services/PricingService` | Prices a whole cart and validates discount codes. **Pure** — it takes loaded entities and a timestamp, and touches no database. |
| `Api/Services/CartService` | All cart database work. Loads, mutates, delegates every calculation to `PricingService`, maps to `CartDto`. |
| `Api/Services/OrderService` | Checkout, order history, status changes. Owns the freeze. |
| `Api/Services/ItemService` | Catalog search, sort, paging, and the administrative writes. |
| `Api/Services/DiscountCodeService` | Administrative CRUD over codes. |
| `Api/Services/UserService`, `AuthService` | Accounts, registration, sign-in. |

`PricingService` being pure is a deliberate testability choice: it is
constructed in tests as
`new PricingService(new CartCalculator(), new SalesTaxCalculator())`, which is
why this project needs no in-memory database provider and no mocking library.

### Discount rules

A cart references at most one discount code, by foreign key. Validation is four
checks in one pure function, `PricingService.ValidateDiscount`: the code is
active, it has started, it has not expired, and the subtotal meets its minimum.
The clock is a parameter, so every date rule is testable without waiting.

It is enforced at three points, which matters:

1. `POST /cart/discount` refuses a code that does not qualify, with a 400 that
   says why.
2. **Every `GET /cart` re-validates.** A code that was valid yesterday and
   expired overnight stops discounting and reports `status: "Expired"`, rather
   than quietly continuing to apply.
3. `POST /orders` validates once more. An invalidated code means the order is
   placed with no discount rather than failing checkout.

A discount can take an order to zero but never below it, so a $25 code on a $10
cart takes off $10 and nobody gets change. Tax is charged on the **discounted**
amount.

Deliberately not built: usage limits and per-user redemption counts. Those need
a redemption table and a concurrency story, which is a promotional rules engine
in disguise — explicitly out of scope.

## API conventions

- Controller-based, `[ApiController]` + `ControllerBase`. No Minimal APIs.
- Lowercase routes (`/items`, `/cart`, `/admin/orders`).
- Primary-constructor dependency injection; every data call takes a
  `CancellationToken`.
- DTOs are `record` types with data annotations. EF entities never go on the
  wire.
- Errors are RFC 7807 `ProblemDetails`. Services return a small
  `ServiceResult<T>` carrying `Ok` / `NotFound` / `Conflict` / `Invalid` /
  `Forbidden`, and `ControllerExtensions` maps that onto status codes — so
  exceptions are not used for ordinary control flow.
- **Every list endpoint returns the same paged envelope:**
  `{ items, page, pageSize, total, totalPages }`. Out-of-range paging values
  are clamped, not rejected.
- Searching and sorting are query parameters, never separate endpoints.
  "Current orders" versus "order history" is `?status=Pending,Paid` against
  `?status=Delivered,Cancelled`.

Catalog search deliberately mirrors what the storefront already does
client-side: a case-insensitive substring match over name and description, and
price sorting on the **effective** price (`COALESCE(sale_price, price)`), so a
product on sale sorts by what a customer would actually pay.

## Authentication

JWT bearer tokens. `POST /auth/login` returns a token; the role claim is
`Customer` or `Admin`, which makes `[Authorize(Roles = "Admin")]` work with no
custom policy. Public endpoints are the catalog reads and `/health`; carts and
orders require a signed-in user; everything administrative requires the `Admin`
role. A customer may read only their own orders — an administrator may read
any.

Registration always creates a `Customer`. Administrators are seeded or promoted
by an existing administrator through `PUT /users/{id}`.

## Deliberate shortcuts

This project is never deployed to production, and ease of development was
chosen over hardening. These were choices, not oversights:

- **Passwords are stored and compared in plaintext.** No hashing.
- **JWTs use a long-lived development signing key** from `.env`, with no
  refresh tokens and no issuer or audience validation. Compose supplies only
  `Jwt__Key`; `appsettings.json` carries a development default so that a plain
  `dotnet run` also works.
- **Migrations are applied automatically on API startup, in Development only**,
  along with seeding. A real deployment would keep control of its own schema.
- **No shipping address, payment, or shipping cost.** Checkout is "turn this
  cart into an order". Orders start `Pending` and an administrator advances the
  status.
- **Order status transitions are unvalidated.** `Pending` straight to
  `Delivered` is legal. A state machine would be overengineering here.

## Recorded decisions and assumptions

- **No guest carts.** A cart requires a signed-in user, enforced by the unique
  index on `carts.user_id`. Guest carts would need an anonymous-id cookie, a
  nullable `user_id` (which removes that index), a merge-on-login routine, and
  orphan cleanup. If they are wanted later the migration is additive.
- **Archiving, not restoring.** `DELETE /items/{id}` sets `is_deleted`. There
  is no `includeDeleted` query option and no restore endpoint; recovering an
  archived product is a database operation.
- **One discount code per cart.** No stacking.
- **Orders have no human-readable number**, only a GUID.
- **Inventory decrements at checkout, not at add-to-cart.** There are no
  reservations, so `CartDto` reports `exceedsAvailable` per line as a warning
  and checkout refuses with a 400 if stock moved underneath the customer.
- **Primary keys are `Guid`**, created with `Guid.CreateVersion7()`. Version 7
  GUIDs are time-ordered, so index locality is sane and the catalog's natural
  "relevance" order is insertion order.
- **The sales tax constant lives in `SalesTaxCalculator`**, not in
  `PricingService` as `CLAUDE.md` describes. The rate is still defined exactly
  once; it moved because a dedicated sales-tax class was wanted (see
  `docs/TEAMMATE_TASKS.md`), and `PricingService` is handed a configured
  instance of it.
- **Every list endpoint is paged, including the public catalog.** One
  consequence is worth knowing: the frontend's `Product[]` type expects a flat
  array, so `GET /items` is not a drop-in for it. Wiring the storefront to the
  API will mean reading `response.items` — a frontend change, which per
  `CLAUDE.md` needs to be agreed first. Nothing is broken today, because the
  frontend still renders from `frontend/lib/mock-data.ts`.
- **The seeded catalog matches the frontend's mock data**, including the same
  `placehold.co` image URLs. That host is the only one whitelisted in the
  frontend's `next.config.ts`, and frontend source is out of scope to change.

## Testing approach

Unit tests cover the business logic and nothing else: cart line math, sale
pricing, discount validation and amounts, tax, cart totals, and the paging
envelope. They construct the classes under test with `new`, so they need no
database, no fixtures, no `WebApplicationFactory`, and no mocking library, and
the whole suite runs in well under a second.

Services that touch `DbContext` are deliberately thin — load, delegate, map,
save — and are verified by hand through Swagger against the real Postgres
container. That is a stronger signal than an in-memory provider, which supports
neither the check constraints nor the `ILIKE` queries this schema relies on. If
integration tests become a goal, the right move is `WebApplicationFactory` plus
Testcontainers against real Postgres, not the in-memory provider.

## The two teammate assignments

`Macrocenter.Domain/Pricing/CartCalculator.cs` and
`Macrocenter.Domain/Pricing/SalesTaxCalculator.cs` each carry one small,
clearly marked `TEAM TASK` method for a teammate to complete, with the expected
behavior already written as skipped tests.

Both methods are **fully implemented and live**. The task is a named
refinement, not a hole — delete the comment banner and the code is still
correct, just less polished — so the application behaves correctly whether or
not either assignment is finished, and the test suite is green before and
after. Full details, including the expected inputs and outputs, are in
`docs/TEAMMATE_TASKS.md`.
