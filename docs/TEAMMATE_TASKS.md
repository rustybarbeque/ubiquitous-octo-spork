# Teammate tasks

Two small, self-contained tasks. Each one is a single method that **already
works** — your job is to improve it in one specific way. The application runs
correctly either way, so you cannot break the site by not finishing, and you
cannot break it by finishing.

Each task has tests already written for it. The tests are the specification:
they say exactly what inputs to expect and exactly what to return. They start
out skipped, and un-skipping them is step one.

Find both tasks by searching the repository for `TEAM TASK`.

## Before you start

```
docker compose up -d db
dotnet test backend/Macrocenter.slnx
```

You should see something like `Failed: 0, Passed: 60, Skipped: 7`. The seven
skipped tests are the two tasks below.

---

## Task 1 — a sale price should actually be a discount

**File:** `backend/Macrocenter.Domain/Pricing/CartCalculator.cs`
**Method:** `IsOnSale(decimal regularPrice, decimal? salePrice)`
**Tests:** `backend/Macrocenter.Api.Tests/Pricing/CartCalculatorTests.cs`

### The problem

The method currently returns `true` whenever a sale price has been set at all:

```csharp
public bool IsOnSale(decimal regularPrice, decimal? salePrice)
    => salePrice.HasValue;
```

So if an administrator means to put an $800 item on sale for $499 but types
`999`, the site cheerfully shows a sale badge and charges **more** than the
regular price.

### What to implement

Return `true` only when the sale price is a real discount: greater than zero,
and strictly less than the regular price.

| regularPrice | salePrice | should return |
| --- | --- | --- |
| 899.99 | 699.99 | `true` |
| 800 | `null` | `false` |
| 800 | 999 | `false` — more expensive |
| 800 | 800 | `false` — not a discount |
| 800 | 0 | `false` — free is a bug, not a sale |

Inputs and outputs are just numbers. You do not need to know anything about the
database, the website, or the rest of the API.

### Why it matters

`EffectiveUnitPrice` and `SavingsPerUnit` both call `IsOnSale`, so this one
change fixes the sale badge, the price the customer is charged, and the
"you save" figure all at once.

### Steps

1. Open the file and find the `TEAM TASK 1` banner.
2. In `CartCalculatorTests.cs`, delete the `Skip = "..."` part of each
   `TeamTask1_*` test, so `[Fact(Skip = "...")]` becomes `[Fact]`.
3. Run `dotnet test backend/Macrocenter.slnx` and watch them fail.
4. Change the one expression in `IsOnSale` so they pass.
5. Delete the `TEAM TASK 1` comment banner — the task is done.

---

## Task 2 — round sales tax the way a cash register does

**File:** `backend/Macrocenter.Domain/Pricing/SalesTaxCalculator.cs`
**Method:** `CalculateTax(decimal taxableAmount)`
**Tests:** `backend/Macrocenter.Api.Tests/Pricing/SalesTaxCalculatorTests.cs`

### The problem

```csharp
public decimal CalculateTax(decimal taxableAmount)
    => Math.Round(taxableAmount * RatePercent / 100m, 2);
```

Two things are wrong with this.

**It rounds the wrong way on an exact half-cent.** `Math.Round` in C# defaults
to "banker's rounding", which breaks a tie toward the nearest *even* cent. The
tax on $10.00 at 8.25% is exactly $0.825, and this returns `0.82`. A cash
register would charge `0.83`.

**It can return a negative number.** Hand it a negative amount and it hands
back negative tax.

### What to implement

| taxableAmount | should return | why |
| --- | --- | --- |
| 100.00 | 8.25 | 8.25% of 100 |
| 10.00 | **0.83** | 0.825 rounds a half-cent up, not down to 0.82 |
| 1234.56 | 101.85 | 101.8512, rounded normally |
| 0 | 0 | nothing taxable |
| -50 | **0** | never tax a negative amount |

Two hints:

- `Math.Round` takes a third argument. `MidpointRounding.AwayFromZero` is the
  one that rounds a half up.
- Handle the zero-or-negative case before doing any arithmetic.

### What *not* to change

The tax rate itself. `DefaultRatePercent` is `8.25m` and the rate can also be
set from configuration — leave both alone. This task is only about the
arithmetic in `CalculateTax`.

### Steps

Same as Task 1: un-skip the `TeamTask2_*` tests, watch them fail, make them
pass, delete the banner.

---

## How to tell you are done

```
dotnet test backend/Macrocenter.slnx
```

With both tasks finished you should see `Failed: 0, Passed: 67, Skipped: 0`.

If you want to see your Task 2 change in the running site, bring the stack up
with `docker compose up` and look at `GET /cart` in
<http://localhost:8080/swagger> — `taxAmount` is the number you changed.
