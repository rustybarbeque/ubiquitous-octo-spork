using Macrocenter.Domain.Enums;

namespace Macrocenter.Domain.Entities;

/// <summary>
/// A customer or administrator account.
/// </summary>
public class User
{
    public Guid Id { get; set; }

    /// <summary>Login identity. Stored lowercased and unique across all users.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Stored in plaintext. This is a deliberate, documented shortcut for a
    /// class project that is never deployed — see docs/architecture.md. This
    /// property must never appear on a DTO.
    /// </summary>
    public string Password { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    /// <summary>Doubles as the admin flag.</summary>
    public UserRole Role { get; set; } = UserRole.Customer;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    /// <summary>The user's single shopping cart, created on first use.</summary>
    public Cart? Cart { get; set; }

    public ICollection<Order> Orders { get; set; } = [];

    /// <summary>Convenience for display and for order snapshots.</summary>
    public string FullName => $"{FirstName} {LastName}".Trim();
}
