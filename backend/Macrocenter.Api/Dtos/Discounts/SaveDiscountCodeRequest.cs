using System.ComponentModel.DataAnnotations;
using Macrocenter.Domain.Enums;

namespace Macrocenter.Api.Dtos.Discounts;

/// <summary>
/// Creates or replaces a discount code. Used by both POST and PUT, because the
/// editable fields are identical.
/// </summary>
public sealed class SaveDiscountCodeRequest : IValidatableObject
{
    /// <summary>What the customer types. Stored and compared uppercased.</summary>
    [Required]
    [MaxLength(32)]
    [RegularExpression("^[A-Za-z0-9_-]+$",
        ErrorMessage = "Code may contain only letters, digits, hyphens, and underscores.")]
    public string Code { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    /// <summary>Percentage or FixedAmount.</summary>
    [Required]
    public DiscountKind Kind { get; set; }

    /// <summary>
    /// Percentage points when the kind is Percentage, dollars when FixedAmount.
    /// </summary>
    [Range(0.01, 99_999_999.99)]
    public decimal Value { get; set; }

    /// <summary>Minimum pre-discount subtotal, or null for no minimum.</summary>
    [Range(0, 99_999_999.99)]
    public decimal? MinimumSubtotal { get; set; }

    public DateTimeOffset? StartsAt { get; set; }

    public DateTimeOffset? EndsAt { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>
    /// The two rules that annotations cannot express on their own: a percentage
    /// cannot exceed 100, and a date window has to run forwards.
    /// </summary>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Kind == DiscountKind.Percentage && Value > 100m)
        {
            yield return new ValidationResult(
                "A percentage discount cannot be greater than 100.",
                [nameof(Value)]);
        }

        if (StartsAt.HasValue && EndsAt.HasValue && EndsAt.Value < StartsAt.Value)
        {
            yield return new ValidationResult(
                "EndsAt must be on or after StartsAt.",
                [nameof(EndsAt)]);
        }
    }
}
