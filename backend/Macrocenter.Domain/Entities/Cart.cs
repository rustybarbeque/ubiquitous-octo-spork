namespace Macrocenter.Domain.Entities;

/// <summary>
/// One shopping cart per user, created on first use and emptied (never deleted)
/// at checkout.
/// </summary>
/// <remarks>
/// There are deliberately no money columns on this entity. Subtotal, discount,
/// tax, and total are recalculated on every read from the live Item and
/// DiscountCode rows. Prices freeze exactly once, at checkout, onto OrderLine.
/// </remarks>
public class Cart
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    /// <summary>
    /// The one discount code applied to this cart, if any. A foreign key rather
    /// than a copied code string, so editing the code changes what this cart
    /// computes on the very next read.
    /// </summary>
    public Guid? AppliedDiscountCodeId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public User User { get; set; } = null!;

    public DiscountCode? AppliedDiscountCode { get; set; }

    public ICollection<CartItem> Items { get; set; } = [];
}
