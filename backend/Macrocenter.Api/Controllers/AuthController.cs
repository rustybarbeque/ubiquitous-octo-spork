using Macrocenter.Api.Auth;
using Macrocenter.Api.Dtos.Auth;
using Macrocenter.Api.Dtos.Users;
using Macrocenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Macrocenter.Api.Controllers;

/// <summary>
/// Registration, sign-in, and reading back who you are signed in as.
/// </summary>
[ApiController]
[Route("auth")]
public class AuthController(AuthService auth, CurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// Creates a customer account and returns a token for it, so a new user is
    /// signed in immediately.
    /// </summary>
    /// <response code="201">The account was created.</response>
    /// <response code="400">The request was not valid.</response>
    /// <response code="409">That email address is already registered.</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var result = await auth.RegisterAsync(request, cancellationToken);

        return this.ToCreatedResponse(result, nameof(Me), new { });
    }

    /// <summary>
    /// Exchanges an email and password for a bearer token.
    /// </summary>
    /// <response code="200">Signed in.</response>
    /// <response code="400">The email address or password was wrong.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await auth.LoginAsync(request, cancellationToken);

        return this.ToResponse(result);
    }

    /// <summary>
    /// The account the current bearer token belongs to.
    /// </summary>
    /// <response code="200">The signed-in user.</response>
    /// <response code="401">No valid token was supplied.</response>
    /// <response code="404">The account has since been deleted.</response>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> Me(CancellationToken cancellationToken)
    {
        var user = await auth.GetCurrentAsync(currentUser.UserId, cancellationToken);

        return user is null
            ? Problem(
                detail: "That user does not exist.",
                statusCode: StatusCodes.Status404NotFound,
                title: "Not found")
            : Ok(user);
    }
}
