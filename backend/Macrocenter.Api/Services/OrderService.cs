using Macrocenter.Api.Dtos;
using Macrocenter.Api.Dtos.Orders;
using Macrocenter.Domain.Entities;
using Macrocenter.Domain.Enums;
using Macrocenter.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Macrocenter.Api.Services;

/// <summary>
/// Placing orders and reading order history.
/// </summary>
public sealed class OrderService(MacrocenterDbContext db, CartService carts)
{
    /// <summary>
    /// Turns the signed-in user's cart into an order.
    /// </summary>
    /// <remarks>
    /// This is the one and only place in the application where prices stop
    /// being live and become history. Everything the order and its lines need
    /// is copied in, so later edits to a product or a discount code can never
    /// change what this customer was charged.
    /// </remarks>
    public async Task<ServiceResult<OrderDto>> PlaceOrderAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            return ServiceResult<OrderDto>.NotFound("That user does not exist.");
        }

        var cart = await carts.GetOrCreateCartAsync(userId, cancellationToken);
        var priced = carts.PriceCart(cart, cart.AppliedDiscountCode);

        if (priced.Lines.Count == 0)
        {
            return ServiceResult<OrderDto>.Invalid("Your cart is empty.");
        }

        // Stock can move between adding to the cart and checking out, so this
        // is checked again here rather than trusted from earlier.
        var understocked = priced.Lines
            .FirstOrDefault(l => l.Quantity > l.Item.QuantityAvailable);

        if (understocked is not null)
        {
            return ServiceResult<OrderDto>.Invalid(
                $"Only {understocked.Item.QuantityAvailable} of {understocked.Item.Name} "
                + $"are available, but your cart has {understocked.Quantity}.");
        }

        var now = DateTimeOffset.UtcNow;

        var order = new Order
        {
            Id = Guid.CreateVersion7(),
            UserId = user.Id,
            Status = OrderStatus.Pending,
            PlacedAt = now,
            UpdatedAt = now,

            // Frozen totals.
            Subtotal = priced.Subtotal,
            DiscountAmount = priced.Discount.Amount,
            TaxAmount = priced.TaxAmount,
            Total = priced.Total,
            TaxRatePercent = priced.TaxRatePercent,

            // Frozen discount details, as text only. A deleted or edited code
            // must never be able to reach into this record.
            DiscountCodeText = priced.Discount.Status == DiscountStatus.Applied
                ? cart.AppliedDiscountCode?.Code
                : null,
            DiscountKind = priced.Discount.Status == DiscountStatus.Applied
                ? cart.AppliedDiscountCode?.Kind
                : null,
            DiscountValue = priced.Discount.Status == DiscountStatus.Applied
                ? cart.AppliedDiscountCode?.Value
                : null,

            // Frozen customer details.
            CustomerEmail = user.Email,
            CustomerName = user.FullName,
        };

        foreach (var line in priced.Lines)
        {
            order.Lines.Add(new OrderLine
            {
                Id = Guid.CreateVersion7(),
                OrderId = order.Id,
                ItemId = line.Item.Id,
                ItemName = line.Item.Name,
                ItemDescription = line.Item.Description,
                ItemImageUrl = line.Item.ImageUrl,
                ItemCategory = line.Item.Category,
                RegularPrice = line.Item.Price,
                SalePrice = line.Item.SalePrice,
                UnitPrice = line.UnitPrice,
                WasOnSale = line.IsOnSale,
                Quantity = line.Quantity,
                LineSubtotal = line.LineSubtotal,
            });

            line.Item.QuantityAvailable -= line.Quantity;
            line.Item.UpdatedAt = now;
        }

        db.Orders.Add(order);

        // The cart is emptied rather than deleted, so the user keeps one cart
        // for the life of the account.
        db.CartItems.RemoveRange(cart.Items);
        cart.Items.Clear();
        cart.AppliedDiscountCodeId = null;
        cart.AppliedDiscountCode = null;
        cart.UpdatedAt = now;

        // One SaveChanges, so EF wraps the whole thing -- the order, its lines,
        // the inventory decrements, and emptying the cart -- in a single
        // transaction. Either the order exists in full or nothing changed. An
        // explicit transaction here would add nothing, and would conflict with
        // the connection retry strategy configured in Program.cs.
        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<OrderDto>.Ok(order.ToDto());
    }

    /// <summary>The signed-in user's own order history.</summary>
    public Task<PagedResult<OrderSummaryDto>> GetForUserAsync(
        Guid userId,
        OrderQuery query,
        CancellationToken cancellationToken) =>
        SearchAsync(query, userId, cancellationToken);

    /// <summary>Every order, for the administrative views.</summary>
    public Task<PagedResult<OrderSummaryDto>> SearchAllAsync(
        OrderQuery query,
        CancellationToken cancellationToken) =>
        SearchAsync(query, null, cancellationToken);

    /// <summary>
    /// One order in full. Administrators may read any order; a customer may
    /// read only their own.
    /// </summary>
    public async Task<ServiceResult<OrderDto>> GetAsync(
        Guid id,
        Guid requestingUserId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .AsNoTracking()
            .Include(o => o.Lines)
            .SingleOrDefaultAsync(o => o.Id == id, cancellationToken);

        if (order is null)
        {
            return ServiceResult<OrderDto>.NotFound("That order does not exist.");
        }

        if (!isAdmin && order.UserId != requestingUserId)
        {
            return ServiceResult<OrderDto>.Forbidden("That order belongs to another customer.");
        }

        return ServiceResult<OrderDto>.Ok(order.ToDto());
    }

    /// <summary>
    /// Moves an order to a new status. Any transition is allowed; this project
    /// deliberately does not model a state machine.
    /// </summary>
    public async Task<ServiceResult<OrderDto>> UpdateStatusAsync(
        Guid id,
        OrderStatus status,
        CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .Include(o => o.Lines)
            .SingleOrDefaultAsync(o => o.Id == id, cancellationToken);

        if (order is null)
        {
            return ServiceResult<OrderDto>.NotFound("That order does not exist.");
        }

        order.Status = status;
        order.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<OrderDto>.Ok(order.ToDto());
    }

    /// <summary>
    /// The shared order query behind both history views. Passing a user id
    /// scopes it to that customer; passing null returns everyone's orders.
    /// </summary>
    /// <remarks>
    /// Sorting by total and by customer are plain indexed column sorts, because
    /// both values were frozen onto the order at checkout.
    /// </remarks>
    private async Task<PagedResult<OrderSummaryDto>> SearchAsync(
        OrderQuery query,
        Guid? userId,
        CancellationToken cancellationToken)
    {
        var orders = db.Orders.AsNoTracking().Include(o => o.Lines).AsQueryable();

        if (userId.HasValue)
        {
            orders = orders.Where(o => o.UserId == userId.Value);
        }

        if (query.Search is { } search)
        {
            orders = orders.Where(o =>
                EF.Functions.ILike(o.CustomerName, $"%{search}%")
                || EF.Functions.ILike(o.CustomerEmail, $"%{search}%"));
        }

        var statuses = query.ParsedStatuses;

        if (statuses.Count > 0)
        {
            orders = orders.Where(o => statuses.Contains(o.Status));
        }

        if (query.FromDate.HasValue)
        {
            orders = orders.Where(o => o.PlacedAt >= query.FromDate.Value);
        }

        if (query.ToDate.HasValue)
        {
            orders = orders.Where(o => o.PlacedAt <= query.ToDate.Value);
        }

        orders = query.Sort switch
        {
            "oldest" or "date-asc" => orders.OrderBy(o => o.PlacedAt),
            "total-desc" => orders.OrderByDescending(o => o.Total),
            "total-asc" => orders.OrderBy(o => o.Total),
            "customer-asc" => orders.OrderBy(o => o.CustomerName).ThenByDescending(o => o.PlacedAt),
            "customer-desc" => orders.OrderByDescending(o => o.CustomerName).ThenByDescending(o => o.PlacedAt),
            // "newest", "date-desc", and anything unrecognized.
            _ => orders.OrderByDescending(o => o.PlacedAt),
        };

        var total = await orders.CountAsync(cancellationToken);

        var page = await orders
            .Skip(query.Skip)
            .Take(query.NormalizedPageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<OrderSummaryDto>(
            page.Select(Mappings.ToSummaryDto).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }
}
