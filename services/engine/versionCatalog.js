const axios = require('axios');

// Lists the framework versions a stack can be scaffolded with, straight from
// the upstream registry. A new major release shows up here automatically —
// no code change needed. Majors newer than the stack's "testedUpTo" are still
// offered, just flagged as untested until someone verifies the overlays.

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map();

function majorOf(v) {
  const m = /^v?(\d+)\./.exec(String(v));
  return m ? parseInt(m[1], 10) : null;
}

function isStable(v) {
  return !/(-|dev|alpha|beta|rc|preview|canary)/i.test(String(v));
}

function compareVersions(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Collapses a flat list of version strings into { major -> newest stable }.
function newestPerMajor(versions, minMajor) {
  const byMajor = new Map();
  for (const v of versions) {
    if (!isStable(v)) continue;
    const major = majorOf(v);
    if (major === null || major < minMajor) continue;
    const current = byMajor.get(major);
    if (!current || compareVersions(v, current) > 0) byMajor.set(major, v.replace(/^v/, ''));
  }
  return [...byMajor.entries()].map(([major, latest]) => ({ major, latest }));
}

const sources = {
  async npm({ package: pkg, minMajor = 0 }) {
    const res = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, {
      timeout: 5000,
      headers: { Accept: 'application/vnd.npm.install-v1+json' } // abbreviated metadata, much smaller
    });
    return newestPerMajor(Object.keys(res.data.versions || {}), minMajor);
  },

  async packagist({ package: pkg, minMajor = 0 }) {
    const res = await axios.get(`https://repo.packagist.org/p2/${pkg}.json`, { timeout: 5000 });
    const releases = (res.data.packages && res.data.packages[pkg]) || [];
    return newestPerMajor(releases.map(r => r.version), minMajor);
  },

  async pypi({ package: pkg, minMajor = 0 }) {
    const res = await axios.get(`https://pypi.org/pypi/${encodeURIComponent(pkg)}/json`, { timeout: 5000 });
    return newestPerMajor(Object.keys(res.data.releases || {}), minMajor);
  },

  // Go modules: proxy.golang.org lists every tagged version, one per line.
  async goproxy({ package: mod, minMajor = 0 }) {
    const res = await axios.get(`https://proxy.golang.org/${mod.toLowerCase()}/@v/list`, { timeout: 5000, responseType: 'text' });
    return newestPerMajor(String(res.data).split('\n').filter(Boolean), minMajor);
  },

  // Stacks with no upstream framework release (e.g. raw PHP) pin their list.
  async static({ offline = [] }) {
    return offline.map(major => ({ major, latest: `${major}.x` }));
  },

  async dotnet({ minMajor = 0 }) {
    const res = await axios.get(
      'https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/releases-index.json',
      { timeout: 5000 }
    );
    return (res.data['releases-index'] || [])
      .filter(r => r.product === '.NET')
      .filter(r => r['support-phase'] === 'active' || r['support-phase'] === 'maintenance')
      .map(r => ({
        major: majorOf(r['channel-version']),
        latest: r['latest-release'],
        lts: r['release-type'] === 'lts'
      }))
      .filter(r => r.major !== null && r.major >= minMajor);
  }
};

/**
 * Returns [{ major, latest, tested, lts?, recommended }] newest-first.
 * Falls back to the manifest's offline list when the registry is unreachable.
 */
async function listVersions(stack) {
  const spec = stack.versions;
  const key = `${stack.id}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.list;

  let list;
  let offline = false;
  try {
    const fetcher = sources[spec.source];
    if (!fetcher) throw new Error(`Unknown version source '${spec.source}'`);
    list = await fetcher(spec);
    if (!list.length) throw new Error('registry returned no versions');
  } catch (err) {
    console.warn(`[VersionCatalog] ${stack.id}: ${err.message}. Using offline list.`);
    list = (spec.offline || []).map(major => ({ major, latest: `${major}.x` }));
    offline = true;
  }

  const lts = new Set(spec.lts || []);
  list = list
    .map(v => ({
      ...v,
      lts: v.lts || lts.has(v.major),
      tested: v.major <= spec.testedUpTo
    }))
    .sort((a, b) => b.major - a.major);

  // Recommended = newest tested major; if nothing is tested, the newest one.
  const recommended = list.find(v => v.tested) || list[0];
  if (recommended) recommended.recommended = true;

  if (!offline) cache.set(key, { at: Date.now(), list });
  return list;
}

module.exports = { listVersions, majorOf, compareVersions };
