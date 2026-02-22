import { describe, expect, it } from 'vitest';
import { resolveDownloadZip } from './download';

describe('download zip resolver', () => {
    it('resolves skill product zip and filename', () => {
        const result = resolveDownloadZip('backend');

        expect(result).toEqual({
            zipFile: 'skills-backend.zip',
            fileName: 'elite-skill-backend.zip',
        });
    });

    it('resolves bundle zip and filename for null slug', () => {
        const result = resolveDownloadZip(null);

        expect(result).toEqual({
            zipFile: 'skills-bundle.zip',
            fileName: 'elite-skills.zip',
        });
    });
});
