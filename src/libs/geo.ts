/** Valid continent codes for geo pricing. */
export type Continent = 'NA' | 'SA' | 'EU' | 'AF' | 'AS' | 'OC' | 'AN';

const VALID_CONTINENTS = new Set<string>([
    'NA',
    'SA',
    'EU',
    'AF',
    'AS',
    'OC',
    'AN',
]);

const FALLBACK_CONTINENT: Continent = 'NA';

/**
 * Resolve continent from Cloudflare request headers.
 *
 * Priority:
 * 1. `cf-ipcontinent` header (from "Add visitor location headers" managed transform)
 * 2. `cf.continent` from Workers IncomingRequestCfProperties
 * 3. Fallback: NA
 *
 * Enable "Add visitor location headers" in Cloudflare dashboard:
 * Rules > Transform Rules > Managed Transforms
 */
export function resolveContinent(
    cf: { continent?: string } | undefined,
    continentHeader: string | null,
): Continent {
    // 1. cf-ipcontinent header (preferred — set by Cloudflare Managed Transform)
    if (continentHeader) {
        const code = continentHeader.toUpperCase().trim();
        if (VALID_CONTINENTS.has(code)) return code as Continent;
    }

    // 2. cf object continent (Workers runtime)
    if (cf?.continent && VALID_CONTINENTS.has(cf.continent)) {
        return cf.continent as Continent;
    }

    return FALLBACK_CONTINENT;
}
