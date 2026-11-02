using Macrocenter.Domain.Entities;
using Macrocenter.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Macrocenter.Infrastructure.Data;

/// <summary>
/// Puts enough data in an empty database to click around in. Runs at startup in
/// Development, right after migrations are applied.
/// </summary>
/// <remarks>
/// Seeding happens at runtime rather than through <c>HasData</c>, which keeps
/// the migration free of a dozen hardcoded GUIDs and makes a clean reseed just
/// <c>docker compose down -v</c>.
/// </remarks>
public static class DatabaseSeeder
{
    /// <summary>Default password for both seeded accounts.</summary>
    public const string SeededAdminEmail = "admin@macrocenter.test";

    /// <summary>Default customer account used for manual testing.</summary>
    public const string SeededCustomerEmail = "student@macrocenter.test";

    /// <summary>
    /// Inserts seed data for any table that is still empty. Safe to call on
    /// every startup: each section is guarded by its own existence check.
    /// </summary>
    public static async Task SeedAsync(MacrocenterDbContext db, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;

        if (!await db.Users.AnyAsync(cancellationToken))
        {
            db.Users.AddRange(
                new User
                {
                    Id = Guid.CreateVersion7(),
                    Email = SeededAdminEmail,
                    Password = "admin",
                    FirstName = "Ada",
                    LastName = "Admin",
                    Role = UserRole.Admin,
                    CreatedAt = now,
                    UpdatedAt = now,
                },
                new User
                {
                    Id = Guid.CreateVersion7(),
                    Email = SeededCustomerEmail,
                    Password = "password",
                    FirstName = "Sam",
                    LastName = "Student",
                    Role = UserRole.Customer,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
        }

        if (!await db.DiscountCodes.AnyAsync(cancellationToken))
        {
            db.DiscountCodes.AddRange(
                new DiscountCode
                {
                    Id = Guid.CreateVersion7(),
                    Code = "SAVE10",
                    Description = "10% off the whole order",
                    Kind = DiscountKind.Percentage,
                    Value = 10.00m,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now,
                },
                new DiscountCode
                {
                    Id = Guid.CreateVersion7(),
                    Code = "TAKE25",
                    Description = "$25 off orders over $100",
                    Kind = DiscountKind.FixedAmount,
                    Value = 25.00m,
                    MinimumSubtotal = 100.00m,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
        }

        if (!await db.Items.AnyAsync(cancellationToken))
        {
            foreach (var (name, description, price, salePrice, quantity, category) in ProductSeeds)
            {
                db.Items.Add(new Item
                {
                    Id = Guid.CreateVersion7(),
                    Name = name,
                    Description = description,
                    ImageUrl = PlaceholderImage(name, category),
                    Category = category,
                    Price = price,
                    SalePrice = salePrice,
                    QuantityAvailable = quantity,
                    IsDeleted = false,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Builds the same placehold.co URL the frontend's mock data builds, so the
    /// seeded catalog renders identically. The host matters: the frontend's
    /// <c>next.config.ts</c> only whitelists placehold.co for remote images,
    /// and frontend source is out of scope to change.
    /// </summary>
    private static string PlaceholderImage(string name, string category)
    {
        var (bg, fg) = CategoryColors.TryGetValue(category, out var colors)
            ? colors
            : ("27272a", "d4d4d8");

        // The frontend replaces spaces with newlines and then URL-encodes,
        // which for every seeded name is exactly a space -> %0A swap.
        var label = name.Replace(" ", "%0A");

        return $"https://placehold.co/600x600/{bg}/{fg}.png?text={label}&font=roboto";
    }

    private static readonly Dictionary<string, (string Bg, string Fg)> CategoryColors = new()
    {
        ["Graphics Cards"] = ("16532d", "bbf7d0"),
        ["Processors"] = ("1e3a8a", "bfdbfe"),
        ["Motherboards"] = ("581c87", "e9d5ff"),
        ["Memory"] = ("9a3412", "fed7aa"),
        ["Storage"] = ("115e59", "99f6e4"),
        ["Power Supplies"] = ("7f1d1d", "fecaca"),
        ["Cooling"] = ("155e75", "a5f3fc"),
        ["Cases"] = ("27272a", "d4d4d8"),
        ["Monitors"] = ("312e81", "c7d2fe"),
    };

    /// <summary>
    /// The same twelve products the frontend renders from mock data, so the
    /// storefront looks the same once it is wired to the API.
    /// </summary>
    private static readonly (string Name, string Description, decimal Price,
        decimal? SalePrice, int Quantity, string Category)[] ProductSeeds =
    [
        ("Vantage RTX 5090 Ti 32GB",
            "Flagship graphics card with 32GB GDDR7 and a triple-slot cooler.",
            3899.99m, 3499.99m, 4, "Graphics Cards"),
        ("Titanium Core i9-15900KX",
            "24-core flagship desktop processor, unlocked, 6.2GHz boost.",
            1299.00m, null, 11, "Processors"),
        ("Apex X870E Extreme Motherboard",
            "E-ATX flagship board with PCIe 5.0, Wi-Fi 7, and 24-phase VRM.",
            1499.99m, null, 0, "Motherboards"),
        ("Ryzen Threadripper 9980X",
            "64-core workstation CPU for rendering and simulation workloads.",
            8999.00m, 7999.00m, 2, "Processors"),
        ("Prism DDR5-8000 64GB Kit",
            "2x32GB low-latency RGB memory kit, CL32.",
            799.00m, null, 38, "Memory"),
        ("Nova NVMe Gen5 4TB SSD",
            "PCIe 5.0 M.2 SSD, 14,000MB/s read with integrated heatsink.",
            899.00m, 749.00m, 16, "Storage"),
        ("Titan 1600W Platinum PSU",
            "Fully modular ATX 3.1 power supply with native 12V-2x6 cable.",
            699.00m, null, 3, "Power Supplies"),
        ("Cryo 360 AIO Liquid Cooler",
            "360mm triple-fan AIO with a 3.5in LCD pump display.",
            499.99m, null, 21, "Cooling"),
        ("Monolith Full Tower Case",
            "Dual-chamber tempered glass case with support for 480mm radiators.",
            599.00m, 479.00m, 7, "Cases"),
        ("Vertex 32in 4K 240Hz Monitor",
            "QD-OLED display with 0.03ms response time and DisplayPort 2.1.",
            2499.00m, null, 9, "Monitors"),
        ("Vantage RTX 5080 16GB",
            "High-end graphics card with 16GB GDDR7 and dual-slot cooling.",
            1899.00m, 1649.00m, 13, "Graphics Cards"),
        ("Quantum 2TB PCIe 5.0 SSD",
            "Compact M.2 2280 SSD built for high-refresh gaming rigs.",
            549.00m, null, 1, "Storage"),
    ];
}
