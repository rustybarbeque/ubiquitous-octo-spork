using Macrocenter.Domain.Enums;

namespace Macrocenter.Api.Dtos.Orders;

/// <summary>
/// An order without its lines, for history and administrative lists. Carries
/// everything those lists sort or filter on, so no second request is needed.
/// </summary>
public sealed record OrderSummaryDto(
    Guid Id,
    Guid UserId,
    string CustomerName,
    string CustomerEmail,
    OrderStatus Status,
    DateTimeOffset PlacedAt,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal TaxAmount,
    decimal Total,
    int LineCount,
    int ItemCount);
