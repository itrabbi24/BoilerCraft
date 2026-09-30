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

    -s, --stack <id>        laravel | nextjs | node-express | dotnet-core | raw-php
    -v, --version <major>   Framework major version (default: recommended)
        --auth / --no-auth  Authentication module (default: on)
        --router <type>     app | pages          (Next.js, default: app)
        --frontend <name>   blade | vue | react  (Laravel, default: blade)
        --template <type>   mvc | api            (.NET, default: mvc)
    -t, --theme <name>      midnight | emerald | royal | crimson
    -m, --mode <mode>       all | dark | light
    -d, --db <name>         mysql | mssql | mongodb
        --styling <name>    tailwind | bootstrap | vanilla
    -o, --out <dir>         Parent folder (default: current directory)
    -y, --yes               Defaults for anything not given
        --install-tools     Install missing PHP / Composer / .NET SDK automatically
        --no-fallback       Fail instead of using offline templates
    -h, --help              This help
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
    const given = { ...values, name, installTools: values['install-tools'], noFallback: values.fallback === false };
    await app.createFlow(given);
    return app.goodbye();
  }
  if (command === 'list') return app.browseFlow();
  if (command === 'doctor' || command === 'tools') return app.toolsFlow();

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
