using Macrocenter.Api.Auth;
using Macrocenter.Api.Dtos;
using Macrocenter.Api.Dtos.Items;
using Macrocenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Macrocenter.Api.Controllers;

/// <summary>
/// The product catalog. Reads are public; every write requires an
/// administrator.
/// </summary>
[ApiController]
[Route("items")]
public class ItemsController(ItemService items) : ControllerBase
{
    /// <summary>
    /// Searches the catalog, with filtering, sorting, and paging.
    /// </summary>
    /// <remarks>
    /// Stock and sale pricing are included on every row, so the storefront can
    /// show availability and sale badges on the main sale page without a
    /// request per product.
    /// </remarks>
    /// <response code="200">A page of matching products.</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ItemDto>>> Search(
        [FromQuery] ItemQuery query,
        CancellationToken cancellationToken) =>
        Ok(await items.SearchAsync(query, cancellationToken));

    /// <summary>
    /// The distinct categories currently in use, for building a filter.
    /// </summary>
    /// <response code="200">The category names, alphabetically.</response>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<string>>> Categories(
        CancellationToken cancellationToken) =>
        Ok(await items.GetCategoriesAsync(cancellationToken));

    /// <summary>One product in detail.</summary>
    /// <response code="200">The product.</response>
    /// <response code="404">No such product, or it has been archived.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItemDto>> Get(Guid id, CancellationToken cancellationToken)
    {
        var item = await items.GetAsync(id, cancellationToken);

        return item is null
            ? Problem(
                detail: "That product does not exist.",
                statusCode: StatusCodes.Status404NotFound,
                title: "Not found")
            : Ok(item);
    }

    /// <summary>Adds a product to the catalog.</summary>
    /// <response code="201">The product was created.</response>
    /// <response code="400">The request was not valid.</response>
    /// <response code="401">No valid token was supplied.</response>
    /// <response code="403">The caller is not an administrator.</response>
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ItemDto>> Create(
        CreateItemRequest request,
        CancellationToken cancellationToken)
    {
        var item = await items.CreateAsync(request, cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = item.Id }, item);
    }

    /// <summary>Replaces a product's editable fields.</summary>
    /// <response code="200">The updated product.</response>
    /// <response code="400">The request was not valid.</response>
    /// <response code="404">No such product.</response>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItemDto>> Update(
        Guid id,
        UpdateItemRequest request,
        CancellationToken cancellationToken) =>
        this.ToResponse(await items.UpdateAsync(id, request, cancellationToken));

    /// <summary>
    /// Puts a product on sale, or clears its sale by sending a null price.
    /// </summary>
    /// <remarks>
    /// The change is visible in every existing cart on its next read, because
    /// carts store no prices of their own.
    /// </remarks>
    /// <response code="200">The updated product.</response>
    /// <response code="404">No such product.</response>
    [HttpPut("{id:guid}/sale")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItemDto>> UpdateSalePrice(
        Guid id,
        UpdateSalePriceRequest request,
        CancellationToken cancellationToken) =>
        this.ToResponse(await items.UpdateSalePriceAsync(id, request.SalePrice, cancellationToken));

    /// <summary>Sets a product's available stock.</summary>
    /// <response code="200">The updated product.</response>
    /// <response code="404">No such product.</response>
    [HttpPut("{id:guid}/inventory")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItemDto>> UpdateInventory(
        Guid id,
        UpdateInventoryRequest request,
        CancellationToken cancellationToken) =>
        this.ToResponse(
            await items.UpdateInventoryAsync(id, request.QuantityAvailable, cancellationToken));

    /// <summary>
    /// Archives a product. It leaves the catalog and every cart, but nothing is
    /// destroyed, so orders containing it still read correctly.
    /// </summary>
    /// <response code="204">The product was archived.</response>
    /// <response code="404">No such product.</response>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken) =>
        this.ToNoContentResponse(await items.SoftDeleteAsync(id, cancellationToken));
}
