using Macrocenter.Domain.Pricing;

namespace Macrocenter.Api.Tests.Pricing;

/// <summary>
/// Tests for the per-line cart math.
/// </summary>
/// <remarks>
/// The tests named TeamTask1_* are the specification for Team Task 1. They are
/// skipped until a teammate implements it. See docs/TEAMMATE_TASKS.md.
/// </remarks>
public class CartCalculatorTests
{
    private readonly CartCalculator _calculator = new();

    // --- Behavior that must hold whether or not Team Task 1 is done ---------

    [Fact]
    public void NoSalePrice_IsNotOnSale()
    {
        Assert.False(_calculator.IsOnSale(regularPrice: 800m, salePrice: null));
    }

    [Fact]
    public void SalePriceBelowRegular_IsOnSale()
    {
        Assert.True(_calculator.IsOnSale(regularPrice: 899.99m, salePrice: 699.99m));
    }

    [Fact]
    public void NotOnSale_ChargesTheRegularPrice()
    {
        Assert.Equal(800m, _calculator.EffectiveUnitPrice(800m, null));
    }

    [Fact]
    public void OnSale_ChargesTheSalePrice()
    {
        Assert.Equal(699.99m, _calculator.EffectiveUnitPrice(899.99m, 699.99m));
    }

    [Fact]
    public void OnSale_SavingsIsTheDifference()
    {
        Assert.Equal(200m, _calculator.SavingsPerUnit(899.99m, 699.99m));
    }

    [Fact]
    public void NotOnSale_SavesNothing()
    {
        Assert.Equal(0m, _calculator.SavingsPerUnit(800m, null));
    }

    [Fact]
    public void LineSubtotal_IsUnitPriceTimesQuantity()
    {
        Assert.Equal(59.97m, _calculator.LineSubtotal(unitPrice: 19.99m, quantity: 3));
    }

    [Fact]
    public void LineSubtotal_OfOneUnit_IsTheUnitPrice()
    {
        Assert.Equal(19.99m, _calculator.LineSubtotal(19.99m, 1));
    }

    // --- Team Task 1: a sale must actually be cheaper -----------------------

    [Fact(Skip = "TEAM TASK 1 — delete this Skip when you implement it.")]
    public void TeamTask1_SalePriceHigherThanRegular_IsNotOnSale()
    {
        Assert.False(_calculator.IsOnSale(regularPrice: 800m, salePrice: 999m));
    }

    [Fact(Skip = "TEAM TASK 1 — delete this Skip when you implement it.")]
    public void TeamTask1_SalePriceEqualToRegular_IsNotOnSale()
    {
        Assert.False(_calculator.IsOnSale(regularPrice: 800m, salePrice: 800m));
    }

    [Fact(Skip = "TEAM TASK 1 — delete this Skip when you implement it.")]
    public void TeamTask1_ZeroSalePrice_IsNotOnSale()
    {
        Assert.False(_calculator.IsOnSale(regularPrice: 800m, salePrice: 0m));
    }

    [Fact(Skip = "TEAM TASK 1 — delete this Skip when you implement it.")]
    public void TeamTask1_BadSalePrice_StillChargesTheRegularPrice()
    {
        // The point of the task: a mistyped sale must not overcharge anyone.
        Assert.Equal(800m, _calculator.EffectiveUnitPrice(regularPrice: 800m, salePrice: 999m));
    }
}
