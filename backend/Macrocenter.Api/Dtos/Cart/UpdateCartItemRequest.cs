using System.ComponentModel.DataAnnotations;

namespace Macrocenter.Api.Dtos.Cart;

/// <summary>
/// Sets a line's quantity outright. To remove a line, use the DELETE endpoint
/// rather than a quantity of zero.
/// </summary>
public sealed class UpdateCartItemRequest
{
    [Range(1, 1000)]
    public int Quantity { get; set; } = 1;
}
