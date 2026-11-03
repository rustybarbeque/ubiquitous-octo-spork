using Macrocenter.Api.Dtos.Discounts;
using Macrocenter.Api.Dtos.Items;
using Macrocenter.Api.Dtos.Orders;
using Macrocenter.Api.Dtos.Users;
using Macrocenter.Domain.Entities;
using Macrocenter.Domain.Enums;
using Macrocenter.Domain.Pricing;

namespace Macrocenter.Api.Services;

/// <summary>
/// Entity-to-DTO conversions, gathered in one file so the wire format of each
/// type is defined in exactly one place.
/// </summary>
public static class Mappings
{
    public static UserDto ToDto(this User user) => new(
        user.Id,
        user.Email,
        user.FirstName,
        user.LastName,
        user.FullName,
        user.Role,
        user.Role == UserRole.Admin,
        user.CreatedAt);

    /// <summary>
    /// Maps a product, using the cart calculator for the sale decision so the
    /// catalog and the cart can never disagree about what is on sale.
    /// </summary>
    public static ItemDto ToDto(this Item item, CartCalculator cartCalculator) => new(
        item.Id,
        item.Name,
        item.Description,
        item.ImageUrl,
        item.Category,
        item.Price,
        item.SalePrice,
        cartCalculator.IsOnSale(item.Price, item.SalePrice),
        cartCalculator.EffectiveUnitPrice(item.Price, item.SalePrice),
        item.QuantityAvailable,
        item.CreatedAt);

    public static DiscountCodeDto ToDto(this DiscountCode code, DateTimeOffset now) => new(
        code.Id,
        code.Code,
        code.Description,
        code.Kind,
        code.Value,
        code.MinimumSubtotal,
        code.StartsAt,
        code.EndsAt,
        code.IsActive,
        IsCurrentlyValid(code, now),
        code.CreatedAt);

    public static OrderLineDto ToDto(this OrderLine line) => new(
        line.Id,
        line.ItemId,
        line.ItemName,
        line.ItemDescription,
        line.ItemImageUrl,
        line.ItemCategory,
        line.RegularPrice,
        line.SalePrice,
        line.UnitPrice,
        line.WasOnSale,
        line.Quantity,
        line.LineSubtotal);

    public static OrderDto ToDto(this Order order) => new(
        order.Id,
        order.UserId,
        order.CustomerName,
        order.CustomerEmail,
        order.Status,
        order.PlacedAt,
        order.UpdatedAt,
        order.Subtotal,
        order.DiscountCodeText,
        order.DiscountKind,
        order.DiscountValue,
        order.DiscountAmount,
        order.TaxRatePercent,
        order.TaxAmount,
        order.Total,
        order.Lines.Sum(l => l.Quantity),
        order.Lines.OrderBy(l => l.ItemName).Select(ToDto).ToList());

    public static OrderSummaryDto ToSummaryDto(this Order order) => new(
        order.Id,
        order.UserId,
        order.CustomerName,
        order.CustomerEmail,
        order.Status,
        order.PlacedAt,
        order.Subtotal,
        order.DiscountAmount,
        order.TaxAmount,
        order.Total,
        order.Lines.Count,
        order.Lines.Sum(l => l.Quantity));

    /// <summary>
    /// Whether a code would work right now, ignoring any particular cart. The
    /// subtotal minimum is not considered here because it depends on the cart.
    /// </summary>
    private static bool IsCurrentlyValid(DiscountCode code, DateTimeOffset now) =>
        code.IsActive
        && (!code.StartsAt.HasValue || now >= code.StartsAt.Value)
        && (!code.EndsAt.HasValue || now <= code.EndsAt.Value);
}
