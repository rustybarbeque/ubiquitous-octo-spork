namespace Macrocenter.Api.Dtos.Items;

/// <summary>
/// A product as the API returns it, in both list and detail responses.
/// </summary>
/// <remarks>
/// <see cref="QuantityAvailable"/> and <see cref="SalePrice"/> are present in
/// the list response on purpose: the storefront shows stock and sale pricing on
/// the main sale page, without a follow-up request per product.
/// <see cref="IsOnSale"/> and <see cref="EffectivePrice"/> are computed
/// server-side so no client has to reimplement the rule.
/// </remarks>
public sealed record ItemDto(
    Guid Id,
    string Name,
    string Description,
    string ImageUrl,
    string Category,
    decimal Price,
    decimal? SalePrice,
    bool IsOnSale,
    decimal EffectivePrice,
    int QuantityAvailable,
    DateTimeOffset CreatedAt);
