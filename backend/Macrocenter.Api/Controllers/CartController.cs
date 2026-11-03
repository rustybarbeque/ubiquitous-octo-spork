using Macrocenter.Api.Auth;
using Macrocenter.Api.Dtos.Cart;
using Macrocenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Macrocenter.Api.Controllers;

/// <summary>
/// The signed-in customer's shopping cart.
/// </summary>
/// <remarks>
/// Every endpoint here returns the whole recalculated cart, so the storefront
/// never needs a follow-up request and never has to work out a sale price, a
/// discount, or tax for itself. Prices are read live from the catalog on every
/// call, which is why an administrator's change shows up immediately.
/// </remarks>
[ApiController]
[Route("cart")]
[Authorize]
public class CartController(CartService cart, CurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// The cart as a complete order summary. Creates an empty cart on first
    /// use rather than returning a 404.
    /// </summary>
    /// <response code="200">The cart.</response>
    /// <response code="401">No valid token was supplied.</response>
    [HttpGet]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CartDto>> Get(CancellationToken cancellationToken) =>
        Ok(await cart.GetCartAsync(currentUser.UserId, cancellationToken));

    /// <summary>
    /// Adds a product to the cart, increasing the quantity if it is already
    /// there.
    /// </summary>
    /// <response code="200">The updated cart.</response>
    /// <response code="400">The quantity asked for exceeds available stock.</response>
    /// <response code="404">No such product.</response>
    [HttpPost("items")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CartDto>> AddItem(
        AddCartItemRequest request,
        CancellationToken cancellationToken) =>
        this.ToResponse(await cart.AddItemAsync(currentUser.UserId, request, cancellationToken));

    /// <summary>
    /// Sets a line's quantity. To remove a line, use DELETE rather than a
    /// quantity of zero.
    /// </summary>
    /// <response code="200">The updated cart.</response>
    /// <response code="400">The quantity asked for exceeds available stock.</response>
    /// <response code="404">That product is not in the cart.</response>
    [HttpPut("items/{itemId:guid}")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CartDto>> UpdateItem(
        Guid itemId,
        UpdateCartItemRequest request,
        CancellationToken cancellationToken) =>
        this.ToResponse(await cart.SetQuantityAsync(
            currentUser.UserId, itemId, request.Quantity, cancellationToken));

    /// <summary>Removes a product from the cart.</summary>
    /// <response code="200">The updated cart.</response>
    /// <response code="404">That product is not in the cart.</response>
    [HttpDelete("items/{itemId:guid}")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CartDto>> RemoveItem(
        Guid itemId,
        CancellationToken cancellationToken) =>
        this.ToResponse(await cart.RemoveItemAsync(currentUser.UserId, itemId, cancellationToken));

    /// <summary>Empties the cart, including any applied discount code.</summary>
    /// <response code="200">The now-empty cart.</response>
    [HttpDelete]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CartDto>> Clear(CancellationToken cancellationToken) =>
        Ok(await cart.ClearAsync(currentUser.UserId, cancellationToken));

    /// <summary>
    /// Applies a discount code. Case does not matter.
    /// </summary>
    /// <remarks>
    /// A code that exists but does not currently qualify is refused with a 400
    /// explaining why, for example that it has expired or that the order does
    /// not meet its minimum.
    /// </remarks>
    /// <response code="200">The updated cart, with the discount applied.</response>
    /// <response code="400">The code cannot be used right now.</response>
    /// <response code="404">No such discount code.</response>
    [HttpPost("discount")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CartDto>> ApplyDiscount(
        ApplyDiscountRequest request,
        CancellationToken cancellationToken) =>
        this.ToResponse(await cart.ApplyDiscountAsync(
            currentUser.UserId, request.Code, cancellationToken));

    /// <summary>Removes the applied discount code.</summary>
    /// <response code="200">The updated cart.</response>
    [HttpDelete("discount")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CartDto>> RemoveDiscount(CancellationToken cancellationToken) =>
        Ok(await cart.RemoveDiscountAsync(currentUser.UserId, cancellationToken));
}
