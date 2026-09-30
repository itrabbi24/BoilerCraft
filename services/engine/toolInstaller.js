const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const axios = require('axios');

/**
 * Installs missing toolchains (PHP, Composer, .NET SDK) on demand.
 *
 * Where possible tools go into a per-user folder (~/.boilercraft/tools) with
 * no admin rights needed; that folder is prepended to PATH for every command
 * BoilerCraft runs, so freshly installed tools work immediately without
 * restarting the terminal.
 *
 *   .NET SDK  → Microsoft's official dotnet-install script (exact major, user folder)
 *   Composer  → official getcomposer.org installer, signature-verified (user folder)
 *   PHP       → winget (Windows) / Homebrew (macOS) / apt · dnf · pacman (Linux)
 */

const TOOLS_HOME = process.env.BOILERCRAFT_TOOLS_HOME || path.join(os.homedir(), '.boilercraft', 'tools');
const BIN_DIR = path.join(TOOLS_HOME, 'bin');
const DOTNET_DIR = path.join(TOOLS_HOME, 'dotnet');
const PHP_WINGET_ID = 'PHP.PHP.8.4';

// Extra folders searched for tools, ahead of the system PATH.
function toolPaths() {
  const dirs = [BIN_DIR, DOTNET_DIR];
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    // winget puts command shims here; a running process doesn't see PATH updates.
    dirs.push(path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links'));
  }
  return dirs.filter(d => fs.existsSync(d));
}

function toolEnv(base = process.env) {
  const env = { ...base };
  const key = Object.keys(env).find(k => k.toUpperCase() === 'PATH') || 'PATH';
  const extra = toolPaths();
  if (extra.length) env[key] = [...extra, env[key] || ''].join(path.delimiter);
  if (fs.existsSync(path.join(DOTNET_DIR, process.platform === 'win32' ? 'dotnet.exe' : 'dotnet'))) {
    env.DOTNET_ROOT = DOTNET_DIR;
  }
  return env;
}

function exec(cmd, args, { shell = false } = {}) {
  return new Promise((resolve, reject) => {
    // stdio inherit: installers may show progress or ask for a sudo password.
    const child = spawn(cmd, args, { stdio: 'inherit', env: toolEnv(), shell });
    child.on('error', reject);
    child.on('close', code => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))));
  });
}

function which(cmd) {
  return new Promise(resolve => {
    const probe = process.platform === 'win32' ? 'where' : 'which';
    const child = spawn(probe, [cmd], { env: toolEnv(), shell: process.platform === 'win32' });
    let out = '';
    child.stdout.on('data', d => (out += d));
    child.on('error', () => resolve(null));
    child.on('close', code => resolve(code === 0 ? out.split(/\r?\n/)[0].trim() : null));
  });
}

async function download(url, dest) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(res.data));
  return dest;
}

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

async function installDotnet({ major }, log) {
  const channel = `${major || 'LTS'}${major ? '.0' : ''}`;
  log(`Installing .NET SDK ${channel} into ${DOTNET_DIR} (official dotnet-install script)`);
  if (process.platform === 'win32') {
    const script = await download('https://dot.net/v1/dotnet-install.ps1', path.join(TOOLS_HOME, 'dotnet-install.ps1'));
    await exec('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Channel', channel, '-InstallDir', DOTNET_DIR]);
  } else {
    const script = await download('https://dot.net/v1/dotnet-install.sh', path.join(TOOLS_HOME, 'dotnet-install.sh'));
    await exec('bash', [script, '--channel', channel, '--install-dir', DOTNET_DIR]);
  }
}

async function installComposer(opts, log) {
  if (!(await which('php'))) throw new Error('Composer needs PHP — install PHP first.');
  log(`Installing Composer into ${BIN_DIR} (official installer, signature-verified)`);
  const installer = await download('https://getcomposer.org/installer', path.join(TOOLS_HOME, 'composer-setup.php'));
  const expected = (await axios.get('https://composer.github.io/installer.sig', { timeout: 15000 })).data.trim();
  const actual = crypto.createHash('sha384').update(fs.readFileSync(installer)).digest('hex');
  if (actual !== expected) {
    fs.rmSync(installer, { force: true });
    throw new Error('Composer installer signature mismatch — aborted.');
  }
  fs.mkdirSync(BIN_DIR, { recursive: true });
  await exec('php', [installer, `--install-dir=${BIN_DIR}`, '--filename=composer.phar'], { shell: process.platform === 'win32' });
  fs.rmSync(installer, { force: true });

  // Shim so plain `composer` works.
  if (process.platform === 'win32') {
    fs.writeFileSync(path.join(BIN_DIR, 'composer.bat'), '@php "%~dp0composer.phar" %*\r\n');
  } else {
    const shim = path.join(BIN_DIR, 'composer');
    fs.writeFileSync(shim, '#!/bin/sh\nexec php "$(dirname "$0")/composer.phar" "$@"\n');
    fs.chmodSync(shim, 0o755);
  }
}

// The Windows PHP zip ships without php.ini, so openssl/mbstring/etc. are off
// and Composer/Laravel fail. Create one from the bundled development template.
function ensureWindowsPhpIni(phpExe, log) {
  const dir = path.dirname(fs.realpathSync(phpExe));
  const ini = path.join(dir, 'php.ini');
  if (fs.existsSync(ini)) return;
  const template = path.join(dir, 'php.ini-development');
  if (!fs.existsSync(template)) return log(`php.ini template not found in ${dir}; enable extensions manually.`);
  let content = fs.readFileSync(template, 'utf8');
  content = content.replace(/^;\s*extension_dir\s*=\s*"ext"/m, 'extension_dir = "ext"');
  for (const ext of ['curl', 'fileinfo', 'mbstring', 'openssl', 'pdo_mysql', 'pdo_sqlite', 'sqlite3', 'zip', 'intl', 'sodium']) {
    content = content.replace(new RegExp(`^;\\s*extension=${ext}\\s*$`, 'm'), `extension=${ext}`);
  }
  fs.writeFileSync(ini, content);
  log(`Created ${ini} with the extensions Laravel needs.`);
}

