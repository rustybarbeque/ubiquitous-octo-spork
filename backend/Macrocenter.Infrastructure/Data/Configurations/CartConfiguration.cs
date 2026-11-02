using Macrocenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Macrocenter.Infrastructure.Data.Configurations;

public class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();

        // One cart per user, enforced by the database rather than by convention.
        builder.HasIndex(c => c.UserId).IsUnique();
        builder.HasIndex(c => c.AppliedDiscountCodeId);

        // Deleting a discount code must not delete carts. The cart loses its
        // discount and recomputes without one on the next read.
        builder.HasOne(c => c.AppliedDiscountCode)
            .WithMany()
            .HasForeignKey(c => c.AppliedDiscountCodeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(c => c.Items)
            .WithOne(ci => ci.Cart)
            .HasForeignKey(ci => ci.CartId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
