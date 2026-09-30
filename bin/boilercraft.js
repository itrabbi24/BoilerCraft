#!/usr/bin/env node
/**
 * BoilerCraft CLI — cross-platform (Windows / macOS / Linux).
 *
 * Everything is reachable from one command:
 *
 *   npx boilercraft
 *
 * which opens an interactive menu (create project, install tools, browse
 * versions, web studio). Flags exist only for scripts/CI, e.g.
 *   npx boilercraft new my-app -s laravel -v 12 -y
 * See `npx boilercraft --help`.
 */
process.env.BOILERCRAFT_CLI = '1';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 18 || (major === 18 && minor < 3)) {
  console.error(`BoilerCraft needs Node.js 18.3 or newer (you have ${process.version}). Get it at https://nodejs.org`);
  process.exit(1);
}

const { parseArgs } = require('util');
const ui = require('../cli/ui');
const app = require('../cli/app');
const pkg = require('../package.json');

const { c } = ui;

const HELP = `
  ${ui.gradient('BoilerCraft')} ${c.gray(`v${pkg.version}`)} ${c.gray('· by')} ${c.bold(app.AUTHOR)}

  ${c.bold('Usage')}
    ${c.cyan('npx boilercraft')}            Opens the interactive menu. This is all you need.

  ${c.bold('Automation')} ${c.gray('(scripts / CI, no prompts)')}
    npx boilercraft new <name> [flags]

    -s, --stack <id>        laravel | nextjs | nestjs | vite | node-express | dotnet-core
                            django | fastapi | go-gin | raw-php
    -v, --version <major>   Framework major version (default: recommended)
        --auth / --no-auth  Authentication module (default: on)
        --router <type>     app | pages          (Next.js, default: app)
        --frontend <name>   blade | vue | react  (Laravel, default: blade)
        --template <type>   mvc | api            (.NET, default: mvc)
        --framework <name>  react | vue | svelte (Vite, default: react)
        --language <lang>   ts | js              (Vite, default: ts)
    -t, --theme <name>      midnight | emerald | royal | crimson
    -m, --mode <mode>       all | dark | light
    -d, --db <name>         mysql | mssql | mongodb | postgresql | sqlite | none
        --styling <name>    tailwind | bootstrap | vanilla
    -e, --extras <list>     docker,ci,lint,prisma   (comma separated)
        --git / --no-git    Initialize a git repository (default: on)
    -p, --preset <name>     Use a saved preset or a JSON file for the answers
        --save-preset <n>   Save this run's answers as a preset
        --open              Open the project in your editor when done
        --editor <cmd>      Editor for --open (default: code, e.g. cursor)
    -o, --out <dir>         Parent folder (default: current directory)
    -y, --yes               Defaults for anything not given
        --install-tools     Install missing PHP / Composer / .NET SDK automatically
        --no-fallback       Fail instead of using offline templates
    -h, --help              This help

  ${c.bold('Other commands')}
    npx boilercraft doctor     Report installed tools and which frameworks are ready
    npx boilercraft tools      Install PHP, Composer or the .NET SDK
    npx boilercraft list       Frameworks and live versions
    npx boilercraft presets    Saved presets
`;

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    allowNegative: true,
    options: {
      stack: { type: 'string', short: 's' },
      version: { type: 'string', short: 'v' },
      auth: { type: 'boolean' },
      theme: { type: 'string', short: 't' },
      mode: { type: 'string', short: 'm' },
      router: { type: 'string' },
      frontend: { type: 'string' },
      template: { type: 'string' },
      framework: { type: 'string' },
      language: { type: 'string' },
      extras: { type: 'string', short: 'e' },
      git: { type: 'boolean' },
      preset: { type: 'string', short: 'p' },
      'save-preset': { type: 'string' },
      open: { type: 'boolean' },
      editor: { type: 'string' },
      db: { type: 'string', short: 'd' },
      styling: { type: 'string' },
      port: { type: 'string' },
      title: { type: 'string' },
      author: { type: 'string' },
      out: { type: 'string', short: 'o' },
      yes: { type: 'boolean', short: 'y' },
      'install-tools': { type: 'boolean' },
      fallback: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' }
    }
  });

  if (values.help || positionals[0] === 'help') return console.log(HELP);

  const [command, name] = positionals;
  if (!command) return app.home();

  // Non-interactive / scripted use.
  if (command === 'new' || command === 'create') {
    app.printBanner();
    const given = { ...values, name, installTools: values['install-tools'], noFallback: values.fallback === false, savePreset: values['save-preset'] };
    await app.createFlow(given);
    await app.notifyUpdate();
    return app.goodbye();
  }
  if (command === 'list') return app.browseFlow();
  // `doctor` used to open the interactive tools screen; it is now a plain report.
  if (command === 'doctor') {
    if (!(await app.doctor())) process.exitCode = 1;
    return app.notifyUpdate();
  }
  if (command === 'tools') return app.toolsFlow();
  if (command === 'presets') return app.listPresetsFlow();

  // `npx boilercraft my-app` → menu-free create with the name filled in.
  app.printBanner();
  await app.createFlow({ ...values, name: command });
  app.goodbye();
}

main().catch(err => {
  if (err instanceof ui.CancelError) {
    console.log(`\n  ${c.gray('Cancelled.')}\n`);
    return;
  }
  ui.log.error(err.message);
  console.log('');
  process.exitCode = 1;
});
