namespace Macrocenter.Api.Dtos.Items;

/// <summary>
/// Search, filter, sort, and paging options for the product catalog.
/// </summary>
/// <remarks>
/// <c>q</c> is a case-insensitive substring match over name and description,
/// matching how the storefront searches. <c>sort</c> accepts
/// <c>relevance</c> (the default), <c>price-asc</c>, <c>price-desc</c>,
/// <c>availability-desc</c>, <c>availability-asc</c>, <c>name-asc</c>,
/// <c>name-desc</c>, and <c>newest</c>. Price sorting uses the effective
/// price, so a sale price is what actually orders the results.
/// </remarks>
public sealed class ItemQuery : PagedQuery
{
    /// <summary>Exact category match, e.g. <c>Graphics Cards</c>.</summary>
    public string? Category { get; set; }

    /// <summary>Lowest acceptable effective price.</summary>
    public decimal? MinPrice { get; set; }

    /// <summary>Highest acceptable effective price.</summary>
    public decimal? MaxPrice { get; set; }

    /// <summary>Exclude products with no stock.</summary>
    public bool InStockOnly { get; set; }

    /// <summary>Only products currently on sale.</summary>
    public bool OnSaleOnly { get; set; }
}
