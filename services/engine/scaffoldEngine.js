const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { listVersions, majorOf } = require('./versionCatalog');
const { toolEnv } = require('./toolInstaller');
const { applyExtras, supportedExtras } = require('./extras');
const { initGit } = require('./postCreate');
const { generateThemeCSS, getThemeSwitcherJS } = require('../themeGenerator');
const { generateDynamicStackReadme } = require('../readmeGenerator');
const {
  getSkeletonComponent,
  getSpinnerComponent,
  getModalComponent,
  getOffcanvasComponent,
  getSwalFireComponent,
  getToastrSonnerComponent
} = require('../componentGenerator');

/**
 * Manifest-driven scaffolding engine.
 *
 * Each stack lives in stacks/<id>/stack.json and describes:
 *   - where its versions come from (npm / packagist / dotnet release index)
 *   - which tools it needs (php, composer, node, dotnet …)
 *   - an ordered list of steps: run the framework's OFFICIAL creator
 *     (composer create-project, create-next-app, dotnet new …), then lay our
 *     own files on top.
 *
 * Every step can carry a `when` filter (version range, database, styling,
 * auth), so version-specific differences are data, not code. Supporting a
 * new framework release usually needs nothing at all; a breaking release
 * needs one more overlay folder + a `when: { version: ">=N" }` step.
 */

// BOILERCRAFT_STACKS_DIR lets tests point the engine at fixture stacks.
const STACKS_DIR = process.env.BOILERCRAFT_STACKS_DIR || path.join(__dirname, '..', '..', 'stacks');

class RequirementError extends Error {
  constructor(missing) {
    super(`Missing required tools: ${missing.map(m => m.name).join(', ')}`);
    this.name = 'RequirementError';
    this.missing = missing;
  }
}

// ---------------------------------------------------------------------------
// Stack registry
// ---------------------------------------------------------------------------

