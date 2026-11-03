using Macrocenter.Api.Dtos.Cart;
using Macrocenter.Domain.Entities;
using Macrocenter.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Macrocenter.Api.Services;

/// <summary>
/// The shopping cart. Owns all cart database work and delegates every
/// calculation to <see cref="PricingService"/>.
/// </summary>
/// <remarks>
/// Cart rows hold only an item id and a quantity. Prices, discounts, and tax
/// are recalculated from the live product and discount-code rows on every
/// single read, which is what makes an administrator's price change or new
/// sale show up immediately in carts that already exist.
/// </remarks>
public sealed class CartService(MacrocenterDbContext db, PricingService pricing)
{
    /// <summary>The cart as a complete, ready-to-render order summary.</summary>
    public async Task<CartDto> GetCartAsync(Guid userId, CancellationToken cancellationToken)
    {
        var cart = await GetOrCreateCartAsync(userId, cancellationToken);

        return BuildDto(cart);
    }

    /// <summary>
    /// Adds a product to the cart, or increases the quantity if it is already
    /// there.
    /// </summary>
    public async Task<ServiceResult<CartDto>> AddItemAsync(
        Guid userId,
        AddCartItemRequest request,
        CancellationToken cancellationToken)
    {
        var item = await db.Items
            .SingleOrDefaultAsync(i => i.Id == request.ItemId && !i.IsDeleted, cancellationToken);

        if (item is null)
        {
            return ServiceResult<CartDto>.NotFound("That product does not exist.");
        }

        var cart = await GetOrCreateCartAsync(userId, cancellationToken);
        var existing = cart.Items.SingleOrDefault(ci => ci.ItemId == request.ItemId);
        var newQuantity = (existing?.Quantity ?? 0) + request.Quantity;

        if (newQuantity > item.QuantityAvailable)
        {
            return ServiceResult<CartDto>.Invalid(
                $"Only {item.QuantityAvailable} of {item.Name} are available.");
        }

        if (existing is null)
        {
            var line = new CartItem
            {
                Id = Guid.CreateVersion7(),
                CartId = cart.Id,
                ItemId = item.Id,
                Quantity = request.Quantity,
                AddedAt = DateTimeOffset.UtcNow,
                Item = item,
            };

            // Added to the set rather than to cart.Items: the id is assigned
            // here rather than by the database, and a new entity discovered
            // only through a navigation property would be taken for an
            // existing row and issued as an UPDATE. Change tracking puts it
            // into cart.Items for us.
            db.CartItems.Add(line);
        }
        else
        {
            existing.Quantity = newQuantity;
        }

        await TouchAndSaveAsync(cart, cancellationToken);

        return ServiceResult<CartDto>.Ok(BuildDto(cart));
    }

    /// <summary>Sets a line's quantity outright.</summary>
    public async Task<ServiceResult<CartDto>> SetQuantityAsync(
        Guid userId,
        Guid itemId,
        int quantity,
        CancellationToken cancellationToken)
    {
        var cart = await GetOrCreateCartAsync(userId, cancellationToken);
        var line = cart.Items.SingleOrDefault(ci => ci.ItemId == itemId);

        if (line is null)
        {
            return ServiceResult<CartDto>.NotFound("That product is not in your cart.");
        }

        if (quantity > line.Item.QuantityAvailable)
        {
            return ServiceResult<CartDto>.Invalid(
                $"Only {line.Item.QuantityAvailable} of {line.Item.Name} are available.");
        }

        line.Quantity = quantity;

        await TouchAndSaveAsync(cart, cancellationToken);

        return ServiceResult<CartDto>.Ok(BuildDto(cart));
    }

    /// <summary>Removes a line from the cart entirely.</summary>
    public async Task<ServiceResult<CartDto>> RemoveItemAsync(
        Guid userId,
        Guid itemId,
        CancellationToken cancellationToken)
    {
        var cart = await GetOrCreateCartAsync(userId, cancellationToken);
        var line = cart.Items.SingleOrDefault(ci => ci.ItemId == itemId);

        if (line is null)
        {
            return ServiceResult<CartDto>.NotFound("That product is not in your cart.");
        }

        cart.Items.Remove(line);
        db.CartItems.Remove(line);

        await TouchAndSaveAsync(cart, cancellationToken);

        return ServiceResult<CartDto>.Ok(BuildDto(cart));
    }

    /// <summary>Empties the cart, keeping the cart itself.</summary>
    public async Task<CartDto> ClearAsync(Guid userId, CancellationToken cancellationToken)
    {
        var cart = await GetOrCreateCartAsync(userId, cancellationToken);

        db.CartItems.RemoveRange(cart.Items);
        cart.Items.Clear();
        cart.AppliedDiscountCodeId = null;
        cart.AppliedDiscountCode = null;

        await TouchAndSaveAsync(cart, cancellationToken);

        return BuildDto(cart);
    }

