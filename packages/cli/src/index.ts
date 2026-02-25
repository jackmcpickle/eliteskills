import { add } from './commands/add.js';
import * as log from './lib/log.js';

const USAGE = `Usage: eliteskills <command>

Commands:
  add <skill> [token]   Install a skill into .claude/skills/

Examples:
  npx @eliteskills/cli add react
  npx @eliteskills/cli add react abc123def`;

export async function main(argv: string[]): Promise<void> {
    const args = argv.slice(2);
    const command = args[0];

    if (!command || command === '--help' || command === '-h') {
        console.log(USAGE);
        return;
    }

    if (command === 'add') {
        const skill = args[1];
        if (!skill) {
            log.error('Missing skill name.');
            console.log(USAGE);
            process.exit(1);
        }
        const token = args[2];
        await add(skill, token);
        return;
    }

    log.error(`Unknown command: ${command}`);
    console.log(USAGE);
    process.exit(1);
}

main(process.argv);
