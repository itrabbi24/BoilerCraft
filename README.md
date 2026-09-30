<div align="center">

<img src="https://raw.githubusercontent.com/itrabbi24/BoilerCraft/main/assets/icon.png" alt="BoilerCraft" width="140" />

# BoilerCraft

**Production-ready projects in one command, built on each framework's official tooling.**
<br />
Any version · Authentication · Themes · Windows, macOS & Linux

[![npm](https://img.shields.io/npm/v/boilercraft?color=22d3ee&label=npm)](https://www.npmjs.com/package/boilercraft)
[![node](https://img.shields.io/badge/node-%E2%89%A518.3-3b82f6)](https://nodejs.org)
[![platforms](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-8b5cf6)](#)
[![license](https://img.shields.io/badge/license-MIT-10b981)](LICENSE)

```bash
npx boilercraft
```

<img src="https://raw.githubusercontent.com/itrabbi24/BoilerCraft/main/docs/assets/cli-menu.svg" alt="BoilerCraft main menu" width="760" />

</div>

---

## Why BoilerCraft

Most boilerplates are a frozen copy of someone's project. They go stale the day a new framework version ships. BoilerCraft works differently:

- **Always the real thing.** The base project is created by the framework's own creator (`composer create-project`, `create-next-app`, `dotnet new`, `npm`), so it matches the version you pick exactly.
- **Any version, including future ones.** Versions are fetched live from npm, Packagist and the .NET release index. A new release shows up in the menu without an update to BoilerCraft.
- **Ready to build on.** Auth, database wiring, a themed landing page and UI components are added on top, so you start with a working app instead of a blank one.
- **One command, zero setup.** Everything happens inside `npx boilercraft`. Missing PHP, Composer or the .NET SDK? It offers to install them for you.

## Quick start

```bash
npx boilercraft
```

Choose **Create a new project** and answer a few questions (↑/↓ to move, Enter to select):

<div align="center">
<img src="https://raw.githubusercontent.com/itrabbi24/BoilerCraft/main/docs/assets/cli-create.svg" alt="Creating a Laravel project" width="760" />
</div>

When it's done, pick **Start the dev server** or **Open in VS Code** from the same menu. You don't need to type `cd` or any other command.

## What you can create

| Framework | Versions | Choices | Databases | Auth |
|---|---|---|---|---|
| **Laravel** | 10 – 13 | Blade · Vue 3 (Inertia) · React (Inertia) | MySQL · SQL Server | Sanctum API tokens, or full Breeze UI (login, register, profile) for Vue/React |
| **Next.js** | 14 – 16 | App Router · Pages Router | MongoDB · MySQL · SQL Server | JWT register/login API routes |
| **.NET** | 8 – 10 | MVC (Model · View · Controller) · Web API | SQL Server · MySQL | MVC: cookie login/register pages · API: JWT + Swagger |
| **Node.js + Express** | 4 – 5 | — | MySQL · MongoDB · SQL Server | JWT middleware with roles |
| **Raw PHP (MVC)** | — | — | MySQL | Session auth |

Every project also gets:
- A **theme**: Slate Midnight, Cyber Emerald, Royal Indigo or Crimson Amber, in dark, light or both with a toggle.
- **Styling** with Tailwind CSS, Bootstrap 5 or plain CSS.
- Optional **UI components**: skeleton loaders, spinners, modals, off-canvas drawers.

The version list above is just what's verified today. Newer releases appear automatically and are marked *preview support* until verified.

## Missing a toolchain?

BoilerCraft checks what's installed and offers to set up the rest. You can also do it any time from **Check & install tools** in the menu.

| Tool | Needed for | How BoilerCraft installs it |
|---|---|---|
| .NET SDK | .NET | Microsoft's official `dotnet-install` script, exact version, user folder, **no admin rights** |
| Composer | Laravel | Official installer, signature-verified, user folder |
| PHP | Laravel, Raw PHP | `winget` (Windows) · Homebrew (macOS) · apt / dnf / pacman (Linux) |
| Node.js | Next.js, Express | Already there, since `npx` runs on it |

Tools installed into the user folder live in `~/.boilercraft/tools` and are added to your user PATH.

## Web studio

Prefer a browser? Choose **Open the web studio** in the menu. You get the same generator as a visual form at `http://localhost:4800`.

<details>
<summary><b>Automation (scripts and CI)</b></summary>

<br />

Every question has a flag. Anything you leave out is asked interactively, or takes its default with `-y`.

```bash
npx boilercraft new shop  -s laravel -v 13 --frontend vue -t emerald -d mysql -y
npx boilercraft new web   -s nextjs --router pages --no-auth -d mongodb -y
npx boilercraft new admin -s dotnet-core -v 10 --template mvc -y --install-tools
npx boilercraft --help
```

</details>

<details>
<summary><b>How new framework versions are handled</b></summary>

<br />

Each framework is described by a small manifest in [`stacks/<id>/stack.json`](stacks). It covers where versions come from, which official creator to run, and which BoilerCraft files to add, and each step can be limited to certain versions. In practice:

- **A new release usually needs nothing.** It appears in the menu automatically.
- **If a release changes something BoilerCraft relies on,** one version-scoped rule is added to the manifest. No code change is needed.

Full reference: [docs/STACK_ENGINE.md](docs/STACK_ENGINE.md).

</details>

<details>
<summary><b>Project structure</b></summary>

<br />

```text
BoilerCraft/
├── bin/boilercraft.js        # CLI entry (npx boilercraft)
├── cli/                      # Interactive menus, banner and prompts
├── stacks/<id>/              # One folder per framework
│   ├── stack.json            #   versions, official creator, version-scoped steps
│   └── overlays/             #   files BoilerCraft adds on top
├── services/
│   ├── engine/               # Manifest runner, live version catalog, tool installer
│   ├── generate.js           # Shared entry for the CLI and web studio
│   ├── themeGenerator.js     # Theme palettes and dark/light CSS
│   └── componentGenerator.js # Skeleton, spinner, modal and drawer components
├── templates/                # Offline fallback templates (and Raw PHP)
├── public/index.html         # Web studio
└── server.js                 # Web studio API
```

</details>

<details>
<summary><b>Working on BoilerCraft</b></summary>

<br />

```bash
git clone https://github.com/itrabbi24/BoilerCraft.git
cd BoilerCraft
npm install
node bin/boilercraft.js
```

To test exactly what npm users get: run `npm pack`, then `npx --package=./boilercraft-<version>.tgz boilercraft` in an empty folder.

**Releasing:** bump `version` in `package.json`, then run `npm publish`. Alternatively, push a `vX.Y.Z` tag: GitHub Actions smoke-tests on Windows, macOS and Linux and then publishes (requires the `NPM_TOKEN` repository secret).

</details>

## Contributing

Issues and pull requests are welcome. Please see the [issues page](https://github.com/itrabbi24/BoilerCraft/issues).

1. Fork the repository.
2. Create a branch: `git checkout -b feature/my-feature`.
3. Commit your changes and open a pull request.

## Author

**ARG RABBI** · [@itrabbi24](https://github.com/itrabbi24)

If BoilerCraft saves you time, a ⭐ on [GitHub](https://github.com/itrabbi24/BoilerCraft) is appreciated.

## License

[MIT](LICENSE) © 2026 ARG RABBI
