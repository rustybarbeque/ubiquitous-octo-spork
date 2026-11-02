namespace Macrocenter.Domain.Enums;

/// <summary>
/// How a discount code's value is interpreted.
/// </summary>
public enum DiscountKind
{
    /// <summary>Value is percentage points, e.g. 10 means 10% off.</summary>
    Percentage,

    /// <summary>Value is dollars, e.g. 25 means $25 off.</summary>
    FixedAmount,
}
