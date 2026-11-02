using Macrocenter.Domain.Entities;
using Macrocenter.Domain.Enums;
using Macrocenter.Domain.Pricing;

namespace Macrocenter.Api.Services;

/// <summary>
/// The outcome of checking a discount code, and what it is worth.
/// </summary>
/// <param name="Status">Whether it applied, and if not, why not.</param>
/// <param name="Amount">Dollars off. Always zero unless the status is Applied.</param>
public sealed record DiscountValidationResult(DiscountStatus Status, decimal Amount)
{
    /// <summary>A cart with no code applied at all.</summary>
    public static readonly DiscountValidationResult None =
        new(DiscountStatus.None, 0m);

    /// <summary>A short explanation suitable for showing to a customer.</summary>
    public string? Message => Status switch
    {
        DiscountStatus.None => null,
        DiscountStatus.Applied => null,
        DiscountStatus.NotFound => "That discount code does not exist.",
        DiscountStatus.Inactive => "That discount code is no longer available.",
        DiscountStatus.NotYetActive => "That discount code is not active yet.",
        DiscountStatus.Expired => "That discount code has expired.",
        DiscountStatus.SubtotalTooLow => "Your order does not meet this code's minimum.",
        _ => null,
    };
}

/// <summary>One priced cart line.</summary>
public sealed record PricedLine(
    Item Item,
    int Quantity,
    decimal UnitPrice,
    bool IsOnSale,
    decimal LineSubtotal);

/// <summary>A fully priced cart: the single source of every number in a cart response.</summary>
public sealed record PricedCart(
    IReadOnlyList<PricedLine> Lines,
    decimal Subtotal,
    DiscountValidationResult Discount,
    decimal TaxRatePercent,
    decimal TaxAmount,
    decimal Total);

/// <summary>
/// Turns cart contents into money. This is where the project's pricing rules
/// live, and it is the same code path the cart and checkout both use, so a
/// customer is always charged exactly what the order summary showed them.
/// </summary>
/// <remarks>
/// This service deliberately touches no database. It is handed entities that
/// have already been loaded and returns a value object, which is what makes the
/// pricing rules straightforward to unit test — see
/// <c>Macrocenter.Api.Tests/Pricing</c>.
/// </remarks>
public sealed class PricingService(CartCalculator cartCalculator, SalesTaxCalculator salesTaxCalculator)
{
    /// <summary>The sales tax rate in effect, in percent.</summary>
    public decimal TaxRatePercent => salesTaxCalculator.RatePercent;

    /// <summary>
    /// Prices a whole cart: each line against the product's live price, then
    /// the discount, then tax on what is left, then the total.
    /// </summary>
    /// <param name="lines">The cart's items and quantities.</param>
    /// <param name="discountCode">The applied code, or null for none.</param>
    /// <param name="now">The moment to judge the code's date window against.</param>
    public PricedCart PriceCart(
        IReadOnlyList<(Item Item, int Quantity)> lines,
        DiscountCode? discountCode,
        DateTimeOffset now)
    {
        var pricedLines = new List<PricedLine>(lines.Count);

        foreach (var (item, quantity) in lines)
        {
            var isOnSale = cartCalculator.IsOnSale(item.Price, item.SalePrice);
            var unitPrice = cartCalculator.EffectiveUnitPrice(item.Price, item.SalePrice);

            pricedLines.Add(new PricedLine(
                item,
                quantity,
                unitPrice,
                isOnSale,
                cartCalculator.LineSubtotal(unitPrice, quantity)));
        }

        var subtotal = Money(pricedLines.Sum(l => l.LineSubtotal));

        var discount = ValidateDiscount(discountCode, subtotal, now);

        // Tax applies to what the customer actually owes, so it comes off the
        // discounted amount rather than the full subtotal.
        var taxableAmount = subtotal - discount.Amount;
        var taxAmount = salesTaxCalculator.CalculateTax(taxableAmount);

        var total = Money(subtotal - discount.Amount + taxAmount);

        return new PricedCart(
            pricedLines,
            subtotal,
            discount,
            salesTaxCalculator.RatePercent,
            taxAmount,
            total);
    }

    /// <summary>
    /// Decides whether a discount code applies to a subtotal right now, and
    /// what it is worth.
    /// </summary>
    /// <remarks>
    /// A pure function: the clock is a parameter rather than a dependency, so
    /// every date rule can be tested without waiting for a calendar.
    /// </remarks>
    /// <param name="code">The code to check, or null if none is applied.</param>
    /// <param name="subtotal">The cart subtotal before any discount.</param>
    /// <param name="now">The moment to compare the date window against.</param>
    public DiscountValidationResult ValidateDiscount(
        DiscountCode? code,
        decimal subtotal,
        DateTimeOffset now)
    {
        if (code is null)
        {
            return DiscountValidationResult.None;
        }

        if (!code.IsActive)
        {
            return new DiscountValidationResult(DiscountStatus.Inactive, 0m);
        }

        if (code.StartsAt.HasValue && now < code.StartsAt.Value)
        {
            return new DiscountValidationResult(DiscountStatus.NotYetActive, 0m);
        }

        if (code.EndsAt.HasValue && now > code.EndsAt.Value)
        {
            return new DiscountValidationResult(DiscountStatus.Expired, 0m);
        }

        if (code.MinimumSubtotal.HasValue && subtotal < code.MinimumSubtotal.Value)
        {
            return new DiscountValidationResult(DiscountStatus.SubtotalTooLow, 0m);
        }

        var raw = code.Kind switch
        {
            DiscountKind.Percentage => subtotal * code.Value / 100m,
            DiscountKind.FixedAmount => code.Value,
            _ => 0m,
        };

        // A discount can take an order to zero but never below it, so a $25
        // code on a $10 cart takes off $10 rather than handing out change.
        var amount = Money(Math.Clamp(raw, 0m, subtotal));

        return new DiscountValidationResult(DiscountStatus.Applied, amount);
    }

    /// <summary>
    /// Rounds to whole cents the way a register does. Keeps every figure the
    /// API reports consistent with the numeric(10,2) columns it is stored in.
    /// </summary>
    internal static decimal Money(decimal value) =>
        Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
