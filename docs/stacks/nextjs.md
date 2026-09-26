# 🚀 Next.js (App Router) Full Documentation & Maintenance Guide

## 📌 Overview
Modern **Next.js 14/15 App Router** enterprise boilerplate supporting React Server Components (RSC), Server Actions, dynamic database connections (**MongoDB**, **MSSQL**, or **MySQL**), and theming.

---

## 📂 Architecture & Directory Tree
```text
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.js    # System health check route handler
│   │   │   └── auth/login/route.js# Next.js authentication handler
│   │   ├── layout.jsx             # Root layout with HTML data-theme injection
│   │   └── page.jsx               # Landing page with interactive components
│   ├── lib/
│   │   └── db.js                  # Database connection pool / client
│   └── styles/
│       └── theme.css              # Curated CSS Variable palette
├── package.json
└── .env
```

---

## ⚡ Quick Start & Running
1. Install dependencies:
```bash
npm install
```

2. Start development server with hot-reload:
```bash
npm run dev
```

3. Build and run production server:
```bash
npm run build
npm start
```

---

## 🗄️ Database Usage in Server Components & Routes

### Example: Querying in Route Handler (`src/app/api/users/route.js`):
```javascript
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function GET() {
  const db = await connectDB();
  // Execute database queries here
  return NextResponse.json({ success: true });
}
```
