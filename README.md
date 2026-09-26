# ⚡ BoilerCraft — The Ultimate Multi-Stack Project Studio

<p align="center">
  <img src="public/favicon.ico" alt="BoilerCraft Logo" width="80" height="80" onerror="this.style.display='none'"/>
</p>

<p align="center">
  <strong>Craft production-ready enterprise boilerplates in seconds with real-time dependency resolution, modern UI kits, dynamic themes, and database engines.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#supported-stacks">Supported Stacks</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#desktop-gui">Desktop GUI</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## ✨ Features

- 🎯 **Visual Customizer Studio:** Set your project name, tagline, description, custom logo, author details, and custom server port.
- ⚡ **Auto-Version & Dynamic Dependency Resolution:**
  - Connects directly with **NPM Registry** & **Packagist (PHP)** APIs.
  - Generates projects with the latest stable versions of packages (Next.js, React, Express, Laravel, Mongoose, etc.) without hardcoded obsolete versions.
  - Safe fallback mechanism for offline usage.
- 🎨 **Unified Design System & Curated Themes:**
  - **Dark**, **Light**, and **System/Device Auto-Sync** modes.
  - 4 Pre-tuned themes: *Slate Midnight*, *Cyber Emerald*, *Royal Indigo*, and *Crimson Amber*.
- 🧩 **Ready-to-use Component Injection:**
  - Skeleton Loaders (placeholder cards & tables)
  - Spinners & Progress Indicators
  - Action Dialogs & Modals (with blur backdrop)
  - Offcanvas Navigation Drawers
  - Styled for **Tailwind CSS**, **Bootstrap 5**, or pure **Vanilla CSS**.
- 🖥️ **Run Anywhere:** Run directly in your terminal/browser or as a native **Electron Desktop Application**.

---

## 🛠️ Supported Stacks & Complete Documentation

Each generated project comes with its own customized guide. You can also explore the dedicated stack documentation directly:

| Stack & Architecture | Databases | Included Features | Dedicated Documentation |
|---|---|---|---|
| **Raw PHP (MVC)** | MySQL, MSSQL, SQLite | QueryBuilder, Session Auth, Roles, .env | [📖 Raw PHP Guide](docs/stacks/raw-php.md) |
| **.NET Core 8 Web API** | MSSQL, MySQL | EF Core, Swagger OpenAPI, JWT Auth, Claims | [📖 .NET Core Guide](docs/stacks/dotnet-core.md) |
| **Next.js (App Router)** | MongoDB, MSSQL, MySQL | React Server Components, Route Handlers, Auth | [📖 Next.js Guide](docs/stacks/nextjs.md) |
| **Node.js + Express** | MongoDB, MySQL, MSSQL | Clean Architecture, JWT Middleware, Error Handlers | [📖 Node.js Guide](docs/stacks/node-express.md) |
| **Laravel 11 + Vue 3** | MySQL, MSSQL | Inertia.js, Vite, Vue 3 Composition API, Auth | [📖 Laravel Vue Guide](docs/stacks/laravel-vue.md) |

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/itrabbi24/BoilerCraft.git
cd BoilerCraft
```

### 2. Install dependencies
```bash
npm install
```

### 3. Launch Web Studio
```bash
npm start
```
Open your browser at: `http://localhost:4800`

---

## 💻 Desktop Application (Electron)

To launch as a native Windows / Mac / Linux desktop application:

```bash
npm run desktop
```

---

## 📁 Project Architecture

```text
BoilerCraft/
├── main.js                   # Electron Desktop entry point
├── server.js                 # Studio API & Web server (Express)
├── services/
│   ├── projectGenerator.js   # Master multi-stack project generator
│   ├── versionResolver.js    # Live NPM & Packagist API version fetcher
│   ├── themeGenerator.js     # CSS variables & theme switcher engine
│   └── componentGenerator.js # Skeleton, Modal, Spinner & Drawer templates
├── public/
│   └── index.html            # Interactive visual studio wizard UI
├── package.json
└── README.md
```

---

## 👨‍💻 Developer & Creator

Developed with ❤️ by **[ARG RABBI](https://github.com/itrabbi24)**  
- GitHub: [@itrabbi24](https://github.com/itrabbi24)
- Repository: [BoilerCraft](https://github.com/itrabbi24/BoilerCraft)

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/itrabbi24/BoilerCraft/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License
Distributed under the **MIT License**. See `LICENSE` for more information.
Copyright (c) 2026 ARG RABBI.

