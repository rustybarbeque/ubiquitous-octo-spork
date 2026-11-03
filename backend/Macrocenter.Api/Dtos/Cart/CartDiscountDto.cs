using Macrocenter.Domain.Enums;

namespace Macrocenter.Api.Dtos.Cart;

/// <summary>
/// The discount code applied to a cart and whether it is currently doing
/// anything.
/// </summary>
/// <remarks>
/// A code is re-validated on every cart read, so one that has since expired or
/// been switched off reports its reason here with an <see cref="Amount"/> of
/// zero, rather than silently continuing to discount.
/// </remarks>
/// <param name="Code">The code as the customer typed it.</param>
/// <param name="Kind">Percentage or fixed dollar amount.</param>
/// <param name="Value">Percentage points, or dollars, depending on the kind.</param>
/// <param name="Status">Whether it applied, and if not, why not.</param>
/// <param name="Amount">Dollars this code is taking off right now.</param>
/// <param name="Message">A human-readable explanation, ready to display.</param>
public sealed record CartDiscountDto(
    string Code,
    DiscountKind Kind,
    decimal Value,
    DiscountStatus Status,
    decimal Amount,
    string? Message);
