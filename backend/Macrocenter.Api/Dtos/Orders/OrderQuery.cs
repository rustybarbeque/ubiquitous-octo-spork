using Macrocenter.Domain.Enums;

namespace Macrocenter.Api.Dtos.Orders;

/// <summary>
/// Filters for order history, used by both the customer's own list and the
/// administrative list.
/// </summary>
/// <remarks>
/// "Current" versus "historical" orders is a status filter rather than a
/// separate endpoint: <c>?status=Pending,Paid</c> against
/// <c>?status=Delivered,Cancelled</c>.
/// <para><c>sort</c> accepts <c>newest</c> (the default), <c>oldest</c>,
/// <c>date-desc</c>, <c>date-asc</c>, <c>total-desc</c>, <c>total-asc</c>,
/// <c>customer-asc</c>, and <c>customer-desc</c>. On the administrative list
/// <c>q</c> matches customer name or email.</para>
/// </remarks>
public sealed class OrderQuery : PagedQuery
{
    /// <summary>
    /// One or more statuses, comma-separated, e.g. <c>Pending,Paid</c>.
    /// Unrecognized names are ignored.
    /// </summary>
    public string? Status { get; set; }

    /// <summary>Only orders placed on or after this moment.</summary>
    public DateTimeOffset? FromDate { get; set; }

    /// <summary>Only orders placed on or before this moment.</summary>
    public DateTimeOffset? ToDate { get; set; }

    /// <summary>The statuses named by <see cref="Status"/>, parsed and filtered.</summary>
    public IReadOnlyList<OrderStatus> ParsedStatuses =>
        string.IsNullOrWhiteSpace(Status)
            ? []
            : Status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => Enum.TryParse<OrderStatus>(s, ignoreCase: true, out var parsed)
                    ? (OrderStatus?)parsed
                    : null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .Distinct()
                .ToList();
}
