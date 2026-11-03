using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Macrocenter.Domain.Entities;
using Microsoft.IdentityModel.Tokens;

namespace Macrocenter.Api.Auth;

/// <summary>
/// Issues the bearer tokens the API accepts.
/// </summary>
/// <remarks>
/// Deliberately simple for a class project: one long-lived token signed with a
/// development key from configuration, no refresh tokens, and no issuer or
/// audience to validate. See docs/architecture.md.
/// </remarks>
public sealed class JwtTokenService(IConfiguration configuration)
{
    /// <summary>
    /// Builds a signed token for a user. The role claim is what makes
    /// <c>[Authorize(Roles = "Admin")]</c> work with no custom policy.
    /// </summary>
    public (string Token, DateTimeOffset ExpiresAt) CreateToken(User user)
    {
        var key = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException(
                "Jwt:Key is not configured. Docker Compose supplies it as Jwt__Key; "
                + "appsettings.json carries a development default for local runs.");

        var expiryHours = configuration.GetValue("Jwt:ExpiryHours", 720);
        var expiresAt = DateTimeOffset.UtcNow.AddHours(expiryHours);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new(ClaimTypes.GivenName, user.FirstName),
            new(ClaimTypes.Surname, user.LastName),
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
