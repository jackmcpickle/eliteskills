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

// ── Country code ───────────────────────────────────────────────────

/**
 * Resolve ISO 3166-1 alpha-2 country code from Cloudflare headers.
 *
 * Priority:
 * 1. `cf-ipcountry` header (Cloudflare Managed Transform)
 * 2. `cf.country` from Workers IncomingRequestCfProperties
 * 3. Fallback: '' (empty = no country override)
 */
export function resolveCountryCode(
    cf: { country?: string } | undefined,
    countryHeader: string | null,
): string {
    if (countryHeader) return countryHeader.toUpperCase().trim();
    if (cf?.country) return cf.country.toUpperCase();
    return '';
}

// ── Continent -> default currency ──────────────────────────────────

const CONTINENT_CURRENCY: Record<string, string> = {
    EU: 'eur',
    OC: 'aud',
};

/** Default currency for a continent. */
export function continentDefaultCurrency(continent: string): string {
    return CONTINENT_CURRENCY[continent] ?? 'usd';
}

// ── Country -> display locale ──────────────────────────────────────

const COUNTRY_LOCALE: Record<string, string> = {
    JP: 'ja-JP',
    DE: 'de-DE',
    FR: 'fr-FR',
    IT: 'it-IT',
    ES: 'es-ES',
    NL: 'nl-NL',
    PT: 'pt-PT',
    AU: 'en-AU',
    NZ: 'en-NZ',
    GB: 'en-GB',
    US: 'en-US',
    CA: 'en-CA',
    BR: 'pt-BR',
    MX: 'es-MX',
    IN: 'en-IN',
    KR: 'ko-KR',
};

/** Display locale derived from country code. Fallback en-US. */
export function resolveLocale(countryCode: string): string {
    return COUNTRY_LOCALE[countryCode] ?? 'en-US';
}
