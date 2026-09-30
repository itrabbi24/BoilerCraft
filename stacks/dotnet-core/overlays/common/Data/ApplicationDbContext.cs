using Microsoft.EntityFrameworkCore;
using {{NAMESPACE}}.Models;

namespace {{NAMESPACE}}.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }
        {{DBCONTEXT_EXTRA}}

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Product>().Property(p => p.Price).HasPrecision(18, 2);
            modelBuilder.Entity<Product>().HasData(
                new Product { Id = 1, Name = "Starter Kit", Price = 99.99m, Description = "Built with BoilerCraft Studio" }
            );
        }
    }
}
