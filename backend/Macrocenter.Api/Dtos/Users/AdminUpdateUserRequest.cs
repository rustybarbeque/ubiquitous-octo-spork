using System.ComponentModel.DataAnnotations;
using Macrocenter.Domain.Enums;

namespace Macrocenter.Api.Dtos.Users;

/// <summary>
/// Changes an administrator makes to any user. Same as a profile update, plus
/// the role — this is how an account is promoted to administrator.
/// </summary>
public sealed class AdminUpdateUserRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public UserRole Role { get; set; } = UserRole.Customer;
}
