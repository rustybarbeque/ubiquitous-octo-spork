using Macrocenter.Api.Dtos.Users;

namespace Macrocenter.Api.Dtos.Auth;

/// <summary>
/// A successful sign-in or registration: the bearer token to send on
/// subsequent requests, when it stops working, and who it belongs to.
/// </summary>
public sealed record AuthResponse(string Token, DateTimeOffset ExpiresAt, UserDto User);
