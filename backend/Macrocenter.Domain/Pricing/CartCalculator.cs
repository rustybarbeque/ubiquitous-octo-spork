namespace Macrocenter.Domain.Pricing;

/// <summary>
/// Pure shopping-cart math. No database, no HTTP, no dependencies — every
/// method here takes numbers in and returns numbers out, which is what makes it
/// straightforward to test.
/// </summary>
/// <remarks>
/// This class is the single place that decides what a customer actually pays
/// per unit. Both the catalog listing and the shopping cart route through it,
/// so the sale badge on a product card and the price charged in the cart cannot
/// disagree.
/// </remarks>
public sealed class CartCalculator
{
    // ===== TEAM TASK 1 of 2 — see docs/TEAMMATE_TASKS.md =====
    // TODO(team-task-1): a sale price should only count as a sale when it is
    // actually CHEAPER than the regular price (and greater than zero).
    // Acceptance: remove the Skip from the CartCalculatorTests.TeamTask1_*
    // tests and make them pass. Then delete this banner.
    // =========================================================

    /// <summary>
    /// Decides whether a cart line or catalog item is on sale.
    /// </summary>
    /// <param name="regularPrice">The item's normal price.</param>
    /// <param name="salePrice">The item's promotional price, or <c>null</c> if there is none.</param>
    /// <returns><c>true</c> when the item should be shown and charged as on sale.</returns>
    /// <remarks>
    /// <para><b>Current behavior:</b> returns <c>true</c> whenever a sale price
    /// is set at all.</para>
    /// <para><b>Your task:</b> also require that <paramref name="salePrice"/> be
    /// greater than zero and strictly less than <paramref name="regularPrice"/>.
    /// Right now an administrator who fat-fingers a $999 "sale" on an $800 item
    /// makes the item more expensive and still gets a sale badge.</para>
    /// </remarks>
    public bool IsOnSale(decimal regularPrice, decimal? salePrice)
        => salePrice.HasValue;

    /// <summary>
    /// The price a customer is actually charged per unit: the sale price when
    /// the item is on sale, otherwise the regular price.
    /// </summary>
    public decimal EffectiveUnitPrice(decimal regularPrice, decimal? salePrice)
        => IsOnSale(regularPrice, salePrice) ? salePrice!.Value : regularPrice;

    /// <summary>
    /// How much the customer saves per unit, or zero when not on sale.
    /// </summary>
    public decimal SavingsPerUnit(decimal regularPrice, decimal? salePrice)
        => regularPrice - EffectiveUnitPrice(regularPrice, salePrice);

    /// <summary>
    /// One line's money: unit price times quantity.
    /// </summary>
    public decimal LineSubtotal(decimal unitPrice, int quantity)
        => unitPrice * quantity;
}
