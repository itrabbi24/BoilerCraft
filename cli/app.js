const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const ui = require('./ui');
const { describeStacks, checkRequirements, getStack } = require('../services/engine/scaffoldEngine');
const { installMissing, canInstall, toolEnv, RECIPES, TOOLS_HOME } = require('../services/engine/toolInstaller');
const { generate } = require('../services/generate');
const { THEMES } = require('../services/themeGenerator');
const pkg = require('../package.json');

const { c, log } = ui;

const AUTHOR = 'ARG RABBI';
const REPO_URL = 'https://github.com/itrabbi24/BoilerCraft';
const TAGLINE = 'Production-ready projects on the official tooling · any version · auth · themes';

const LEGACY_STACKS = [{
  id: 'raw-php',
  name: 'Raw PHP (MVC)',
  databases: ['mysql'],
  stylings: ['tailwind', 'bootstrap', 'vanilla'],
  versions: [],
  requirements: { ok: true, missing: [] },
  nextSteps: ['php -S localhost:8000 -t public']
}];

const STACK_HINTS = {
  'laravel': 'Blade · Vue · React',
  'nextjs': 'React · App Router / Pages Router',
  'node-express': 'REST API · JWT',
  'dotnet-core': 'MVC · Web API · EF Core',
  'raw-php': 'No framework · PDO'
};
const DB_LABELS = { mysql: 'MySQL', mssql: 'SQL Server', mongodb: 'MongoDB' };
const STYLE_LABELS = { tailwind: 'Tailwind CSS', bootstrap: 'Bootstrap 5', vanilla: 'Plain CSS' };
const COLOR_MODES = [
  { value: 'all', label: 'Dark + Light', hint: 'with a toggle' },
  { value: 'dark', label: 'Dark only' },
  { value: 'light', label: 'Light only' }
];

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

let stacksPromise = null;
function loadStacks({ refresh = false } = {}) {
  if (!stacksPromise || refresh) {
    stacksPromise = describeStacks().then(list => [...list, ...LEGACY_STACKS]);
  }
  return stacksPromise;
}

function probe(cmd, args) {
  return new Promise(resolve => {
    const child = spawn([cmd, ...args].join(' '), { shell: true, env: toolEnv() });
    let out = '';
    child.stdout.on('data', d => (out += d));
    child.stderr.on('data', d => (out += d));
    child.on('error', () => resolve(null));
    child.on('close', code => resolve(code === 0 ? ui.stripAnsi(out).trim() : null));
  });
}

// Runs a command attached to the terminal (dev servers, editors). Ctrl+C stops
// the child and returns here instead of killing BoilerCraft.
function runAttached(command, cwd) {
  return new Promise(resolve => {
    const ignore = () => {};
    process.on('SIGINT', ignore);
    const child = spawn(command, { cwd, shell: true, stdio: 'inherit', env: toolEnv() });
    child.on('error', () => resolve(1));
    child.on('close', code => {
      process.removeListener('SIGINT', ignore);
      resolve(code ?? 0);
    });
  });
}

function openInBackground(command) {
  const child = spawn(command, { shell: true, detached: true, stdio: 'ignore', env: toolEnv() });
  child.on('error', () => {});
  child.unref();
}

function openerFor(target) {
  const quoted = `"${target}"`;
  if (process.platform === 'win32') return `start "" ${quoted}`;
  if (process.platform === 'darwin') return `open ${quoted}`;
  return `xdg-open ${quoted}`;
}

function isNewer(latest, current) {
  const a = latest.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  return false;
}

