const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateProject } = require('./services/projectGenerator');
const { getLatestNpmVersion, getLatestPackagistVersion } = require('./services/versionResolver');

const app = express();
const PORT = process.env.PORT || 4800;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Generation API Endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const config = req.body;
    console.log(`[BoilerCraft] Generating project: ${config.projectName} at: ${config.outputDir || 'default'}`);
    const result = await generateProject(config, config.outputDir || null);
    res.json(result);
  } catch (err) {
    console.error('[BoilerCraft] Generation Error:', err);
    res.status(500).json({ success: false, error: err.message });
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
