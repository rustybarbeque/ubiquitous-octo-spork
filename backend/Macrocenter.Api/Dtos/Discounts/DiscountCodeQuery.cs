namespace Macrocenter.Api.Dtos.Discounts;

/// <summary>
/// Filters for the administrative discount-code list. <c>q</c> matches the code
/// or its description; <c>sort</c> accepts <c>code-asc</c>, <c>code-desc</c>,
/// <c>newest</c>, or <c>oldest</c>.
/// </summary>
public sealed class DiscountCodeQuery : PagedQuery
{
    /// <summary>Only codes that would work right now.</summary>
    public bool ActiveOnly { get; set; }
}
