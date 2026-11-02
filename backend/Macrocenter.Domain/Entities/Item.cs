namespace Macrocenter.Domain.Entities;

/// <summary>
/// A product for sale. Prices here are always the live, current prices — carts
/// read them on every request, which is what makes an administrator's price
/// change show up immediately in carts that already exist.
/// </summary>
public class Item
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    /// <summary>Absolute image URL. Seeded values point at placehold.co.</summary>
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>A free-form string such as "Graphics Cards", not a lookup table.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>The normal price.</summary>
    public decimal Price { get; set; }

    /// <summary>The promotional price, or null when the item is not on sale.</summary>
    public decimal? SalePrice { get; set; }

    public int QuantityAvailable { get; set; }

    /// <summary>
    /// Soft delete. Deleted items vanish from the catalog and from live carts,
    /// but nothing is destroyed, so order history stays intact.
    /// </summary>
    public bool IsDeleted { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<CartItem> CartItems { get; set; } = [];
}
