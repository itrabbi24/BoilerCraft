const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');

// Checks npm for a newer BoilerCraft at most once a day. The answer is cached
// in ~/.boilercraft/update-check.json so most runs cost no network at all.

const CACHE_FILE = process.env.BOILERCRAFT_UPDATE_CACHE || path.join(os.homedir(), '.boilercraft', 'update-check.json');
const DAY_MS = 24 * 60 * 60 * 1000;

function isNewer(latest, current) {
  const a = String(latest).split('.').map(Number);
  const b = String(current).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  return false;
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

async function latestVersion({ name, now = Date.now(), fetch } = {}) {
  const cached = readCache();
  if (cached && now - cached.at < DAY_MS) return cached.latest;
  try {
    const latest = fetch
      ? await fetch()
      : (await axios.get(`https://registry.npmjs.org/${name}/latest`, { timeout: 1500 })).data?.version;
    if (!latest) return null;
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ at: now, latest }));
    return latest;
  } catch {
    return cached?.latest || null;
  }
}

// Resolves to the newer version string, or null. Never throws.
async function checkForUpdate(pkg, opts = {}) {
  if (process.env.BOILERCRAFT_NO_UPDATE_CHECK || process.env.CI) return null;
  const latest = await latestVersion({ name: pkg.name, ...opts });
  return latest && isNewer(latest, pkg.version) ? latest : null;
}

module.exports = { checkForUpdate, isNewer, latestVersion, CACHE_FILE };
