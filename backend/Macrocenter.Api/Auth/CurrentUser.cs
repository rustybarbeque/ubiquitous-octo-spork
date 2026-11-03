using System.Security.Claims;

namespace Macrocenter.Api.Auth;

/// <summary>
/// Who is making the current request, read from the bearer token's claims.
/// Exists so that controllers and services never parse claims themselves.
/// </summary>
public sealed class CurrentUser(IHttpContextAccessor accessor)
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    /// <summary>Whether the caller presented a valid token.</summary>
    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

    /// <summary>
    /// The signed-in user's id. Only read this on endpoints that require
    /// authentication, where the framework has already rejected anonymous
    /// callers with a 401.
    /// </summary>
    /// <exception cref="InvalidOperationException">
    /// If called with no valid token, which would be a routing or attribute
    /// mistake rather than a user error.
    /// </exception>
    public Guid UserId =>
        Guid.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new InvalidOperationException(
                "No authenticated user on this request. Is [Authorize] missing?");

    /// <summary>The signed-in user's email, or an empty string if anonymous.</summary>
    public string Email => Principal?.FindFirstValue(ClaimTypes.Email) ?? string.Empty;

    /// <summary>Whether the caller is an administrator.</summary>
    public bool IsAdmin => Principal?.IsInRole(Roles.Admin) ?? false;
}

/// <summary>
/// Role names, in one place, so <c>[Authorize(Roles = ...)]</c> and the token
/// factory cannot drift apart.
/// </summary>
public static class Roles
{
    public const string Admin = "Admin";

    public const string Customer = "Customer";
}
