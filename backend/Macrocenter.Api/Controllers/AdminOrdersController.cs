using Macrocenter.Api.Auth;
using Macrocenter.Api.Dtos;
using Macrocenter.Api.Dtos.Orders;
using Macrocenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Macrocenter.Api.Controllers;

/// <summary>
/// Administrative views over every customer's orders.
/// </summary>
/// <remarks>
/// Current orders versus historical orders is a status filter rather than two
/// endpoints: <c>?status=Pending,Paid</c> against
/// <c>?status=Delivered,Cancelled</c>.
/// </remarks>
[ApiController]
[Route("admin/orders")]
[Authorize(Roles = Roles.Admin)]
public class AdminOrdersController(OrderService orders) : ControllerBase
{
    /// <summary>
    /// Every order, searchable by customer and sortable by order date,
    /// customer, or order total in dollars.
    /// </summary>
    /// <response code="200">A page of matching orders.</response>
    /// <response code="401">No valid token was supplied.</response>
    /// <response code="403">The caller is not an administrator.</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<OrderSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<OrderSummaryDto>>> Search(
        [FromQuery] OrderQuery query,
        CancellationToken cancellationToken) =>
        Ok(await orders.SearchAllAsync(query, cancellationToken));

    /// <summary>One order in full, with its lines.</summary>
    /// <response code="200">The order.</response>
    /// <response code="404">No such order.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDto>> Get(Guid id, CancellationToken cancellationToken) =>
        this.ToResponse(await orders.GetAsync(
            id, requestingUserId: Guid.Empty, isAdmin: true, cancellationToken));

    /// <summary>
    /// Moves an order to a new status. Any status may be set from any other.
    /// </summary>
    /// <response code="200">The updated order.</response>
    /// <response code="400">The status name was not recognized.</response>
    /// <response code="404">No such order.</response>
    [HttpPut("{id:guid}/status")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDto>> UpdateStatus(
        Guid id,
        UpdateOrderStatusRequest request,
        CancellationToken cancellationToken) =>
        this.ToResponse(await orders.UpdateStatusAsync(id, request.Status, cancellationToken));
}
