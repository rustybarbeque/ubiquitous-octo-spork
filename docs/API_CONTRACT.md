# API contract

The Macrocenter HTTP API, as implemented. Swagger UI is at
<http://localhost:8080/swagger> when the stack is running in Development.

Base URL is the bare origin with no `/api` prefix: `http://localhost:8080`
from the browser, `http://api:8080` from inside the Compose network.

## Conventions

**JSON** is camelCase in both directions. Enums travel as their names
(`"Pending"`, `"Percentage"`), not numbers. Money is a JSON number with two
decimal places. Identifiers are GUID strings. A field with no value is `null`,
never omitted.

**Authentication** is a JWT bearer token from `POST /auth/login` or
`POST /auth/register`:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Each endpoint below is marked:

| Mark | Meaning |
| --- | --- |
| **Public** | No token needed. |
| **Customer** | Any signed-in user. 401 without a valid token. |
| **Admin** | Signed-in user whose `role` is `Admin`. 401 without a token, 403 with a customer's token. |

**Paging** is identical on every list endpoint:

```json
{ "items": [], "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 }
```

Shared query parameters: `page` (default 1), `pageSize` (default 20, maximum
100), `q` (free-text search), `sort`. Out-of-range values are **clamped, not
rejected** — `?page=0&pageSize=9999` returns page 1 at size 100. An
unrecognized `sort` falls back to that endpoint's default.

**Errors** are RFC 7807 problem documents:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Invalid request",
  "status": 400,
  "detail": "Your order does not meet this code's minimum.",
  "traceId": "00-64fbbde8a91a..."
}
```

Request-body validation failures come back as `ValidationProblemDetails`:

```json
{
  "status": 400,
  "title": "One or more validation errors occurred.",
  "errors": { "Value": ["A percentage discount cannot be greater than 100."] }
}
```

Status codes used throughout: **200** read or update succeeded, **201**
created, **204** deleted, **400** invalid request, **401** no or bad token,
**403** wrong role or someone else's data, **404** no such thing, **409** a
conflict such as a duplicate email or a deletion that would destroy history.

### Seeded accounts

| Email | Password | Role |
| --- | --- | --- |
| `admin@macrocenter.test` | `admin` | Admin |
| `student@macrocenter.test` | `password` | Customer |

Seeded discount codes: `SAVE10` (10% off) and `TAKE25` ($25 off orders of $100
or more).

---

# Users

## POST /auth/register — **Public**

Creates a customer account and signs it in. Always creates a `Customer`; there
is no way to self-assign `Admin`.

Request:

```json
{
  "email": "alice@example.com",
  "password": "hunter2",
  "firstName": "Alice",
  "lastName": "Anders"
}
```

Validation: `email` required and well-formed (max 256); `password` required,
6–128 characters; `firstName` and `lastName` required (max 100). Email is
stored lowercased, so `Alice@Example.COM` and `alice@example.com` are the same
account.

Response `201`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2026-12-02T21:18:44.123+00:00",
  "user": {
    "id": "01a19e1b-57f4-7f64-bc90-1897caa4266a",
    "email": "alice@example.com",
    "firstName": "Alice",
    "lastName": "Anders",
    "fullName": "Alice Anders",
    "role": "Customer",
    "isAdmin": false,
    "createdAt": "2026-11-02T21:18:44.123+00:00"
  }
}
```

`400` validation failed · `409` that email is already registered.

## POST /auth/login — **Public**

Request: `{ "email": "student@macrocenter.test", "password": "password" }`

Response `200`: the same shape as registration.

`400` wrong email or password — the message does not say which.

## GET /auth/me — **Customer**

The account the current token belongs to. Response `200` is a `UserDto` as
nested above. `401` no valid token · `404` the account was deleted since the
token was issued.

## PUT /users/me — **Customer**

Updates your own name and email. Cannot change a role.

Request:

```json
{ "email": "student@macrocenter.test", "firstName": "Sam", "lastName": "Student" }
```

