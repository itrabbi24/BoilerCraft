const readline = require('readline');

// Terminal UI primitives: colors, banner, boxes, menus, prompts, spinner.
// No dependencies; falls back to plain numbered prompts when not in a TTY.

const isTTY = !!(process.stdin.isTTY && process.stdout.isTTY);
const useColor = !!process.stdout.isTTY && !process.env.NO_COLOR;
const trueColor = useColor && (process.env.COLORTERM === 'truecolor' || process.env.COLORTERM === '24bit' ||
  !!process.env.WT_SESSION || process.env.TERM_PROGRAM === 'vscode' || process.platform === 'win32');

const paint = code => s => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const c = {
  bold: paint(1), dim: paint(2), italic: paint(3),
  red: paint(31), green: paint(32), yellow: paint(33), blue: paint(34), magenta: paint(35), cyan: paint(36), gray: paint(90)
};

function rgb(r, g, b, s) {
  if (!useColor) return s;
  return trueColor ? `\x1b[38;2;${r};${g};${b}m${s}\x1b[0m` : c.cyan(s);
}

function swatch(hex) {
  if (!useColor) return '';
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return trueColor ? `\x1b[48;2;${r};${g};${b}m  \x1b[0m` : '';
}

const stripAnsi = s => String(s).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
const width = s => [...stripAnsi(s)].length;
const columns = () => process.stdout.columns || 80;

