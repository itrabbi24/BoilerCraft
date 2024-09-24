const axios = require('axios');

// Known-good major version for each package this generator scaffolds against.
// Bumping these is a deliberate, tested decision (update the templates too),
// NOT something that should happen automatically just because upstream
// published a new major release.
const TESTED_MAJOR = {
  npm: {
    'next': 14,
    'react': 18,
    'react-dom': 18,
    'express': 4,
    'mongoose': 8,
    'mysql2': 3,
    'mssql': 11,
    'tailwindcss': 3,
    'bootstrap': 5,
    'dotenv': 16,
    'cors': 2,
    'vue': 3
  },
  packagist: {
    'laravel/framework': 11,
    'vlucas/phpdotenv': 5
  }
};

// Fallback stable versions if the registry is unreachable (offline usage).
const FALLBACK_VERSIONS = {
  npm: {
    'next': '^14.2.5',
    'react': '^18.3.1',
    'react-dom': '^18.3.1',
    'express': '^4.19.2',
    'mongoose': '^8.5.2',
    'mysql2': '^3.11.0',
    'mssql': '^11.0.1',
    'tailwindcss': '^3.4.7',
    'bootstrap': '^5.3.3',
    'dotenv': '^16.4.5',
    'cors': '^2.8.5',
    'vue': '^3.4.34'
  },
  packagist: {
    'laravel/framework': '^11.0',
    'vlucas/phpdotenv': '^5.6'
  }
};

const cache = new Map();

function majorOf(versionString) {
  const match = /^v?(\d+)\./.exec(versionString);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Resolves the latest version within this generator's tested major line from
 * the NPM Registry. Falls back to the pinned/fallback version if the
 * registry's current "latest" has moved to a newer, untested major (so a
 * scaffolded project never silently picks up a breaking upstream release),
 * or if the registry can't be reached.
 */
async function getLatestNpmVersion(pkgName) {
  if (cache.has(`npm:${pkgName}`)) {
    return cache.get(`npm:${pkgName}`);
  }

  const testedMajor = TESTED_MAJOR.npm[pkgName];

  try {
    const res = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(pkgName)}`, {
      timeout: 3500
    });
    const distTags = res.data && res.data['dist-tags'];
    const latest = distTags && distTags.latest;

    if (latest) {
      let resolvedVersion = latest;

      // If we have a tested major pin and the registry's "latest" has moved
      // past it, look for the newest published version still on that major
      // instead of jumping to an unverified major release.
      if (testedMajor !== undefined && majorOf(latest) !== testedMajor) {
        const versions = Object.keys(res.data.versions || {});
        const onTestedMajor = versions
          .filter(v => majorOf(v) === testedMajor && !/-/.test(v)) // exclude pre-releases (canary/alpha/beta/rc)
          .sort((a, b) => compareVersions(b, a));
        resolvedVersion = onTestedMajor[0] || latest;
      }

      const ver = `^${resolvedVersion}`;
      cache.set(`npm:${pkgName}`, ver);
      return ver;
    }
  } catch (err) {
    console.warn(`[VersionResolver] Failed to fetch version info for npm package '${pkgName}'. Using fallback.`);
  }
  return FALLBACK_VERSIONS.npm[pkgName] || 'latest';
}

/**
 * Resolves the latest version within this generator's tested major line from
 * Packagist (PHP / Laravel). Same tested-major guard as the NPM resolver.
 */
async function getLatestPackagistVersion(packageName) {
  if (cache.has(`php:${packageName}`)) {
    return cache.get(`php:${packageName}`);
  }

  const testedMajor = TESTED_MAJOR.packagist[packageName];

  try {
    const res = await axios.get(`https://repo.packagist.org/p2/${packageName}.json`, {
      timeout: 3500
    });
    if (res.data && res.data.packages && res.data.packages[packageName]) {
      const releases = res.data.packages[packageName];
      const stableReleases = releases.filter(
        r => !r.version.includes('dev') && !r.version.includes('alpha') && !r.version.includes('beta') && !r.version.includes('RC')
      );

      let candidates = stableReleases;
      if (testedMajor !== undefined) {
        const onTestedMajor = stableReleases.filter(r => majorOf(r.version.replace(/^v/, '')) === testedMajor);
        if (onTestedMajor.length) candidates = onTestedMajor;
      }

      const stable = candidates[0]; // packagist returns releases newest-first
      if (stable) {
        const ver = `^${stable.version.replace(/^v/, '')}`;
        cache.set(`php:${packageName}`, ver);
        return ver;
      }
    }
  } catch (err) {
    console.warn(`[VersionResolver] Failed to fetch packagist package '${packageName}'. Using fallback.`);
  }
  return FALLBACK_VERSIONS.packagist[packageName] || '*';
}

// Minimal semver-ish comparator, sufficient for sorting registry version strings.
function compareVersions(a, b) {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0);
  const pb = b.split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Batch resolve versions for requested package list
 */
async function resolveDependencies(pkgList, type = 'npm') {
  const result = {};
  await Promise.all(
    pkgList.map(async (pkg) => {
      if (type === 'npm') {
        result[pkg] = await getLatestNpmVersion(pkg);
      } else if (type === 'packagist') {
        result[pkg] = await getLatestPackagistVersion(pkg);
      }
    })
  );
  return result;
}

module.exports = {
  getLatestNpmVersion,
  getLatestPackagistVersion,
  resolveDependencies,
  FALLBACK_VERSIONS,
  TESTED_MAJOR
};
