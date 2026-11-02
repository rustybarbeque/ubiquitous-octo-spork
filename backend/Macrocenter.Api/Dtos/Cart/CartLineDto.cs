namespace Macrocenter.Api.Dtos.Cart;

/// <summary>
/// One line of the cart, priced against the product's current live values.
/// </summary>
/// <param name="ItemId">The product, so the client can link to it.</param>
/// <param name="RegularPrice">The product's normal price right now.</param>
/// <param name="SalePrice">The product's sale price right now, if any.</param>
/// <param name="UnitPrice">What is actually being charged per unit.</param>
/// <param name="IsOnSale">Whether to show this line as a sale price.</param>
/// <param name="SavingsPerUnit">Difference between regular and charged price.</param>
/// <param name="QuantityAvailable">Current stock, for an "only 2 left" hint.</param>
/// <param name="ExceedsAvailable">
/// True when the quantity in the cart is more than what is in stock. The cart
/// still prices normally; checkout is what refuses.
/// </param>
/// <param name="LineSubtotal">Unit price times quantity.</param>
public sealed record CartLineDto(
    Guid ItemId,
    string Name,
    string ImageUrl,
    string Category,
    decimal RegularPrice,
    decimal? SalePrice,
    decimal UnitPrice,
    bool IsOnSale,
    decimal SavingsPerUnit,
    int Quantity,
    int QuantityAvailable,
    bool ExceedsAvailable,
    decimal LineSubtotal);
