using Macrocenter.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Macrocenter.Api.Controllers;

/// <summary>
/// Turns a service outcome into an HTTP response, so every controller reports
/// failures the same way and all of them are RFC 7807 problem documents.
/// </summary>
public static class ControllerExtensions
{
    /// <summary>
    /// 200 with the value on success, or the problem response that matches the
    /// failure.
    /// </summary>
    public static ActionResult<T> ToResponse<T>(
        this ControllerBase controller,
        ServiceResult<T> result) =>
        result.IsOk
            ? controller.Ok(result.Value)
            : controller.ToProblem<T>(result);

    /// <summary>
    /// 204 on success, or the matching problem response. For deletes, where
    /// there is nothing useful to return.
    /// </summary>
    public static ActionResult ToNoContentResponse(
        this ControllerBase controller,
        ServiceResult<bool> result) =>
        result.IsOk
            ? controller.NoContent()
            : controller.ToProblem(result);

    /// <summary>
    /// 201 with a Location header on success, or the matching problem
    /// response.
    /// </summary>
    public static ActionResult<T> ToCreatedResponse<T>(
        this ControllerBase controller,
        ServiceResult<T> result,
        string actionName,
        object routeValues) =>
        result.IsOk
            ? controller.CreatedAtAction(actionName, routeValues, result.Value)
            : controller.ToProblem<T>(result);

    private static ActionResult<T> ToProblem<T>(
        this ControllerBase controller,
        ServiceResult<T> result) =>
        controller.Problem(
            detail: result.Error,
            statusCode: StatusCodeFor(result.Status),
            title: TitleFor(result.Status));

    private static ActionResult ToProblem(
        this ControllerBase controller,
        ServiceResult<bool> result) =>
        controller.Problem(
            detail: result.Error,
            statusCode: StatusCodeFor(result.Status),
            title: TitleFor(result.Status));

    private static int StatusCodeFor(ResultStatus status) => status switch
    {
        ResultStatus.NotFound => StatusCodes.Status404NotFound,
        ResultStatus.Conflict => StatusCodes.Status409Conflict,
        ResultStatus.Forbidden => StatusCodes.Status403Forbidden,
        _ => StatusCodes.Status400BadRequest,
    };

    private static string TitleFor(ResultStatus status) => status switch
    {
        ResultStatus.NotFound => "Not found",
        ResultStatus.Conflict => "Conflict",
        ResultStatus.Forbidden => "Forbidden",
        _ => "Invalid request",
    };
}
