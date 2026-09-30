const fs = require('fs');
const path = require('path');

/**
 * Optional add-ons that work across stacks: Docker, GitHub Actions CI,
 * ESLint + Prettier and Prisma. A manifest opts in with
 *
 *   "runtime": "node" | "php" | "dotnet" | "python" | "go",
 *   "extras": ["docker", "ci", "lint", "prisma"],
 *   "docker": { "build": "npm run build", "start": "npm start" },
 *   "ci": { "test": "php artisan test" }
 *
 * Files are generated from the runtime, so a new stack gets all of this by
 * declaring three fields instead of copying templates around.
 */

const EXTRAS = {
  docker: { label: 'Docker', hint: 'Dockerfile + docker-compose with your database' },
  ci: { label: 'GitHub Actions CI', hint: 'build + test on every push' },
  lint: { label: 'ESLint + Prettier', hint: 'lint and format scripts' },
  prisma: { label: 'Prisma ORM', hint: 'schema, client and migrations' }
};

function supportedExtras(stack) {
  return (stack.extras || []).filter(x => EXTRAS[x]);
}

const write = (dir, rel, content) => {
  const file = path.join(dir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.replace(/^\n/, ''));
};

// ---------------------------------------------------------------------------
// Docker
// ---------------------------------------------------------------------------

function dockerfile(stack, ctx) {
  const port = ctx.vars.PORT;
  const d = stack.docker || {};
  const cmd = JSON.stringify((d.start || '').split(' ').filter(Boolean));
  switch (stack.runtime) {
    case 'node':
      return `
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
${d.build ? `RUN ${d.build}\n` : ''}ENV PORT=${port}
EXPOSE ${port}
CMD ${cmd}
`;
    case 'php':
      return `
FROM php:8.3-cli
RUN apt-get update && apt-get install -y git unzip libzip-dev \\
 && docker-php-ext-install pdo pdo_mysql zip && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY . .
${fs.existsSync(path.join(ctx.projectDir, 'composer.json')) ? 'RUN composer install --no-dev --optimize-autoloader --no-interaction\n' : ''}EXPOSE ${port}
CMD ${cmd}
`;
    case 'dotnet':
      return `
FROM mcr.microsoft.com/dotnet/sdk:${ctx.major}.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:${ctx.major}.0
WORKDIR /app
COPY --from=build /out .
ENV ASPNETCORE_URLS=http://+:${port}
EXPOSE ${port}
ENTRYPOINT ["dotnet", "${ctx.name}.dll"]
`;
    case 'python':
      return `
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${port}
CMD ${cmd}
`;
    case 'go':
      return `
FROM golang:1-alpine AS build
WORKDIR /src
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app .

FROM alpine:3
COPY --from=build /app /app
COPY --from=build /src/public /public
WORKDIR /
ENV PORT=${port}
EXPOSE ${port}
ENTRYPOINT ["/app"]
`;
    default:
      return null;
  }
}

const DB_SERVICES = {
  mysql: name => `
  db:
    image: mysql:8
    environment:
      MYSQL_DATABASE: ${name}
      MYSQL_ALLOW_EMPTY_PASSWORD: "yes"
    ports: ["3306:3306"]
    volumes: [db-data:/var/lib/mysql]
`,
  postgresql: name => `
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${name}
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: [db-data:/var/lib/postgresql/data]
`,
  mongodb: () => `
  db:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [db-data:/data/db]
`,
  mssql: () => `
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: \${DB_PASSWORD:-Change_me_123}
    ports: ["1433:1433"]
    volumes: [db-data:/var/opt/mssql]
`
};

function applyDocker(stack, ctx) {
  const file = dockerfile(stack, ctx);
  if (!file) return ctx.warn(`Docker: no Dockerfile recipe for runtime '${stack.runtime}'`);
  const { projectDir, vars, database } = ctx;
  write(projectDir, 'Dockerfile', file);
  write(projectDir, '.dockerignore', `
node_modules
vendor
bin
obj
.venv
__pycache__
.git
.env
`);
  const db = DB_SERVICES[database];
  write(projectDir, 'docker-compose.yml', `
services:
  app:
    build: .
    ports: ["${vars.PORT}:${vars.PORT}"]
    env_file:
      - path: .env
        required: false
${db ? '    environment:\n      DB_HOST: db\n    depends_on: [db]\n' : ''}${db ? db(vars.DB_NAME) : ''}${db ? '\nvolumes:\n  db-data:\n' : ''}`);
  ctx.log('Added Dockerfile and docker-compose.yml');
}

// ---------------------------------------------------------------------------
// GitHub Actions
// ---------------------------------------------------------------------------

function ciSteps(stack, ctx) {
  const test = stack.ci?.test;
  switch (stack.runtime) {
    case 'node':
      return `
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm run build --if-present
      - run: ${test || 'npm test --if-present'}`;
    case 'php':
      return `
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
${fs.existsSync(path.join(ctx.projectDir, 'composer.json')) ? '      - run: composer install --no-interaction --prefer-dist\n' : ''}      - run: ${test || 'find . -name "*.php" -not -path "./vendor/*" -print0 | xargs -0 -n1 php -l'}`;
    case 'dotnet':
      return `
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '${ctx.major}.0.x'
      - run: dotnet build
      - run: ${test || 'dotnet test --no-build'}`;
    case 'python':
      return `
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: ${test || 'python -m compileall -q .'}`;
    case 'go':
      return `
      - uses: actions/setup-go@v5
        with:
          go-version: stable
      - run: go vet ./...
      - run: go build ./...
      - run: ${test || 'go test ./...'}`;
    default:
      return null;
  }
}

