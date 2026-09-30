using System.ComponentModel.DataAnnotations;

namespace {{NAMESPACE}}.Models
{
    public class Product
    {
        public int Id { get; set; }

        [Required, StringLength(120)]
        public string Name { get; set; } = string.Empty;

        [Range(0, 1_000_000)]
        [DataType(DataType.Currency)]
        public decimal Price { get; set; }

        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;
    }
}
