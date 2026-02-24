export function skillSlug(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '-');
}

export function skillSlashCommand(title: string): string {
    return `/elite-${skillSlug(title)}`;
}
