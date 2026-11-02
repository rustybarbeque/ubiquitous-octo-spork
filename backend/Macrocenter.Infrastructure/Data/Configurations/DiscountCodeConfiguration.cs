using Macrocenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Macrocenter.Infrastructure.Data.Configurations;

public class DiscountCodeConfiguration : IEntityTypeConfiguration<DiscountCode>
{
    public void Configure(EntityTypeBuilder<DiscountCode> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Code).IsRequired().HasMaxLength(32);
        builder.Property(d => d.Description).HasMaxLength(200);

        builder.Property(d => d.Kind).IsRequired().HasMaxLength(32).HasConversion<string>();

        builder.Property(d => d.Value).IsRequired().HasPrecision(10, 2);
        builder.Property(d => d.MinimumSubtotal).HasPrecision(10, 2);

        builder.Property(d => d.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(d => d.CreatedAt).IsRequired();
        builder.Property(d => d.UpdatedAt).IsRequired();

        builder.HasIndex(d => d.Code).IsUnique();

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_discount_codes_value_positive", "value > 0");
            t.HasCheckConstraint(
                "ck_discount_codes_minimum_subtotal_non_negative",
                "minimum_subtotal IS NULL OR minimum_subtotal >= 0");
        });
    }
}
