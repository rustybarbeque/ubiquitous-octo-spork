namespace Macrocenter.Domain.Entities;

/// <summary>
/// One line in a shopping cart. Holds only which item and how many — never a
/// price. Removing a line deletes the row; quantity is never zero.
/// </summary>
public class CartItem
{
    public Guid Id { get; set; }

    public Guid CartId { get; set; }

    public Guid ItemId { get; set; }

    public int Quantity { get; set; }

    /// <summary>Gives the cart a stable display order.</summary>
    public DateTimeOffset AddedAt { get; set; }

    public Cart Cart { get; set; } = null!;

    public Item Item { get; set; } = null!;
}
