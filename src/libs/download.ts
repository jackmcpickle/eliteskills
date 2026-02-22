export interface DownloadZipInfo {
    zipFile: string;
    fileName: string;
}

export function resolveDownloadZip(skillSlug: string | null): DownloadZipInfo {
    if (skillSlug) {
        return {
            zipFile: `skills-${skillSlug}.zip`,
            fileName: `elite-skill-${skillSlug}.zip`,
        };
    }

    return {
        zipFile: 'skills-bundle.zip',
        fileName: 'elite-skills.zip',
    };
}
