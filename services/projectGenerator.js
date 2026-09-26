const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { resolveDependencies } = require('./versionResolver');
const { generateThemeCSS, getThemeSwitcherJS } = require('./themeGenerator');
const { generateDynamicStackReadme } = require('./readmeGenerator');
const {
  getSkeletonComponent,
  getSpinnerComponent,
  getModalComponent,
  getOffcanvasComponent,
  getSwalFireComponent,
  getToastrSonnerComponent
} = require('./componentGenerator');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// Escapes user-supplied text before it is interpolated into generated
// HTML/JSX templates, so a malicious appTitle/description/author/logoUrl
// in the generator config can't inject markup into the scaffolded output.
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function copyFolderRecursive(source, target, replaceMap = {}) {
  ensureDir(target);
  const files = fs.readdirSync(source);

  for (const file of files) {
    const srcPath = path.join(source, file);
    const destPath = path.join(target, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyFolderRecursive(srcPath, destPath, replaceMap);
    } else {
      let content = fs.readFileSync(srcPath, 'utf8');
      for (const [key, val] of Object.entries(replaceMap)) {
        content = content.split(key).join(val);
      }
      fs.writeFileSync(destPath, content, 'utf8');
    }
  }
}

/**
 * Universal Database Connection Generator for any backend
 */
function getUniversalDbHelper(backend, database, projectName) {
  if (backend === 'node' || backend === 'nextjs') {
    if (database === 'mongodb') {
      return `
const mongoose = require('mongoose');
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/${projectName}';
  try {
    await mongoose.connect(uri);
    console.log('⚡ Connected to MongoDB (Mongoose)');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
}
module.exports = { connectDB };
`;
    } else if (database === 'mysql') {
      return `
const mysql = require('mysql2/promise');
async function connectDB() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || '${projectName}_db',
      port: parseInt(process.env.DB_PORT || '3306')
    });
    console.log('⚡ Connected to MySQL');
    return pool;
  } catch (err) {
    console.error('❌ MySQL Connection Error:', err.message);
  }
}
module.exports = { connectDB };
`;
    } else if (database === 'mssql') {
      return `
const sql = require('mssql');
const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong@Password',
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || '${projectName}_db',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: { encrypt: false, trustServerCertificate: true }
};
async function connectDB() {
  try {
    const pool = await sql.connect(config);
    console.log('⚡ Connected to MSSQL (SQL Server)');
    return pool;
  } catch (err) {
    console.error('❌ MSSQL Connection Error:', err.message);
  }
}
module.exports = { connectDB, sql };
`;
    }
  }
  return '';
}

/**
 * Universal Project Generator supporting ANY COMBINATION of:
 * - Backend: Raw PHP, Laravel, Node.js Express, Next.js, .NET Core
 * - Frontend / UI: Vue, React, Blade, Vanilla
 * - Database: MySQL, MongoDB, MSSQL
 * - Styling: Tailwind CSS, Bootstrap 5, Vanilla CSS
 * - UI Components: Skeleton, Spinner, Modal, Offcanvas
 * - Themes: Midnight, Emerald, Royal, Crimson & Dark/Light/Device
 */
