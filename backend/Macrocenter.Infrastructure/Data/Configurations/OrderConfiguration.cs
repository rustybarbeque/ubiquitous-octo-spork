using Macrocenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Macrocenter.Infrastructure.Data.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(o => o.Id);

        builder.Property(o => o.Status).IsRequired().HasMaxLength(32).HasConversion<string>();
        builder.Property(o => o.PlacedAt).IsRequired();
        builder.Property(o => o.UpdatedAt).IsRequired();

        // Frozen totals.
        builder.Property(o => o.Subtotal).IsRequired().HasPrecision(10, 2);
        builder.Property(o => o.DiscountAmount).IsRequired().HasPrecision(10, 2);
        builder.Property(o => o.TaxAmount).IsRequired().HasPrecision(10, 2);
        builder.Property(o => o.Total).IsRequired().HasPrecision(10, 2);

        // A rate, not money: 8.250 needs three decimals, not two.
        builder.Property(o => o.TaxRatePercent).IsRequired().HasPrecision(5, 3);

        // Frozen discount details. Deliberately no foreign key to
        // discount_codes, so editing or deleting a code can never reach into
        // order history.
        builder.Property(o => o.DiscountCodeText).HasMaxLength(32);
        builder.Property(o => o.DiscountKind).HasMaxLength(32).HasConversion<string>();
        builder.Property(o => o.DiscountValue).HasPrecision(10, 2);

        // Frozen customer details.
        builder.Property(o => o.CustomerEmail).IsRequired().HasMaxLength(256);
        builder.Property(o => o.CustomerName).IsRequired().HasMaxLength(201);

        builder.HasIndex(o => o.UserId);
        builder.HasIndex(o => o.PlacedAt);
        builder.HasIndex(o => o.Total);
        builder.HasIndex(o => o.CustomerName);
        builder.HasIndex(o => o.Status);

        // Orders are never deleted. Deleting a customer who has orders fails
        // at the database, and the admin endpoint turns that into a 409.
        builder.HasOne(o => o.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Lines)
            .WithOne(l => l.Order)
            .HasForeignKey(l => l.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
