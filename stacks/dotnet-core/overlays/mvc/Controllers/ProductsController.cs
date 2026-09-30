using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using {{NAMESPACE}}.Data;
using {{NAMESPACE}}.Models;

namespace {{NAMESPACE}}.Controllers
{
    {{PRODUCTS_AUTHORIZE}}
    public class ProductsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /Products
        public async Task<IActionResult> Index()
        {
            return View(await _context.Products.OrderBy(p => p.Name).ToListAsync());
        }

        // GET: /Products/Create
        public IActionResult Create()
        {
            return View(new Product());
        }

        // POST: /Products/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Name,Price,Description")] Product product)
        {
            if (!ModelState.IsValid) return View(product);
            _context.Add(product);
            await _context.SaveChangesAsync();
            TempData["Status"] = $"\"{product.Name}\" was created.";
            return RedirectToAction(nameof(Index));
        }

        // GET: /Products/Edit/5
        public async Task<IActionResult> Edit(int id)
        {
            var product = await _context.Products.FindAsync(id);
            return product == null ? NotFound() : View(product);
        }

        // POST: /Products/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Name,Price,Description")] Product product)
        {
            if (id != product.Id) return NotFound();
            if (!ModelState.IsValid) return View(product);
            _context.Update(product);
            await _context.SaveChangesAsync();
            TempData["Status"] = $"\"{product.Name}\" was updated.";
            return RedirectToAction(nameof(Index));
        }

        // GET: /Products/Delete/5
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _context.Products.FindAsync(id);
            return product == null ? NotFound() : View(product);
        }

        // POST: /Products/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product != null)
            {
                _context.Products.Remove(product);
                await _context.SaveChangesAsync();
                TempData["Status"] = $"\"{product.Name}\" was deleted.";
            }
            return RedirectToAction(nameof(Index));
        }
    }
}
