using System.ComponentModel.DataAnnotations;

namespace Macrocenter.Api.Dtos.Users;

/// <summary>Changes a user makes to their own account.</summary>
public sealed class UpdateProfileRequest
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
}
