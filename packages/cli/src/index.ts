import { find } from './commands/find.js';
import { install } from './commands/install.js';
import * as log from './lib/log.js';

const USAGE = `Usage: eliteskills <command>

Commands:
  find <keyword>            Search the skill catalog
  install <skill> [token]   Install a skill (or start purchase flow)
  add <skill> [token]       Alias for install
  buy <skill>               Alias for install

Examples:
  npx @eliteskills/cli find react
  npx @eliteskills/cli install react
  npx @eliteskills/cli install react abc123def`;

export async function main(argv: string[]): Promise<void> {
    const args = argv.slice(2);
    const command = args[0];

    if (!command || command === '--help' || command === '-h') {
        console.log(USAGE);
        return;
    }

    if (command === 'find') {
        const keyword = args[1];
        await find(keyword);
        return;
    }

    if (command === 'install' || command === 'add' || command === 'buy') {
        const skill = args[1];
        if (!skill) {
            log.error('Missing skill name.');
            console.log(USAGE);
            process.exit(1);
        }
        const token = args[2];
        await install(skill, token);
        return;
    }

    log.error(`Unknown command: ${command}`);
    console.log(USAGE);
    process.exit(1);
}

main(process.argv);
