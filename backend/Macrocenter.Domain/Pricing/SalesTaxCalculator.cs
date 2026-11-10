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

    public decimal CalculateTax(decimal taxableAmount)
    {
        if (taxableAmount <= 0)
        {
            return 0m;
        }

        decimal tax = taxableAmount * RatePercent / 100m;
        return Math.Round(tax, 2, MidpointRounding.AwayFromZero);
    }
}
