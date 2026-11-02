namespace Macrocenter.Api.Dtos;

/// <summary>
/// The query-string options every list endpoint understands. Out-of-range
/// values are clamped rather than rejected, so a stray <c>?page=0</c> returns
/// the first page instead of a validation error.
/// </summary>
public class PagedQuery
{
    /// <summary>Largest page size the API will serve.</summary>
    public const int MaxPageSize = 100;

    /// <summary>Page size used when the caller does not ask for one.</summary>
    public const int DefaultPageSize = 20;

    /// <summary>1-based page number. Defaults to the first page.</summary>
    public int Page { get; set; } = 1;

    /// <summary>Items per page. Clamped to 1..<see cref="MaxPageSize"/>.</summary>
    public int PageSize { get; set; } = DefaultPageSize;

    /// <summary>Free-text search term. Meaning depends on the endpoint.</summary>
    public string? Q { get; set; }

    /// <summary>Sort key. Allowed values are listed per endpoint.</summary>
    public string? Sort { get; set; }

    /// <summary>The page number to actually use, clamped to at least 1.</summary>
    public int NormalizedPage => Page < 1 ? 1 : Page;

    /// <summary>The page size to actually use, clamped to a sane range.</summary>
    public int NormalizedPageSize => PageSize switch
    {
        < 1 => DefaultPageSize,
        > MaxPageSize => MaxPageSize,
        _ => PageSize,
    };

    /// <summary>How many rows to skip for the requested page.</summary>
    public int Skip => (NormalizedPage - 1) * NormalizedPageSize;

    /// <summary>The trimmed search term, or null when it is blank.</summary>
    public string? Search => string.IsNullOrWhiteSpace(Q) ? null : Q.Trim();
}
