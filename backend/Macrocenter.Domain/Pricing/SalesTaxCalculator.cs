namespace Macrocenter.Domain.Pricing;

/// <summary>
/// Sales tax. The rate is defined here and nowhere else; the pricing service is
/// handed a configured instance of this class.
/// </summary>
public sealed class SalesTaxCalculator
{
    /// <summary>
    /// The project's sales tax rate, in percent. This is the single definition
    /// of the rate. To change it, change it here — or override it without
    /// touching code via the <c>Pricing:SalesTaxRatePercent</c> setting.
    /// </summary>
    public const decimal DefaultRatePercent = 8.25m;

    /// <summary>
    /// Creates a calculator at the given rate, defaulting to the project rate.
    /// </summary>
    /// <param name="ratePercent">The rate in percent, e.g. <c>8.25</c>.</param>
    public SalesTaxCalculator(decimal ratePercent = DefaultRatePercent)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(ratePercent);
        RatePercent = ratePercent;
    }

    /// <summary>The configured rate in percent, e.g. <c>8.25</c> for 8.25%.</summary>
    public decimal RatePercent { get; }

    // ===== TEAM TASK 2 of 2 — see docs/TEAMMATE_TASKS.md =====
    // TODO(team-task-2): round half a cent UP the way a cash register does,
    // and never return a negative amount.
    // Acceptance: remove the Skip from the SalesTaxCalculatorTests.TeamTask2_*
    // tests and make them pass. Then delete this banner.
    // =========================================================

    /// <summary>
    /// Calculates the sales tax owed on an amount.
    /// </summary>
    /// <param name="taxableAmount">
    /// The amount to tax. For a cart this is the subtotal after any discount.
    /// </param>
    /// <returns>The tax owed, in dollars, rounded to whole cents.</returns>
    /// <remarks>
    /// <para><b>Current behavior:</b> multiplies by the rate and rounds to two
    /// decimal places using C#'s default "banker's rounding", which breaks an
    /// exact half-cent tie toward the nearest even cent. On $10.00 the exact tax
    /// is $0.825, and this returns <c>0.82</c>. It also happily returns a
    /// negative number if handed a negative amount.</para>
    /// <para><b>Your task:</b> round a half-cent <i>up</i> instead — pass
    /// <c>MidpointRounding.AwayFromZero</c> to <see cref="Math.Round(decimal, int, MidpointRounding)"/>,
    /// which is how a cash register rounds, so $10.00 yields <c>0.83</c>. Also
    /// return <c>0</c> when <paramref name="taxableAmount"/> is zero or
    /// negative, so a fully discounted cart can never show negative tax.</para>
    /// </remarks>
    public decimal CalculateTax(decimal taxableAmount)
        => Math.Round(taxableAmount * RatePercent / 100m, 2);
}
