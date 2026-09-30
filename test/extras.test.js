const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { dockerfile, supportedExtras } = require('../services/engine/extras');

const ctx = () => ({
  projectDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bc-extra-')),
  vars: { PORT: '8080' },
  major: 9,
  name: 'shop'
});

test('supportedExtras ignores unknown names', () => {
  assert.deepStrictEqual(supportedExtras({ extras: ['docker', 'nope', 'ci'] }), ['docker', 'ci']);
  assert.deepStrictEqual(supportedExtras({}), []);
});

test('dockerfile has a recipe per runtime', () => {
  assert.match(dockerfile({ runtime: 'node', docker: { build: 'npm run build', start: 'npm start' } }, ctx()), /RUN npm run build[\s\S]*CMD \["npm","start"\]/);
  assert.match(dockerfile({ runtime: 'dotnet' }, ctx()), /sdk:9\.0[\s\S]*aspnet:9\.0[\s\S]*"shop\.dll"/);
  assert.match(dockerfile({ runtime: 'python', docker: { start: 'fastapi run app/main.py' } }, ctx()), /python:3\.12-slim/);
  assert.match(dockerfile({ runtime: 'go' }, ctx()), /golang:1-alpine/);
  assert.match(dockerfile({ runtime: 'php', docker: { start: 'php -S 0.0.0.0:8000 -t public' } }, ctx()), /php:8\.3-cli/);
  assert.strictEqual(dockerfile({ runtime: 'cobol' }, ctx()), null);
});
