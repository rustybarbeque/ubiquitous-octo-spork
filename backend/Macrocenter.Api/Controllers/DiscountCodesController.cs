using Macrocenter.Api.Auth;
using Macrocenter.Api.Dtos;
using Macrocenter.Api.Dtos.Discounts;
using Macrocenter.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Macrocenter.Api.Controllers;

/// <summary>
/// Administrative management of discount codes.
/// </summary>
/// <remarks>
/// Changes here are reflected in shopping carts immediately: a cart stores a
/// reference to the code, not a copy of its value, so it recalculates against
/// the edited code on its next read. Placed orders are unaffected, because they
/// keep their own frozen copy of the code text and amount.
/// </remarks>
[ApiController]
[Route("discount-codes")]
[Authorize(Roles = Roles.Admin)]
public class DiscountCodesController(DiscountCodeService codes) : ControllerBase
{
    /// <summary>Searches, sorts, and pages the discount codes.</summary>
    /// <response code="200">A page of matching codes.</response>
    /// <response code="401">No valid token was supplied.</response>
    /// <response code="403">The caller is not an administrator.</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<DiscountCodeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<DiscountCodeDto>>> Search(
        [FromQuery] DiscountCodeQuery query,
        CancellationToken cancellationToken) =>
        Ok(await codes.SearchAsync(query, cancellationToken));

    /// <summary>One discount code by id.</summary>
    /// <response code="200">The code.</response>
    /// <response code="404">No such code.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DiscountCodeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DiscountCodeDto>> Get(
        Guid id,
        CancellationToken cancellationToken)
    {
        var code = await codes.GetAsync(id, cancellationToken);

        return code is null
            ? Problem(
                detail: "That discount code does not exist.",
                statusCode: StatusCodes.Status404NotFound,
                title: "Not found")
            : Ok(code);
    }

    /// <summary>
    /// Creates a discount code, either percentage-based or a fixed dollar
    /// amount, with optional activation and expiration dates.
    /// </summary>
    /// <response code="201">The code was created.</response>
    /// <response code="400">The request was not valid.</response>
    /// <response code="409">A code with that text already exists.</response>
    [HttpPost]
    [ProducesResponseType(typeof(DiscountCodeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DiscountCodeDto>> Create(
        SaveDiscountCodeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await codes.CreateAsync(request, cancellationToken);

        return this.ToCreatedResponse(
            result,
            nameof(Get),
            new { id = result.Value?.Id ?? Guid.Empty });
    }

    /// <summary>Updates a discount code.</summary>
    /// <response code="200">The updated code.</response>
    /// <response code="400">The request was not valid.</response>
    /// <response code="404">No such code.</response>
    /// <response code="409">Another code already uses that text.</response>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(DiscountCodeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DiscountCodeDto>> Update(
        Guid id,
        SaveDiscountCodeRequest request,
        CancellationToken cancellationToken) =>
        this.ToResponse(await codes.UpdateAsync(id, request, cancellationToken));

    /// <summary>
    /// Deletes a discount code. Carts using it lose their discount; placed
    /// orders are untouched.
    /// </summary>
    /// <response code="204">The code was deleted.</response>
    /// <response code="404">No such code.</response>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken) =>
        this.ToNoContentResponse(await codes.DeleteAsync(id, cancellationToken));
}
