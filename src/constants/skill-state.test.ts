import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname ?? '.', '../..');

function selfTest(rel: string): string {
    return execFileSync('bash', [join(ROOT, rel), 'self-test'], {
        encoding: 'utf8',
        cwd: ROOT,
    });
}

describe('elite-merge state.sh', () => {
    it('rejects merge with HITL, review-bots, pending CI, or stuck polls', () => {
        expect(selfTest('skills/elite-merge/scripts/state.sh')).toContain(
            'self-test ok',
        );
    });
});

describe('elite-validate state.sh', () => {
    it('blocks author/environment before prerequisites and approval', () => {
        expect(selfTest('skills/elite-validate/scripts/state.sh')).toContain(
            'self-test ok',
        );
    });
});
