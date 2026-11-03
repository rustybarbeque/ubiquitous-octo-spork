using System.ComponentModel.DataAnnotations;

namespace Macrocenter.Api.Dtos.Cart;

/// <summary>Applies a discount code to the cart. Case does not matter.</summary>
public sealed class ApplyDiscountRequest
{
    [Required]
    [MaxLength(32)]
    public string Code { get; set; } = string.Empty;
}
