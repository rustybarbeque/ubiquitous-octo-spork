using Macrocenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Macrocenter.Infrastructure.Data.Configurations;

public class ItemConfiguration : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Name).IsRequired().HasMaxLength(200);
        builder.Property(i => i.Description).IsRequired().HasMaxLength(2000);
        builder.Property(i => i.ImageUrl).IsRequired().HasMaxLength(500);
        builder.Property(i => i.Category).IsRequired().HasMaxLength(100);

        // Money is numeric(10,2). Never float or double.
        builder.Property(i => i.Price).IsRequired().HasPrecision(10, 2);
        builder.Property(i => i.SalePrice).HasPrecision(10, 2);

        builder.Property(i => i.QuantityAvailable).IsRequired();
        builder.Property(i => i.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(i => i.CreatedAt).IsRequired();
        builder.Property(i => i.UpdatedAt).IsRequired();

        builder.HasIndex(i => i.Name);
        builder.HasIndex(i => i.QuantityAvailable);

        // The catalog hot path: every public query filters on IsDeleted and
        // often also on Category.
        builder.HasIndex(i => new { i.IsDeleted, i.Category });

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_items_price_non_negative", "price >= 0");
            t.HasCheckConstraint(
                "ck_items_sale_price_non_negative",
                "sale_price IS NULL OR sale_price >= 0");
            t.HasCheckConstraint(
                "ck_items_quantity_non_negative",
                "quantity_available >= 0");
        });
    }
}
