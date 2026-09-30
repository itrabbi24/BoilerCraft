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

## 🚀 Get started

```bash
npx boilercraft
```

That's the only command you need. It works on Windows, macOS and Linux, needs only Node.js 18.3+, and there's nothing to clone or install first.

```text
  ██████╗  ██████╗ ██╗██╗     ███████╗██████╗  ██████╗██████╗  █████╗ ███████╗████████╗
  ...
  by ARG RABBI   ·   v1.0.0

  ? What would you like to do?
    ❯ Create a new project          Laravel · Next.js · Express · .NET · PHP
      Check & install tools         PHP · Composer · .NET SDK
      Browse frameworks & versions
      Open the web studio           same features in your browser
      About BoilerCraft
      Exit
```

Everything happens inside that menu. Use ↑/↓ to move and Enter to choose:

| Menu | What it does |
|---|---|
| **Create a new project** | Name → framework → **version** (fetched live, so new releases appear automatically) → **auth** on/off → **theme** (Slate Midnight · Cyber Emerald · Royal Indigo · Crimson Amber) and dark/light mode → database → styling → summary → create. When it's done you can **start the dev server** or **open the project in VS Code** straight from the menu. |
| **Check & install tools** | Shows what's installed and installs PHP, Composer or any .NET SDK version for you. |
| **Browse frameworks & versions** | Every supported version, with LTS and recommended marked. |
| **Open the web studio** | The same generator in your browser. |

Projects are created with each framework's **official tool** (`composer create-project`, `create-next-app`, `dotnet new`, `npm`), so they always match the version you picked. BoilerCraft then adds auth, database wiring and your theme on top.

### Missing PHP, Composer or the .NET SDK?

BoilerCraft notices and offers to install it. You don't need to leave the menu:

| Tool | How it is installed |
|---|---|
| .NET SDK | Microsoft's official `dotnet-install` script, exact version, user folder, no admin rights |
| Composer | Official installer (signature-verified), user folder |
| PHP | `winget` (Windows) · Homebrew (macOS) · apt / dnf / pacman (Linux) |

Tools in the user folder live in `~/.boilercraft/tools` and are added to your user PATH.

<details>
<summary>Automation (scripts / CI, no prompts)</summary>

```bash
npx boilercraft new shop -s laravel -v 12 -t emerald -d mysql -y
npx boilercraft new api  -s dotnet-core -v 10 --no-auth -y --install-tools
npx boilercraft --help
```

Flags you leave out are asked interactively, or take their defaults with `-y`. See [docs/STACK_ENGINE.md](docs/STACK_ENGINE.md) for how versions are managed.
</details>

<details>
<summary>Working on BoilerCraft itself</summary>

```bash
git clone https://github.com/itrabbi24/BoilerCraft.git
cd BoilerCraft && npm install
node bin/boilercraft.js       # or: npm link, then `boilercraft`
```

To release: bump `version` in package.json, then push a tag `vX.Y.Z`. The GitHub Action smoke-tests on Windows, macOS and Linux, then publishes to npm (needs the `NPM_TOKEN` secret).
</details>

---

<!--
  Desktop app (Electron) — DEPRECATED in favour of the cross-platform CLI above.
  main.js and the electron scripts are kept so it can be revived.

## 💻 Desktop Application (Electron)

To launch as a native Windows / Mac / Linux desktop application:

```bash
npm run desktop
```
-->

---

## 📁 Project Architecture

```text
BoilerCraft/
├── main.js                   # Electron Desktop entry point
├── server.js                 # Studio API & Web server (Express)
├── bin/boilercraft.js        # CLI entry (`npx boilercraft`)
├── cli/                      # Interactive menus, banner, prompts (ui.js, app.js)
├── stacks/<id>/stack.json    # Per-stack manifest: versions, official creator, overlays
├── services/
│   ├── engine/               # Manifest runner + live version catalog
│   ├── generate.js           # Shared entry (engine, with template fallback)
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