Response `200`: the updated `UserDto`.

`400` validation failed · `409` another account already uses that email.

Changing your name does **not** change the name recorded on orders you have
already placed.

## GET /users — **Admin**

The administrative user list.

| Parameter | Meaning |
| --- | --- |
| `q` | Substring of email, first name, or last name (case-insensitive) |
| `role` | `Customer` or `Admin` |
| `sort` | `newest` (default), `oldest`, `name-asc`, `name-desc`, `email-asc`, `email-desc` |
| `page`, `pageSize` | Paging |

Response `200`: `PagedResult<UserDto>`.

## GET /users/{id} — **Admin**

Response `200`: a `UserDto`. `404` no such user.

## PUT /users/{id} — **Admin**

Updates any user, including their role. **This is how an account is promoted to
administrator.** The promoted user must sign in again to get a token carrying
the new role.

Request:

```json
{
  "email": "alice@example.com",
  "firstName": "Alice",
  "lastName": "Anders",
  "role": "Admin"
}
```

Response `200`: the updated `UserDto`. `404` no such user · `409` another
account already uses that email.

## DELETE /users/{id} — **Admin**

Response `204`.

`404` no such user · `409` in two cases: the user has placed orders (order
history is never destroyed), or you are trying to delete your own account.

---

# Products

## GET /items — **Public**

The product catalog: search, filter, sort, page. Stock and sale pricing are on
every row, so the main sale page needs no follow-up request per product.

| Parameter | Meaning |
| --- | --- |
| `q` | Case-insensitive substring of **name or description** |
| `category` | Exact match, e.g. `Graphics Cards` |
| `minPrice`, `maxPrice` | Compared against the **effective** price (sale price if on sale) |
| `inStockOnly` | `true` excludes products with no stock |
| `onSaleOnly` | `true` returns only products on sale |
| `sort` | See below |
| `page`, `pageSize` | Paging |

`sort` accepts `relevance` (default — natural catalog order), `price-asc`,
`price-desc`, `availability-desc`, `availability-asc`, `name-asc`, `name-desc`,
`newest`. **Price sorts use the effective price**, so a product on sale sorts
by what a customer would actually pay.

Archived products are never returned.

`GET /items?q=rtx&sort=price-asc&pageSize=5` → `200`:

```json
{
  "items": [
    {
      "id": "01a19e1b-5877-7b16-806d-0925f7a064b6",
      "name": "Vantage RTX 5080 16GB",
      "description": "High-end graphics card with 16GB GDDR7 and dual-slot cooling.",
      "imageUrl": "https://placehold.co/600x600/16532d/bbf7d0.png?text=Vantage%0ARTX%0A5080%0A16GB&font=roboto",
      "category": "Graphics Cards",
      "price": 1899.00,
      "salePrice": 1649.00,
      "isOnSale": true,
      "effectivePrice": 1649.00,
      "quantityAvailable": 13,
      "createdAt": "2026-11-02T21:12:34.357+00:00"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "total": 2,
  "totalPages": 1
}
```

`salePrice` is `null` when the product is not on sale, and `isOnSale` is then
`false` with `effectivePrice` equal to `price`.

## GET /items/categories — **Public**

The distinct categories in use, alphabetically — for building a filter.

Response `200`:

```json
["Cases","Cooling","Graphics Cards","Memory","Monitors",
 "Motherboards","Power Supplies","Processors","Storage"]
```

## GET /items/{id} — **Public**

Response `200`: one `ItemDto`. `404` no such product, or it has been archived.

## POST /items — **Admin**

Request:

```json
{
  "name": "Test Widget",
  "description": "A widget.",
  "imageUrl": "https://placehold.co/600x600/27272a/d4d4d8.png?text=Widget",
  "category": "Cases",
  "price": 12.34,
  "salePrice": null,
  "quantityAvailable": 5
}
```

