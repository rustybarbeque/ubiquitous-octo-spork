using Macrocenter.Api.Dtos;
using Macrocenter.Api.Dtos.Items;
using Macrocenter.Domain.Entities;
using Macrocenter.Domain.Pricing;
using Macrocenter.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Macrocenter.Api.Services;

/// <summary>
/// The product catalog: search, detail, and the administrative write
/// operations.
/// </summary>
public sealed class ItemService(MacrocenterDbContext db, CartCalculator cartCalculator)
{
    /// <summary>
    /// Searches, filters, sorts, and pages the catalog. Soft-deleted products
    /// are never returned.
    /// </summary>
    public async Task<PagedResult<ItemDto>> SearchAsync(
        ItemQuery query,
        CancellationToken cancellationToken)
    {
        var items = db.Items.AsNoTracking().Where(i => !i.IsDeleted);

        if (query.Search is { } search)
        {
            // Case-insensitive substring over name and description, which is
            // how the storefront search behaves.
            items = items.Where(i =>
                EF.Functions.ILike(i.Name, $"%{search}%")
                || EF.Functions.ILike(i.Description, $"%{search}%"));
        }

        if (!string.IsNullOrWhiteSpace(query.Category))
        {
            var category = query.Category.Trim();
            items = items.Where(i => i.Category == category);
        }

        // Price filters compare against the effective price, so an item on sale
        // is filtered by what a customer would actually pay.
        if (query.MinPrice.HasValue)
        {
            items = items.Where(i => (i.SalePrice ?? i.Price) >= query.MinPrice.Value);
        }

        if (query.MaxPrice.HasValue)
        {
            items = items.Where(i => (i.SalePrice ?? i.Price) <= query.MaxPrice.Value);
        }

        if (query.InStockOnly)
        {
            items = items.Where(i => i.QuantityAvailable > 0);
        }

        if (query.OnSaleOnly)
        {
            items = items.Where(i => i.SalePrice != null);
        }

        items = query.Sort switch
        {
            // COALESCE(sale_price, price): sorting by what is charged, not by
            // the list price.
            "price-asc" => items.OrderBy(i => i.SalePrice ?? i.Price),
            "price-desc" => items.OrderByDescending(i => i.SalePrice ?? i.Price),
            "availability-desc" => items.OrderByDescending(i => i.QuantityAvailable),
            "availability-asc" => items.OrderBy(i => i.QuantityAvailable),
            "name-asc" => items.OrderBy(i => i.Name),
            "name-desc" => items.OrderByDescending(i => i.Name),
            "newest" => items.OrderByDescending(i => i.CreatedAt),
            // "relevance" and anything unrecognized: the natural catalog order.
            // Ids are time-ordered, so this is insertion order.
            _ => items.OrderBy(i => i.Id),
        };

        var total = await items.CountAsync(cancellationToken);

        var page = await items
            .Skip(query.Skip)
            .Take(query.NormalizedPageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<ItemDto>(
            page.Select(i => i.ToDto(cartCalculator)).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    /// <summary>One product by id, or null if it does not exist or was deleted.</summary>
    public async Task<ItemDto?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        var item = await db.Items
            .AsNoTracking()
            .SingleOrDefaultAsync(i => i.Id == id && !i.IsDeleted, cancellationToken);

        return item?.ToDto(cartCalculator);
    }

    /// <summary>
    /// The distinct categories currently in use, for a filter dropdown.
    /// </summary>
    public async Task<IReadOnlyList<string>> GetCategoriesAsync(CancellationToken cancellationToken) =>
        await db.Items
            .AsNoTracking()
            .Where(i => !i.IsDeleted)
            .Select(i => i.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync(cancellationToken);

    /// <summary>Adds a new product to the catalog.</summary>
    public async Task<ItemDto> CreateAsync(
        CreateItemRequest request,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;

        var item = new Item
        {
            Id = Guid.CreateVersion7(),
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            ImageUrl = request.ImageUrl.Trim(),
            Category = request.Category.Trim(),
            Price = request.Price,
            SalePrice = request.SalePrice,
            QuantityAvailable = request.QuantityAvailable,
            IsDeleted = false,
            CreatedAt = now,
            UpdatedAt = now,
        };

        db.Items.Add(item);
        await db.SaveChangesAsync(cancellationToken);

        return item.ToDto(cartCalculator);
    }

    /// <summary>Replaces a product's editable fields.</summary>
    public async Task<ServiceResult<ItemDto>> UpdateAsync(
        Guid id,
        UpdateItemRequest request,
        CancellationToken cancellationToken)
    {
        var item = await FindAsync(id, cancellationToken);

        if (item is null)
        {
            return ServiceResult<ItemDto>.NotFound("That product does not exist.");
        }

        item.Name = request.Name.Trim();
        item.Description = request.Description.Trim();
        item.ImageUrl = request.ImageUrl.Trim();
        item.Category = request.Category.Trim();
        item.Price = request.Price;
        item.SalePrice = request.SalePrice;
        item.QuantityAvailable = request.QuantityAvailable;
        item.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<ItemDto>.Ok(item.ToDto(cartCalculator));
    }

    /// <summary>
    /// Puts a product on sale or takes it off sale. Existing carts pick the
    /// change up on their next read, because they hold no prices of their own.
    /// </summary>
    public async Task<ServiceResult<ItemDto>> UpdateSalePriceAsync(
        Guid id,
        decimal? salePrice,
        CancellationToken cancellationToken)
    {
        var item = await FindAsync(id, cancellationToken);

        if (item is null)
        {
            return ServiceResult<ItemDto>.NotFound("That product does not exist.");
        }

        item.SalePrice = salePrice;
        item.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<ItemDto>.Ok(item.ToDto(cartCalculator));
    }

    /// <summary>Sets a product's available stock.</summary>
    public async Task<ServiceResult<ItemDto>> UpdateInventoryAsync(
        Guid id,
        int quantityAvailable,
        CancellationToken cancellationToken)
    {
        var item = await FindAsync(id, cancellationToken);

        if (item is null)
        {
            return ServiceResult<ItemDto>.NotFound("That product does not exist.");
        }

        item.QuantityAvailable = quantityAvailable;
        item.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<ItemDto>.Ok(item.ToDto(cartCalculator));
    }

    /// <summary>
    /// Archives a product: it leaves the catalog and any live cart, but nothing
    /// is destroyed, so orders that include it still read correctly.
    /// </summary>
    public async Task<ServiceResult<bool>> SoftDeleteAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var item = await FindAsync(id, cancellationToken);

        if (item is null)
        {
            return ServiceResult<bool>.NotFound("That product does not exist.");
        }

        item.IsDeleted = true;
        item.UpdatedAt = DateTimeOffset.UtcNow;

        // Drop it from every cart, so nobody checks out an archived product.
        var affectedLines = await db.CartItems
            .Where(ci => ci.ItemId == id)
            .ToListAsync(cancellationToken);

        db.CartItems.RemoveRange(affectedLines);

        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<bool>.Ok(true);
    }

    private Task<Item?> FindAsync(Guid id, CancellationToken cancellationToken) =>
        db.Items.SingleOrDefaultAsync(i => i.Id == id && !i.IsDeleted, cancellationToken);
}
