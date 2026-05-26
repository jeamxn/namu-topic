// ANSI codes
const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

const ts = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${c.gray}${hh}:${mm}:${ss}${c.reset}`;
};

const tag = (label: string, color: string) =>
  `${color}${c.bold}[${label}]${c.reset}`;

const pad = (scope: string) => `${c.dim}${scope.padEnd(10)}${c.reset}`;

export const log = {
  info: (scope: string, msg: string) =>
    console.log(`${ts()} ${tag("INFO", c.cyan)}  ${pad(scope)}  ${msg}`),
  ok: (scope: string, msg: string) =>
    console.log(`${ts()} ${tag(" OK ", c.green)}  ${pad(scope)}  ${msg}`),
  warn: (scope: string, msg: string) =>
    console.warn(`${ts()} ${tag("WARN", c.yellow)}  ${pad(scope)}  ${msg}`),
  error: (scope: string, msg: string, err?: unknown) => {
    const detail =
      err instanceof Error
        ? `  ${c.red}${err.message}${c.reset}`
        : err
          ? `  ${c.red}${String(err)}${c.reset}`
          : "";
    console.error(
      `${ts()} ${tag("ERR ", c.red)}  ${pad(scope)}  ${msg}${detail}`,
    );
  },
  step: (scope: string, msg: string) =>
    console.log(`${ts()} ${tag("STEP", c.magenta)}  ${pad(scope)}  ${msg}`),
  metric: (scope: string, msg: string) =>
    console.log(`${ts()} ${tag("STAT", c.blue)}  ${pad(scope)}  ${msg}`),

  divider: (title?: string) => {
    const line = "─".repeat(60);
    if (title) {
      console.log(`\n${c.gray}${line}${c.reset}`);
      console.log(`${c.bold}${c.cyan}  ${title}${c.reset}`);
      console.log(`${c.gray}${line}${c.reset}`);
    } else {
      console.log(`${c.gray}${line}${c.reset}`);
    }
  },

  progress: (scope: string, current: number, total: number, label: string) => {
    const pct = total > 0 ? Math.floor((current / total) * 100) : 0;
    const barLen = 20;
    const filled = total > 0 ? Math.floor((current / total) * barLen) : 0;
    const bar = `${c.green}${"█".repeat(filled)}${c.gray}${"░".repeat(barLen - filled)}${c.reset}`;
    console.log(
      `${ts()} ${tag("PROG", c.magenta)}  ${pad(scope)}  ${bar} ${c.bold}${String(pct).padStart(3)}%${c.reset} (${current}/${total}) ${c.dim}${label}${c.reset}`,
    );
  },
};

export default log;