async function installPhp(opts, log) {
  if (process.platform === 'win32') {
    if (!(await which('winget'))) throw new Error('winget not found. Install PHP manually: https://windows.php.net/download');
    log(`Installing PHP via winget (${PHP_WINGET_ID})`);
    await exec('winget', ['install', '--id', PHP_WINGET_ID, '-e', '--accept-source-agreements', '--accept-package-agreements'], { shell: true });
    const php = await which('php');
    if (!php) throw new Error('PHP installed, but not found on PATH yet. Open a new terminal and run the command again.');
    ensureWindowsPhpIni(php, log);
  } else if (process.platform === 'darwin') {
    if (!(await which('brew'))) throw new Error('Homebrew not found. Install it from https://brew.sh, then re-run.');
    log('Installing PHP via Homebrew');
    await exec('brew', ['install', 'php']);
  } else {
    const managers = [
      ['apt-get', ['sudo', 'apt-get', 'install', '-y', 'php-cli', 'php-mbstring', 'php-xml', 'php-curl', 'php-zip', 'php-sqlite3', 'php-mysql', 'php-intl', 'unzip']],
      ['dnf', ['sudo', 'dnf', 'install', '-y', 'php-cli', 'php-mbstring', 'php-xml', 'php-pdo', 'php-mysqlnd', 'php-intl', 'unzip']],
      ['pacman', ['sudo', 'pacman', '-S', '--noconfirm', 'php', 'unzip']]
    ];
    for (const [probe, [cmd, ...args]] of managers) {
      if (await which(probe)) {
        log(`Installing PHP via ${probe} (you may be asked for your password)`);
        return exec(cmd, args);
      }
    }
    throw new Error('No supported package manager found. Install PHP 8.3+ manually.');
  }
}

/**
 * Makes tools installed into TOOLS_HOME available in new terminals too, by
 * adding them to the *user* PATH (no admin): the user Path environment
 * variable on Windows, the shell rc file elsewhere. Returns a description of
 * what was changed, or null if nothing needed changing.
 */
async function persistPath() {
  const dirs = [BIN_DIR, DOTNET_DIR].filter(d => fs.existsSync(d));
  if (!dirs.length || process.env.BOILERCRAFT_NO_PATH_UPDATE) return null;
  const hasDotnet = dirs.includes(DOTNET_DIR);

  if (process.platform === 'win32') {
    // Read-modify-write of the User scope only, so the (long) machine PATH is
    // never copied into it and nothing gets truncated (unlike setx).
    const ps = [
      '$p = [Environment]::GetEnvironmentVariable("Path", "User"); if (-not $p) { $p = "" }',
      `$add = @(${dirs.map(d => `"${d}"`).join(',')}) | Where-Object { ($p -split ";") -notcontains $_ }`,
      'if ($add) { [Environment]::SetEnvironmentVariable("Path", (($add + ($p -split ";" | Where-Object { $_ })) -join ";"), "User"); Write-Output "changed" }',
      hasDotnet ? `[Environment]::SetEnvironmentVariable("DOTNET_ROOT", "${DOTNET_DIR}", "User")` : ''
    ].join('; ');
    await new Promise((resolve, reject) => {
      const child = spawn('powershell.exe', ['-NoProfile', '-Command', ps], { stdio: 'ignore' });
      child.on('error', reject);
      child.on('close', resolve);
    });
    return `Added ${dirs.join(', ')} to your user PATH. Open a new terminal to use them.`;
  }

  const shell = path.basename(process.env.SHELL || '');
  const rc = path.join(os.homedir(), shell === 'zsh' ? '.zshrc' : shell === 'bash' ? '.bashrc' : '.profile');
  const marker = '# Added by BoilerCraft';
  const existing = fs.existsSync(rc) ? fs.readFileSync(rc, 'utf8') : '';
  if (existing.includes(marker)) return null;
  const lines = [
    '',
    marker,
    `export PATH="${dirs.join(':')}:$PATH"`,
    hasDotnet ? `export DOTNET_ROOT="${DOTNET_DIR}"` : ''
  ].filter(l => l !== '').join('\n');
  fs.appendFileSync(rc, `\n${lines}\n`);
  return `Added BoilerCraft tools to PATH in ${rc}. Run "source ${rc}" or open a new terminal.`;
}

const RECIPES = {
  php: { name: 'PHP', install: installPhp },
  composer: { name: 'Composer', install: installComposer, after: ['php'] },
  dotnet: { name: '.NET SDK', install: installDotnet }
};

function canInstall(tool) {
  return Object.prototype.hasOwnProperty.call(RECIPES, tool);
}

/**
 * Installs the given missing requirements (from checkRequirements) in
 * dependency order. Returns the names that could not be auto-installed.
 */
async function installMissing(missing, log = console.log) {
  const order = ['php', 'composer', 'dotnet'];
  const todo = [...missing].sort((a, b) => order.indexOf(a.tool) - order.indexOf(b.tool));
  const manual = [];
  for (const m of todo) {
    if (!canInstall(m.tool)) {
      manual.push(m);
      continue;
    }
    await RECIPES[m.tool].install({ major: m.major }, log);
  }
  const pathNote = await persistPath();
  if (pathNote) log(pathNote);
  return manual;
}

module.exports = { toolEnv, installMissing, persistPath, canInstall, RECIPES, TOOLS_HOME };
