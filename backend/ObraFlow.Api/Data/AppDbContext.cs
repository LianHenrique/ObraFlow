using Microsoft.EntityFrameworkCore;
using ObraFlow.Api.Models;

namespace ObraFlow.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Obra> Obras => Set<Obra>();
    public DbSet<Despesa> Despesas => Set<Despesa>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Obra>().Property(o => o.Orcamento).HasPrecision(12, 2);
        modelBuilder.Entity<Despesa>().Property(d => d.Valor).HasPrecision(12, 2);
        modelBuilder.Entity<Obra>().HasMany(o => o.Despesas)
            .WithOne(d => d.Obra).HasForeignKey(d => d.ObraId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
