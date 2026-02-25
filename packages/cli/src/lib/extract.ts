import { unzipSync } from 'fflate';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';

const SKIP_FILES = new Set(['.DS_Store', '__MACOSX']);

function shouldSkip(path: string): boolean {
    const parts = path.split('/');
    return parts.some((p) => SKIP_FILES.has(p));
}

export interface ExtractResult {
    fileCount: number;
    dirs: string[];
}

export function extractZip(
    zipData: ArrayBuffer,
    destDir: string,
): ExtractResult {
    const files = unzipSync(new Uint8Array(zipData));
    let fileCount = 0;
    const dirs = new Set<string>();

    for (const [path, data] of Object.entries(files)) {
        if (shouldSkip(path)) continue;

        // Skip directory entries (empty data, path ends with /)
        if (path.endsWith('/') || data.length === 0) continue;

        // Safety: all paths must be within .claude/skills/
        const normalized = normalize(path);
        if (
            normalized.startsWith('..') ||
            (!normalized.startsWith('.claude/skills/') &&
                !normalized.startsWith('.claude\\skills\\'))
        ) {
            throw new Error(
                `Unsafe path in zip: ${path}. Expected paths under .claude/skills/`,
            );
        }

        const fullPath = join(destDir, normalized);
        mkdirSync(dirname(fullPath), { recursive: true });
        writeFileSync(fullPath, data);
        fileCount++;

        // Track top-level skill dirs (.claude/skills/<dir>)
        const parts = normalized.split('/');
        if (parts.length >= 3) {
            dirs.add(parts[2]);
        }
    }

    return { fileCount, dirs: [...dirs] };
}
