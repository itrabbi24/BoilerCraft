# ⚡ Node.js + Express Full Documentation & Maintenance Guide

## 📌 Overview
Production-ready **Node.js Express Clean Architecture** boilerplate featuring modular controllers, routes, global error handling middlewares, **JWT Authentication**, and database drivers (**MongoDB Mongoose**, **MySQL2**, or **MSSQL**).

---

## 📂 Architecture & Directory Tree
```text
├── src/
│   ├── controllers/
│   │   └── authController.js     # User registration, login, and profiles
│   ├── middlewares/
│   │   ├── auth.js               # JWT verification & role authorization guard
│   │   └── errorHandler.js       # Centralized error handler
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication endpoints
│   │   └── api.js                # Resource endpoints
│   ├── db.js                     # Unified database connection connector
│   └── server.js                 # Express server configuration
├── public/                       # Static assets & theme files
├── package.json
└── .env
```

---

## ⚡ Quick Start & Running
1. Install dependencies:
```bash
npm install
```

2. Start development server (with hot auto-reload):
```bash
npm run dev
```

---

## 🔐 Route Authentication & Role Guards
Protecting endpoints in `src/routes/api.js`:

```javascript
const express = require('express');
const router = express.Router();
const { auth, role } = require('../middlewares/auth');

// Protected for any authenticated user
router.get('/profile', auth, (req, res) => {
  res.json({ user: req.user });
});

// Protected for 'admin' role only
router.delete('/user/:id', auth, role('admin'), (req, res) => {
  res.json({ message: 'User deleted' });
});
```
