namespace Macrocenter.Domain.Enums;

/// <summary>
/// What a user is allowed to do. This single value is the admin flag — there is
/// no separate boolean. Persisted as a string so the database stays readable.
/// </summary>
public enum UserRole
{
    Customer,
    Admin,
}
