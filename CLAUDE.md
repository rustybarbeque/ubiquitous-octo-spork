# Macrocenter — project conventions

A spoof-of-Micro-Center e-commerce site built for a Software Engineering class.
The branding is a joke; the engineering is not. `README.md` holds the graded
requirements and is the source of truth for scope.

## Architecture

Three Docker Compose services: `web` (Next.js), `api` (ASP.NET Core), `db`
(Postgres). The API reaches the database at host `db` over the Compose network.
All configuration comes from environment variables, sourced from `.env`.

Backend layering, strictly one direction:

```
Controllers  ->  Services  ->  MacrocenterDbContext
(Macrocenter.Api)             (Macrocenter.Infrastructure)
        \-> DTOs                      \-> Entities (Macrocenter.Domain)
```

## Backend conventions

- Controller-based API: `[ApiController]` + `ControllerBase`. **No Minimal APIs.**
- DTOs are separate from EF entities. Entities never appear on the wire.
- Async all the way down; every data call takes a `CancellationToken`.
- Errors are RFC 7807 `ProblemDetails`.
- Money is `decimal` in C# and `numeric(10,2)` in Postgres. **Never `float` or
  `double`.**
- Tables and columns are `snake_case` (via `UseSnakeCaseNamingConvention`).
- Enums are persisted as strings so the database stays readable.
- Sales tax is 8.25%, defined once as a named constant in the pricing service.

## Pricing is computed, never stored

Cart rows hold only an item id and a quantity. Prices, discounts, and tax are
recalculated on every read against the live `Item` and `DiscountCode` rows. This
is what makes an admin's sale-price or discount change show up immediately in
carts that already exist. Prices are frozen exactly once, at checkout, into
`OrderLine` snapshot columns.

## Frontend conventions

The frontend is fully wired to the API: storefront, auth, account, cart,
checkout, order history, and the `/admin` back end. Next.js 16 (App Router),
React 19, Ant Design 6, Tailwind 4, lucide icons.
This Next.js version differs from older training data, so check
`frontend/node_modules/next/dist/docs/` before using an unfamiliar API.

- API calls live in `frontend/lib/services/*-service.ts`, one file per area
  (products, auth, cart, ...). Components never call `fetch` directly.
- Server components call the API at `API_URL` (`http://api:8080` in Compose);
  browser code calls it at `NEXT_PUBLIC_API_URL` through
  `frontend/lib/api-client.ts`, which also turns ProblemDetails errors into
  readable messages.
- The API computes all money (sale prices, discounts, tax, totals). The
  frontend displays those numbers and never recalculates them.
- Auth is a JWT kept in `localStorage` and exposed through `useAuth()` from
  `frontend/components/auth/AuthProvider.tsx`.
- Pages that need a signed-in user wrap their content in `<RequireAuth>`;
  admin pages sit under `app/admin/`, whose layout applies `<RequireAdmin>`.
- Product images may come from any host: `next.config.ts` sets
  `images.unoptimized`, and `components/ProductImage.tsx` swaps in a local
  fallback when a URL is broken. Use `ProductImage`, not `next/image`, for
  product pictures.
- Keep the existing look: zinc palette, Ant Design components, Tailwind for
  layout.
- The dev container runs Turbopack, whose file watcher misses edits across the
  Windows bind mount. After changing frontend files, run
  `docker compose restart web` before checking them in the browser.

## Scope rules

- **No Azure work.** Cloud hosting is a stretch goal. Avoid choices that would
  make containerized deployment harder later.
- One feature branch per module, reviewed via pull request before merging to
  `main`. Never push without being asked.

## Deliberate shortcuts

This project is never deployed to production, and ease of development was chosen
over hardening:

- Passwords are stored in plaintext.
- JWTs use a long-lived development signing key from `.env`, with no refresh
  tokens.
- Migrations are applied automatically on API startup in Development only.

These are recorded in `docs/architecture.md` so a reviewer can see they were
choices rather than oversights.
