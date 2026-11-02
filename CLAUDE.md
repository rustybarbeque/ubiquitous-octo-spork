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

## Scope rules

- **Do not modify frontend source.** The frontend needs only to build and run in
  its container. The single exception is `output: "standalone"` in
  `next.config.ts`, which the production image requires. If something else seems
  to need a frontend change, stop and ask.
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
