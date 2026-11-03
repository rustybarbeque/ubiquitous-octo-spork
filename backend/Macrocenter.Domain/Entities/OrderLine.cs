namespace Macrocenter.Domain.Entities;

/// <summary>
/// One line of a placed order. The product's details are copied here rather
/// than referenced, because a receipt should not change when the store's price
/// sign does.
/// </summary>
public class OrderLine
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    /// <summary>
    /// A convenience link back to the product, for a "view this item" link.
    /// Nullable on purpose: if an item is ever hard-deleted this becomes null
    /// and the order still renders in full from the snapshots below.
    /// </summary>
    public Guid? ItemId { get; set; }

    // --- Frozen product snapshot -------------------------------------------

    public string ItemName { get; set; } = string.Empty;

    public string ItemDescription { get; set; } = string.Empty;

    public string ItemImageUrl { get; set; } = string.Empty;

    public string ItemCategory { get; set; } = string.Empty;

    /// <summary>The item's regular price at checkout.</summary>
    public decimal RegularPrice { get; set; }

    /// <summary>The item's sale price at checkout, if it was on sale.</summary>
    public decimal? SalePrice { get; set; }

    /// <summary>The price actually charged per unit.</summary>
    public decimal UnitPrice { get; set; }

    /// <summary>Whether this line was bought at a sale price. A frozen answer.</summary>
    public bool WasOnSale { get; set; }

    public int Quantity { get; set; }

    /// <summary>UnitPrice * Quantity, frozen.</summary>
    public decimal LineSubtotal { get; set; }

    public Order Order { get; set; } = null!;

    public Item? Item { get; set; }
}
