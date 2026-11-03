using Macrocenter.Api.Services;
using Macrocenter.Domain.Entities;
using Macrocenter.Domain.Enums;
using Macrocenter.Domain.Pricing;

namespace Macrocenter.Api.Tests.Pricing;

/// <summary>
/// Tests for pricing a whole cart: line subtotals, the order subtotal, where
/// tax is charged, and the total.
/// </summary>
public class PricingServiceCartTests
{
    private static readonly DateTimeOffset Now = new(2026, 3, 1, 12, 0, 0, TimeSpan.Zero);

    private readonly PricingService _pricing = new(new CartCalculator(), new SalesTaxCalculator());

    [Fact]
    public void EmptyCart_IsAllZeros()
    {
        var result = _pricing.PriceCart([], null, Now);

        Assert.Empty(result.Lines);
        Assert.Equal(0m, result.Subtotal);
        Assert.Equal(0m, result.Discount.Amount);
        Assert.Equal(0m, result.TaxAmount);
        Assert.Equal(0m, result.Total);
    }

    [Fact]
    public void SubtotalIsTheSumOfTheLines()
    {
        var result = _pricing.PriceCart(TwoLineCart(), null, Now);

        // 100.00 x 2 = 200.00, plus 40.00 x 1 on sale = 240.00.
        Assert.Equal(240m, result.Subtotal);
        Assert.Equal(200m, result.Lines[0].LineSubtotal);
        Assert.Equal(40m, result.Lines[1].LineSubtotal);
    }

    [Fact]
    public void ALineOnSale_IsChargedAtTheSalePrice()
    {
        var result = _pricing.PriceCart(TwoLineCart(), null, Now);

        var saleLine = result.Lines[1];

        Assert.True(saleLine.IsOnSale);
        Assert.Equal(40m, saleLine.UnitPrice);
    }

    [Fact]
    public void ALineNotOnSale_IsChargedAtTheRegularPrice()
    {
        var result = _pricing.PriceCart(TwoLineCart(), null, Now);

        var regularLine = result.Lines[0];

        Assert.False(regularLine.IsOnSale);
        Assert.Equal(100m, regularLine.UnitPrice);
    }

    [Fact]
    public void WithNoDiscount_TaxIsChargedOnTheWholeSubtotal()
    {
        var result = _pricing.PriceCart(TwoLineCart(), null, Now);

        // 240.00 at 8.25%.
        Assert.Equal(19.80m, result.TaxAmount);
        Assert.Equal(259.80m, result.Total);
    }

    [Fact]
    public void TaxIsChargedAfterTheDiscount_NotBeforeIt()
    {
        var code = new DiscountCode
        {
            Code = "SAVE10",
            Kind = DiscountKind.Percentage,
            Value = 10m,
            IsActive = true,
        };

        var result = _pricing.PriceCart(TwoLineCart(), code, Now);

        Assert.Equal(240m, result.Subtotal);
        Assert.Equal(24m, result.Discount.Amount);

        // 8.25% of 216.00, not of 240.00. Taxing the full subtotal would give
        // 19.80 and overcharge the customer.
        Assert.Equal(17.82m, result.TaxAmount);
        Assert.Equal(233.82m, result.Total);
    }

    [Fact]
    public void TotalIsAlwaysSubtotalMinusDiscountPlusTax()
    {
        var code = new DiscountCode
        {
            Code = "SAVE10",
            Kind = DiscountKind.Percentage,
            Value = 10m,
            IsActive = true,
        };

        var result = _pricing.PriceCart(TwoLineCart(), code, Now);

        Assert.Equal(
            result.Subtotal - result.Discount.Amount + result.TaxAmount,
            result.Total);
    }

    [Fact]
    public void SubtotalAlwaysEqualsTheSumOfTheLineSubtotals()
    {
        var result = _pricing.PriceCart(TwoLineCart(), null, Now);

        Assert.Equal(result.Lines.Sum(l => l.LineSubtotal), result.Subtotal);
    }

    [Fact]
    public void AnExpiredCode_StopsDiscountingButStillReportsItself()
    {
        var code = new DiscountCode
        {
            Code = "SAVE10",
            Kind = DiscountKind.Percentage,
            Value = 10m,
            IsActive = true,
            EndsAt = Now.AddDays(-1),
        };

        var result = _pricing.PriceCart(TwoLineCart(), code, Now);

        Assert.Equal(DiscountStatus.Expired, result.Discount.Status);
        Assert.Equal(0m, result.Discount.Amount);
        Assert.Equal(259.80m, result.Total);
    }

    [Fact]
    public void ADiscountThatCoversTheWholeOrder_LeavesNothingToPay()
    {
        var code = new DiscountCode
        {
            Code = "TAKE25",
            Kind = DiscountKind.FixedAmount,
            Value = 25m,
            IsActive = true,
        };

        var cart = new List<(Item, int)> { (Product("Cable", 10m, null), 1) };

        var result = _pricing.PriceCart(cart, code, Now);

        Assert.Equal(10m, result.Subtotal);
        Assert.Equal(10m, result.Discount.Amount);
        Assert.Equal(0m, result.TaxAmount);
        Assert.Equal(0m, result.Total);
    }

    [Fact]
    public void TheReportedTaxRate_IsTheConfiguredOne()
    {
        var pricing = new PricingService(new CartCalculator(), new SalesTaxCalculator(6m));

        Assert.Equal(6m, pricing.PriceCart(TwoLineCart(), null, Now).TaxRatePercent);
        Assert.Equal(8.25m, _pricing.TaxRatePercent);
    }

    /// <summary>
    /// Two lines: a regular-priced item times two, and one item on sale.
    /// </summary>
    private static List<(Item Item, int Quantity)> TwoLineCart() =>
    [
        (Product("Motherboard", price: 100m, salePrice: null), 2),
        (Product("Memory Kit", price: 50m, salePrice: 40m), 1),
    ];

    private static Item Product(string name, decimal price, decimal? salePrice) => new()
    {
        Id = Guid.CreateVersion7(),
        Name = name,
        Description = $"{name} for testing.",
        ImageUrl = "https://placehold.co/600x600.png",
        Category = "Components",
        Price = price,
        SalePrice = salePrice,
        QuantityAvailable = 10,
    };
}
