/**
 * Generates an exhaustive, production-grade customized README.md 
 * tailored specifically for the chosen backend, database, styling, and auth setup.
 */
function generateDynamicStackReadme(config, backend, database, styling, theme, mode) {
  const title = config.appTitle || config.projectName;
  const author = config.author || 'ARG RABBI';
  const desc = config.description || 'Enterprise grade application crafted with BoilerCraft Studio';

  let stackSpecificGuide = '';

  if (backend === 'raw-php') {
    stackSpecificGuide = `
## 🐘 Raw PHP (MVC) Architecture & Guide

### 📂 Directory Architecture
\`\`\`text
├── app/
│   ├── Controllers/          # HomeController, AuthController
│   ├── Models/               # User Model with QueryBuilder & Auto-Schema
│   └── Views/                # home.php, dashboard.php, auth/login.php, auth/register.php
├── config/
│   ├── Database.php          # Universal PDO Connection (MySQL, MSSQL, SQLite, Postgres)
│   ├── QueryBuilder.php      # Fluent ORM Query Builder (table, select, where, orderBy, get, insert)
│   ├── Auth.php              # Session Auth & Role Manager (check, user, login, logout, hasRole)
│   ├── Middleware.php        # Route guards (auth, guest, role)
│   └── Env.php               # Zero-dependency .env reader
├── public/                   # Web Root (css, js, index.php)
└── .env                      # Database & Server configuration
\`\`\`

### 🔐 Authentication & Roles Usage
- **Protected Route Example:**
\`\`\`php
$router->get('/dashboard', function() {
    Middleware::auth(); // Redirects to /login if guest
    require __DIR__ . '/../app/Views/dashboard.php';
});
\`\`\`
- **Admin Role Guard Example:**
\`\`\`php
$router->get('/admin', function() {
    Middleware::role('admin'); // Returns 403 Forbidden if not admin
    require __DIR__ . '/../app/Views/admin.php';
});
\`\`\`

### 🗄️ QueryBuilder Examples
\`\`\`php
use App\\Config\\QueryBuilder;

// Select with condition
$users = QueryBuilder::table('users')->where('role', 'user')->orderBy('id', 'DESC')->get();

// Insert record
QueryBuilder::table('users')->insert([
    'name' => 'John Doe',
    'email' => 'john@example.com'
]);
\`\`\`

### 🚀 Running the App
\`\`\`bash
# Using PHP Built-in Server:
php -S localhost:${config.port || 8000} -t public
\`\`\`
`;
  } else if (backend === 'dotnet-core' || backend.includes('dotnet')) {
    stackSpecificGuide = `
## 🟣 .NET Core 8 Web API & Guide

### 📂 Directory Architecture
\`\`\`text
├── Controllers/              # ProductsController, Api Controllers
├── Models/                   # C# Data Models & Entities
├── Data/                     # ApplicationDbContext (EF Core SQL Server / MySQL)
├── Program.cs                # Dependency Injection, Middleware, Swagger & Static Files
└── ${config.projectName}.csproj
\`\`\`

### 🗄️ Entity Framework Core Database Setup
\`\`\`bash
# 1. Add EF Core Migration:
dotnet ef migrations add InitialCreate

# 2. Apply Migration to Database (${database.toUpperCase()}):
dotnet ef database update
\`\`\`

### 🚀 Running the App
\`\`\`bash
dotnet restore
dotnet build
dotnet run
\`\`\`
- **Interactive Swagger OpenAPI:** Navigate to \`http://localhost:${config.port || 5000}/swagger\`
`;
  } else if (backend === 'nextjs' || backend.includes('nextjs')) {
    stackSpecificGuide = `
## 🚀 Next.js App Router Architecture & Guide

### 📂 Directory Architecture
\`\`\`text
├── src/
│   ├── app/
│   │   ├── api/health/route.js # Route Handler API
│   │   ├── layout.jsx          # Root Layout & Theme Injection
│   │   └── page.jsx            # Landing Page with Components
│   ├── lib/
│   │   └── db.js               # Database Connection Pool (${database.toUpperCase()})
│   └── styles/
│       └── theme.css           # Curated CSS Variable Design Tokens
\`\`\`

### 🚀 Development & Build
\`\`\`bash
# Install dependencies
npm install

# Start Dev Server with Hot-Reload:
npm run dev

# Build for Production:
npm run build
npm start
\`\`\`
`;
  } else if (backend === 'laravel' || backend.includes('laravel')) {
    stackSpecificGuide = `
## 🔴 Laravel 11 + Vue 3 Guide

### 📂 Directory Architecture
\`\`\`text
├── app/Http/Controllers/     # HomeController with Inertia responses
├── resources/
│   ├── js/
│   │   ├── Pages/            # Vue 3 Composition API Pages (Home.vue)
│   │   └── Components/       # Vue UI Components & Modals
│   └── css/                  # Styling & Theme Variables
├── routes/web.php            # Web Routes
└── composer.json
\`\`\`

### 🚀 Quick Start
\`\`\`bash
composer install
npm install
npm run dev
php artisan serve
\`\`\`
`;
  } else {
    // Node Express
    stackSpecificGuide = `
## ⚡ Node.js + Express Clean Architecture Guide

### 📂 Directory Architecture
\`\`\`text
├── src/
│   ├── controllers/          # Business logic handlers
│   ├── models/               # Database Schemas (${database.toUpperCase()})
│   ├── routes/               # Modular Express Routers
│   ├── middlewares/          # Error handling & Auth guards
│   ├── db.js                 # Database connection connector
│   └── server.js             # Express entry point
├── public/                   # Static theme & demo UI
└── .env
\`\`\`

### 🚀 Running the Server
\`\`\`bash
npm install
npm run dev   # Auto-reload via node --watch
\`\`\`
`;
  }

  return `# ${title}

> ${desc}

---

## 📋 Technology Configuration
- **Backend Architecture:** \`${backend}\`
- **Database Engine:** \`${database.toUpperCase()}\`
- **Styling System:** \`${styling.toUpperCase()}\`
- **Theme Palette:** \`${theme}\` (${mode} mode)
- **Developer & Maintainer:** **${author}**
- **Created with:** [BoilerCraft Studio](https://github.com/itrabbi24/BoilerCraft)

---

${stackSpecificGuide}

---

## 🎨 Theme & Appearance
- Active Theme: \`${theme}\`
- Mode: \`${mode}\`
- Custom CSS variables can be modified directly in the generated \`theme.css\` file.
- Client-side theme switching is powered by the included \`ThemeManager\` helper.

---

## 🛡️ Maintenance & Best Practices
1. **Environment Variables:** Never commit sensitive credentials or real passwords to version control. Always copy \`.env.example\` to \`.env\`.
2. **Database Migrations:** Ensure your local database server (${database.toUpperCase()}) is active and the database name matches \`.env\`.
3. **Updating Packages:** This boilerplate was generated with the latest stable versions from online package registries. Regularly execute security audits (\`npm audit\` or \`composer audit\`).

---

## 🤝 Support & Author
Developed by **[${author}](https://github.com/itrabbi24)**.  
Feedback and questions: [BoilerCraft Issues](https://github.com/itrabbi24/BoilerCraft/issues)
`;
}

module.exports = {
  generateDynamicStackReadme
};
