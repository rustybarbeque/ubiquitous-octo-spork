namespace Macrocenter.Domain.Pricing;

/// <summary>
/// Shopping-cart math. Every method takes numbers in and returns numbers out.
/// No database, no website, no other code involved.
/// </summary>
public sealed class CartCalculator
{
    // ==================== TEAM TASK 1 ====================
    // Goal: only count something as "on sale" when the sale price is a real
    // discount: more than zero AND less than the regular price.
    //
    // Right now this returns true whenever ANY sale price is set, so a typo
    // like a $999 "sale" on an $800 item still shows a sale badge.
    //
    // Examples:
    //   IsOnSale(899.99m, 699.99m) -> true
    //   IsOnSale(800m,    null)    -> false   (no sale price)
    //   IsOnSale(800m,    999m)    -> false   (more expensive)
    //   IsOnSale(800m,    800m)    -> false   (same price)
    //   IsOnSale(800m,    0m)      -> false   (free is a mistake)
    //
    // When the TeamTask1 tests pass, delete this comment block.
    // =====================================================
    public bool IsOnSale(decimal regularPrice, decimal? salePrice)
    {
        return salePrice.HasValue;
    }

    /// <summary>
    /// The price the customer pays for one item.
    /// </summary>
    public decimal EffectiveUnitPrice(decimal regularPrice, decimal? salePrice)
    {
        if (IsOnSale(regularPrice, salePrice))
        {
            // The "!" tells the compiler "I already checked, this isn't null."
            return salePrice!.Value;
        }

        return regularPrice;
    }

    /// <summary>
    /// How much the customer saves on one item (zero if it isn't on sale).
    /// </summary>
    public decimal SavingsPerUnit(decimal regularPrice, decimal? salePrice)
    {
        decimal pricePaid = EffectiveUnitPrice(regularPrice, salePrice);
        return regularPrice - pricePaid;
    }

    /// <summary>
    /// The total for one line in the cart: price times quantity.
    /// </summary>
    public decimal LineSubtotal(decimal unitPrice, int quantity)
    {
        return unitPrice * quantity;
    }
}
