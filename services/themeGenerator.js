/**
 * Color palettes and Theme configurations
 */
const THEMES = {
  midnight: {
    id: 'midnight',
    name: 'Slate Midnight',
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#090d16',
    surface: '#111827',
    surfaceHover: '#1f2937',
    border: '#1f293d',
    text: '#f8fafc',
    textMuted: '#94a3b8'
  },
  emerald: {
    id: 'emerald',
    name: 'Cyber Emerald',
    primary: '#10b981',
    secondary: '#065f46',
    background: '#04100c',
    surface: '#081c15',
    surfaceHover: '#0f2f24',
    border: '#133a2d',
    text: '#ecfdf5',
    textMuted: '#6ee7b7'
  },
  royal: {
    id: 'royal',
    name: 'Royal Indigo',
    primary: '#6366f1',
    secondary: '#818cf8',
    background: '#0a091a',
    surface: '#12102e',
    surfaceHover: '#1b1945',
    border: '#2a265f',
    text: '#f5f3ff',
    textMuted: '#a5b4fc'
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Amber',
    primary: '#f43f5e',
    secondary: '#fb923c',
    background: '#120508',
    surface: '#1f0b11',
    surfaceHover: '#2e111a',
    border: '#451624',
    text: '#fff1f2',
    textMuted: '#fda4af'
  }
};

/**
 * Returns CSS stylesheet content based on selected theme and mode
 */
function generateThemeCSS(themeKey = 'midnight', colorMode = 'dark') {
  const theme = THEMES[themeKey] || THEMES.midnight;

  return `
/* ==========================================================
   Ultimate Boilerplate Studio Generated Theme
   Theme: ${theme.name} | Default Mode: ${colorMode}
   ========================================================== */
:root {
  --color-primary: ${theme.primary};
  --color-secondary: ${theme.secondary};
  --color-bg: ${colorMode === 'light' ? '#ffffff' : theme.background};
  --color-surface: ${colorMode === 'light' ? '#f8fafc' : theme.surface};
  --color-surface-hover: ${colorMode === 'light' ? '#f1f5f9' : theme.surfaceHover};
  --color-border: ${colorMode === 'light' ? '#e2e8f0' : theme.border};
  --color-text: ${colorMode === 'light' ? '#0f172a' : theme.text};
  --color-text-muted: ${colorMode === 'light' ? '#64748b' : theme.textMuted};
  --color-accent: ${theme.primary};
  --radius-base: 0.75rem;
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] {
  --color-bg: ${theme.background};
  --color-surface: ${theme.surface};
  --color-surface-hover: ${theme.surfaceHover};
  --color-border: ${theme.border};
  --color-text: ${theme.text};
  --color-text-muted: ${theme.textMuted};
}

[data-theme="light"] {
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-surface-hover: #f1f5f9;
  --color-border: #e2e8f0;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  margin: 0;
  padding: 0;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}
`;
}

/**
 * Client Theme switcher runtime helper script
 */
function getThemeSwitcherJS() {
  return `
(function() {
  const STORAGE_KEY = 'ubs-theme-mode';
  const getPreferredMode = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyMode = (mode) => {
    if (mode === 'device' || mode === 'all') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', mode);
    }
    localStorage.setItem(STORAGE_KEY, mode);
  };

  window.ThemeManager = {
    setMode: applyMode,
    getMode: () => localStorage.getItem(STORAGE_KEY) || 'device',
    toggle: () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyMode(current === 'dark' ? 'light' : 'dark');
    }
  };

  applyMode(getPreferredMode());
})();
`;
}

module.exports = {
  THEMES,
  generateThemeCSS,
  getThemeSwitcherJS
};