function loadStacks() {
  if (!fs.existsSync(STACKS_DIR)) return [];
  return fs.readdirSync(STACKS_DIR)
    .filter(dir => fs.existsSync(path.join(STACKS_DIR, dir, 'stack.json')))
    .map(dir => {
      const manifest = JSON.parse(fs.readFileSync(path.join(STACKS_DIR, dir, 'stack.json'), 'utf8'));
      return { ...manifest, id: manifest.id || dir, dir: path.join(STACKS_DIR, dir) };
    })
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

function getStack(id) {
  const stacks = loadStacks();
  return stacks.find(s => s.id === id || (s.aliases || []).includes(id)) || null;
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

// Major-version range matcher: "*", "11", ">=11", "<11", "10-12", ">=9 <11".
function versionMatches(range, major) {
  if (range === undefined || range === '*' || range === '') return true;
  return String(range).trim().split(/\s+/).every(part => {
    let m;
    if ((m = /^(\d+)-(\d+)$/.exec(part))) return major >= +m[1] && major <= +m[2];
    if ((m = /^(>=|<=|>|<|=)?(\d+)$/.exec(part))) {
      const n = +m[2];
      switch (m[1]) {
        case '>=': return major >= n;
        case '<=': return major <= n;
        case '>': return major > n;
        case '<': return major < n;
        default: return major === n;
      }
    }
    throw new Error(`Invalid version range '${range}'`);
  });
}

function oneOf(expected, actual) {
  return Array.isArray(expected) ? expected.includes(actual) : expected === actual;
}

function matches(when, ctx) {
  if (!when) return true;
  if (when.version !== undefined && !versionMatches(when.version, ctx.major)) return false;
  if (when.database !== undefined && !oneOf(when.database, ctx.database)) return false;
  if (when.styling !== undefined && !oneOf(when.styling, ctx.styling)) return false;
  if (when.auth !== undefined && when.auth !== ctx.auth) return false;
  if (when.roles !== undefined && when.roles !== ctx.roles) return false;
  if (when.platform !== undefined && !oneOf(when.platform, process.platform)) return false;
  if (when.extra !== undefined && !(ctx.extras || []).includes(when.extra)) return false;
  // Any other key refers to a stack-specific option (e.g. Next.js "router").
  for (const [key, expected] of Object.entries(when)) {
    if (BUILTIN_WHEN_KEYS.has(key)) continue;
    if (!oneOf(expected, ctx.options?.[key])) return false;
  }
  return true;
}

const BUILTIN_WHEN_KEYS = new Set(['version', 'database', 'styling', 'auth', 'roles', 'platform', 'extra']);

// Stack-specific options (manifest "options"), validated, with defaults filled in.
function resolveOptions(stack, given = {}) {
  const resolved = {};
  for (const opt of stack.options || []) {
    const value = given[opt.id] ?? opt.default ?? opt.choices[0].value;
    if (!opt.choices.some(ch => ch.value === value)) {
      throw new Error(`${stack.name}: invalid ${opt.label || opt.id} '${value}'. Options: ${opt.choices.map(ch => ch.value).join(', ')}`);
    }
    resolved[opt.id] = value;
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Placeholders
// ---------------------------------------------------------------------------

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildVars(config, stack, ctx) {
  const projectName = ctx.name;
  const styling = ctx.styling;
  const colorMode = config.colorMode || 'all';
  const title = config.appTitle || projectName;
  const description = config.description || 'Enterprise grade multi-combination application';
  const author = config.author || 'ARG RABBI';

  let uiComponents = '';
  if (config.components?.skeleton) uiComponents += getSkeletonComponent(styling) + '\n';
  if (config.components?.spinner) uiComponents += getSpinnerComponent(styling) + '\n';
  if (config.components?.modal) uiComponents += getModalComponent(styling) + '\n';
  if (config.components?.offcanvas) uiComponents += getOffcanvasComponent(styling) + '\n';
  if (config.components?.swalfire) uiComponents += getSwalFireComponent() + '\n';
  if (config.components?.toastr) uiComponents += getToastrSonnerComponent() + '\n';

  const logoHtml = config.logoUrl
    ? `<img src="${escapeHtml(config.logoUrl)}" alt="${escapeHtml(title)}" class="bc-logo-img" />`
    : `<div class="bc-logo">${escapeHtml(projectName[0].toUpperCase())}</div>`;

  const stylesheetLink = styling === 'bootstrap'
    ? '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">'
    : styling === 'tailwind'
    ? '<script src="https://cdn.tailwindcss.com"></script>'
    : '';

  const vars = {
    PROJECT_NAME: projectName,
    NAMESPACE: projectName.replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1'),
    APP_TITLE: escapeHtml(title),
    APP_DESC: escapeHtml(description),
    AUTHOR: escapeHtml(author),
    APP_TITLE_JS: JSON.stringify(title),
    APP_DESC_JS: JSON.stringify(description),
    AUTHOR_JS: JSON.stringify(author),
    DB_NAME: `${projectName.replace(/-/g, '_')}_db`,
    DB_TYPE: ctx.database,
    DATABASE: ctx.database.toUpperCase(),
    STYLING: styling.toUpperCase(),
    THEME: config.theme || 'midnight',
    COLOR_MODE: colorMode === 'all' || colorMode === 'device' ? 'dark' : colorMode,
    PORT: String(config.port || stack.defaultPort || 3000),
    VERSION: String(ctx.major),
    STACK_NAME: stack.name,
    AUTH_ENABLED: ctx.auth ? 'true' : 'false',
    LOGO_HTML: logoHtml,
    STYLESHEET_LINK: stylesheetLink,
    UI_COMPONENTS: uiComponents,
    UI_COMPONENTS_RAZOR: uiComponents.replace(/@/g, '@@'), // "@" is Razor syntax
    THEME_CSS: generateThemeCSS(config.theme || 'midnight', colorMode),
    THEME_JS: getThemeSwitcherJS(),
    RANDOM_SECRET: crypto.randomBytes(32).toString('hex'),
    RANDOM_PASSWORD: crypto.randomBytes(12).toString('base64url') + 'A1!'
  };

  const dbEnv = password => ({
    mongodb: `MONGODB_URI=mongodb://127.0.0.1:27017/${vars.DB_NAME}`,
    mysql: `DB_HOST=127.0.0.1\nDB_PORT=3306\nDB_DATABASE=${vars.DB_NAME}\nDB_USERNAME=root\nDB_PASSWORD=`,
    mssql: `DB_HOST=127.0.0.1\nDB_PORT=1433\nDB_DATABASE=${vars.DB_NAME}\nDB_USERNAME=sa\nDB_PASSWORD=${password}`,
    postgresql: `DB_HOST=127.0.0.1\nDB_PORT=5432\nDB_DATABASE=${vars.DB_NAME}\nDB_USERNAME=postgres\nDB_PASSWORD=${password}`,
    sqlite: 'DB_PATH=database.sqlite'
  }[ctx.database] || '');
  // Stack options are available as {{OPTION_<ID>}}, e.g. {{OPTION_FRONTEND}}.
  for (const [id, value] of Object.entries(ctx.options || {})) vars[`OPTION_${id.toUpperCase()}`] = String(value);

  vars.DB_ENV = dbEnv(vars.RANDOM_PASSWORD);
  vars.DB_ENV_EXAMPLE = dbEnv('change-me');

  // Stack-defined conditional vars; later entries override earlier ones.
  for (const v of stack.vars || []) {
    if (!(v.name in vars)) vars[v.name] = '';
    if (matches(v.when, ctx)) vars[v.name] = interpolate(v.value, vars);
  }
  return vars;
}

function interpolate(text, vars) {
  return String(text).replace(/\{\{([A-Z0-9_]+)\}\}/g, (whole, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : whole
  );
}

// ---------------------------------------------------------------------------
// Step executors
// ---------------------------------------------------------------------------

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function isBinary(buf) {
  return buf.subarray(0, 8000).includes(0);
}

function copyDir(src, dest, vars, log) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, interpolate(entry.name, vars));
    if (entry.isDirectory()) {
      copyDir(s, d, vars, log);
    } else {
      const buf = fs.readFileSync(s);
      fs.writeFileSync(d, isBinary(buf) ? buf : interpolate(buf.toString('utf8'), vars));
    }
  }
}

function quoteArg(arg) {
  if (/^[A-Za-z0-9_\-.,:/=@^+]+$/.test(arg)) return arg;
  return process.platform === 'win32'
    ? `"${arg.replace(/"/g, '\\"')}"`
    : `'${arg.replace(/'/g, `'\\''`)}'`;
}

function runCommand(cmd, args, cwd, log, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const line = [cmd, ...args].map(quoteArg).join(' ');
    log(`$ ${line}`);
    // shell:true so Windows can resolve composer.bat / npx.cmd shims.
    const child = spawn(line, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'], // no stdin: a tool that prompts gets EOF instead of hanging
      env: { ...toolEnv(), CI: '1', COMPOSER_NO_INTERACTION: '1', DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1', CHECKPOINT_DISABLE: '1', ...extraEnv }
    });
    let tail = '';
    const onData = chunk => {
      const text = chunk.toString();
      tail = (tail + text).slice(-4000);
      if (!process.env.BOILERCRAFT_CLI) process.stdout.write(text); // the CLI shows its own progress
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve(tail);
      else reject(new Error(`Command failed (exit ${code}): ${line}\n${tail.trim().split('\n').slice(-15).join('\n')}`));
    });
  });
}

function captureCommand(cmd, args) {
  return captureIn(cmd, args);
}

function captureIn(cmd, args, cwd) {
  return new Promise(resolve => {
    const child = spawn([cmd, ...args].map(quoteArg).join(' '), { shell: true, cwd, env: toolEnv() });
    let out = '';
    child.stdout.on('data', c => (out += c));
    child.stderr.on('data', c => (out += c));
    child.on('error', () => resolve({ ok: false, out }));
    child.on('close', code => resolve({ ok: code === 0, out }));
  });
}

// Sets KEY=value in an env file, replacing an existing (or commented-out) line.
function setEnvValues(file, values) {
  if (!fs.existsSync(file)) return false;
  let content = fs.readFileSync(file, 'utf8');
  for (const [key, value] of Object.entries(values)) {
    const re = new RegExp(`^#?\\s*${key}=.*$`, 'm');
    const line = `${key}=${value}`;
    content = re.test(content) ? content.replace(re, line) : content.replace(/\s*$/, `\n${line}\n`);
  }
  fs.writeFileSync(file, content);
  return true;
}

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      target[k] = deepMerge(target[k] && typeof target[k] === 'object' ? target[k] : {}, v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

async function executeStep(step, ctx) {
  const { vars, projectDir, parentDir, stack, log, warn } = ctx;
  const resolvePath = rel => path.join(projectDir, interpolate(rel, vars));
  const readSource = s => (s.from ? fs.readFileSync(path.join(stack.dir, s.from), 'utf8') : s.content);

  if (step.run) {
    const [cmd, ...args] = step.run.map(a => interpolate(a, vars));
    const cwd = step.cwd === 'parent' ? parentDir : projectDir;
    ensureDir(cwd);
    try {
      await runCommand(cmd, args, cwd, log, step.env);
    } catch (err) {
      if (step.optional) warn(`${step.label || cmd} failed (optional step): ${err.message.split('\n')[0]}`);
      else throw err;
    }
  } else if (step.copy) {
    copyDir(path.join(stack.dir, step.copy), step.to ? resolvePath(step.to) : projectDir, vars, log);
  } else if (step.write) {
    const file = resolvePath(step.write);
    if (step.ifMissing && fs.existsSync(file)) return;
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, interpolate(readSource(step), vars));
  } else if (step.prepend) {
    const file = resolvePath(step.prepend);
    if (!fs.existsSync(file)) return warn(`prepend: ${step.prepend} not found, skipped`);
    fs.writeFileSync(file, interpolate(readSource(step), vars) + fs.readFileSync(file, 'utf8'));
  } else if (step.append) {
    const file = resolvePath(step.append);
    if (!fs.existsSync(file)) return warn(`append: ${step.append} not found, skipped`);
    if (step.skipIfContains && fs.readFileSync(file, 'utf8').includes(step.skipIfContains)) return;
    fs.appendFileSync(file, interpolate(readSource(step), vars));
  } else if (step.replace) {
    const file = resolvePath(step.replace);
    if (!fs.existsSync(file)) return warn(`replace: ${step.replace} not found, skipped`);
    const content = fs.readFileSync(file, 'utf8');
    if (step.skipIfContains && content.includes(step.skipIfContains)) return;
    // `find` is a plain string (no escaping needed); `findRegex` for patterns.
    // In `with`, "$&" inserts the matched text.
    const pattern = step.findRegex ? new RegExp(step.findRegex, 'm') : step.find;
    const found = step.findRegex ? pattern.test(content) : content.includes(pattern);
    if (!found) return warn(`replace: pattern not found in ${step.replace} — check this manually`);
    fs.writeFileSync(file, content.replace(pattern, interpolate(step.with, vars)));
  } else if (step.insertBefore) {
    const file = resolvePath(step.insertBefore);
    if (!fs.existsSync(file)) return warn(`insertBefore: ${step.insertBefore} not found, skipped`);
    const content = fs.readFileSync(file, 'utf8');
    const idx = content.lastIndexOf(step.marker);
    if (idx === -1) return warn(`insertBefore: marker '${step.marker}' not found in ${step.insertBefore}`);
    fs.writeFileSync(file, content.slice(0, idx) + interpolate(readSource(step), vars) + content.slice(idx));
  } else if (step.env) {
    const values = Object.fromEntries(Object.entries(step.env).map(([k, v]) => [k, interpolate(v, vars)]));
    for (const f of step.files || ['.env', '.env.example']) setEnvValues(resolvePath(f), values);
  } else if (step.json) {
    const file = resolvePath(step.json);
    const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    const merge = JSON.parse(interpolate(JSON.stringify(step.merge), vars));
    fs.writeFileSync(file, JSON.stringify(deepMerge(data, merge), null, 2) + '\n');
  } else if (step.remove) {
    const file = resolvePath(step.remove);
    if (fs.existsSync(file)) fs.rmSync(file, { recursive: true, force: true });
  } else {
    throw new Error(`Unknown step in ${stack.id}/stack.json: ${JSON.stringify(step)}`);
  }
}

// ---------------------------------------------------------------------------
// Requirements
// ---------------------------------------------------------------------------

async function checkRequirements(stack, major) {
  const missing = [];
  for (const req of stack.requires || []) {
    if (req.platform && !oneOf(req.platform, process.platform)) continue;
    const { ok, out } = await captureCommand(req.cmd, req.args || ['--version']);
    if (!ok) {
      missing.push({ tool: req.tool || req.cmd, name: req.name || req.cmd, install: req.install, major });
      continue;
    }
    // e.g. .NET: an SDK of at least the requested major must be installed.
    if (req.minMajor && major !== undefined) {
      const majors = [...out.matchAll(new RegExp(req.minMajor.pattern, 'gm'))].map(m => parseInt(m[1], 10));
      if (!majors.some(m => m >= major)) {
        missing.push({ tool: req.tool || req.cmd, name: `${req.name || req.cmd} ${major}+`, install: req.install, major });
      }
    }
  }
  return missing;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function parseMajor(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return value;
  const m = /(\d+)/.exec(String(value)); // "11", "^11.0", "net8.0", "8.x"
  return m ? parseInt(m[1], 10) : null;
}

async function describeStacks() {
  const stacks = loadStacks();
  return Promise.all(stacks.map(async stack => {
    const [versions, missing] = await Promise.all([listVersions(stack), checkRequirements(stack)]);
    return {
      id: stack.id,
      name: stack.name,
      databases: stack.databases,
      options: stack.options || [],
      stylings: stack.stylings,
      extras: supportedExtras(stack),
      auth: stack.auth !== false,
      description: stack.description || '',
      nextSteps: stack.nextSteps || [],
      versions,
      requirements: { ok: missing.length === 0, missing }
    };
  }));
}

async function scaffold(config, outputBasePath = null, onLog = () => {}) {
  const backend = config.backend || config.stack;
  const stack = getStack(backend);
  if (!stack) throw new Error(`No stack manifest for '${backend}'`);

  const name = (config.projectName || 'my-app').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const parentDir = outputBasePath || path.join(__dirname, '..', '..', 'generated');
  const projectDir = path.join(parentDir, name);

  const logs = [];
  const warnings = [];
  const echo = !process.env.BOILERCRAFT_CLI; // the CLI prints via onLog itself
  const log = msg => { logs.push(msg); onLog(msg); if (echo) console.log(`[Engine] ${msg}`); };
  const warn = msg => { warnings.push(msg); log(`WARNING: ${msg}`); };

  // Resolve the requested major (or the recommended one).
  let major = parseMajor(config.versions?.[stack.id] ?? config.version);
  const catalog = await listVersions(stack);
  if (major === null) major = (catalog.find(v => v.recommended) || catalog[0]).major;
  const entry = catalog.find(v => v.major === major);
  if (major < stack.versions.minMajor) {
    throw new Error(`${stack.name} ${major} is below the minimum supported version (${stack.versions.minMajor}).`);
  }
  if (!entry || !entry.tested) {
    warn(`${stack.name} ${major} is newer than the last verified release (${stack.versions.testedUpTo}). ` +
      `The official base will be correct; review the BoilerCraft overlays after generation.`);
  }

  const database = config.database || stack.databases[0];
  const styling = config.styling || stack.stylings[0];
  if (!stack.databases.includes(database)) {
    throw new Error(`${stack.name} supports these databases: ${stack.databases.join(', ')} (got '${database}').`);
  }

  const missing = await checkRequirements(stack, major);
  if (missing.length) throw new RequirementError(missing);

  if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length) {
    throw new Error(`Target folder already exists and is not empty: ${projectDir}`);
  }
  ensureDir(parentDir);

  const ctx = {
    stack,
    name,
    major,
    database,
    styling,
    auth: stack.auth === false ? false : config.auth ? config.auth.enabled !== false : true,
    roles: !!config.auth?.roles,
    options: resolveOptions(stack, config.options),
    extras: (config.extras || []).filter(x => supportedExtras(stack).includes(x)),
    parentDir,
    projectDir,
    log,
    warn
  };
  ctx.vars = buildVars(config, stack, ctx);

  log(`Scaffolding ${stack.name} ${major} (${database}, ${styling}) → ${projectDir}`);
  for (const step of stack.steps) {
    if (!matches(step.when, ctx)) continue;
    if (step.label) log(interpolate(step.label, ctx.vars));
    await executeStep(step, ctx);
  }

  if (stack.readme !== false) {
    fs.writeFileSync(
      path.join(projectDir, 'BOILERCRAFT.md'),
      generateDynamicStackReadme({ ...config, projectName: name }, stack.id, database, styling, ctx.vars.THEME, config.colorMode || 'all')
    );
  }

  await applyExtras(ctx, { runCommand, interpolate });
  if (config.git !== false) await initGit(ctx, captureIn);

  log('Done.');
  return {
    success: true,
    engine: 'official',
    projectName: name,
    path: projectDir,
    version: major,
    combination: [`${stack.id}@${major}`, ...Object.values(ctx.options), database, styling, ...ctx.extras].join(' + '),
    nextSteps: (stack.nextSteps || []).map(s => interpolate(s, ctx.vars)),
    warnings,
    logs
  };
}

module.exports = {
  scaffold,
  describeStacks,
  checkRequirements,
  getStack,
  loadStacks,
  parseMajor,
  versionMatches,
  matches,
  interpolate,
  resolveOptions,
  RequirementError
};