Validation: `name` (max 200), `description` (max 2000), `imageUrl` (max 500,
must be a URL), `category` (max 100) all required; `price` and `salePrice`
non-negative; `quantityAvailable` non-negative.

Response `201` with a `Location` header and the created `ItemDto`.

## PUT /items/{id} — **Admin**

Replaces every editable field; same body and validation as `POST /items`.
Response `200`: the updated `ItemDto`. `404` no such product.

## PUT /items/{id}/sale — **Admin**

Puts a product on sale, or takes it off sale. **A change here is visible in
every existing cart on its next read.**

Request: `{ "salePrice": 999.00 }` — or `{ "salePrice": null }` to clear the
sale.

Response `200`: the updated `ItemDto`. `404` no such product.

## PUT /items/{id}/inventory — **Admin**

Request: `{ "quantityAvailable": 14 }`

Response `200`: the updated `ItemDto`. `404` no such product.

## DELETE /items/{id} — **Admin**

Archives a product: it leaves the catalog, is removed from every cart, and can
no longer be added to one. The row is **not** deleted, so orders containing it
still read correctly.

Response `204`. `404` no such product.

---

# Cart

Every cart endpoint requires a signed-in **Customer** and returns the **whole
recalculated cart**, so a client never needs a follow-up `GET` and never has to
compute a sale price, a discount, or tax for itself.

Prices are read live from the catalog on every call. There is one cart per
user, created automatically on first use.

## The cart response

```json
{
  "lines": [
    {
      "itemId": "01a19e1b-5877-77a5-9878-09d7d39ce3fc",
      "name": "Titanium Core i9-15900KX",
      "imageUrl": "https://placehold.co/600x600/1e3a8a/bfdbfe.png?text=Titanium%0ACore%0Ai9-15900KX&font=roboto",
      "category": "Processors",
      "regularPrice": 1299.00,
      "salePrice": null,
      "unitPrice": 1299.00,
      "isOnSale": false,
      "savingsPerUnit": 0,
      "quantity": 2,
      "quantityAvailable": 11,
      "exceedsAvailable": false,
      "lineSubtotal": 2598.00
    },
    {
      "itemId": "01a19e1b-5877-73d6-9a3f-0694f42ca0df",
      "name": "Nova NVMe Gen5 4TB SSD",
      "imageUrl": "https://placehold.co/600x600/115e59/99f6e4.png?text=Nova%0ANVMe%0AGen5%0A4TB%0ASSD&font=roboto",
      "category": "Storage",
      "regularPrice": 899.00,
      "salePrice": 749.00,
      "unitPrice": 749.00,
      "isOnSale": true,
      "savingsPerUnit": 150.00,
      "quantity": 2,
      "quantityAvailable": 16,
      "exceedsAvailable": false,
      "lineSubtotal": 1498.00
    }
  ],
  "itemCount": 4,
  "lineCount": 2,
  "subtotal": 4096.00,
  "discount": {
    "code": "SAVE10",
    "kind": "Percentage",
    "value": 10.00,
    "status": "Applied",
    "amount": 409.60,
    "message": null
  },
  "discountAmount": 409.60,
  "taxRatePercent": 8.25,
  "taxAmount": 304.13,
  "total": 3990.53
}
```

| Field | Notes |
| --- | --- |
| `itemCount` | Total units, for the header badge. `lineCount` is distinct products. |
| `unitPrice` | What is actually being charged. `isOnSale` says whether to show it as a sale. |
| `exceedsAvailable` | The cart holds more than is in stock. The cart still prices normally; **checkout** is what refuses. |
| `discount` | `null` when no code is applied. |
| `taxAmount` | Charged on the subtotal **after** the discount. |
| `total` | Always `subtotal - discountAmount + taxAmount`. |

**The applied code is re-validated on every read.** A code that has since
expired or been switched off reports its reason and stops discounting:

```json
"discount": {
  "code": "SAVE10", "kind": "Percentage", "value": 10.00,
  "status": "Expired", "amount": 0,
  "message": "That discount code has expired."
}
```

