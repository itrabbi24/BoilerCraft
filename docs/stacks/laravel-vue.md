# 🔴 Laravel 11 + Vue 3 Full Documentation & Maintenance Guide

## 📌 Overview
Full-stack enterprise framework combining **Laravel 11**, **Vue 3 Composition API**, **Inertia.js**, and **Vite**, with database support for **MySQL** and **MSSQL**.

---

## 📂 Architecture & Directory Tree
```text
├── app/
│   └── Http/
│       └── Controllers/
│           ├── HomeController.php
│           └── Auth/AuthenticatedSessionController.php
├── resources/
│   ├── js/
│   │   ├── Pages/
│   │   │   ├── Home.vue           # Vue 3 Composition API Landing
│   │   │   └── Auth/Login.vue     # Vue Login Component
│   │   └── Components/            # Skeletons, Modals, Offcanvas
│   └── css/                       # Theme styles
├── routes/
│   └── web.php                    # Inertia web routes
├── vite.config.js
└── composer.json
```

---

## ⚡ Quick Start & Running
1. Install backend and frontend dependencies:
```bash
composer install
npm install
```

2. Start the Vite asset compiler and Laravel artisan server:
```bash
# Terminal 1:
npm run dev

# Terminal 2:
php artisan serve
```

3. Open in browser: `http://localhost:8000`
