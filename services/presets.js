const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Presets are saved answers for `boilercraft new`, so a team (or you) can
 * create the same kind of project again without going through every prompt.
 *
 *   ~/.boilercraft/presets/<name>.json   saved from the CLI ("Save as preset")
 *   ./anything.json                      passed with --preset ./anything.json
 *
 * The keys are the same as the CLI flags: stack, version, auth, theme, mode,
 * db, styling, extras, git, plus stack options such as router or frontend.
 */

const PRESETS_DIR = process.env.BOILERCRAFT_PRESETS_DIR || path.join(os.homedir(), '.boilercraft', 'presets');
const KEYS = ['stack', 'version', 'auth', 'theme', 'mode', 'db', 'styling', 'extras', 'git', 'port', 'author', 'title'];

function slug(name) {
  return String(name).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function listPresets() {
  if (!fs.existsSync(PRESETS_DIR)) return [];
  return fs.readdirSync(PRESETS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        return { name: f.slice(0, -5), ...JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, f), 'utf8')) };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function normalize(data) {
  const out = { ...data };
  if (typeof out.extras === 'string') out.extras = out.extras.split(',').map(s => s.trim()).filter(Boolean);
  if (out.version !== undefined) out.version = String(out.version);
  delete out.name;
  return out;
}

// A path to a JSON file, or the name of a saved preset.
function loadPreset(ref) {
  const asFile = path.resolve(ref);
  const file = fs.existsSync(asFile) && fs.statSync(asFile).isFile() ? asFile : path.join(PRESETS_DIR, `${slug(ref)}.json`);
  if (!fs.existsSync(file)) {
    const known = listPresets().map(p => p.name);
    throw new Error(`Preset "${ref}" not found.${known.length ? ` Saved presets: ${known.join(', ')}` : ''}`);
  }
  try {
    return normalize(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch (err) {
    throw new Error(`Preset ${file} is not valid JSON: ${err.message}`);
  }
}

// Turns a finished project config back into preset answers.
function presetFromConfig(config, stack) {
  const data = {
    stack: config.backend,
    version: config.versions?.[config.backend] !== undefined ? String(config.versions[config.backend]) : undefined,
    auth: config.auth?.enabled,
    theme: config.theme,
    mode: config.colorMode,
    db: config.database,
    styling: config.styling,
    extras: config.extras || [],
    git: config.git,
    ...config.options
  };
  for (const opt of stack?.options || []) data[opt.id] = config.options?.[opt.id];
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

function savePreset(name, data) {
  const id = slug(name);
  if (!id) throw new Error('Preset name is empty');
  fs.mkdirSync(PRESETS_DIR, { recursive: true });
  const file = path.join(PRESETS_DIR, `${id}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  return file;
}

module.exports = { PRESETS_DIR, KEYS, listPresets, loadPreset, savePreset, presetFromConfig, slug };
