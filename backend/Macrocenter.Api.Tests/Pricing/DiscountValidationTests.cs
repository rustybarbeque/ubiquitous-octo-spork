using Macrocenter.Api.Services;
using Macrocenter.Domain.Entities;
using Macrocenter.Domain.Enums;
using Macrocenter.Domain.Pricing;

namespace Macrocenter.Api.Tests.Pricing;

/// <summary>
/// Tests for the discount-code rules: when a code counts, and what it is worth.
/// </summary>
public class DiscountValidationTests
{
    private static readonly DateTimeOffset Now = new(2026, 3, 1, 12, 0, 0, TimeSpan.Zero);

    private readonly PricingService _pricing = new(new CartCalculator(), new SalesTaxCalculator());

    [Fact]
    public void NoCode_MeansNoDiscount()
    {
        var result = _pricing.ValidateDiscount(null, subtotal: 200m, Now);

        Assert.Equal(DiscountStatus.None, result.Status);
        Assert.Equal(0m, result.Amount);
    }

    [Fact]
    public void PercentageCode_TakesThatPercentageOff()
    {
        var result = _pricing.ValidateDiscount(Percentage(10m), subtotal: 200m, Now);

        Assert.Equal(DiscountStatus.Applied, result.Status);
        Assert.Equal(20m, result.Amount);
    }

    [Fact]
    public void FixedAmountCode_TakesThoseDollarsOff()
    {
        var result = _pricing.ValidateDiscount(Fixed(25m), subtotal: 200m, Now);

        Assert.Equal(DiscountStatus.Applied, result.Status);
        Assert.Equal(25m, result.Amount);
    }

    [Fact]
    public void FixedAmountLargerThanTheOrder_OnlyTakesTheOrderToZero()
    {
        // A $25 code on a $10 order discounts $10, not $25. Nobody gets change.
        var result = _pricing.ValidateDiscount(Fixed(25m), subtotal: 10m, Now);

        Assert.Equal(DiscountStatus.Applied, result.Status);
        Assert.Equal(10m, result.Amount);
    }

    [Fact]
    public void PercentageDiscount_IsRoundedToWholeCents()
    {
        // 99.99 * 7.5% is 7.49925.
        var result = _pricing.ValidateDiscount(Percentage(7.5m), subtotal: 99.99m, Now);

        Assert.Equal(7.50m, result.Amount);
    }

    [Fact]
    public void InactiveCode_DoesNotApply()
    {
        var code = Percentage(10m);
        code.IsActive = false;

        var result = _pricing.ValidateDiscount(code, subtotal: 200m, Now);

        Assert.Equal(DiscountStatus.Inactive, result.Status);
        Assert.Equal(0m, result.Amount);
    }

    [Fact]
    public void CodeThatHasNotStartedYet_DoesNotApply()
    {
        var code = Percentage(10m);
        code.StartsAt = Now.AddDays(1);

        var result = _pricing.ValidateDiscount(code, subtotal: 200m, Now);

        Assert.Equal(DiscountStatus.NotYetActive, result.Status);
        Assert.Equal(0m, result.Amount);
    }

    [Fact]
    public void ExpiredCode_DoesNotApply()
    {
        var code = Percentage(10m);
        code.EndsAt = Now.AddDays(-1);

        var result = _pricing.ValidateDiscount(code, subtotal: 200m, Now);

        Assert.Equal(DiscountStatus.Expired, result.Status);
        Assert.Equal(0m, result.Amount);
    }

    [Fact]
    public void CodeInsideItsDateWindow_Applies()
    {
        var code = Percentage(10m);
        code.StartsAt = Now.AddDays(-1);
        code.EndsAt = Now.AddDays(1);

        Assert.Equal(DiscountStatus.Applied, _pricing.ValidateDiscount(code, 200m, Now).Status);
    }

    [Fact]
    public void OrderBelowTheMinimum_DoesNotGetTheDiscount()
    {
        var code = Fixed(25m);
        code.MinimumSubtotal = 100m;

        var result = _pricing.ValidateDiscount(code, subtotal: 50m, Now);

        Assert.Equal(DiscountStatus.SubtotalTooLow, result.Status);
        Assert.Equal(0m, result.Amount);
    }

    [Fact]
    public void OrderExactlyAtTheMinimum_GetsTheDiscount()
    {
        var code = Fixed(25m);
        code.MinimumSubtotal = 100m;

        var result = _pricing.ValidateDiscount(code, subtotal: 100m, Now);

        Assert.Equal(DiscountStatus.Applied, result.Status);
        Assert.Equal(25m, result.Amount);
    }

    [Fact]
    public void ARefusedCode_ExplainsItself()
    {
        var code = Percentage(10m);
        code.EndsAt = Now.AddDays(-1);

        var result = _pricing.ValidateDiscount(code, 200m, Now);

        Assert.False(string.IsNullOrWhiteSpace(result.Message));
    }

    private static DiscountCode Percentage(decimal value) => new()
    {
        Code = "SAVE",
        Kind = DiscountKind.Percentage,
        Value = value,
        IsActive = true,
    };

    private static DiscountCode Fixed(decimal value) => new()
    {
        Code = "TAKE",
        Kind = DiscountKind.FixedAmount,
        Value = value,
        IsActive = true,
    };
}
