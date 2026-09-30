const fs = require('fs');
const path = require('path');

/**
 * Leaves the project as a git repository with one clean commit. Some official
 * creators (create-next-app, nest new) already run `git init` and commit their
 * own files; then only BoilerCraft's additions are committed on top.
 * Never fails the scaffold — a missing git or identity just becomes a warning.
 */
async function initGit(ctx, capture) {
  const { projectDir, log, warn } = ctx;
  const git = (...args) => capture('git', args, projectDir);

  if (!(await git('--version')).ok) return warn('git not found — skipped repository setup');

  const fresh = !fs.existsSync(path.join(projectDir, '.git'));
  if (fresh) {
    const init = await git('init', '-b', 'main');
    if (!init.ok && !(await git('init')).ok) return warn('git init failed — skipped repository setup');
  }
  await git('add', '-A');
  if (!(await git('status', '--porcelain')).out.trim()) return log('Git repository ready');

  const message = fresh ? 'Initial commit from BoilerCraft' : 'Add BoilerCraft auth, database and theme';
  const commit = await git('commit', '-q', '-m', message);
  if (commit.ok) return log(fresh ? 'Initialized git repository' : 'Committed BoilerCraft files');
  warn('git commit failed (set user.name / user.email), files are staged — commit them yourself');
}

module.exports = { initGit };
