using Macrocenter.Domain.Enums;

namespace Macrocenter.Api.Dtos.Users;

/// <summary>
/// Filters for the administrative user list. <c>q</c> matches email, first
/// name, or last name; <c>sort</c> accepts <c>name-asc</c>, <c>name-desc</c>,
/// <c>email-asc</c>, <c>email-desc</c>, <c>newest</c>, or <c>oldest</c>.
/// </summary>
public sealed class UserQuery : PagedQuery
{
    /// <summary>Only return users with this role.</summary>
    public UserRole? Role { get; set; }
}
