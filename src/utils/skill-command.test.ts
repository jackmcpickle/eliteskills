import { describe, expect, it } from 'vitest';
import { skillDir, skillSlashCommand } from '@/utils/skill-command';

describe('skillDir', () => {
    it('maps Architecture Review to elite-review', () => {
        expect(skillDir('architecture-review')).toBe('elite-review');
    });

    it('maps Feature Enhancer to elite-feature', () => {
        expect(skillDir('feature-enhancer')).toBe('elite-feature');
    });

    it('maps App Bootstrap to elite-bootstrap', () => {
        expect(skillDir('app-bootstrap')).toBe('elite-bootstrap');
    });

    it('maps Backend python slug to elite-backend', () => {
        expect(skillDir('python')).toBe('elite-backend');
    });

    it('falls back to elite-{slug} for unknown content slugs', () => {
        expect(skillDir('unknown-skill')).toBe('elite-unknown-skill');
    });
});

describe('skillSlashCommand', () => {
    it('uses the published dir, not the display title', () => {
        expect(skillSlashCommand('architecture-review')).toBe('/elite-review');
        expect(skillSlashCommand('feature-enhancer')).toBe('/elite-feature');
        expect(skillSlashCommand('app-bootstrap')).toBe('/elite-bootstrap');
        expect(skillSlashCommand('python')).toBe('/elite-backend');
    });
});
