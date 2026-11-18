using Microsoft.EntityFrameworkCore;
using ObraFlow.Api.Models;

namespace ObraFlow.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Obra> Obras => Set<Obra>();
    public DbSet<Despesa> Despesas => Set<Despesa>();
    public DbSet<Receita> Receitas => Set<Receita>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<Obra>().Property(o => o.Orcamento).HasPrecision(12, 2);
        modelBuilder.Entity<Despesa>().Property(d => d.Valor).HasPrecision(12, 2);
        modelBuilder.Entity<Receita>().Property(r => r.Valor).HasPrecision(12, 2);
        modelBuilder.Entity<Obra>().HasMany(o => o.Despesas)
            .WithOne(d => d.Obra).HasForeignKey(d => d.ObraId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
