using Macrocenter.Api.Auth;
using Macrocenter.Api.Dtos;
using Macrocenter.Api.Dtos.Users;
using Macrocenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Macrocenter.Api.Controllers;

/// <summary>
/// User accounts: the account-settings endpoint customers use on themselves,
/// and the administrative user management endpoints.
/// </summary>
[ApiController]
[Route("users")]
[Authorize]
public class UsersController(UserService users, CurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// The administrative user list. Search by email or name, filter by role,
    /// sorted and paged.
    /// </summary>
    /// <response code="200">A page of matching users.</response>
    /// <response code="401">No valid token was supplied.</response>
    /// <response code="403">The caller is not an administrator.</response>
    [HttpGet]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(PagedResult<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<UserDto>>> Search(
        [FromQuery] UserQuery query,
        CancellationToken cancellationToken) =>
        Ok(await users.SearchAsync(query, cancellationToken));

    /// <summary>Updates the signed-in user's own profile.</summary>
    /// <response code="200">The updated account.</response>
    /// <response code="400">The request was not valid.</response>
    /// <response code="409">Another account already uses that email address.</response>
    [HttpPut("me")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserDto>> UpdateMe(
        UpdateProfileRequest request,
        CancellationToken cancellationToken) =>
        this.ToResponse(
            await users.UpdateProfileAsync(currentUser.UserId, request, cancellationToken));

    /// <summary>One user by id. Administrators only.</summary>
    /// <response code="200">The user.</response>
    /// <response code="404">No such user.</response>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> Get(Guid id, CancellationToken cancellationToken)
    {
        var user = await users.GetAsync(id, cancellationToken);

        return user is null
            ? Problem(
                detail: "That user does not exist.",
                statusCode: StatusCodes.Status404NotFound,
                title: "Not found")
            : Ok(user);
    }

    /// <summary>
    /// Updates any user, including their role. This is how an account is
    /// promoted to administrator.
    /// </summary>
    /// <response code="200">The updated user.</response>
    /// <response code="404">No such user.</response>
    /// <response code="409">Another account already uses that email address.</response>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserDto>> Update(
        Guid id,
        AdminUpdateUserRequest request,
        CancellationToken cancellationToken) =>
        this.ToResponse(await users.AdminUpdateAsync(id, request, cancellationToken));

    /// <summary>
    /// Deletes a user.
    /// </summary>
    /// <remarks>
    /// Refused for a user who has placed orders, because order history is
    /// never destroyed, and refused for your own account.
    /// </remarks>
    /// <response code="204">The account was deleted.</response>
    /// <response code="404">No such user.</response>
    /// <response code="409">The user has orders, or is the caller.</response>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken) =>
        this.ToNoContentResponse(
            await users.DeleteAsync(id, currentUser.UserId, cancellationToken));
}
