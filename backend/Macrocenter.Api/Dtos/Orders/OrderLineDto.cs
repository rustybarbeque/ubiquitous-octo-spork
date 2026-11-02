namespace Macrocenter.Api.Dtos.Orders;

/// <summary>
/// One line of a placed order, read back from the frozen snapshot taken at
/// checkout. None of these values change when the product changes.
/// </summary>
/// <param name="ItemId">
/// The product this line came from, or null if that product has since been
/// hard-deleted. Everything needed to display the line is below regardless, so
/// a null here only means there is no product page to link to.
/// </param>
/// <param name="RegularPrice">The regular price at the time of purchase.</param>
/// <param name="SalePrice">The sale price at the time of purchase, if any.</param>
/// <param name="UnitPrice">What the customer was actually charged per unit.</param>
/// <param name="WasOnSale">Whether this line was bought on sale.</param>
public sealed record OrderLineDto(
    Guid Id,
    Guid? ItemId,
    string Name,
    string Description,
    string ImageUrl,
    string Category,
    decimal RegularPrice,
    decimal? SalePrice,
    decimal UnitPrice,
    bool WasOnSale,
    int Quantity,
    decimal LineSubtotal);