    /// <summary>
    /// Applies a discount code, rejecting it with a reason if it does not
    /// currently qualify.
    /// </summary>
    public async Task<ServiceResult<CartDto>> ApplyDiscountAsync(
        Guid userId,
        string code,
        CancellationToken cancellationToken)
    {
        var normalized = NormalizeCode(code);

        var discount = await db.DiscountCodes
            .SingleOrDefaultAsync(d => d.Code == normalized, cancellationToken);

        if (discount is null)
        {
            return ServiceResult<CartDto>.NotFound("That discount code does not exist.");
        }

        var cart = await GetOrCreateCartAsync(userId, cancellationToken);

        // Price the cart as it stands to get the subtotal the code is judged
        // against, then check the code before committing it to the cart.
        var priced = PriceCart(cart, discount);

        if (priced.Discount.Status != Domain.Enums.DiscountStatus.Applied)
        {
            return ServiceResult<CartDto>.Invalid(
                priced.Discount.Message ?? "That discount code cannot be used right now.");
        }

        cart.AppliedDiscountCodeId = discount.Id;
        cart.AppliedDiscountCode = discount;

        await TouchAndSaveAsync(cart, cancellationToken);

        return ServiceResult<CartDto>.Ok(BuildDto(cart));
    }

    /// <summary>Removes any applied discount code.</summary>
    public async Task<CartDto> RemoveDiscountAsync(Guid userId, CancellationToken cancellationToken)
    {
        var cart = await GetOrCreateCartAsync(userId, cancellationToken);

        cart.AppliedDiscountCodeId = null;
        cart.AppliedDiscountCode = null;

        await TouchAndSaveAsync(cart, cancellationToken);

        return BuildDto(cart);
    }

    /// <summary>
    /// Loads the user's cart with its lines, products, and applied code,
    /// creating the cart on first use.
    /// </summary>
    /// <remarks>
    /// There is one cart per user, enforced by a unique index. If two requests
    /// race to create it, the loser catches the unique violation and re-reads
    /// rather than failing the request.
    /// </remarks>
    public async Task<Cart> GetOrCreateCartAsync(Guid userId, CancellationToken cancellationToken)
    {
        var cart = await LoadAsync(userId, cancellationToken);

        if (cart is not null)
        {
            return cart;
        }

        var now = DateTimeOffset.UtcNow;

        db.Carts.Add(new Cart
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            CreatedAt = now,
            UpdatedAt = now,
        });

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Another request created it first. Theirs is as good as ours.
            db.ChangeTracker.Clear();
        }

        return await LoadAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException($"Could not load a cart for user {userId}.");
    }

    /// <summary>
    /// Prices a cart. Soft-deleted products are skipped, so an archived item
    /// can never contribute to a total.
    /// </summary>
    internal PricedCart PriceCart(Cart cart, DiscountCode? discountCode)
    {
        var lines = cart.Items
            .Where(ci => ci.Item is { IsDeleted: false })
            .OrderBy(ci => ci.AddedAt)
            .Select(ci => (ci.Item, ci.Quantity))
            .ToList();

        return pricing.PriceCart(lines, discountCode, DateTimeOffset.UtcNow);
    }

    /// <summary>Discount codes are stored and compared uppercased.</summary>
    internal static string NormalizeCode(string code) => code.Trim().ToUpperInvariant();

    private Task<Cart?> LoadAsync(Guid userId, CancellationToken cancellationToken) =>
        db.Carts
            .Include(c => c.Items)
                .ThenInclude(ci => ci.Item)
            .Include(c => c.AppliedDiscountCode)
            .SingleOrDefaultAsync(c => c.UserId == userId, cancellationToken);

    private async Task TouchAndSaveAsync(Cart cart, CancellationToken cancellationToken)
    {
        cart.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Turns a loaded cart into the response DTO, re-validating the applied
    /// discount code along the way. A code that has since expired reports why
    /// and stops discounting, instead of quietly continuing to apply.
    /// </summary>
    private CartDto BuildDto(Cart cart)
    {
        var priced = PriceCart(cart, cart.AppliedDiscountCode);

        var lines = priced.Lines.Select(line => new CartLineDto(
            line.Item.Id,
            line.Item.Name,
            line.Item.ImageUrl,
            line.Item.Category,
            line.Item.Price,
            line.Item.SalePrice,
            line.UnitPrice,
            line.IsOnSale,
            line.IsOnSale ? line.Item.Price - line.UnitPrice : 0m,
            line.Quantity,
            line.Item.QuantityAvailable,
            line.Quantity > line.Item.QuantityAvailable,
            line.LineSubtotal)).ToList();

        var discountDto = cart.AppliedDiscountCode is { } code
            ? new CartDiscountDto(
                code.Code,
                code.Kind,
                code.Value,
                priced.Discount.Status,
                priced.Discount.Amount,
                priced.Discount.Message)
            : null;

        return new CartDto(
            lines,
            lines.Sum(l => l.Quantity),
            lines.Count,
            priced.Subtotal,
            discountDto,
            priced.Discount.Amount,
            priced.TaxRatePercent,
            priced.TaxAmount,
            priced.Total);
    }
}