`status` is one of `Applied`, `Expired`, `NotYetActive`, `Inactive`,
`SubtotalTooLow`, `NotFound`, or `None`.

## GET /cart — **Customer**

Response `200`: the cart. Creates an empty one on first use rather than
returning `404`.

## POST /cart/items — **Customer**

Adds a product, or increases the quantity if it is already in the cart.

Request: `{ "itemId": "01a1...", "quantity": 2 }` — `quantity` 1–1000,
defaults to 1.

Response `200`: the updated cart.

`400` the requested quantity exceeds stock, e.g.
`"Only 9 of Titanium Core i9-15900KX are available."` · `404` no such product,
or it is archived.

## PUT /cart/items/{itemId} — **Customer**

Sets a line's quantity outright. Request: `{ "quantity": 3 }` — 1–1000. To
remove a line, use `DELETE`; a quantity of zero is rejected.

Response `200`: the updated cart. `400` exceeds stock · `404` that product is
not in the cart.

## DELETE /cart/items/{itemId} — **Customer**

Response `200`: the updated cart. `404` that product is not in the cart.

## DELETE /cart — **Customer**

Empties the cart, including any applied discount code. Response `200`: the
now-empty cart.

## POST /cart/discount — **Customer**

Applies a discount code. Case-insensitive, so `save10` works.

Request: `{ "code": "SAVE10" }`

Response `200`: the updated cart with the discount applied.

`400` the code exists but does not currently qualify — `detail` says why, for
example `"Your order does not meet this code's minimum."` or
`"That discount code has expired."` · `404` no such code.

## DELETE /cart/discount — **Customer**

Response `200`: the updated cart with no discount.

---

# Discounts

Administrators only. Changes here reach shopping carts immediately — a cart
stores a reference to the code, not a copy of its value. Placed orders are
unaffected, because they keep their own frozen copy.

## The discount-code response

```json
{
  "id": "01a19e1b-57fb-7a9c-8e21-3f0b4c8d1e55",
  "code": "TAKE25",
  "description": "$25 off orders over $100",
  "kind": "FixedAmount",
  "value": 25.00,
  "minimumSubtotal": 100.00,
  "startsAt": null,
  "endsAt": null,
  "isActive": true,
  "isCurrentlyValid": true,
  "createdAt": "2026-11-02T21:12:34.357+00:00"
}
```

| Field | Notes |
| --- | --- |
| `kind` | `Percentage` or `FixedAmount`. |
| `value` | Percentage points when `Percentage` (`10.00` means 10% off), dollars when `FixedAmount`. |
| `minimumSubtotal` | Minimum pre-discount subtotal, or `null` for none. |
| `startsAt` / `endsAt` | `null` means "already started" / "never expires". |
| `isActive` | An administrator kill switch, independent of the dates. |
| `isCurrentlyValid` | Computed: active **and** inside its date window. Ignores `minimumSubtotal`, which depends on the cart. |

## GET /discount-codes — **Admin**

| Parameter | Meaning |
| --- | --- |
| `q` | Substring of the code or its description |
| `activeOnly` | `true` returns only codes that would work right now |
| `sort` | `newest` (default), `oldest`, `code-asc`, `code-desc` |
| `page`, `pageSize` | Paging |

Response `200`: `PagedResult<DiscountCodeDto>`.

## GET /discount-codes/{id} — **Admin**

Response `200`: one code. `404` no such code.

## POST /discount-codes — **Admin**

Request:

```json
{
  "code": "SPRING15",
  "description": "15% off for spring",
  "kind": "Percentage",
  "value": 15,
  "minimumSubtotal": null,
  "startsAt": "2027-03-01T00:00:00Z",
  "endsAt": "2027-03-31T23:59:59Z",
  "isActive": true
}
```

Validation:

- `code` required, max 32, letters/digits/hyphens/underscores only. Stored
  uppercased and must be unique.
