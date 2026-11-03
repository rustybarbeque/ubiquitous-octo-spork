using Macrocenter.Domain.Enums;

namespace Macrocenter.Domain.Entities;

/// <summary>
/// A promotional code an administrator creates and a customer applies to a cart.
/// </summary>
public class DiscountCode
{
    public Guid Id { get; set; }

    /// <summary>What the customer types. Stored uppercased and unique.</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>An administrator-facing note. Not shown to customers.</summary>
    public string? Description { get; set; }

    public DiscountKind Kind { get; set; }

    /// <summary>
    /// Percentage points when <see cref="Kind"/> is Percentage (10.00 means
    /// 10% off), dollars when FixedAmount (25.00 means $25 off).
    /// </summary>
    public decimal Value { get; set; }

    /// <summary>Minimum pre-discount subtotal, or null for no minimum.</summary>
    public decimal? MinimumSubtotal { get; set; }

    /// <summary>When the code becomes usable, or null to mean "already".</summary>
    public DateTimeOffset? StartsAt { get; set; }

    /// <summary>When the code stops working, or null to mean "never".</summary>
    public DateTimeOffset? EndsAt { get; set; }

    /// <summary>An administrator kill switch, independent of the dates.</summary>
    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
