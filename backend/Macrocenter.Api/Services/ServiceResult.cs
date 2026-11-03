namespace Macrocenter.Api.Services;

/// <summary>
/// How a service call turned out. Controllers map these onto HTTP status codes,
/// which keeps exceptions out of ordinary control flow.
/// </summary>
public enum ResultStatus
{
    /// <summary>It worked. 200 or 201.</summary>
    Ok,

    /// <summary>The thing being acted on does not exist. 404.</summary>
    NotFound,

    /// <summary>It exists but the action is not allowed right now. 409.</summary>
    Conflict,

    /// <summary>The request itself does not make sense. 400.</summary>
    Invalid,

    /// <summary>The caller is not allowed to touch this. 403.</summary>
    Forbidden,
}

/// <summary>
/// A service call's outcome and, when it succeeded, its value.
/// </summary>
/// <typeparam name="T">The value type on success.</typeparam>
public sealed record ServiceResult<T>(ResultStatus Status, T? Value, string? Error)
{
    /// <summary>Whether the call succeeded.</summary>
    public bool IsOk => Status == ResultStatus.Ok;

    public static ServiceResult<T> Ok(T value) => new(ResultStatus.Ok, value, null);

    public static ServiceResult<T> NotFound(string error) =>
        new(ResultStatus.NotFound, default, error);

    public static ServiceResult<T> Conflict(string error) =>
        new(ResultStatus.Conflict, default, error);

    public static ServiceResult<T> Invalid(string error) =>
        new(ResultStatus.Invalid, default, error);

    public static ServiceResult<T> Forbidden(string error) =>
        new(ResultStatus.Forbidden, default, error);
}
