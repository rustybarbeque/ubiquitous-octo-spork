using System.ComponentModel.DataAnnotations;

namespace Macrocenter.Api.Dtos.Items;

/// <summary>
/// Puts a product on sale, or takes it off sale. This is the promotional-sales
/// endpoint: a change here is visible in every existing cart on the next read.
/// </summary>
public sealed class UpdateSalePriceRequest
{
    /// <summary>The sale price, or null to clear the sale.</summary>
    [Range(0, 99_999_999.99)]
    public decimal? SalePrice { get; set; }
}
