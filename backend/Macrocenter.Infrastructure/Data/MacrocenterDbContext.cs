using Microsoft.EntityFrameworkCore;

namespace Macrocenter.Infrastructure.Data;

/// <summary>
/// EF Core context for the Macrocenter store. Entity sets and their
/// configurations are added in the database phase; for now this exists so the
/// API can verify connectivity to Postgres.
/// </summary>
public class MacrocenterDbContext(DbContextOptions<MacrocenterDbContext> options)
    : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Picks up every IEntityTypeConfiguration<T> in this assembly.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MacrocenterDbContext).Assembly);
    }
}
