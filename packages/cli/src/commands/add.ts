import { fetchSkillZip } from '../lib/api.js';
import { extractZip } from '../lib/extract.js';
import { promptToken } from '../lib/prompt.js';
import * as log from '../lib/log.js';

export async function add(skill: string, token?: string): Promise<void> {
    const resolvedToken = token || (await promptToken());
    if (!resolvedToken) {
        log.error('No token provided.');
        process.exit(1);
    }

    log.dim(`Downloading skill "${skill}"...`);

    let zipData: ArrayBuffer;
    try {
        zipData = await fetchSkillZip(resolvedToken, skill);
    } catch (err) {
        log.error((err as Error).message);
        process.exit(1);
    }

    try {
        const { fileCount, dirs } = extractZip(zipData, process.cwd());
        const dirList = dirs.length > 0 ? dirs.join(', ') : skill;
        log.success(`Installed ${dirList} (${fileCount} files) to .claude/skills/`);
    } catch (err) {
        log.error((err as Error).message);
        process.exit(1);
    }
}
