namespace Macrocenter.Domain.Enums;

/// <summary>
/// The outcome of validating a discount code against a cart. Returned to the
/// frontend so it can explain why a code is not discounting without having to
/// re-implement any of the rules.
/// </summary>
public enum DiscountStatus
{
    /// <summary>No code is applied to the cart.</summary>
    None,

    /// <summary>The code is valid and the discount was applied.</summary>
    Applied,

    /// <summary>No code exists with that text.</summary>
    NotFound,

    /// <summary>An administrator switched the code off.</summary>
    Inactive,

    /// <summary>The code's start date is in the future.</summary>
    NotYetActive,

    /// <summary>The code's end date has passed.</summary>
    Expired,

    /// <summary>The cart subtotal is below the code's minimum.</summary>
    SubtotalTooLow,
}
