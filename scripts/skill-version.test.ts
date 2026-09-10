import { describe, expect, it } from 'vitest';
import {
    applyBump,
    bumpFor,
    highestBump,
    versionChangedInDiff,
} from './skill-version.ts';

describe('bumpFor', () => {
    it('major on BREAKING CHANGE footer', () => {
        expect(bumpFor('feat: x', 'BREAKING CHANGE: api removed')).toBe(
            'major',
        );
    });
    it('major on BREAKING-CHANGE footer', () => {
        expect(bumpFor('feat: x', 'BREAKING-CHANGE: api removed')).toBe(
            'major',
        );
        expect(bumpFor('fix: x', 'body\n\nBREAKING-CHANGE: api removed')).toBe(
            'major',
        );
    });
    it('major on bang subject', () => {
        expect(bumpFor('feat!: x', '')).toBe('major');
        expect(bumpFor('refactor(web)!: x', '')).toBe('major');
    });
    it('minor on feat', () => {
        expect(bumpFor('feat: x', '')).toBe('minor');
        expect(bumpFor('feat(react): x', '')).toBe('minor');
    });
    it('patch otherwise', () => {
        expect(bumpFor('fix: x', '')).toBe('patch');
        expect(bumpFor('Add elite-merge (#34)', '')).toBe('patch');
        expect(bumpFor('feature: x', '')).toBe('patch');
        expect(bumpFor('fix: x', 'mentions BREAKING CHANGE in prose')).toBe(
            'patch',
        );
    });
});

describe('highestBump', () => {
    it('defaults to patch', () => {
        expect(highestBump([])).toBe('patch');
    });
    it('picks the highest', () => {
        expect(
            highestBump([
                ['fix: a', ''],
                ['feat: b', ''],
                ['docs: c', ''],
            ]),
        ).toBe('minor');
        expect(
            highestBump([
                ['fix: a', ''],
                ['chore: b', 'BREAKING-CHANGE: x'],
            ]),
        ).toBe('major');
    });
});

describe('applyBump', () => {
    it('bumps and resets lower parts', () => {
        expect(applyBump('1.2.3', 'patch')).toBe('1.2.4');
        expect(applyBump('1.2.3', 'minor')).toBe('1.3.0');
        expect(applyBump('1.2.3', 'major')).toBe('2.0.0');
    });
    it('tolerates short versions', () => {
        expect(applyBump('1', 'minor')).toBe('1.1.0');
    });
});

describe('versionChangedInDiff', () => {
    it('detects a manual bump', () => {
        expect(versionChangedInDiff('-version: 1.0.0\n+version: 1.1.0\n')).toBe(
            true,
        );
    });
    it('ignores unrelated changes', () => {
        expect(
            versionChangedInDiff(
                ' version: 1.0.0\n-description: a\n+description: b\n',
            ),
        ).toBe(false);
        expect(versionChangedInDiff('')).toBe(false);
    });
});
