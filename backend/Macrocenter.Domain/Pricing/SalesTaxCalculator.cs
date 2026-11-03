namespace Macrocenter.Domain.Pricing;

/// <summary>
/// Calculates sales tax.
/// </summary>
public sealed class SalesTaxCalculator
{
    // The sales tax rate, in percent. This is the only place it is defined.
    // It can also be changed in settings (Pricing:SalesTaxRatePercent).
    // You do NOT need to change this for the task.
    public const decimal DefaultRatePercent = 8.25m;

    public SalesTaxCalculator(decimal ratePercent = DefaultRatePercent)
    {
        if (ratePercent < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(ratePercent), "Tax rate cannot be negative.");
        }

        RatePercent = ratePercent;
    }

    // The rate this calculator uses, e.g. 8.25 means 8.25%.
    public decimal RatePercent { get; }

    // ==================== TEAM TASK 2 ====================
    // Goal: fix two problems in CalculateTax.
    //
    // 1. Rounding. Math.Round normally rounds an exact half-cent to the
    //    nearest EVEN cent, so $0.825 becomes $0.82. A cash register would
    //    charge $0.83. Hint: Math.Round accepts a third argument,
    //    MidpointRounding.AwayFromZero, which rounds a half up.
    //
    // 2. Negative amounts. If taxableAmount is zero or negative, return 0.
    //    Check this first, before doing any math.
    //
    // Examples (at 8.25%):
    //   CalculateTax(100.00m)  -> 8.25
    //   CalculateTax(10.00m)   -> 0.83    (currently returns 0.82)
    //   CalculateTax(1234.56m) -> 101.85
    //   CalculateTax(0m)       -> 0
    //   CalculateTax(-50m)     -> 0       (currently returns a negative number)
    //
    // When the TeamTask2 tests pass, delete this comment block.
    // =====================================================
    public decimal CalculateTax(decimal taxableAmount)
    {
        decimal tax = taxableAmount * RatePercent / 100m;
        return Math.Round(tax, 2);
    }
}
