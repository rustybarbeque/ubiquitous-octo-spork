using Macrocenter.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;

namespace Macrocenter.Api.Controllers;

/// <summary>
/// Liveness probe. Used by the Compose healthcheck and by anyone verifying that
/// a fresh checkout came up correctly.
/// </summary>
[ApiController]
[Route("health")]
public class HealthController(
    MacrocenterDbContext db,
    ILogger<HealthController> logger) : ControllerBase
{
    /// <summary>
    /// Reports API liveness along with whether Postgres is reachable.
    /// Returns 503 when the database cannot be reached, so that a container
    /// healthcheck fails rather than reporting a half-working service.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        try
        {
            if (await db.Database.CanConnectAsync(cancellationToken))
            {
                return Ok(new { status = "healthy", database = "reachable" });
            }

            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { status = "unhealthy", database = "unreachable" });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Health check could not reach the database.");

            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { status = "unhealthy", database = "unreachable", error = ex.Message });
        }
    }
}
