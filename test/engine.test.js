const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

process.env.BOILERCRAFT_STACKS_DIR = path.join(__dirname, 'fixtures', 'stacks');
process.env.BOILERCRAFT_CLI = '1'; // keep engine output quiet

const { scaffold, versionMatches, matches, interpolate, resolveOptions, getStack } = require('../services/engine/scaffoldEngine');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bc-test-'));
const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');

test('versionMatches handles every range form', () => {
  assert.ok(versionMatches(undefined, 5));
  assert.ok(versionMatches('*', 5));
  assert.ok(versionMatches('11', 11));
  assert.ok(!versionMatches('11', 12));
  assert.ok(versionMatches('>=11', 12));
  assert.ok(!versionMatches('<11', 11));
  assert.ok(versionMatches('10-12', 12));
  assert.ok(versionMatches('>=9 <11', 10));
  assert.ok(!versionMatches('>=9 <11', 11));
  assert.throws(() => versionMatches('abc', 1));
});

test('matches supports builtin keys, stack options and extras', () => {
  const ctx = { major: 3, database: 'mysql', styling: 'vanilla', auth: true, options: { flavor: 'fancy' }, extras: ['docker'] };
  assert.ok(matches({ version: '>=2', database: ['mysql', 'mssql'] }, ctx));
  assert.ok(matches({ flavor: 'fancy', extra: 'docker' }, ctx));
  assert.ok(!matches({ extra: 'ci' }, ctx));
  assert.ok(!matches({ auth: false }, ctx));
  assert.ok(!matches({ flavor: 'plain' }, ctx));
});

test('interpolate leaves unknown placeholders alone', () => {
  assert.strictEqual(interpolate('{{A}}-{{B}}', { A: 'x' }), 'x-{{B}}');
});

test('resolveOptions fills defaults and rejects bad values', () => {
  const stack = getStack('demo');
  assert.deepStrictEqual(resolveOptions(stack, {}), { flavor: 'plain' });
  assert.throws(() => resolveOptions(stack, { flavor: 'nope' }), /invalid Flavor/);
});

test('scaffold runs manifest steps, options, conditions and extras', async () => {
  const out = tmp();
  const result = await scaffold({
    projectName: 'My App', backend: 'demo', versions: { demo: 2 }, database: 'postgresql',
    options: { flavor: 'fancy' }, extras: ['docker', 'ci', 'prisma'], git: false, author: 'Tester'
  }, out);

  const dir = path.join(out, 'my-app');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.path, dir);
  assert.strictEqual(read(dir, 'src/index.js').trim(), "console.log('good day from my-app on port 4000');");
  assert.deepStrictEqual(JSON.parse(read(dir, 'package.json')), { name: 'my-app', scripts: { start: 'node src/index.js' }, author: 'Tester' });
  assert.strictEqual(read(dir, 'V2.txt'), 'v2');
  assert.match(read(dir, '.env'), /DB_PORT=5432/);
  assert.strictEqual(read(dir, 'EXTRA.txt'), 'docker on');
  assert.match(read(dir, 'Dockerfile'), /FROM node:22-alpine[\s\S]*CMD \["node","src\/index.js"\]/);
  assert.match(read(dir, 'docker-compose.yml'), /image: postgres:16/);
  assert.match(read(dir, '.github/workflows/ci.yml'), /actions\/setup-node@v4/);
  assert.ok(!result.combination.includes('prisma'), 'unsupported extras are dropped');
  assert.ok(fs.existsSync(path.join(dir, 'BOILERCRAFT.md')));
});

test('scaffold picks the recommended (newest tested) version and warns on untested ones', async () => {
  const out = tmp();
  const rec = await scaffold({ projectName: 'a', backend: 'demo', database: 'none', git: false }, out);
  assert.strictEqual(rec.version, 2);
  assert.ok(!fs.existsSync(path.join(rec.path, 'Dockerfile')), 'no extras unless asked');

  const preview = await scaffold({ projectName: 'b', backend: 'demo', versions: { demo: 3 }, database: 'none', git: false }, out);
  assert.ok(preview.warnings.some(w => /newer than the last verified/.test(w)));
});

test('scaffold rejects bad input', async () => {
  const out = tmp();
  await assert.rejects(scaffold({ projectName: 'x', backend: 'demo', database: 'mongodb' }, out), /supports these databases/);
  await assert.rejects(scaffold({ projectName: 'x', backend: 'demo', versions: { demo: 0 } }, out), /below the minimum/);
  await assert.rejects(scaffold({ projectName: 'x', backend: 'missing' }, out), /No stack manifest/);
  fs.mkdirSync(path.join(out, 'taken'));
  fs.writeFileSync(path.join(out, 'taken', 'f'), '');
  await assert.rejects(scaffold({ projectName: 'taken', backend: 'demo', database: 'none', git: false }, out), /already exists/);
});

const hasGit = spawnSync('git', ['--version']).status === 0;

test('git step creates an initial commit', { skip: !hasGit && 'git not installed' }, async () => {
  const out = tmp();
  process.env.GIT_AUTHOR_NAME = process.env.GIT_COMMITTER_NAME = 'Test';
  process.env.GIT_AUTHOR_EMAIL = process.env.GIT_COMMITTER_EMAIL = 'test@example.com';
  const result = await scaffold({ projectName: 'g', backend: 'demo', database: 'none' }, out);
  const log = execSync('git log --oneline', { cwd: result.path }).toString();
  assert.match(log, /Initial commit from BoilerCraft/);
});
