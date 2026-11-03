using Macrocenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Macrocenter.Infrastructure.Data.Configurations;

public class OrderLineConfiguration : IEntityTypeConfiguration<OrderLine>
{
    public void Configure(EntityTypeBuilder<OrderLine> builder)
    {
        builder.HasKey(l => l.Id);

        // Frozen product snapshot. These make the line renderable forever,
        // with or without the item row it came from.
        builder.Property(l => l.ItemName).IsRequired().HasMaxLength(200);
        builder.Property(l => l.ItemDescription).IsRequired().HasMaxLength(2000);
        builder.Property(l => l.ItemImageUrl).IsRequired().HasMaxLength(500);
        builder.Property(l => l.ItemCategory).IsRequired().HasMaxLength(100);

        builder.Property(l => l.RegularPrice).IsRequired().HasPrecision(10, 2);
        builder.Property(l => l.SalePrice).HasPrecision(10, 2);
        builder.Property(l => l.UnitPrice).IsRequired().HasPrecision(10, 2);
        builder.Property(l => l.LineSubtotal).IsRequired().HasPrecision(10, 2);

        builder.Property(l => l.WasOnSale).IsRequired();
        builder.Property(l => l.Quantity).IsRequired();

        builder.HasIndex(l => l.OrderId);
        builder.HasIndex(l => l.ItemId);

        // Hard-deleting an item leaves history intact and only costs the
        // "view this product" link, because everything displayable is above.
        builder.HasOne(l => l.Item)
            .WithMany()
            .HasForeignKey(l => l.ItemId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.ToTable(t =>
            t.HasCheckConstraint("ck_order_lines_quantity_positive", "quantity > 0"));
    }
}
