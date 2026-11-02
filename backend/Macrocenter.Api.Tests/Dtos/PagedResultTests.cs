using Macrocenter.Api.Dtos;

namespace Macrocenter.Api.Tests.Dtos;

/// <summary>
/// Tests for the paging envelope and the query clamping behind it.
/// </summary>
public class PagedResultTests
{
    [Theory]
    [InlineData(0, 20, 0)]    // No matches claims no pages, not one empty one.
    [InlineData(1, 20, 1)]
    [InlineData(20, 20, 1)]   // Exactly one full page.
    [InlineData(21, 20, 2)]   // One over the boundary.
    [InlineData(40, 20, 2)]
    [InlineData(41, 20, 3)]
    public void TotalPages_CoversEveryMatch(int total, int pageSize, int expected)
    {
        var result = new PagedResult<string>([], Page: 1, pageSize, total);

        Assert.Equal(expected, result.TotalPages);
    }

    [Fact]
    public void TotalPages_WithAnImpossiblePageSize_IsZeroRatherThanDividingByZero()
    {
        Assert.Equal(0, new PagedResult<string>([], 1, 0, 100).TotalPages);
    }

    [Fact]
    public void TheEnvelopeCarriesTheItemsItWasGiven()
    {
        var result = new PagedResult<string>(["a", "b"], 2, 10, 12);

        Assert.Equal(["a", "b"], result.Items);
        Assert.Equal(2, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(12, result.Total);
    }
}

/// <summary>
/// Tests for query clamping. Out-of-range paging values are corrected rather
/// than rejected, so a stray query string does not produce an error page.
/// </summary>
public class PagedQueryTests
{
    [Theory]
    [InlineData(0, 1)]
    [InlineData(-5, 1)]
    [InlineData(1, 1)]
    [InlineData(7, 7)]
    public void PageIsClampedToAtLeastOne(int requested, int expected)
    {
        Assert.Equal(expected, new PagedQuery { Page = requested }.NormalizedPage);
    }

    [Theory]
    [InlineData(0, PagedQuery.DefaultPageSize)]
    [InlineData(-1, PagedQuery.DefaultPageSize)]
    [InlineData(50, 50)]
    [InlineData(1000, PagedQuery.MaxPageSize)]
    public void PageSizeIsClampedToASaneRange(int requested, int expected)
    {
        Assert.Equal(expected, new PagedQuery { PageSize = requested }.NormalizedPageSize);
    }

    [Fact]
    public void SkipFollowsFromThePageAndSize()
    {
        var query = new PagedQuery { Page = 3, PageSize = 10 };

        Assert.Equal(20, query.Skip);
    }

    [Fact]
    public void FirstPageSkipsNothing()
    {
        Assert.Equal(0, new PagedQuery { Page = 1, PageSize = 25 }.Skip);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ABlankSearchTermIsNoSearchTerm(string? term)
    {
        Assert.Null(new PagedQuery { Q = term }.Search);
    }

    [Fact]
    public void ASearchTermIsTrimmed()
    {
        Assert.Equal("rtx", new PagedQuery { Q = "  rtx  " }.Search);
    }
}
