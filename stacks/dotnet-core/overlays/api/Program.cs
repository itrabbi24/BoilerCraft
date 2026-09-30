using Microsoft.EntityFrameworkCore;
using {{NAMESPACE}}.Data;
{{AUTH_USINGS}}

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database: {{DATABASE}} (Entity Framework Core)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured");
builder.Services.AddDbContext<ApplicationDbContext>(options => {{DB_USE}});

{{AUTH_SERVICES}}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseDefaultFiles(); // serves wwwroot/index.html at "/"
app.UseStaticFiles();
{{AUTH_MIDDLEWARE}}
app.UseAuthorization();
app.MapControllers();

app.Run();
