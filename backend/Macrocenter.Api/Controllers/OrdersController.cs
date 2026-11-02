using Macrocenter.Api.Auth;
using Macrocenter.Api.Dtos;
using Macrocenter.Api.Dtos.Orders;
using Macrocenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Macrocenter.Api.Controllers;

/// <summary>
/// Checkout and the signed-in customer's own order history.
/// </summary>
[ApiController]
[Route("orders")]
[Authorize]
public class OrdersController(OrderService orders, CurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// Places an order from the signed-in customer's cart, then empties it.
    /// </summary>
    /// <remarks>
    /// This is the moment prices stop being live: everything about each product
    /// and the discount used is copied onto the order, so later edits to the
    /// catalog cannot change this receipt.
    /// </remarks>
    /// <response code="201">The order was placed.</response>
    /// <response code="400">The cart is empty, or stock ran out.</response>
    /// <response code="401">No valid token was supplied.</response>
    [HttpPost]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<OrderDto>> Place(CancellationToken cancellationToken)
    {
        var result = await orders.PlaceOrderAsync(currentUser.UserId, cancellationToken);

        return this.ToCreatedResponse(
            result,
            nameof(Get),
            new { id = result.Value?.Id ?? Guid.Empty });
    }

    /// <summary>
    /// The signed-in customer's order history, sorted and paged.
    /// </summary>
    /// <response code="200">A page of the caller's orders.</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<OrderSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<OrderSummaryDto>>> Mine(
        [FromQuery] OrderQuery query,
        CancellationToken cancellationToken) =>
        Ok(await orders.GetForUserAsync(currentUser.UserId, query, cancellationToken));

    /// <summary>
    /// One order in full, with its lines. Customers may read only their own
    /// orders; administrators may read any.
    /// </summary>
    /// <response code="200">The order.</response>
    /// <response code="403">The order belongs to another customer.</response>
    /// <response code="404">No such order.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDto>> Get(Guid id, CancellationToken cancellationToken) =>
        this.ToResponse(await orders.GetAsync(
            id, currentUser.UserId, currentUser.IsAdmin, cancellationToken));
}