async function generateProject(config, outputBasePath = null) {
  const projectName = (config.projectName || 'my-app').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const targetDir = outputBasePath 
    ? path.join(outputBasePath, projectName) 
    : path.join(__dirname, '..', 'generated', projectName);

  ensureDir(targetDir);

  const backend = config.backend || config.stack || 'node-express';
  const database = config.database || 'mysql';
  const styling = config.styling || 'tailwind';
  const themeKey = config.theme || 'midnight';
  const colorMode = config.colorMode || 'all';

  const themeCSS = generateThemeCSS(themeKey, colorMode);
  const themeJS = getThemeSwitcherJS();

  // Sanitized copies of user-supplied text, safe to interpolate into HTML/JSX.
  const safeAppTitle = escapeHtml(config.appTitle || projectName);
  const safeDescription = escapeHtml(config.description || 'Enterprise grade multi-combination application');
  const safeAuthor = escapeHtml(config.author || 'ARG RABBI');
  const safeLogoUrl = config.logoUrl ? escapeHtml(config.logoUrl) : '';

  let uiComponents = '';
  if (config.components?.skeleton) uiComponents += getSkeletonComponent(styling) + '\n';
  if (config.components?.spinner) uiComponents += getSpinnerComponent(styling) + '\n';
  if (config.components?.modal) uiComponents += getModalComponent(styling) + '\n';
  if (config.components?.offcanvas) uiComponents += getOffcanvasComponent(styling) + '\n';
  if (config.components?.swalfire) uiComponents += getSwalFireComponent() + '\n';
  if (config.components?.toastr) uiComponents += getToastrSonnerComponent() + '\n';

  const logoHtml = safeLogoUrl
    ? `<img src="${safeLogoUrl}" alt="${safeAppTitle}" style="max-height: 60px; margin: 0 auto 1.5rem auto; display: block;" />`
    : `<div style="width: 56px; height: 56px; border-radius: 14px; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: bold; margin: 0 auto 1.5rem auto;">${escapeHtml((config.projectName || 'B')[0].toUpperCase())}</div>`;

  const stylesheetLink = styling === 'bootstrap'
    ? '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">'
    : styling === 'tailwind'
    ? '<script src="https://cdn.tailwindcss.com"></script>'
    : '';

  const replaceMap = {
    '{{PROJECT_NAME}}': projectName,
    '{{APP_TITLE}}': safeAppTitle,
    '{{APP_DESC}}': safeDescription,
    '{{AUTHOR}}': safeAuthor,
    '{{DB_NAME}}': `${projectName}_db`,
    '{{DB_TYPE}}': database,
    '{{COLOR_MODE}}': colorMode === 'all' || colorMode === 'device' ? 'dark' : colorMode,
    '{{LOGO_HTML}}': logoHtml,
    '{{STYLESHEET_LINK}}': stylesheetLink,
    '{{UI_COMPONENTS}}': uiComponents
  };

  // ==========================================
  // 1. .NET CORE (ANY STYLING: Tailwind / Bootstrap + MSSQL / MySQL)
  // ==========================================
  if (backend === 'dotnet-core' || backend.includes('dotnet')) {
    const srcDir = path.join(__dirname, '..', 'templates', 'dotnet-bootstrap-mssql');
    copyFolderRecursive(srcDir, targetDir, replaceMap);

    const dotnetVer = config.versions?.dotnet || 'net8.0';
    const efCoreVer = dotnetVer === 'net9.0' ? '9.0.*' : '8.0.*';
    const csproj = `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>${dotnetVer}</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>${projectName.replace(/-/g, '_')}</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    ${database === 'mysql' ? `<PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="${efCoreVer}" />` : `<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="${efCoreVer}" />`}
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="${efCoreVer}" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
  </ItemGroup>
</Project>
`;
    fs.writeFileSync(path.join(targetDir, `${projectName}.csproj`), csproj);

    // Dynamic Program.cs with user's selected styling (Tailwind OR Bootstrap)
    const programCs = `
using Microsoft.EntityFrameworkCore;
using DotNetBootstrapMssql.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Database: ${database.toUpperCase()}
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    ${database === 'mysql' 
      ? `var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Server=localhost;Port=3306;Database=${projectName};Uid=root;Pwd=;";
         options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));`
      : `options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection") 
         ?? "Server=localhost,1433;Database=${projectName};User Id=sa;Password=YourStrong@Password;TrustServerCertificate=True;");`
    }
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => Results.Content(@"
<!DOCTYPE html>
<html lang=""en"" data-theme=""${colorMode}"">
<head>
    <meta charset=""utf-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <title>${safeAppTitle}</title>
    ${stylesheetLink}
    <style>${themeCSS}</style>
</head>
<body class=""p-8"">
    <div style=""max-width: 900px; margin: 0 auto; text-align: center;"">
        ${logoHtml}
        <h1 style=""font-size: 2.5rem; font-weight: 800;"">${safeAppTitle}</h1>
        <p style=""color: var(--color-text-muted);"">${config.description ? safeDescription : '.NET Core 8 Web API with ' + styling.toUpperCase() + ' and ' + database.toUpperCase()}</p>
        <p style=""font-size: 0.85rem; color: var(--color-primary); font-weight: bold;"">Developer: ${safeAuthor}</p>
        
        <div style=""margin: 1.5rem 0;"">
            <a href=""/swagger"" style=""padding: 10px 20px; background: var(--color-primary); color: white; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;"">
                Explore Swagger API ↗
            </a>
        </div>

        <div style=""text-align: left; padding: 2rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-base); margin-top: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.15);"">
            <h3 style=""margin-top: 0;"">⚡ Active Architecture:</h3>
            <ul>
                <li><strong>Backend:</strong> .NET Core 8 Web API</li>
                <li><strong>Database Engine:</strong> ${database.toUpperCase()} (EF Core)</li>
                <li><strong>Styling Engine:</strong> ${styling.toUpperCase()}</li>
                <li><strong>Theme:</strong> ${themeKey} (${colorMode})</li>
            </ul>

            <hr style=""border: none; border-top: 1px solid var(--color-border); margin: 1.5rem 0;"" />
            <h4>Dynamic Selected UI Components:</h4>
            ${uiComponents}
        </div>
    </div>
    <script>${themeJS}</script>
</body>
</html>", "text/html"));

app.Run();
`;
    fs.writeFileSync(path.join(targetDir, 'Program.cs'), programCs);
  }

  // ==========================================
  // 2. RAW PHP (ANY DATABASE + ANY STYLING)
  // ==========================================
  else if (backend === 'raw-php') {
    const srcDir = path.join(__dirname, '..', 'templates', 'raw-php-mysql');
    copyFolderRecursive(srcDir, targetDir, replaceMap);
    fs.writeFileSync(path.join(targetDir, 'public', 'css', 'theme.css'), themeCSS);
    fs.writeFileSync(path.join(targetDir, 'public', 'js', 'theme.js'), themeJS);
  }

  // ==========================================
  // 3. LARAVEL (Genuine Full Laravel 11 Structure + Vue 3 / Blade + Artisan + Migrations)
  // ==========================================
  else if (backend === 'laravel' || backend === 'laravel-vue-mysql') {
    const srcDir = path.join(__dirname, '..', 'templates', 'laravel-full');
    copyFolderRecursive(srcDir, targetDir, replaceMap);

    const chosenLaravelVer = config.versions?.laravel || '^11.0';
    const isAuth = config.auth ? config.auth.enabled !== false : true;

    const laravelDeps = {
      "php": "^8.2",
      "laravel/framework": chosenLaravelVer,
      "laravel/tinker": "^2.9",
      "inertiajs/inertia-laravel": "^1.0"
    };

    if (isAuth) {
      laravelDeps["laravel/sanctum"] = "^4.0";
    }

    const composerJson = {
      name: `developer/${projectName}`,
      type: "project",
      description: config.description || `Laravel ${chosenLaravelVer.replace(/[^0-9.]/g, '')} Full Stack Project`,
      keywords: ["framework", "laravel"],
      license: "MIT",
      require: laravelDeps,
      "require-dev": {
        "fakerphp/faker": "^1.23",
        "mockery/mockery": "^1.6",
        "nunomaduro/collision": "^8.0",
        "phpunit/phpunit": "^11.0"
      },
      "autoload": {
        "psr-4": {
          "App\\\\": "app/",
          "Database\\\\Factories\\\\": "database/factories/",
          "Database\\\\Seeders\\\\": "database/seeders/"
        }
      },
      "scripts": {
        "post-autoload-dump": [
          "Illuminate\\\\Foundation\\\\ComposerScripts::postAutoloadDump",
          "@php artisan package:discover --ansi"
        ]
      },
      "config": {
        "optimize-autoloader": true,
        "preferred-install": "dist",
        "sort-packages": true
      }
    };
    fs.writeFileSync(path.join(targetDir, 'composer.json'), JSON.stringify(composerJson, null, 2));

    const vueDeps = await resolveDependencies([
      'vue', 
      '@vitejs/plugin-vue', 
      '@inertiajs/vue3', 
      'laravel-vite-plugin', 
      'vite', 
      'axios'
    ], 'npm');

    if (styling === 'tailwind') {
      Object.assign(vueDeps, await resolveDependencies(['tailwindcss', 'postcss', 'autoprefixer'], 'npm'));
    }

    const pkgJson = {
      private: true,
      type: "module",
      scripts: {
        "dev": "vite",
        "build": "vite build"
      },
      devDependencies: vueDeps
    };
    fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
  }

  // ==========================================
  // 4. NEXT.JS (ANY DATABASE: MongoDB / MSSQL / MySQL + ANY STYLING)
  // ==========================================
  else if (backend === 'nextjs' || backend.includes('nextjs')) {
    const reqPkgs = ['next', 'react', 'react-dom'];
    if (database === 'mongodb') reqPkgs.push('mongoose');
    if (database === 'mysql') reqPkgs.push('mysql2');
    if (database === 'mssql') reqPkgs.push('mssql');
    if (styling === 'tailwind') reqPkgs.push('tailwindcss', 'postcss', 'autoprefixer');
    const chosenNextVer = config.versions?.nextjs || '^14.2.0';
    const isAuth = config.auth ? config.auth.enabled !== false : true;

    if (isAuth) {
      reqPkgs.push('jsonwebtoken', 'bcryptjs');
    }

    const deps = await resolveDependencies(reqPkgs, 'npm');
    deps['next'] = chosenNextVer;
    if (chosenNextVer.startsWith('^15')) {
      deps['react'] = '^19.0.0';
      deps['react-dom'] = '^19.0.0';
    } else {
      deps['react'] = '^18.3.1';
      deps['react-dom'] = '^18.3.1';
    }

    const pkg = {
      name: projectName,
      version: '1.0.0',
      scripts: {
        dev: `next dev -p ${config.port || 3000}`,
        build: "next build",
        start: `next start -p ${config.port || 3000}`
      },
      dependencies: deps
    };
    fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkg, null, 2));

    ensureDir(path.join(targetDir, 'src', 'app', 'api', 'health'));
    ensureDir(path.join(targetDir, 'src', 'styles'));
    ensureDir(path.join(targetDir, 'src', 'lib'));

    fs.writeFileSync(path.join(targetDir, 'src', 'styles', 'theme.css'), themeCSS);
    fs.writeFileSync(path.join(targetDir, 'src', 'lib', 'db.js'), getUniversalDbHelper('nextjs', database, projectName));

    // Next.js Route Handler
    fs.writeFileSync(path.join(targetDir, 'src', 'app', 'api', 'health', 'route.js'), `
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({
    status: 'online',
    stack: 'Next.js App Router',
    database: '${database.toUpperCase()}',
    styling: '${styling}',
    appName: '${config.appTitle || projectName}',
    author: '${config.author || 'ARG RABBI'}'
  });
}
`);

    // Next.js Root Layout
    fs.writeFileSync(path.join(targetDir, 'src', 'app', 'layout.jsx'), `
import '../styles/theme.css';
${styling === 'bootstrap' ? "import 'bootstrap/dist/css/bootstrap.min.css';" : ''}

export const metadata = {
  title: "${config.appTitle || projectName}",
  description: "${config.description || 'Next.js Multi-Stack Application'}"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="${colorMode === 'all' || colorMode === 'device' ? 'dark' : colorMode}">
      <body>{children}</body>
    </html>
  );
}
`);

    // Next.js Home Page
    fs.writeFileSync(path.join(targetDir, 'src', 'app', 'page.jsx'), `
export default function Home() {
  return (
    <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '1rem', textAlign: 'center' }}>
      ${logoHtml}
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>${safeAppTitle}</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>${config.description ? safeDescription : 'Next.js + ' + database.toUpperCase() + ' + ' + styling.toUpperCase()}</p>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--color-surface)', borderRadius: '1rem', textAlign: 'left', border: '1px solid var(--color-border)' }}>
        <h3>🚀 Configured Architecture:</h3>
        <ul>
          <li><strong>Framework:</strong> Next.js (App Router)</li>
          <li><strong>Database Engine:</strong> ${database.toUpperCase()}</li>
          <li><strong>Styling System:</strong> ${styling.toUpperCase()}</li>
          <li><strong>Theme:</strong> ${themeKey}</li>
        </ul>
        <p>Health API: <a href="/api/health" style={{ color: 'var(--color-primary)' }}>/api/health</a></p>
        <hr style={{ borderColor: 'var(--color-border)', margin: '1.5rem 0' }} />
        <h4>Included UI Components:</h4>
        ${uiComponents}
      </div>
    </div>
  );
}
`);
  }

  // ==========================================
  // 5. NODE.JS + EXPRESS (ANY DATABASE + ANY STYLING)
  // ==========================================
  else {
    const reqPkgs = ['express', 'dotenv', 'cors'];
    if (database === 'mongodb') reqPkgs.push('mongoose');
    if (database === 'mysql') reqPkgs.push('mysql2');
    if (database === 'mssql') reqPkgs.push('mssql');

    const chosenExpressVer = config.versions?.nodeExpress || '^5.0.0';
    const isAuth = config.auth ? config.auth.enabled !== false : true;

    if (isAuth) {
      reqPkgs.push('jsonwebtoken', 'bcryptjs');
    }

    const deps = await resolveDependencies(reqPkgs, 'npm');
    deps['express'] = chosenExpressVer;

    const pkg = {
      name: projectName,
      version: '1.0.0',
      description: config.description,
      author: config.author || 'ARG RABBI',
      main: 'src/server.js',
      scripts: {
        start: 'node src/server.js',
        dev: 'node --watch src/server.js'
      },
      dependencies: deps
    };
    fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkg, null, 2));

    ensureDir(path.join(targetDir, 'src'));
    ensureDir(path.join(targetDir, 'public'));

    fs.writeFileSync(path.join(targetDir, 'public', 'theme.css'), themeCSS);
    fs.writeFileSync(path.join(targetDir, 'public', 'theme.js'), themeJS);
    fs.writeFileSync(path.join(targetDir, 'src', 'db.js'), getUniversalDbHelper('node', database, projectName));

    const srv = `
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { connectDB } = require('./db');

const app = express();
const PORT = process.env.PORT || ${config.port || 5000};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

connectDB();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: '${config.appTitle || projectName}',
    database: '${database}',
    styling: '${styling}',
    author: '${config.author || 'ARG RABBI'}'
  });
});

app.listen(PORT, () => {
  console.log(\`⚡ Server listening at http://localhost:\${PORT}\`);
});
`;
    fs.writeFileSync(path.join(targetDir, 'src', 'server.js'), srv);

    const indexHtml = `
<!DOCTYPE html>
<html lang="en" data-theme="${colorMode}">
<head>
  <meta charset="UTF-8">
  <title>${safeAppTitle}</title>
  <link rel="stylesheet" href="/theme.css">
  ${stylesheetLink}
</head>
<body class="p-6">
  <div style="max-width: 850px; margin: 2rem auto; text-align: center;">
    ${logoHtml}
    <h1>${safeAppTitle}</h1>
    <p style="color: var(--color-text-muted);">${config.description ? safeDescription : 'Node.js Express + ' + database.toUpperCase() + ' + ' + styling.toUpperCase()}</p>
    
    <div style="text-align: left; padding: 2rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-base); margin-top: 2rem;">
      <h3>Active Architecture:</h3>
      <ul>
        <li><strong>Backend:</strong> Node.js Express</li>
        <li><strong>Database:</strong> ${database.toUpperCase()}</li>
        <li><strong>Styling:</strong> ${styling.toUpperCase()}</li>
      </ul>
      <hr style="border: none; border-top: 1px solid var(--color-border); margin: 1.5rem 0;" />
      <h4>Components:</h4>
      ${uiComponents}
    </div>
  </div>
  <script src="/theme.js"></script>
</body>
</html>
`;
    fs.writeFileSync(path.join(targetDir, 'public', 'index.html'), indexHtml);
  }

