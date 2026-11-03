using Macrocenter.Api.Auth;
using Macrocenter.Api.Dtos.Auth;
using Macrocenter.Api.Dtos.Users;
using Macrocenter.Domain.Entities;
using Macrocenter.Domain.Enums;
using Macrocenter.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Macrocenter.Api.Services;

/// <summary>
/// Registration and sign-in.
/// </summary>
/// <remarks>
/// Passwords are compared as plaintext, which is a deliberate and documented
/// shortcut for this class project — see docs/architecture.md.
/// </remarks>
public sealed class AuthService(MacrocenterDbContext db, JwtTokenService tokens)
{
    /// <summary>
    /// Creates a customer account. Administrator accounts are seeded or
    /// promoted by an existing administrator, never self-assigned here.
    /// </summary>
    public async Task<ServiceResult<AuthResponse>> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var email = Normalize(request.Email);

        if (await db.Users.AnyAsync(u => u.Email == email, cancellationToken))
        {
            return ServiceResult<AuthResponse>.Conflict(
                "An account with that email address already exists.");
        }

        var now = DateTimeOffset.UtcNow;

        var user = new User
        {
            Id = Guid.CreateVersion7(),
            Email = email,
            Password = request.Password,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Role = UserRole.Customer,
            CreatedAt = now,
            UpdatedAt = now,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<AuthResponse>.Ok(BuildResponse(user));
    }

    /// <summary>
    /// Checks credentials and issues a token. Returns the same message whether
    /// the email or the password was wrong.
    /// </summary>
    public async Task<ServiceResult<AuthResponse>> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var email = Normalize(request.Email);

        var user = await db.Users
            .SingleOrDefaultAsync(u => u.Email == email, cancellationToken);

        if (user is null || user.Password != request.Password)
        {
            return ServiceResult<AuthResponse>.Invalid("Incorrect email address or password.");
        }

        return ServiceResult<AuthResponse>.Ok(BuildResponse(user));
    }

    /// <summary>
    /// Reads the signed-in user back out of the database, or null if the
    /// account has been deleted since the token was issued.
    /// </summary>
    public async Task<UserDto?> GetCurrentAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);

        return user?.ToDto();
    }

    private AuthResponse BuildResponse(User user)
    {
        var (token, expiresAt) = tokens.CreateToken(user);

        return new AuthResponse(token, expiresAt, user.ToDto());
    }

    /// <summary>
    /// Emails are stored and compared lowercased, so casing can never create a
    /// second account for the same person.
    /// </summary>
    internal static string Normalize(string email) => email.Trim().ToLowerInvariant();
}
