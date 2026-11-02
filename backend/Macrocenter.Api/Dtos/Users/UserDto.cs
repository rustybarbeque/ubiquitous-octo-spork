using Macrocenter.Domain.Enums;

namespace Macrocenter.Api.Dtos.Users;

/// <summary>
/// A user as the API returns it. Note the absence of any password field.
/// </summary>
public sealed record UserDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string FullName,
    UserRole Role,
    bool IsAdmin,
    DateTimeOffset CreatedAt);
