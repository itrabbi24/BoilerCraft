using Microsoft.EntityFrameworkCore;
using DotNetBootstrapMssql.Models;

namespace DotNetBootstrapMssql.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Seed initial sample product
            modelBuilder.Entity<Product>().HasData(
                new Product { Id = 1, Name = "Starter Kit", Price = 99.99m, Description = "Built with BoilerCraft Studio" }
            );
        }
    }
}
