using System.ComponentModel.DataAnnotations;

namespace Macrocenter.Api.Dtos.Cart;

/// <summary>
/// Adds a product to the cart. Adding one that is already there increases the
/// existing line rather than creating a second one.
/// </summary>
public sealed class AddCartItemRequest
{
    [Required]
    public Guid ItemId { get; set; }

    [Range(1, 1000)]
    public int Quantity { get; set; } = 1;
}
