namespace Macrocenter.Domain.Enums;

/// <summary>
/// Where an order is in its lifecycle. Admins advance this manually; there is
/// deliberately no transition validation in this project.
/// </summary>
public enum OrderStatus
{
    Pending,
    Paid,
    Shipped,
    Delivered,
    Cancelled,
}
