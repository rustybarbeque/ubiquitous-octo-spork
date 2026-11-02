using System.ComponentModel.DataAnnotations;

namespace Macrocenter.Api.Dtos.Items;

/// <summary>Sets a product's available stock. Administrators only.</summary>
public sealed class UpdateInventoryRequest
{
    [Range(0, int.MaxValue)]
    public int QuantityAvailable { get; set; }
}
