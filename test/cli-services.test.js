const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-home-'));
process.env.BOILERCRAFT_PRESETS_DIR = path.join(home, 'presets');
process.env.BOILERCRAFT_UPDATE_CACHE = path.join(home, 'update.json');
delete process.env.CI;
delete process.env.BOILERCRAFT_NO_UPDATE_CHECK;

const presets = require('../services/presets');
const { checkForUpdate, isNewer } = require('../services/updateNotifier');

test('presets round-trip through save / list / load', () => {
  const config = {
    backend: 'nextjs', versions: { nextjs: 16 }, options: { router: 'app' }, auth: { enabled: false },
    theme: 'emerald', colorMode: 'dark', database: 'mysql', styling: 'tailwind', extras: ['docker'], git: true
  };
  presets.savePreset('My Next!', presets.presetFromConfig(config, { options: [{ id: 'router' }] }));
  assert.deepStrictEqual(presets.listPresets().map(p => p.name), ['my-next']);
  assert.deepStrictEqual(presets.loadPreset('my-next'), {
    stack: 'nextjs', version: '16', auth: false, theme: 'emerald', mode: 'dark', db: 'mysql',
    styling: 'tailwind', extras: ['docker'], git: true, router: 'app'
  });
});

test('presets load from a file path and split string extras', () => {
  const file = path.join(home, 'team.json');
  fs.writeFileSync(file, JSON.stringify({ stack: 'laravel', version: 12, extras: 'docker, ci' }));
  assert.deepStrictEqual(presets.loadPreset(file), { stack: 'laravel', version: '12', extras: ['docker', 'ci'] });
  assert.throws(() => presets.loadPreset('does-not-exist'), /not found/);
});

test('isNewer compares semver parts numerically', () => {
  assert.ok(isNewer('1.10.0', '1.9.9'));
  assert.ok(!isNewer('1.0.0', '1.0.0'));
  assert.ok(!isNewer('0.9.0', '1.0.0'));
});

test('update check is cached for a day', async () => {
  let calls = 0;
  const fetch = async () => { calls++; return '9.9.9'; };
  const pkg = { name: 'boilercraft', version: '1.0.0' };
  assert.strictEqual(await checkForUpdate(pkg, { fetch, now: 1000 }), '9.9.9');
  assert.strictEqual(await checkForUpdate(pkg, { fetch, now: 2000 }), '9.9.9');
  assert.strictEqual(calls, 1);
  await checkForUpdate(pkg, { fetch, now: 1000 + 25 * 3600 * 1000 });
  assert.strictEqual(calls, 2);
  assert.strictEqual(await checkForUpdate({ ...pkg, version: '9.9.9' }, { fetch, now: 2000 }), null);
});
