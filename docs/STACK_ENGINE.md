# Stack engine: how versions are handled

BoilerCraft does not ship a hand-written copy of each framework. For Laravel, Next.js, Node + Express and .NET it:

1. **Lists versions live** from the upstream registry (Packagist, npm, the .NET release index), so a new major shows up in the UI without a code change.
2. **Creates the base project with the framework's official tool** for the chosen version:
   | Stack | Official creator |
   |---|---|
   | Laravel | `composer create-project laravel/laravel:^N.0` |
   | Next.js | `npx create-next-app@N` |
   | Node + Express | `npm init` + `npm install express@N` |
   | .NET | `dotnet new webapi --framework netN.0` + `dotnet new sln` |
3. **Applies BoilerCraft overlays** on top: auth, DB wiring, theme, landing page. Any step can be limited to certain versions.

Raw PHP has no upstream framework, so it still uses `templates/raw-php-mysql`.

If a required tool is missing, the CLI offers to install it (`services/engine/toolInstaller.js`):
- .NET SDK and Composer go into `~/.boilercraft/tools`, no admin rights needed.
- PHP comes from winget, brew or apt/dnf/pacman.

That folder is put first on PATH for every command BoilerCraft runs, and is added to the user PATH for new terminals. If the user declines, generation falls back to the old template generator. A `requires` entry's `tool` field (defaulting to `cmd`) links it to an installer recipe: `php`, `composer` or `dotnet`.

## Where things live

```
stacks/<id>/stack.json     manifest: versions, required tools, steps
stacks/<id>/overlays/…     files copied into the project ({{PLACEHOLDERS}} filled in)
stacks/<id>/snippets/…     text appended or inserted into generated files
services/engine/           scaffoldEngine.js (runs manifests), versionCatalog.js (live versions)
```

## A new framework version is released: what to do

**Usually nothing.** It appears in the dropdown labelled *Untested*, and users can already generate with it. The base comes from the official tool, so it matches that version exactly.

To verify it:

1. Generate a project with the new version and run it (the `BOILERCRAFT.md` in the output lists the start commands).
2. If it works, raise `versions.testedUpTo` in `stack.json`. The *Untested* label goes away and the version becomes the recommended default.
3. If one of our overlays breaks, add a version-scoped step. Don't edit the existing one:

```json
{ "when": { "version": "<13" },  "copy": "overlays/auth" },
{ "when": { "version": ">=13" }, "copy": "overlays/auth-v13" }
```

Real example, from `stacks/dotnet-core/stack.json`: Swashbuckle 10 needs OpenAPI 2.x, which only .NET 10+ uses. So the package version is a version-scoped var:

```json
{ "name": "SWASHBUCKLE_VERSION", "when": { "version": "<10" },  "value": "9.*" },
{ "name": "SWASHBUCKLE_VERSION", "when": { "version": ">=10" }, "value": "10.*" }
```

To drop an old version, raise `versions.minMajor`.

## Manifest reference

**Stack-specific questions.** A manifest can declare extra choices in `options`. The CLI asks them automatically, and they can be used in `when` and `vars` like any other filter. Next.js uses this for App Router vs Pages Router:

```json
"options": [{
  "id": "router", "label": "Router", "default": "app",
  "choices": [
    { "value": "app",   "label": "App Router",   "hint": "recommended" },
    { "value": "pages", "label": "Pages Router", "hint": "classic" }
  ]
}]
```
```json
{ "name": "NEXT_ROUTER_FLAG", "when": { "router": "pages" }, "value": "--no-app" },
{ "when": { "router": "pages" }, "copy": "overlays/router-pages" }
```

`when` filters (all optional, combined with AND):
`version` (`"11"`, `">=11"`, `"<11"`, `"10-12"`, `">=9 <11"`), `database`, `styling` (a value or an array), `auth`, `roles`, `platform`.

| Step | What it does |
|---|---|
| `run: [cmd, ...args]` | Runs a command in the project folder (`cwd: "parent"` runs it one level up, for creators). `optional: true` turns a failure into a warning. |
| `copy: "overlays/x"` | Copies a folder into the project and fills in placeholders. |
| `write: "path", content` | Writes a file. |
| `append: "path", from/content` | Appends text to a file. |
| `insertBefore: "path", marker, from/content` | Inserts text before the last occurrence of `marker`. |
| `replace: "path", find / findRegex, with, skipIfContains` | Replaces the first match. `find` is plain text, so no escaping is needed. Use `findRegex` only when you need a pattern (remember to double backslashes in JSON). `$&` in `with` inserts the matched text. If nothing matches you get a warning, not a failure. |
| `env: {KEY: value}`, `files` | Sets or uncomments keys in `.env` / `.env.example`. |
| `json: "path", merge` | Deep-merges into a JSON file (for example `package.json` scripts). |
| `remove: "path"` | Deletes a file or folder. |

Built-in placeholders: `PROJECT_NAME`, `NAMESPACE`, `APP_TITLE`, `APP_DESC`, `AUTHOR` (HTML-escaped), `APP_TITLE_JS`, `APP_DESC_JS`, `AUTHOR_JS` (JSON strings), `DB_NAME`, `DB_TYPE`, `DATABASE`, `STYLING`, `THEME`, `COLOR_MODE`, `PORT`, `VERSION` (the major), `AUTH_ENABLED`, `LOGO_HTML`, `STYLESHEET_LINK`, `UI_COMPONENTS`, `THEME_CSS`, `THEME_JS`, `DB_ENV`, `DB_ENV_EXAMPLE`, `RANDOM_SECRET`, `RANDOM_PASSWORD`. Stack-specific ones go in the manifest's `vars` array; each entry can have its own `when`.

## Adding a new stack

Create `stacks/<id>/stack.json` with `versions`, `requires` and `steps`. The API (`GET /api/stacks`) and generation pick it up automatically. The only UI change needed is a backend card and a version `<select>` mapped in `VERSION_SELECTS` in `public/index.html`.

## Fields added in 1.1

| Field | Meaning |
|---|---|
| `order` | Position in the framework menu (lower first). |
| `description` | One-line hint shown in the menu, `doctor` and the web studio. |
| `auth: false` | The stack has no BoilerCraft auth module; the Authentication question is skipped. |
| `runtime` | `node` · `php` · `dotnet` · `python` · `go`. Drives the Docker and CI recipes. |
| `extras` | Which add-ons the stack offers: `docker`, `ci`, `lint`, `prisma`. |
| `docker` | `{ "build": "...", "start": "..." }` commands used in the generated Dockerfile. |
| `ci` | `{ "test": "..." }` overrides the test command in the generated workflow. |
| `versions.source` | Also `pypi`, `goproxy` (Go module proxy) and `static` (fixed `offline` list). |
| `requires[].platform` | Only check this tool on the given OS, e.g. `python` on `win32`, `python3` elsewhere. |

Step additions:

- `when: { "extra": "docker" }`: run only when that extra was chosen.
- `write` + `"ifMissing": true`: skip if the file already exists.
- `append` + `"skipIfContains": "..."`: skip if the file already contains the text.

After the steps, the engine applies the chosen extras (`services/engine/extras.js`) and then runs `git init` with an initial commit (`services/engine/postCreate.js`; skipped with `git: false` / `--no-git`). Commands run with no stdin, so a tool that prompts gets EOF instead of hanging.

Tests live in `test/` and use a fixture stack (`test/fixtures/stacks/demo`) via `BOILERCRAFT_STACKS_DIR`, so they run offline: `npm test`.
