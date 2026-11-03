using Macrocenter.Domain.Enums;

namespace Macrocenter.Api.Dtos.Orders;

/// <summary>
/// A placed order in full, including its lines. Every monetary value is the one
/// recorded at checkout.
/// </summary>
/// <param name="CustomerName">The customer's name as it was at purchase time.</param>
/// <param name="DiscountCode">The code used, or null. Text only, by design.</param>
public sealed record OrderDto(
    Guid Id,
    Guid UserId,
    string CustomerName,
    string CustomerEmail,
    OrderStatus Status,
    DateTimeOffset PlacedAt,
    DateTimeOffset UpdatedAt,
    decimal Subtotal,
    string? DiscountCode,
    DiscountKind? DiscountKind,
    decimal? DiscountValue,
    decimal DiscountAmount,
    decimal TaxRatePercent,
    decimal TaxAmount,
    decimal Total,
    int ItemCount,
    IReadOnlyList<OrderLineDto> Lines);
