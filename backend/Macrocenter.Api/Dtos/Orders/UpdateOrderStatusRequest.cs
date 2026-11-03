using System.ComponentModel.DataAnnotations;
using Macrocenter.Domain.Enums;

namespace Macrocenter.Api.Dtos.Orders;

/// <summary>
/// Moves an order to a new status. Any status may be set from any other; this
/// project deliberately does not model a state machine.
/// </summary>
public sealed class UpdateOrderStatusRequest
{
    [Required]
    public OrderStatus Status { get; set; }
}
