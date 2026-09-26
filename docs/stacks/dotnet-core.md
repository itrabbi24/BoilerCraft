# 🟣 .NET Core 8 Web API Full Documentation & Maintenance Guide

## 📌 Overview
High-performance **.NET Core 8 Web API** with **Entity Framework Core**, **Swagger / OpenAPI Documentation**, **JWT Bearer Token Authentication**, and pre-wired CSS systems (Tailwind CSS or Bootstrap 5).

---

## 📂 Architecture & Directory Tree
```text
├── Controllers/
│   ├── ProductsController.cs     # CRUD Web API Controller
│   └── AuthController.cs         # JWT Authentication & Role Claims
├── Models/
│   └── Product.cs                # Entity Model
├── Data/
│   └── ApplicationDbContext.cs   # EF Core DbContext with Seeding
├── Program.cs                    # Dependency Injection, Middleware, Swagger
└── {ProjectName}.csproj          # Project file with Nuget packages
```

---

## ⚡ Quick Start & Running
1. Restore packages and run migrations:
```bash
dotnet restore
dotnet build
```

2. Start the API server:
```bash
dotnet run
```

3. Open Swagger UI in your browser:
```text
http://localhost:5000/swagger
```

---

## 🗄️ Database Migrations (EF Core)

### Creating Migrations:
Whenever you change or add models in `Models/`:
```bash
dotnet ef migrations add AddNewEntity
```

### Applying Migrations to Database:
```bash
dotnet ef database update
```

---

## 🔐 JWT Authentication
- Endpoint: `POST /api/auth/login`
- Sample Body:
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```
- In Swagger or Postman, include the returned Bearer token in the `Authorization` header:
```text
Authorization: Bearer <your_jwt_token>
```
