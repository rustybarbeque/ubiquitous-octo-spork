namespace Macrocenter.Api.Dtos.Cart;

/// <summary>
/// A complete order summary, ready to render. Every number the storefront needs
/// is here, already calculated — the client never has to work out a sale price,
/// a discount, or tax for itself.
/// </summary>
/// <param name="Lines">The cart's lines, oldest first.</param>
/// <param name="ItemCount">Total units across all lines, for the header badge.</param>
/// <param name="LineCount">How many distinct products are in the cart.</param>
/// <param name="Subtotal">Sum of the line subtotals, before discount and tax.</param>
/// <param name="Discount">The applied code and its current status, if any.</param>
/// <param name="DiscountAmount">Dollars taken off. Zero when no valid code applies.</param>
/// <param name="TaxRatePercent">The sales tax rate used, in percent.</param>
/// <param name="TaxAmount">Tax, charged on the subtotal after the discount.</param>
/// <param name="Total">Subtotal minus the discount plus tax.</param>
public sealed record CartDto(
    IReadOnlyList<CartLineDto> Lines,
    int ItemCount,
    int LineCount,
    decimal Subtotal,
    CartDiscountDto? Discount,
    decimal DiscountAmount,
    decimal TaxRatePercent,
    decimal TaxAmount,
    decimal Total);
