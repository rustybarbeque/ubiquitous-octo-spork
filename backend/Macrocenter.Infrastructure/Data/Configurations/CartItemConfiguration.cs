using Macrocenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Macrocenter.Infrastructure.Data.Configurations;

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.HasKey(ci => ci.Id);

        builder.Property(ci => ci.Quantity).IsRequired();
        builder.Property(ci => ci.AddedAt).IsRequired();

        // Adding an item already in the cart increments the existing row
        // instead of creating a duplicate one.
        builder.HasIndex(ci => new { ci.CartId, ci.ItemId }).IsUnique();

        // A cart line with no item is meaningless, so it evaporates with it.
        builder.HasOne(ci => ci.Item)
            .WithMany(i => i.CartItems)
            .HasForeignKey(ci => ci.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable(t =>
            t.HasCheckConstraint("ck_cart_items_quantity_positive", "quantity > 0"));
    }
}