function applyCi(stack, ctx) {
  const steps = ciSteps(stack, ctx);
  if (!steps) return ctx.warn(`CI: no workflow recipe for runtime '${stack.runtime}'`);
  write(ctx.projectDir, '.github/workflows/ci.yml', `
name: CI

on:
  push:
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4${steps}
`);
  ctx.log('Added GitHub Actions workflow');
}

// ---------------------------------------------------------------------------
// ESLint + Prettier (Node stacks)
// ---------------------------------------------------------------------------

function readPkg(dir) {
  const file = path.join(dir, 'package.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function mergeScripts(dir, scripts) {
  const pkg = readPkg(dir);
  if (!pkg) return;
  pkg.scripts = { ...scripts, ...pkg.scripts }; // never clobber the framework's own scripts
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
}

async function applyLint(stack, ctx, { runCommand }) {
  const { projectDir } = ctx;
  const pkg = readPkg(projectDir);
  if (!pkg) return ctx.warn('ESLint + Prettier: no package.json, skipped');
  const hasEslint = !!(pkg.devDependencies?.eslint || pkg.dependencies?.eslint);

  ctx.log('Adding ESLint + Prettier');
  const deps = ['prettier', 'eslint-config-prettier'];
  if (!hasEslint) deps.push('eslint', '@eslint/js', 'globals');
  await runCommand('npm', ['install', '-D', ...deps], projectDir, ctx.log);

  if (!hasEslint && pkg.type === 'module') {
    write(projectDir, 'eslint.config.js', `
import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['node_modules/', 'dist/'] },
  js.configs.recommended,
  { languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser, ...globals.node } } },
  prettier
];
`);
  } else if (!hasEslint) {
    write(projectDir, 'eslint.config.js', `
const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  { ignores: ['node_modules/', 'dist/', 'public/'] },
  js.configs.recommended,
  { languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: globals.node } },
  prettier
];
`);
  }
  write(projectDir, '.prettierrc', '{\n  "singleQuote": true,\n  "semi": true,\n  "printWidth": 100\n}\n');
  write(projectDir, '.prettierignore', 'node_modules\ndist\n.next\nbuild\n');
  mergeScripts(projectDir, { lint: 'eslint .', format: 'prettier --write .' });
}

// ---------------------------------------------------------------------------
// Prisma (Node stacks)
// ---------------------------------------------------------------------------

const PRISMA_PROVIDERS = { mysql: 'mysql', postgresql: 'postgresql', mssql: 'sqlserver', mongodb: 'mongodb', sqlite: 'sqlite' };

function prismaUrl(database, db) {
  return {
    mysql: `mysql://root:@127.0.0.1:3306/${db}`,
    postgresql: `postgresql://postgres:postgres@127.0.0.1:5432/${db}`,
    mssql: `sqlserver://127.0.0.1:1433;database=${db};user=sa;password=change-me;trustServerCertificate=true`,
    mongodb: `mongodb://127.0.0.1:27017/${db}`,
    sqlite: 'file:./dev.db'
  }[database];
}

async function applyPrisma(stack, ctx, { runCommand }) {
  const provider = PRISMA_PROVIDERS[ctx.database];
  if (!provider) return ctx.warn(`Prisma: database '${ctx.database}' is not supported, skipped`);
  const { projectDir } = ctx;
  ctx.log('Adding Prisma ORM');
  await runCommand('npm', ['install', '-D', 'prisma@6'], projectDir, ctx.log);
  await runCommand('npm', ['install', '@prisma/client@6'], projectDir, ctx.log);
  await runCommand('npx', ['prisma', 'init', '--datasource-provider', provider], projectDir, ctx.log);

  const url = `DATABASE_URL="${prismaUrl(ctx.database, ctx.vars.DB_NAME)}"`;
  for (const f of ['.env', '.env.local']) {
    const file = path.join(projectDir, f);
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, /^DATABASE_URL=.*$/m.test(content) ? content.replace(/^DATABASE_URL=.*$/m, url) : content.replace(/\s*$/, `\n${url}\n`));
  }
  mergeScripts(projectDir, { 'db:migrate': 'prisma migrate dev', 'db:studio': 'prisma studio' });
}

// ---------------------------------------------------------------------------

async function applyExtras(ctx, helpers) {
  const { stack } = ctx;
  for (const extra of ctx.extras || []) {
    try {
      if (extra === 'docker') applyDocker(stack, ctx);
      else if (extra === 'ci') applyCi(stack, ctx);
      else if (extra === 'lint') await applyLint(stack, ctx, helpers);
      else if (extra === 'prisma') await applyPrisma(stack, ctx, helpers);
    } catch (err) {
      ctx.warn(`${EXTRAS[extra].label} failed: ${err.message.split('\n')[0]}`);
    }
  }
}

module.exports = { EXTRAS, supportedExtras, applyExtras, dockerfile };
