using Macrocenter.Domain.Enums;

namespace Macrocenter.Api.Dtos.Discounts;

/// <summary>A discount code as the administrative API returns it.</summary>
/// <param name="IsCurrentlyValid">
/// Whether the code would work right now, considering both its active flag and
/// its date window. Saves the admin UI from re-deriving it.
/// </param>
public sealed record DiscountCodeDto(
    Guid Id,
    string Code,
    string? Description,
    DiscountKind Kind,
    decimal Value,
    decimal? MinimumSubtotal,
    DateTimeOffset? StartsAt,
    DateTimeOffset? EndsAt,
    bool IsActive,
    bool IsCurrentlyValid,
    DateTimeOffset CreatedAt);