// Truncates to a visible width, keeping ANSI styling intact.
function truncate(s, max) {
  if (width(s) <= max) return s;
  let out = '';
  let visible = 0;
  for (const part of String(s).split(/(\x1b\[[0-9;?]*[A-Za-z])/)) {
    if (/^\x1b\[/.test(part)) {
      out += part;
      continue;
    }
    for (const ch of part) {
      if (visible >= max - 1) return out + '…' + (useColor ? '\x1b[0m' : '');
      out += ch;
      visible++;
    }
  }
  return out;
}

// Brand gradient: cyan → blue → violet.
const STOPS = [[34, 211, 238], [59, 130, 246], [139, 92, 246]];
function gradientAt(t) {
  const seg = t < 0.5 ? 0 : 1;
  const local = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const [a, b] = [STOPS[seg], STOPS[seg + 1]];
  return a.map((v, i) => Math.round(v + (b[i] - v) * local));
}
function gradient(text) {
  const chars = [...text];
  return chars.map((ch, i) => (ch === ' ' ? ch : rgb(...gradientAt(chars.length > 1 ? i / (chars.length - 1) : 0), ch))).join('');
}

// "ANSI Shadow" glyphs for the banner.
const GLYPHS = {
  B: ['██████╗ ', '██╔══██╗', '██████╔╝', '██╔══██╗', '██████╔╝', '╚═════╝ '],
  O: [' ██████╗ ', '██╔═══██╗', '██║   ██║', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
  I: ['██╗', '██║', '██║', '██║', '██║', '╚═╝'],
  L: ['██╗     ', '██║     ', '██║     ', '██║     ', '███████╗', '╚══════╝'],
  E: ['███████╗', '██╔════╝', '█████╗  ', '██╔══╝  ', '███████╗', '╚══════╝'],
  R: ['██████╗ ', '██╔══██╗', '██████╔╝', '██╔══██╗', '██║  ██║', '╚═╝  ╚═╝'],
  C: [' ██████╗', '██╔════╝', '██║     ', '██║     ', '╚██████╗', ' ╚═════╝'],
  A: [' █████╗ ', '██╔══██╗', '███████║', '██╔══██║', '██║  ██║', '╚═╝  ╚═╝'],
  F: ['███████╗', '██╔════╝', '█████╗  ', '██╔══╝  ', '██║     ', '╚═╝     '],
  T: ['████████╗', '╚══██╔══╝', '   ██║   ', '   ██║   ', '   ██║   ', '   ╚═╝   ']
};

function banner({ version, tagline, author }) {
  const word = 'BOILERCRAFT';
  const rows = GLYPHS.B.map((_, r) => [...word].map(ch => GLYPHS[ch][r]).join(''));
  const artWidth = width(rows[0]);
  const out = [''];

  if (columns() >= artWidth + 4) {
    for (const row of rows) out.push('  ' + gradient(row));
  } else {
    out.push('  ' + c.bold(gradient('◆ B O I L E R C R A F T')));
  }
  const byline = `${c.dim('by')} ${c.bold(author)}   ${c.gray('·')}   ${c.dim(`v${version}`)}`;
  out.push('');
  out.push(`  ${byline}`);
  out.push(`  ${c.gray(tagline)}`);
  out.push('');
  return out.join('\n');
}

function box(lines, { title, color = c.cyan, padding = 1 } = {}) {
  const maxLine = Math.max(20, columns() - 8 - padding * 2);
  lines = lines.map(l => truncate(l, maxLine));
  const inner = Math.max(...lines.map(width), title ? width(title) + 2 : 0) + padding * 2;
  const pad = ' '.repeat(padding);
  const top = title
    ? `${color('╭─')} ${c.bold(title)} ${color('─'.repeat(Math.max(0, inner - width(title) - 3)) + '╮')}`
    : color(`╭${'─'.repeat(inner)}╮`);
  const body = lines.map(l => `${color('│')}${pad}${l}${' '.repeat(inner - padding * 2 - width(l))}${pad}${color('│')}`);
  return ['  ' + top, ...body.map(b => '  ' + b), '  ' + color(`╰${'─'.repeat(inner)}╯`)].join('\n');
}

function divider(label = '') {
  const w = Math.min(columns() - 4, 72);
  if (!label) return '  ' + c.gray('─'.repeat(w));
  return '  ' + c.gray('── ') + c.bold(label) + ' ' + c.gray('─'.repeat(Math.max(0, w - width(label) - 4)));
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

// Buffered line reader for non-TTY input (piped answers), so answers sent
// ahead of time aren't lost while async work (version lookups) runs.
let queue;
function nextLine() {
  if (!queue) {
    queue = { lines: [], waiters: [], closed: false };
    const rl = readline.createInterface({ input: process.stdin, terminal: false });
    rl.on('line', l => (queue.waiters.length ? queue.waiters.shift()(l) : queue.lines.push(l)));
    rl.on('close', () => {
      queue.closed = true;
      while (queue.waiters.length) queue.waiters.shift()('');
    });
  }
  if (queue.lines.length) return Promise.resolve(queue.lines.shift());
  if (queue.closed) return Promise.resolve(null);
  return new Promise(resolve => queue.waiters.push(resolve));
}

class CancelError extends Error {
  constructor() {
    super('Cancelled');
    this.name = 'CancelError';
  }
}

async function input(question, { initial, validate } = {}) {
  for (;;) {
    const prompt = `  ${c.cyan('?')} ${c.bold(question)}${initial ? c.gray(` (${initial})`) : ''} ${c.gray('›')} `;
    let answer;
    if (isTTY) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      answer = await new Promise(resolve => {
        rl.on('SIGINT', () => {
          rl.close();
          process.stdout.write('\n');
          resolve(null);
        });
        rl.question(prompt, resolve);
      });
      rl.close();
      if (answer === null) throw new CancelError();
    } else {
      process.stdout.write(prompt);
      answer = await nextLine();
      if (answer === null) throw new CancelError();
      process.stdout.write(`${answer}\n`);
    }
    const value = answer.trim() || initial || '';
    const error = validate ? validate(value) : null;
    if (!error) {
      if (isTTY) {
        // Replace the prompt line with a compact answered line.
        process.stdout.write('\x1b[1A\x1b[2K');
        console.log(`  ${c.green('✔')} ${c.bold(question)} ${c.gray('·')} ${c.cyan(value)}`);
      }
      return value;
    }
    console.log(`    ${c.red('✖')} ${c.red(error)}`);
  }
}

/**
 * options: [{ value, label, hint, short, disabled }]
 * Arrow keys / j k / number keys; Enter selects; Esc or Ctrl+C cancels.
 */
async function select(question, options, { initial = 0 } = {}) {
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter(i => i >= 0);
  let index = enabled.includes(initial) ? initial : enabled[0];
  if (!isTTY) return selectPlain(question, options, index);

  return new Promise((resolve, reject) => {
    const out = process.stdout;
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    out.write('\x1b[?25l');

    const header = truncate(`  ${c.cyan('?')} ${c.bold(question)} ${c.gray('· ↑↓ to move, enter to select')}`, columns() - 1);
    const lineFor = (o, i) => {
      const active = i === index;
      const pointer = active ? c.cyan('❯') : ' ';
      const label = o.disabled ? c.gray(o.label) : active ? c.cyan(c.bold(o.label)) : o.label;
      const hint = o.hint ? `  ${c.gray(o.hint)}` : '';
      // Never wrap: a wrapped line would break the redraw (cursor-up count).
      const full = `    ${pointer} ${label}${hint}`;
      const fit = width(full) <= columns() - 1 ? full : truncate(`    ${pointer} ${label}`, columns() - 1);
      return `\x1b[2K${fit}`;
    };
    out.write(header + '\n');
    const render = first => {
      if (!first) out.write(`\x1b[${options.length}A`);
      options.forEach((o, i) => out.write(lineFor(o, i) + '\n'));
    };
    render(true);

    const move = step => {
      const pos = enabled.indexOf(index);
      index = enabled[(pos + step + enabled.length) % enabled.length];
    };
    const finish = () => {
      process.stdin.removeListener('keypress', onKey);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      out.write(`\x1b[${options.length + 1}A\x1b[0J\x1b[?25h`);
    };
    const onKey = (str, key = {}) => {
      if ((key.ctrl && key.name === 'c') || key.name === 'escape') {
        finish();
        return reject(new CancelError());
      }
      if (key.name === 'up' || key.name === 'k') move(-1);
      else if (key.name === 'down' || key.name === 'j' || key.name === 'tab') move(1);
      else if (/^[1-9]$/.test(str || '') && enabled.includes(+str - 1)) index = +str - 1;
      else if (key.name === 'return' || key.name === 'enter') {
        finish();
        const chosen = options[index];
        out.write(`  ${c.green('✔')} ${c.bold(question)} ${c.gray('·')} ${c.cyan(chosen.short || stripAnsi(chosen.label).trim())}\n`);
        return resolve(chosen.value);
      }
      render(false);
    };
    process.stdin.on('keypress', onKey);
  });
}

async function selectPlain(question, options, initial) {
  console.log(`  ${c.cyan('?')} ${c.bold(question)}`);
  options.forEach((o, i) => {
    if (o.disabled) return console.log(c.gray(`     -  ${stripAnsi(o.label)}`));
    console.log(`    ${String(i + 1).padStart(2)}) ${o.label}${o.hint ? c.gray(`  ${o.hint}`) : ''}`);
  });
  for (let attempt = 0; attempt < 5; attempt++) {
    process.stdout.write(`    ${c.gray(`choose [${initial + 1}]:`)} `);
    const answer = await nextLine();
    if (answer === null) throw new CancelError();
    process.stdout.write(`${answer}\n`);
    if (!answer.trim()) return options[initial].value;
    const n = parseInt(answer, 10);
    if (n >= 1 && n <= options.length && !options[n - 1].disabled) return options[n - 1].value;
    console.log(`    ${c.red('✖ Invalid choice')}`);
  }
  throw new CancelError();
}

async function confirm(question, initial = true) {
  return select(question, [
    { value: true, label: 'Yes', short: 'Yes' },
    { value: false, label: 'No', short: 'No' }
  ], { initial: initial ? 0 : 1 });
}

async function spinner(text, fn) {
  if (!isTTY) return fn();
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  process.stdout.write('\x1b[?25l');
  const timer = setInterval(() => process.stdout.write(`\r  ${c.cyan(frames[i++ % frames.length])} ${c.dim(text)}`), 80);
  try {
    return await fn();
  } finally {
    clearInterval(timer);
    process.stdout.write('\r\x1b[2K\x1b[?25h');
  }
}

/**
 * Checklist-style progress: each update() ticks off the previous step and
 * spins on the new one. pause()/resume() let interactive child processes
 * (installers asking for a password) use the terminal in between.
 */
function tasks() {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let current = null;
  let detail = '';
  let timer = null;
  let i = 0;
  const started = Date.now();

  const draw = () => {
    const extra = detail ? `  ${c.gray(detail.length > 60 ? detail.slice(0, 57) + '…' : detail)}` : '';
    process.stdout.write(`\r\x1b[2K  ${c.cyan(frames[i++ % frames.length])} ${current}${extra}`);
  };
  const startTimer = () => {
    if (!isTTY || !current || timer) return;
    process.stdout.write('\x1b[?25l');
    timer = setInterval(draw, 80);
  };
  const stopTimer = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    process.stdout.write('\r\x1b[2K\x1b[?25h');
  };
  const complete = mark => {
    if (!current) return;
    stopTimer();
    console.log(`  ${mark} ${current}`);
    current = null;
    detail = '';
  };

  return {
    update(text) {
      complete(c.green('✔'));
      current = text;
      if (isTTY) startTimer();
    },
    detail(text) {
      detail = text;
    },
    warn(text) {
      const wasRunning = !!timer;
      stopTimer();
      log.warn(text);
      if (wasRunning) startTimer();
    },
    pause: stopTimer,
    resume: startTimer,
    done() {
      complete(c.green('✔'));
      return ((Date.now() - started) / 1000).toFixed(1);
    },
    fail() {
      complete(c.red('✖'));
    }
  };
}

const log = {
  step: msg => console.log(`  ${c.cyan('›')} ${msg}`),
  cmd: msg => console.log(`    ${c.gray(msg)}`),
  ok: msg => console.log(`  ${c.green('✔')} ${msg}`),
  warn: msg => console.log(`  ${c.yellow('▲')} ${c.yellow(msg)}`),
  error: msg => console.log(`  ${c.red('✖')} ${c.red(msg)}`),
  info: msg => console.log(`  ${c.blue('ℹ')} ${msg}`)
};

module.exports = { truncate, c, isTTY, swatch, gradient, banner, box, divider, input, select, confirm, spinner, tasks, log, width, stripAnsi, CancelError };