- `value` greater than 0, and **at most 100 when `kind` is `Percentage`**.
- `minimumSubtotal` non-negative when given.
- `endsAt` must be on or after `startsAt` when both are given.

Response `201` with a `Location` header and the created code.

`400` validation failed · `409` a code with that text already exists.

## PUT /discount-codes/{id} — **Admin**

Same body and validation as `POST`. Response `200`: the updated code. `404` no
such code · `409` another code already uses that text.

## DELETE /discount-codes/{id} — **Admin**

Response `204`. Carts referencing the code silently lose their discount;
placed orders are untouched. `404` no such code.

## Promotional sale pricing

Putting a product on sale is **`PUT /items/{id}/sale`**, documented under
Products. It is the same promotional mechanism, applied to a product rather
than to an order.

---

# Orders

## The order response

```json
{
  "id": "01a19e22-9a45-72ef-b9a0-d70af52471d9",
  "userId": "01a19e1b-57f4-7f64-bc90-1897caa4266a",
  "customerName": "Sam Student",
  "customerEmail": "student@macrocenter.test",
  "status": "Pending",
  "placedAt": "2026-11-02T21:20:30.277+00:00",
  "updatedAt": "2026-11-02T21:20:30.277+00:00",
  "subtotal": 4096.00,
  "discountCode": "SAVE10",
  "discountKind": "Percentage",
  "discountValue": 10.00,
  "discountAmount": 409.60,
  "taxRatePercent": 8.25,
  "taxAmount": 304.13,
  "total": 3990.53,
  "itemCount": 4,
  "lines": [
    {
      "id": "01a19e22-9a46-7c8d-91f3-5b2a7e40c6d1",
      "itemId": "01a19e1b-5877-73d6-9a3f-0694f42ca0df",
      "name": "Nova NVMe Gen5 4TB SSD",
      "description": "PCIe 5.0 M.2 SSD, 14,000MB/s read with integrated heatsink.",
      "imageUrl": "https://placehold.co/600x600/115e59/99f6e4.png?text=Nova%0ANVMe%0AGen5%0A4TB%0ASSD&font=roboto",
      "category": "Storage",
      "regularPrice": 899.00,
      "salePrice": 749.00,
      "unitPrice": 749.00,
      "wasOnSale": true,
      "quantity": 2,
      "lineSubtotal": 1498.00
    }
  ]
}
```

**Every value here is frozen at checkout.** Editing the product afterwards —
its price, its sale, even its name — does not change this response. Likewise
`customerName` is the name as it was at purchase time, so a later profile
change does not rewrite history.

`lines[].itemId` is `null` if that product has since been hard-deleted from the
database. Everything needed to display the line is on the line itself; a `null`
only means there is no product page to link to.

`status` is one of `Pending`, `Paid`, `Shipped`, `Delivered`, `Cancelled`.

`OrderSummaryDto`, returned by the list endpoints, is the same minus `lines`,
`discountCode`, `discountKind`, `discountValue`, `taxRatePercent`, and
`updatedAt`, plus a `lineCount`.

## POST /orders — **Customer**

Places an order from your cart, then empties it. Takes no request body.

On success: the order is written with every price frozen, stock is decremented
for each line, and the cart is emptied and its discount cleared. It all happens
in one transaction — either the order exists in full or nothing changed.

Response `201` with a `Location` header and the full order.

`400` the cart is empty, or stock ran out since the item was added
(`"Only 1 of Quantum 2TB PCIe 5.0 SSD are available, but your cart has 2."`).

The applied discount code is validated one last time here. If it is no longer
valid the order is placed with **no discount** rather than failing — the
response shows `discountAmount: 0` and a `null` `discountCode`.

## GET /orders — **Customer**

Your own order history.

| Parameter | Meaning |
| --- | --- |
| `status` | Comma-separated, e.g. `Pending,Paid`. Unrecognized names are ignored. |
| `fromDate`, `toDate` | Filter on `placedAt` |
| `sort` | `newest` (default), `oldest`, `date-desc`, `date-asc`, `total-desc`, `total-asc` |
| `page`, `pageSize` | Paging |

