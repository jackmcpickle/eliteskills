const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

export function success(msg: string): void {
    console.log(`${GREEN}✓${RESET} ${msg}`);
}

export function error(msg: string): void {
    console.error(`${RED}✗${RESET} ${msg}`);
}

export function warn(msg: string): void {
    console.warn(`${YELLOW}!${RESET} ${msg}`);
}

export function dim(msg: string): void {
    console.log(`${DIM}${msg}${RESET}`);
}
