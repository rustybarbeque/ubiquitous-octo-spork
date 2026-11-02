using Macrocenter.Api.Dtos;
using Macrocenter.Api.Dtos.Users;
using Macrocenter.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Macrocenter.Api.Services;

/// <summary>
/// Reading and modifying user accounts, for both the account-settings screen
/// and the administrative user list.
/// </summary>
public sealed class UserService(MacrocenterDbContext db)
{
    /// <summary>
    /// The administrative user list: search by name or email, filter by role,
    /// sorted and paged.
    /// </summary>
    public async Task<PagedResult<UserDto>> SearchAsync(
        UserQuery query,
        CancellationToken cancellationToken)
    {
        var users = db.Users.AsNoTracking();

        if (query.Search is { } search)
        {
            users = users.Where(u =>
                EF.Functions.ILike(u.Email, $"%{search}%")
                || EF.Functions.ILike(u.FirstName, $"%{search}%")
                || EF.Functions.ILike(u.LastName, $"%{search}%"));
        }

        if (query.Role.HasValue)
        {
            users = users.Where(u => u.Role == query.Role.Value);
        }

        users = query.Sort switch
        {
            "name-asc" => users.OrderBy(u => u.LastName).ThenBy(u => u.FirstName),
            "name-desc" => users.OrderByDescending(u => u.LastName).ThenByDescending(u => u.FirstName),
            "email-asc" => users.OrderBy(u => u.Email),
            "email-desc" => users.OrderByDescending(u => u.Email),
            "oldest" => users.OrderBy(u => u.CreatedAt),
            _ => users.OrderByDescending(u => u.CreatedAt),
        };

        var total = await users.CountAsync(cancellationToken);

        var page = await users
            .Skip(query.Skip)
            .Take(query.NormalizedPageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<UserDto>(
            page.Select(Mappings.ToDto).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    /// <summary>One user by id, or null.</summary>
    public async Task<UserDto?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(u => u.Id == id, cancellationToken);

        return user?.ToDto();
    }

    /// <summary>
    /// Updates the signed-in user's own name and email. Cannot change a role.
    /// </summary>
    public async Task<ServiceResult<UserDto>> UpdateProfileAsync(
        Guid userId,
        UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            return ServiceResult<UserDto>.NotFound("That user does not exist.");
        }

        var email = AuthService.Normalize(request.Email);

        if (await db.Users.AnyAsync(u => u.Email == email && u.Id != userId, cancellationToken))
        {
            return ServiceResult<UserDto>.Conflict(
                "Another account already uses that email address.");
        }

        user.Email = email;
        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<UserDto>.Ok(user.ToDto());
    }

    /// <summary>
    /// Updates any user, including their role. This is how an account becomes
    /// an administrator.
    /// </summary>
    public async Task<ServiceResult<UserDto>> AdminUpdateAsync(
        Guid id,
        AdminUpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user is null)
        {
            return ServiceResult<UserDto>.NotFound("That user does not exist.");
        }

        var email = AuthService.Normalize(request.Email);

        if (await db.Users.AnyAsync(u => u.Email == email && u.Id != id, cancellationToken))
        {
            return ServiceResult<UserDto>.Conflict(
                "Another account already uses that email address.");
        }

        user.Email = email;
        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Role = request.Role;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<UserDto>.Ok(user.ToDto());
    }

    /// <summary>
    /// Deletes a user, refusing when that would destroy order history.
    /// </summary>
    /// <remarks>
    /// The database would refuse this anyway — orders reference users with
    /// Restrict — but checking first lets the API answer with a 409 and an
    /// explanation instead of surfacing a foreign-key error.
    /// </remarks>
    public async Task<ServiceResult<bool>> DeleteAsync(
        Guid id,
        Guid actingUserId,
        CancellationToken cancellationToken)
    {
        if (id == actingUserId)
        {
            return ServiceResult<bool>.Conflict("You cannot delete your own account.");
        }

        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user is null)
        {
            return ServiceResult<bool>.NotFound("That user does not exist.");
        }

        if (await db.Orders.AnyAsync(o => o.UserId == id, cancellationToken))
        {
            return ServiceResult<bool>.Conflict(
                "That user has placed orders, so the account cannot be deleted. "
                + "Order history is never destroyed.");
        }

        db.Users.Remove(user);
        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<bool>.Ok(true);
    }
}
