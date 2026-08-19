import { SKILL_SLUG_TO_DIR } from '@/constants/products';

/** Published skills/ dir for a content slug (`architecture-review` → `elite-review`). */
export function skillDir(contentSlug: string): string {
    return SKILL_SLUG_TO_DIR[contentSlug] ?? `elite-${contentSlug}`;
}

/** Slash command for a content slug (`architecture-review` → `/elite-review`). */
export function skillSlashCommand(contentSlug: string): string {
    return `/${skillDir(contentSlug)}`;
}
