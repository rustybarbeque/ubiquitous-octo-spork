using System.ComponentModel.DataAnnotations;

namespace Macrocenter.Api.Dtos.Auth;

/// <summary>Credentials for a sign-in attempt.</summary>
public sealed class LoginRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string Password { get; set; } = string.Empty;
}
