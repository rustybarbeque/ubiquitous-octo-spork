namespace Macrocenter.Api.Dtos;

/// <summary>
/// One page of a larger result set. Every list endpoint in this API returns
/// this envelope, so paging looks the same everywhere.
/// </summary>
/// <typeparam name="T">The item type on this page.</typeparam>
/// <param name="Items">The items on this page.</param>
/// <param name="Page">The 1-based page number this result represents.</param>
/// <param name="PageSize">How many items a full page holds.</param>
/// <param name="Total">How many items match in total, across all pages.</param>
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int Total)
{
    /// <summary>
    /// How many pages the full result set spans. Zero when there are no
    /// matches at all, so an empty result does not claim to have one page.
    /// </summary>
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(Total / (double)PageSize);
}
