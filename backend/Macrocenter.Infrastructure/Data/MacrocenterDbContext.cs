using Macrocenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Macrocenter.Infrastructure.Data;

/// <summary>
/// EF Core context for the Macrocenter store. Table and column names come out
/// as snake_case because the API configures
/// <c>UseSnakeCaseNamingConvention()</c>; per-entity rules live in the
/// configuration classes under <c>Data/Configurations</c>.
/// </summary>
public class MacrocenterDbContext(DbContextOptions<MacrocenterDbContext> options)
    : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<Item> Items => Set<Item>();

    public DbSet<Cart> Carts => Set<Cart>();

    public DbSet<CartItem> CartItems => Set<CartItem>();

    public DbSet<DiscountCode> DiscountCodes => Set<DiscountCode>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderLine> OrderLines => Set<OrderLine>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Picks up every IEntityTypeConfiguration<T> in this assembly.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MacrocenterDbContext).Assembly);
    }
}
