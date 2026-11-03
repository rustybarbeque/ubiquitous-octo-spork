using System.ComponentModel.DataAnnotations;

namespace Macrocenter.Api.Dtos.Items;

/// <summary>A new product. Administrators only.</summary>
public sealed class CreateItemRequest
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

    /// <summary>Promotional price, or null for an item that is not on sale.</summary>
    [Range(0, 99_999_999.99)]
    public decimal? SalePrice { get; set; }

    [Range(0, int.MaxValue)]
    public int QuantityAvailable { get; set; }
}
