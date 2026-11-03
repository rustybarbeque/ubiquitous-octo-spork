using Macrocenter.Domain.Enums;

namespace Macrocenter.Domain.Entities;

/// <summary>
/// A placed order. An order is a receipt: every money value on it and on its
/// lines is a snapshot frozen at checkout, so changing an item's price or
/// editing a discount code later can never alter what a customer was charged.
/// </summary>
/// <remarks>
/// Note there is no foreign key to DiscountCode — only the text snapshots below.
/// A deleted or edited code must not be reachable from order history.
/// </remarks>
public class Order
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public DateTimeOffset PlacedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    // --- Frozen totals -----------------------------------------------------
    // Stored rather than recomputed so that admin sorting by dollar amount is a
    // plain indexed ORDER BY, and so the receipt never shifts under the reader.

    /// <summary>Sum of the line subtotals, before discount and tax.</summary>
    public decimal Subtotal { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal TaxAmount { get; set; }

    /// <summary>Subtotal - DiscountAmount + TaxAmount.</summary>
    public decimal Total { get; set; }

    /// <summary>The tax rate in effect at checkout, in percent, e.g. 8.250.</summary>
    public decimal TaxRatePercent { get; set; }

    // --- Frozen discount details -------------------------------------------

    /// <summary>The code text as typed, or null if no discount applied.</summary>
    public string? DiscountCodeText { get; set; }

    public DiscountKind? DiscountKind { get; set; }

    public decimal? DiscountValue { get; set; }

    // --- Frozen customer details -------------------------------------------

    /// <summary>The customer's email at purchase time.</summary>
    public string CustomerEmail { get; set; } = string.Empty;

    /// <summary>
    /// The customer's name at purchase time. Snapshotted so admin order lists
    /// sort by customer without a join, and so a later name change does not
    /// rewrite history.
    /// </summary>
    public string CustomerName { get; set; } = string.Empty;

    public User User { get; set; } = null!;

    public ICollection<OrderLine> Lines { get; set; } = [];
}