// Common environment and documentation
fs.writeFileSync(path.join(targetDir, '.env.example'), getEnvExample(config, database));
fs.writeFileSync(path.join(targetDir, '.env'), getEnvLocal(config, database));
fs.writeFileSync(path.join(targetDir, 'README.md'), generateDynamicStackReadme(config, backend, database, styling, themeKey, colorMode));

  return {
    success: true,
    projectName,
    path: targetDir,
    combination: `${backend} + ${database} + ${styling}`
  };
}

// .env.example: placeholder values only, safe to commit, never real secrets.
function getEnvExample(config, dbType) {
  return `
PORT=${config.port || 3000}
APP_NAME="${config.appTitle || config.projectName}"
APP_ENV=development

# Database Settings (${dbType.toUpperCase()})
${dbType === 'mongodb' ? `MONGODB_URI=mongodb://127.0.0.1:27017/${config.projectName}` : ''}
${dbType === 'mysql' ? `DB_HOST=127.0.0.1\nDB_PORT=3306\nDB_DATABASE=${config.projectName}\nDB_USERNAME=root\nDB_PASSWORD=change-me` : ''}
${dbType === 'mssql' ? `DB_HOST=127.0.0.1\nDB_PORT=1433\nDB_DATABASE=${config.projectName}\nDB_USERNAME=sa\nDB_PASSWORD=change-me` : ''}
`;
}

// .env: the actual local dev file. Generates a fresh random password/secret per
// project instead of baking in a shared default credential (e.g. MSSQL's
// "YourStrong@Password"), which would otherwise ship identically in every
// scaffolded project.
function getEnvLocal(config, dbType) {
  const randomSecret = () => crypto.randomBytes(16).toString('hex');

  return `
PORT=${config.port || 3000}
APP_NAME="${config.appTitle || config.projectName}"
APP_ENV=development
APP_KEY=${randomSecret()}

# Database Settings (${dbType.toUpperCase()})
${dbType === 'mongodb' ? `MONGODB_URI=mongodb://127.0.0.1:27017/${config.projectName}` : ''}
${dbType === 'mysql' ? `DB_HOST=127.0.0.1\nDB_PORT=3306\nDB_DATABASE=${config.projectName}\nDB_USERNAME=root\nDB_PASSWORD=` : ''}
${dbType === 'mssql' ? `DB_HOST=127.0.0.1\nDB_PORT=1433\nDB_DATABASE=${config.projectName}\nDB_USERNAME=sa\nDB_PASSWORD=${randomSecret()}` : ''}
`;
}

module.exports = {
  generateProject
};