Response `200`: `PagedResult<OrderSummaryDto>`.

## GET /orders/{id} — **Customer**

Response `200`: the full order. A customer may read only their own orders; an
administrator may read any.

`403` the order belongs to another customer · `404` no such order.

---

# Administration

The administrative interface is built from the **Admin** endpoints already
listed, plus the order views below. Everything an admin UI needs is exposed
independently of the customer-facing routes:

| Admin capability | Endpoints |
| --- | --- |
| Retrieve and modify all products | `GET/POST/PUT/DELETE /items` |
| Manage inventory and pricing | `PUT /items/{id}/inventory`, `PUT /items/{id}` |
| Create and modify promotional sales | `PUT /items/{id}/sale` |
| Create and modify discount codes | `GET/POST/PUT/DELETE /discount-codes` |
| Retrieve and modify users | `GET/PUT/DELETE /users`, `GET /users/{id}` |
| Currently placed orders | `GET /admin/orders?status=Pending,Paid` |
| Historical orders | `GET /admin/orders?status=Delivered,Cancelled` |
| Sort history by date, customer, or dollar amount | `GET /admin/orders?sort=...` |

## GET /admin/orders — **Admin**

Every customer's orders. "Current" versus "historical" is a `status` filter
rather than two different endpoints.

| Parameter | Meaning |
| --- | --- |
| `q` | Substring of customer name or email |
| `status` | Comma-separated, e.g. `Pending,Paid` |
| `fromDate`, `toDate` | Filter on `placedAt` |
| `sort` | See below |
| `page`, `pageSize` | Paging |

`sort` covers the three required orderings and both directions of each:

| Value | Orders by |
| --- | --- |
| `date-desc` (default), `date-asc` | **Order date** |
| `customer-asc`, `customer-desc` | **Customer** name |
| `total-desc`, `total-asc` | **Order total in dollars** |

`newest` and `oldest` are accepted as aliases for `date-desc` and `date-asc`.

`GET /admin/orders?sort=total-desc` → `200`:

```json
{
  "items": [
    {
      "id": "01a19e22-9a45-72ef-b9a0-d70af52471d9",
      "userId": "01a19e1b-57f4-7f64-bc90-1897caa4266a",
      "customerName": "Sam Student",
      "customerEmail": "student@macrocenter.test",
      "status": "Shipped",
      "placedAt": "2026-11-02T21:20:30.277+00:00",
      "subtotal": 4096.00,
      "discountAmount": 409.60,
      "taxAmount": 304.13,
      "total": 3990.53,
      "lineCount": 2,
      "itemCount": 4
    },
    {
      "id": "01a19e23-1b02-7d41-ae55-2c9f8a71b3e0",
      "userId": "01a19e22-4c11-7e88-b012-77aa5e9d3c44",
      "customerName": "Alice Anders",
      "customerEmail": "alice@example.com",
      "status": "Pending",
      "placedAt": "2026-11-02T21:21:05.110+00:00",
      "subtotal": 549.00,
      "discountAmount": 0,
      "taxAmount": 45.29,
      "total": 594.29,
      "lineCount": 1,
      "itemCount": 1
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 2,
  "totalPages": 1
}
```

## GET /admin/orders/{id} — **Admin**

Response `200`: the full order including its lines. `404` no such order.

## PUT /admin/orders/{id}/status — **Admin**

Request: `{ "status": "Shipped" }`

Any status may be set from any other; this project deliberately does not model
a state machine.

Response `200`: the updated order. `400` unrecognized status name · `404` no
such order.

---

# Health

## GET /health — **Public**

Used by the Compose healthcheck.

`200` → `{ "status": "healthy", "database": "reachable" }`

`503` → `{ "status": "unhealthy", "database": "unreachable" }`
