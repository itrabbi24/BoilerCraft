const { generateProject } = require('./projectGenerator');
const { scaffold, getStack, parseMajor, RequirementError } = require('./engine/scaffoldEngine');

// Shared entry point for the web/desktop server and the CLI.

// The legacy generator expects the old per-stack version formats.
function toLegacyVersions(config) {
  const v = config.versions || {};
  const major = key => parseMajor(v[key]);
  return {
    laravel: major('laravel') ? `^${major('laravel')}.0` : v.laravel,
    nextjs: major('nextjs') ? `^${major('nextjs')}.0.0` : v.nextjs,
    nodeExpress: major('node-express') ? `^${major('node-express')}.0.0` : v.nodeExpress,
    dotnet: major('dotnet-core') ? `net${major('dotnet-core')}.0` : v.dotnet
  };
}

async function runLegacy(config, warning) {
  const result = await generateProject({ ...config, versions: toLegacyVersions(config) }, config.outputDir || null);
  return { ...result, engine: 'legacy', warnings: warning ? [warning] : [] };
}

/**
 * Every stack has a manifest in stacks/ and is scaffolded by the engine;
 * the template generator is only an offline fallback. If the
 * required toolchain is missing, fall back to templates unless the caller
 * opted out with allowLegacyFallback: false.
 */
async function generate(config, onLog = () => {}) {
  const backend = config.backend || config.stack;
  if (config.engine === 'legacy' || !getStack(backend)) return runLegacy(config);

  try {
    return await scaffold(config, config.outputDir || null, onLog);
  } catch (err) {
    if (err instanceof RequirementError && config.allowLegacyFallback !== false) {
      const hint = err.missing.map(m => `${m.name}${m.install ? ` (${m.install})` : ''}`).join(', ');
      const warning = `${err.message}. Used offline templates instead — install ${hint} for an official, version-exact scaffold.`;
      onLog(`WARNING: ${warning}`);
      return runLegacy(config, warning);
    }
    throw err;
  }
}

module.exports = { generate, toLegacyVersions };
