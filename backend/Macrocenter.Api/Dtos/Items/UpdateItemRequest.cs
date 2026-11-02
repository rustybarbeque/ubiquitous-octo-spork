using System.ComponentModel.DataAnnotations;

namespace Macrocenter.Api.Dtos.Items;

/// <summary>
/// A full replacement of a product's editable fields. Administrators only.
/// </summary>
public sealed class UpdateItemRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    [Url]
    public string ImageUrl { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [Range(0, 99_999_999.99)]
    public decimal Price { get; set; }

    [Range(0, 99_999_999.99)]
    public decimal? SalePrice { get; set; }

    [Range(0, int.MaxValue)]
    public int QuantityAvailable { get; set; }
}
