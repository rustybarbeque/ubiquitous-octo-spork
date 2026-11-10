using Macrocenter.Domain.Pricing;

namespace Macrocenter.Api.Tests.Pricing;

/// <summary>
/// Tests for sales tax.
/// </summary>
/// <remarks>
/// The tests named TeamTask2_* are the specification for Team Task 2. They are
/// skipped until a teammate implements it. See docs/TEAMMATE_TASKS.md.
/// </remarks>
public class SalesTaxCalculatorTests
{
    [Fact]
    public void DefaultRate_IsTheProjectRate()
    {
        Assert.Equal(8.25m, SalesTaxCalculator.DefaultRatePercent);
        Assert.Equal(8.25m, new SalesTaxCalculator().RatePercent);
    }

    [Fact]
    public void TaxOnOneHundredDollars_IsTheRateItself()
    {
        Assert.Equal(8.25m, new SalesTaxCalculator().CalculateTax(100m));
    }

    [Fact]
    public void TaxIsRoundedToWholeCents()
    {
        // 1234.56 * 8.25% is exactly 101.8512, which is not a payable amount.
        Assert.Equal(101.85m, new SalesTaxCalculator().CalculateTax(1234.56m));
    }

    [Fact]
    public void NothingTaxable_MeansNoTax()
    {
        Assert.Equal(0m, new SalesTaxCalculator().CalculateTax(0m));
    }

    [Fact]
    public void RateIsConfigurable()
    {
        Assert.Equal(5m, new SalesTaxCalculator(10m).CalculateTax(50m));
    }

    [Fact]
    public void ZeroRate_MeansNoTax()
    {
        var calculator = new SalesTaxCalculator(0m);

        Assert.Equal(0m, calculator.RatePercent);
        Assert.Equal(0m, calculator.CalculateTax(100m));
    }

    [Fact]
    public void NegativeRate_IsRejected()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new SalesTaxCalculator(-1m));
    }

    // --- Team Task 2: round like a register, and never go negative ----------

    [Fact]
    public void TeamTask2_RoundsAHalfCentUp()
    {
        // 10.00 * 8.25% is exactly 0.825. A register charges 0.83; C#'s default
        // rounding picks the even cent and gives 0.82.
        Assert.Equal(0.83m, new SalesTaxCalculator().CalculateTax(10.00m));
    }

    [Fact]
    public void TeamTask2_NegativeAmount_IsNotTaxed()
    {
        Assert.Equal(0m, new SalesTaxCalculator().CalculateTax(-50m));
    }

    [Fact]
    public void TeamTask2_NeverReturnsANegativeAmount()
    {
        Assert.True(new SalesTaxCalculator().CalculateTax(-0.01m) >= 0m);
    }
}