async function checkForUpdate() {
  try {
    const res = await axios.get('https://registry.npmjs.org/boilercraft/latest', { timeout: 1500 });
    return res.data?.version && isNewer(res.data.version, pkg.version) ? res.data.version : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Create project
// ---------------------------------------------------------------------------

function validateName(name, cwd) {
  if (!name) return 'Please enter a name';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) return 'Use letters, numbers, - and _ (must start with a letter or number)';
  if (name.length > 60) return 'Keep it under 60 characters';
  const target = path.join(cwd, name.toLowerCase());
  if (fs.existsSync(target) && fs.readdirSync(target).length) return `A non-empty folder "${name.toLowerCase()}" already exists here`;
  return null;
}

function versionOption(v) {
  const tags = [v.recommended && 'recommended', v.lts && 'LTS', !v.tested && 'preview support'].filter(Boolean);
  return { value: v.major, label: `${v.major}.x`, short: `${v.major}.x`, hint: `latest ${v.latest}${tags.length ? '  ·  ' + tags.join(', ') : ''}` };
}

async function askProject(given = {}) {
  const cwd = path.resolve(given.out || process.cwd());
  const ask = !given.yes;

  console.log(ui.divider('New project'));
  console.log('');

  const projectName = given.name
    ? (() => {
        const err = validateName(given.name, cwd);
        if (err) throw new Error(err);
        return given.name;
      })()
    : ask ? await ui.input('Project name', { initial: 'my-app', validate: v => validateName(v, cwd) }) : 'my-app';

  const stacks = await ui.spinner('Loading frameworks and latest versions…', () => loadStacks());

  let stack = given.stack && stacks.find(s => s.id === given.stack);
  if (given.stack && !stack) throw new Error(`Unknown stack "${given.stack}". Options: ${stacks.map(s => s.id).join(', ')}`);
  if (!stack) {
    stack = ask
      ? await ui.select('Framework', stacks.map(s => ({
          value: s,
          label: s.name,
          short: s.name,
          hint: s.requirements.ok ? STACK_HINTS[s.id] : c.yellow(`needs ${s.requirements.missing.map(m => m.name).join(', ')} · can install`)
        })))
      : stacks[0];
  }

  let version;
  if (stack.versions.length) {
    const rec = Math.max(0, stack.versions.findIndex(v => v.recommended));
    if (given.version) {
      version = parseInt(given.version, 10);
      if (!stack.versions.some(v => v.major === version)) {
        throw new Error(`${stack.name} ${given.version} is not available. Options: ${stack.versions.map(v => v.major).join(', ')}`);
      }
    } else {
      version = ask ? await ui.select(`${stack.name} version`, stack.versions.map(versionOption), { initial: rec }) : stack.versions[rec].major;
    }
  }

  // Stack-specific questions declared in the manifest (e.g. Next.js router).
  const options = {};
  for (const opt of stack.options || []) {
    const preset = given[opt.id];
    if (preset !== undefined && !opt.choices.some(ch => ch.value === preset)) {
      throw new Error(`Invalid ${opt.label.toLowerCase()} "${preset}". Options: ${opt.choices.map(ch => ch.value).join(', ')}`);
    }
    const initial = Math.max(0, opt.choices.findIndex(ch => ch.value === opt.default));
    options[opt.id] = preset ?? (ask
      ? await ui.select(opt.label, opt.choices.map(ch => ({ ...ch, short: ch.label })), { initial })
      : opt.choices[initial].value);
  }

  const auth = given.auth !== undefined ? given.auth : ask
    ? await ui.select('Authentication', [
        { value: true, label: 'Include authentication', short: 'Included', hint: 'register · login · token' },
        { value: false, label: 'No authentication', short: 'None' }
      ])
    : true;

  const themeIds = Object.keys(THEMES);
  if (given.theme && !THEMES[given.theme]) throw new Error(`Unknown theme "${given.theme}". Options: ${themeIds.join(', ')}`);
  const theme = given.theme || (ask
    ? await ui.select('Theme', themeIds.map(id => ({
        value: id,
        label: `${ui.swatch(THEMES[id].primary)}${ui.swatch(THEMES[id].secondary)}${ui.swatch(THEMES[id].surface)}  ${THEMES[id].name}`,
        short: THEMES[id].name
      })))
    : themeIds[0]);
  const colorMode = given.mode || (ask ? await ui.select('Color mode', COLOR_MODES.map(m => ({ ...m, short: m.label }))) : 'all');

  if (given.db && !stack.databases.includes(given.db)) {
    throw new Error(`${stack.name} supports: ${stack.databases.join(', ')} (got "${given.db}")`);
  }
  const database = given.db || (ask
    ? await ui.select('Database', stack.databases.map(d => ({ value: d, label: DB_LABELS[d] || d })))
    : stack.databases[0]);
  const styling = given.styling || (ask
    ? await ui.select('Styling', stack.stylings.map(s => ({ value: s, label: STYLE_LABELS[s] || s })))
    : stack.stylings[0]);

  return {
    stack,
    config: {
      projectName,
      backend: stack.id,
      versions: version ? { [stack.id]: version } : {},
      options,
      auth: { enabled: auth },
      theme,
      colorMode,
      database,
      styling,
      port: given.port ? parseInt(given.port, 10) : undefined,
      appTitle: given.title,
      author: given.author,
      outputDir: cwd,
      allowLegacyFallback: !given.noFallback
    }
  };
}

function displayPath(p) {
  const rel = path.relative(process.cwd(), p);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? `.${path.sep}${rel}` : p;
}

function summaryBox(stack, config) {
  const version = config.versions[stack.id];
  const rows = [
    ['Project', c.bold(config.projectName)],
    ['Framework', `${stack.name}${version ? ` ${version}.x` : ''}`],
    ...(stack.options || []).map(opt => [opt.label, opt.choices.find(ch => ch.value === config.options?.[opt.id])?.label || '']),
    ['Auth', config.auth.enabled ? 'Included' : 'None'],
    ['Theme', `${ui.swatch(THEMES[config.theme].primary)} ${THEMES[config.theme].name} · ${COLOR_MODES.find(m => m.value === config.colorMode)?.label}`],
    ['Database', DB_LABELS[config.database] || config.database],
    ['Styling', STYLE_LABELS[config.styling] || config.styling],
    ['Location', c.gray(displayPath(path.join(config.outputDir, config.projectName.toLowerCase())))]
  ];
  return ui.box(rows.map(([k, v]) => `${c.gray(k.padEnd(10))} ${v}`), { title: 'Summary' });
}

async function ensureTools(stack, config, given = {}) {
  const manifest = getStack(stack.id);
  if (!manifest) return true;
  const version = config.versions[stack.id];
  const missing = await checkRequirements(manifest, version);
  if (!missing.length) return true;

  const installable = missing.filter(m => canInstall(m.tool));
  const manual = missing.filter(m => !canInstall(m.tool));
  console.log('');
  log.warn(`${stack.name}${version ? ` ${version}` : ''} needs ${missing.map(m => m.name).join(', ')}, which ${missing.length > 1 ? 'are' : 'is'} not installed.`);
  for (const m of manual) log.info(`Install ${m.name} manually: ${m.install}`);

  let choice;
  if (given.installTools) choice = 'install';
  else if (given.yes) choice = 'fallback';
  else {
    const options = [];
    if (installable.length && !manual.length) {
      options.push({ value: 'install', label: `Install ${installable.map(m => m.name).join(' + ')} for me`, short: 'Install tools', hint: 'recommended · no admin needed for .NET / Composer' });
    }
    options.push({ value: 'fallback', label: 'Continue with offline templates', short: 'Offline templates', hint: 'works now, version may not match exactly' });
    options.push({ value: 'back', label: 'Go back', short: 'Back' });
    choice = await ui.select('How do you want to continue?', options);
  }

  if (choice === 'back') return false;
  if (choice === 'install') {
    console.log('');
    await installMissing(installable, msg => log.step(msg));
    const still = await checkRequirements(manifest, version);
    if (still.length) throw new Error(`Still missing after install: ${still.map(m => m.name).join(', ')}. Open a new terminal and run npx boilercraft again.`);
    log.ok('Tools installed');
    loadStacks({ refresh: true });
  }
  return true;
}

async function runGeneration(config) {
  console.log('');
  const progress = ui.tasks();
  let result;
  try {
    result = await generate(config, msg => {
      if (msg.startsWith('$ ')) progress.detail(msg.slice(2));
      else if (msg.startsWith('WARNING')) progress.warn(msg.replace(/^WARNING:\s*/, ''));
      else if (msg === 'Done.' || msg.startsWith('Scaffolding ')) return;
      else progress.update(msg);
    });
  } catch (err) {
    progress.fail();
    throw err;
  }
  if (!result.success) {
    progress.fail();
    throw new Error(result.error || 'Generation failed');
  }
  if (result.engine !== 'official') progress.update('Generated from offline templates');
  const seconds = progress.done();
  return { ...result, seconds };
}

async function afterCreate(stack, result) {
  const rel = path.relative(process.cwd(), result.path) || '.';
  const steps = result.nextSteps || (stack.nextSteps || []);
  console.log('');
  console.log(ui.box([
    `${c.green('✔')} ${c.bold(result.projectName)} is ready ${c.gray(`in ${result.seconds}s`)}`,
    '',
    `${c.gray('Folder'.padEnd(8))} ${rel}`,
    `${c.gray('Stack'.padEnd(8))} ${result.combination || stack.name}`,
    `${c.gray('Docs'.padEnd(8))} ${result.engine === 'official' ? 'BOILERCRAFT.md' : 'README.md'}`
  ], { title: 'Done', color: c.green }));
  console.log('');

  const hasCode = !!(await probe('code', ['--version']));
  for (;;) {
    const options = [
      { value: 'run', label: 'Start the dev server', hint: steps.join('  →  ') },
      hasCode && { value: 'code', label: 'Open in VS Code' },
      { value: 'folder', label: 'Open the project folder' },
      { value: 'menu', label: 'Back to main menu' },
      { value: 'exit', label: 'Exit' }
    ].filter(Boolean);
    let action;
    try {
      action = await ui.select('What next?', options);
    } catch (err) {
      if (err instanceof ui.CancelError) return 'exit';
      throw err;
    }

    if (action === 'run') {
      console.log('');
      log.info(`Starting in ${rel} · press ${c.bold('Ctrl+C')} to stop and come back here`);
      for (let i = 0; i < steps.length; i++) {
        console.log(ui.divider(steps[i]));
        const code = await runAttached(steps[i], result.path);
        if (code !== 0 && i < steps.length - 1) {
          log.warn(`"${steps[i]}" failed (exit ${code}). Is your database running? Continuing…`);
        }
      }
      console.log('');
    } else if (action === 'code') {
      openInBackground(`code "${result.path}"`);
      log.ok('Opened in VS Code');
    } else if (action === 'folder') {
      openInBackground(openerFor(result.path));
      log.ok('Opened folder');
    } else {
      return action;
    }
  }
}

async function createFlow(given = {}) {
  for (;;) {
    const { stack, config } = await askProject(given);
    console.log('');
    console.log(summaryBox(stack, config));
    console.log('');

    if (!(await ensureTools(stack, config, given))) {
      if (given.yes) return 'exit';
      continue; // start over
    }
    if (!given.yes) {
      const go = await ui.select('Create this project?', [
        { value: 'yes', label: 'Create project', short: 'Yes' },
        { value: 'edit', label: 'Start over', short: 'Start over' },
        { value: 'cancel', label: 'Cancel', short: 'Cancel' }
      ]);
      if (go === 'edit') {
        console.log('');
        continue;
      }
      if (go === 'cancel') return 'menu';
    }

    const result = await runGeneration(config);
    if (given.yes || !ui.isTTY) {
      printPlainNextSteps(stack, result);
      return 'exit';
    }
    return afterCreate(stack, result);
  }
}

function printPlainNextSteps(stack, result) {
  const rel = path.relative(process.cwd(), result.path) || '.';
  console.log('');
  log.ok(`${c.bold(result.projectName)} is ready ${c.gray(`(${result.combination || result.engine}, ${result.seconds}s)`)}`);
  console.log(`\n  ${c.bold('Next steps')}`);
  console.log(`    cd ${rel.includes(' ') ? `"${rel}"` : rel}`);
  for (const s of result.nextSteps || stack.nextSteps || []) console.log(`    ${s}`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

async function toolStatus() {
  const [npm, php, composer, sdks] = await Promise.all([
    probe('npm', ['--version']),
    probe('php', ['-r', '"echo PHP_VERSION;"']),
    probe('composer', ['--version', '--no-ansi']),
    probe('dotnet', ['--list-sdks'])
  ]);
  const sdkList = sdks ? [...new Set(sdks.split(/\r?\n/).map(l => l.split(' ')[0]).filter(Boolean))] : [];
  return [
    { id: 'node', name: 'Node.js', version: process.version.slice(1), usedBy: 'Next.js · Express' },
    { id: 'npm', name: 'npm', version: npm, usedBy: 'Next.js · Express' },
    { id: 'php', name: 'PHP', version: php, usedBy: 'Laravel · Raw PHP' },
    { id: 'composer', name: 'Composer', version: composer && (composer.match(/(\d+\.\d+\.\d+)/) || [])[1], usedBy: 'Laravel' },
    { id: 'dotnet', name: '.NET SDK', version: sdkList.length ? sdkList.join(', ') : null, usedBy: '.NET' }
  ];
}

async function toolsFlow() {
  for (;;) {
    console.log(ui.divider('Tools'));
    console.log('');
    const tools = await ui.spinner('Checking installed tools…', toolStatus);
    console.log(ui.box(tools.map(t => {
      const mark = t.version ? c.green('●') : c.gray('○');
      const ver = t.version ? t.version : c.yellow('not installed');
      return `${mark} ${t.name.padEnd(10)} ${ver}  ${c.gray(`· ${t.usedBy}`)}`;
    }), { title: 'Your toolchain' }));
    console.log(`  ${c.gray(`Tools installed by BoilerCraft live in ${TOOLS_HOME}`)}`);
    console.log('');

    const byId = Object.fromEntries(tools.map(t => [t.id, t]));
    const options = [];
    if (!byId.php.version) options.push({ value: 'php', label: 'Install PHP', hint: process.platform === 'win32' ? 'via winget' : process.platform === 'darwin' ? 'via Homebrew' : 'via your package manager' });
    if (!byId.composer.version) options.push({ value: 'composer', label: 'Install Composer', hint: byId.php.version ? 'official installer' : 'needs PHP first', disabled: !byId.php.version });
    options.push({ value: 'dotnet', label: byId.dotnet.version ? 'Install another .NET SDK version' : 'Install .NET SDK', hint: 'official script · no admin' });
    options.push({ value: 'back', label: 'Back to main menu' });

    const choice = await ui.select('Install something?', options);
    if (choice === 'back') return;

    let major;
    if (choice === 'dotnet') {
      const stacks = await ui.spinner('Fetching .NET releases…', () => loadStacks());
      const dotnet = stacks.find(s => s.id === 'dotnet-core');
      major = await ui.select('.NET SDK version', dotnet.versions.map(versionOption), { initial: Math.max(0, dotnet.versions.findIndex(v => v.recommended)) });
    }
    console.log('');
    try {
      await installMissing([{ tool: choice, name: RECIPES[choice].name, major }], msg => log.step(msg));
      log.ok(`${RECIPES[choice].name} installed`);
      loadStacks({ refresh: true });
    } catch (err) {
      log.error(err.message);
    }
    console.log('');
  }
}

// ---------------------------------------------------------------------------
// Browse / About / Web studio
// ---------------------------------------------------------------------------

async function browseFlow() {
  console.log(ui.divider('Frameworks & versions'));
  console.log('');
  const stacks = await ui.spinner('Loading frameworks and latest versions…', () => loadStacks());
  for (const s of stacks) {
    const status = s.requirements.ok ? c.green('● ready') : c.yellow(`○ needs ${s.requirements.missing.map(m => m.name).join(', ')}`);
    const lines = [`${status}   ${c.gray(STACK_HINTS[s.id] || '')}`];
    if (s.versions.length) {
      lines.push('');
      for (const v of s.versions) {
        const tags = [v.recommended && c.cyan('recommended'), v.lts && c.green('LTS'), !v.tested && c.yellow('preview support')].filter(Boolean);
        lines.push(`${`${v.major}.x`.padEnd(6)} ${c.gray(`latest ${v.latest}`.padEnd(18))} ${tags.join(c.gray(' · '))}`);
      }
    }
    lines.push('', `${c.gray('Databases')}  ${s.databases.map(d => DB_LABELS[d] || d).join(', ')}`);
    console.log(ui.box(lines, { title: s.name }));
  }
  console.log(`\n  ${c.gray('Versions are fetched live from npm, Packagist and the .NET release index,')}`);
  console.log(`  ${c.gray('so new framework releases appear here automatically.')}\n`);
  await ui.select('Done?', [{ value: 'back', label: 'Back to main menu' }]);
}

async function aboutFlow() {
  console.log('');
  console.log(ui.box([
    `${c.bold('BoilerCraft')} ${c.gray(`v${pkg.version}`)}`,
    c.gray(TAGLINE),
    '',
    `${c.gray('Author'.padEnd(9))} ${c.bold(AUTHOR)}`,
    `${c.gray('GitHub'.padEnd(9))} ${REPO_URL}`,
    `${c.gray('License'.padEnd(9))} ${pkg.license}`,
    '',
    'Every project starts from the framework\'s own official creator',
    '(composer create-project, create-next-app, dotnet new, npm), then',
    'BoilerCraft adds auth, database wiring and your theme on top.'
  ], { title: 'About' }));
  console.log('');
  await ui.select('Done?', [
    { value: 'back', label: 'Back to main menu' },
    { value: 'repo', label: 'Open GitHub page' }
  ]).then(v => v === 'repo' && openInBackground(openerFor(REPO_URL)));
}

async function webFlow() {
  const { startServer } = require('../server');
  await new Promise(resolve => {
    const server = startServer(port => {
      const url = `http://localhost:${port}`;
      console.log('');
      log.ok(`Web studio running at ${c.cyan(url)}`);
      log.info(`Press ${c.bold('Ctrl+C')} to stop and return to the menu`);
      openInBackground(openerFor(url));
    });
    const stop = () => {
      process.removeListener('SIGINT', stop);
      server.close(() => resolve());
      server.closeAllConnections?.(); // drop browser keep-alive sockets so Ctrl+C returns promptly
      console.log('');
    };
    process.on('SIGINT', stop);
  });
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

function goodbye() {
  console.log(`\n  ${c.gray('Thanks for using')} ${ui.gradient('BoilerCraft')}${c.gray('  ·  made with')} ${c.red('♥')} ${c.gray('by')} ${c.bold(AUTHOR)}\n`);
}

function printBanner() {
  console.log(ui.banner({ version: pkg.version, tagline: TAGLINE, author: AUTHOR }));
}

async function home() {
  printBanner();
  const updatePromise = checkForUpdate();
  loadStacks(); // warm up in the background while the user reads the menu

  const latest = await Promise.race([updatePromise, new Promise(r => setTimeout(() => r(null), 800))]);
  if (latest) {
    console.log(ui.box([`Update available ${c.gray(pkg.version)} → ${c.green(latest)}`, `Run ${c.cyan('npx boilercraft@latest')}`], { color: c.yellow }));
    console.log('');
  }

  for (;;) {
    let action;
    try {
      action = await ui.select('What would you like to do?', [
        { value: 'create', label: 'Create a new project', hint: 'Laravel · Next.js · Express · .NET · PHP' },
        { value: 'tools', label: 'Check & install tools', hint: 'PHP · Composer · .NET SDK' },
        { value: 'browse', label: 'Browse frameworks & versions' },
        { value: 'web', label: 'Open the web studio', hint: 'same features in your browser' },
        { value: 'about', label: 'About BoilerCraft' },
        { value: 'exit', label: 'Exit' }
      ]);
    } catch (err) {
      if (err instanceof ui.CancelError) action = 'exit';
      else throw err;
    }
    if (action === 'exit') return goodbye();

    console.log('');
    try {
      if (action === 'create') {
        if ((await createFlow()) === 'exit') return goodbye();
      } else if (action === 'tools') await toolsFlow();
      else if (action === 'browse') await browseFlow();
      else if (action === 'web') await webFlow();
      else if (action === 'about') await aboutFlow();
    } catch (err) {
      if (err instanceof ui.CancelError) log.info('Cancelled — back to the main menu');
      else log.error(err.message);
    }
    console.log('');
  }
}

module.exports = { home, createFlow, toolsFlow, browseFlow, printBanner, goodbye, AUTHOR };
