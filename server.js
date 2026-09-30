const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateProject } = require('./services/projectGenerator');
const { getLatestNpmVersion, getLatestPackagistVersion } = require('./services/versionResolver');
const { describeStacks, RequirementError } = require('./services/engine/scaffoldEngine');
// generate() (engine + legacy fallback) lives in services/generate.js, shared with the CLI.
const { generate } = require('./services/generate');

const app = express();
const PORT = process.env.PORT || 4800;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Available stacks with live version lists and toolchain status.
app.get('/api/stacks', async (req, res) => {
  try {
    res.json({ stacks: await describeStacks() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generation API Endpoint. With ?stream=1 the response is NDJSON:
// {"type":"log","message":...} lines followed by one {"type":"result",...}.
app.post('/api/generate', async (req, res) => {
  const config = req.body;
  const stream = req.query.stream === '1';
  console.log(`[BoilerCraft] Generating project: ${config.projectName} at: ${config.outputDir || 'default'}`);

  if (stream) res.setHeader('Content-Type', 'application/x-ndjson');
  const send = obj => res.write(JSON.stringify(obj) + '\n');
  const onLog = stream ? message => send({ type: 'log', message }) : () => {};

  try {
    const result = await generate(config, onLog);
    if (stream) {
      send({ type: 'result', ...result });
      res.end();
    } else {
      res.json(result);
    }
  } catch (err) {
    console.error('[BoilerCraft] Generation Error:', err);
    const body = { success: false, error: err.message, missing: err.missing };
    if (stream) {
      send({ type: 'result', ...body });
      res.end();
    } else {
      res.status(err instanceof RequirementError ? 400 : 500).json(body);
    }
  }
});

// Real-time package version check endpoint
app.get('/api/version-check', async (req, res) => {
  const { pkg, type } = req.query;
  try {
    let ver = 'latest';
    if (type === 'packagist') {
      ver = await getLatestPackagistVersion(pkg);
    } else {
      ver = await getLatestNpmVersion(pkg);
    }
    res.json({ package: pkg, version: ver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function startServer(cb) {
  return app.listen(PORT, () => {
    console.log(`🔥 BoilerCraft Studio active at http://localhost:${PORT}`);
    if (cb) cb(PORT);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, PORT };
