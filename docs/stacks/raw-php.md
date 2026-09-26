# 🐘 Raw PHP (MVC) Full Documentation & Maintenance Guide

## 📌 Overview
This boilerplate provides a production-grade, zero-dependency MVC framework in pure PHP, featuring a **Singleton Multi-Driver PDO**, **Fluent QueryBuilder**, **Session Authentication with Role Guards**, and **Native .env parsing**.

---

## 📂 Architecture & Directory Tree
```text
├── app/
│   ├── Controllers/
│   │   ├── HomeController.php    # Landing page, health check, AJAX demo
│   │   └── AuthController.php    # Register, Login, Session handling
│   ├── Models/
│   │   └── User.php              # User model leveraging QueryBuilder & Auto-Schema
│   └── Views/
│       ├── home.php              # Dynamic Landing view (AJAX + jQuery demo)
│       ├── dashboard.php         # Protected Dashboard with role badges
│       ├── 404.php               # Error page
│       └── auth/
│           ├── login.php         # AJAX login interface
│           └── register.php      # AJAX register interface
├── config/
│   ├── Database.php              # Multi-driver PDO (MySQL, MSSQL, SQLite, Postgres)
│   ├── QueryBuilder.php          # Fluent SQL Query Builder
│   ├── Auth.php                  # Session authentication & Role manager
│   ├── Middleware.php            # Route guards (auth, guest, role)
│   ├── Router.php                # Lightweight custom URL dispatcher
│   └── Env.php                   # Native .env parser (No composer needed)
├── public/                       # Web Document Root
│   ├── index.php                 # Front Controller & Route dispatcher
│   ├── css/theme.css             # Theme variable stylesheet
│   └── js/theme.js               # Theme switching script
└── .env                          # Local Environment configuration
```

---

## ⚡ Quick Start & Running
1. Open your terminal in the generated project root.
2. Run the built-in PHP development server:
```bash
php -S localhost:8000 -t public
```
3. Open your browser at: `http://localhost:8000`

---

## 🔐 Authentication & Route Guards
Protecting routes in `public/index.php`:

```php
use App\Config\Middleware;

// 1. Authenticated Users Only:
$router->get('/dashboard', function() {
    Middleware::auth(); // Redirects unauthenticated visitors to /login
    require __DIR__ . '/../app/Views/dashboard.php';
});

// 2. Specific Role Guard (e.g. 'admin'):
$router->get('/admin', function() {
    Middleware::role('admin'); // Returns 403 Forbidden if not admin
    require __DIR__ . '/../app/Views/admin.php';
});

// 3. Guest Only (Redirects logged-in users away from login/register):
$router->get('/login', function() {
    Middleware::guest();
    (new AuthController())->showLogin();
});
```

---

## 🗄️ QueryBuilder Usage Guide

### Fetch Records:
```php
use App\Config\QueryBuilder;

// Select specific columns with conditions & ordering
$users = QueryBuilder::table('users')
    ->select(['id', 'name', 'email'])
    ->where('role', 'user')
    ->orderBy('id', 'DESC')
    ->limit(10)
    ->get();

// Find single record
$user = QueryBuilder::table('users')->where('id', 1)->first();
```

### Insert & Update:
```php
// Insert
QueryBuilder::table('users')->insert([
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'role' => 'user'
]);

// Update
QueryBuilder::table('users')
    ->where('id', 1)
    ->update(['name' => 'Updated Name']);
```

---

## 🗄️ Database Configuration (.env)
Edit your `.env` file to switch databases seamlessly:

```ini
# MySQL
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=my_app_db
DB_USER=root
DB_PASS=

# OR Microsoft SQL Server (MSSQL)
# DB_CONNECTION=mssql
# DB_HOST=127.0.0.1
# DB_PORT=1433
# DB_NAME=my_app_db
# DB_USER=sa
# DB_PASS=YourStrong@Password
```
