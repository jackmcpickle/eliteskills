import { describe, it, expect } from 'vitest';
import {
    resolveContinent,
    resolveCountryCode,
    resolveLocale,
    continentDefaultCurrency,
} from './geo';

describe('resolveContinent', () => {
    it('prefers header over cf object', () => {
        expect(resolveContinent({ continent: 'SA' }, 'EU')).toBe('EU');
    });

    it('falls back to cf object', () => {
        expect(resolveContinent({ continent: 'AS' }, null)).toBe('AS');
    });

    it('defaults to NA', () => {
        expect(resolveContinent(undefined, null)).toBe('NA');
    });
});

describe('resolveCountryCode', () => {
    it('reads header first', () => {
        expect(resolveCountryCode({ country: 'DE' }, 'JP')).toBe('JP');
    });

    it('falls back to cf object', () => {
        expect(resolveCountryCode({ country: 'AU' }, null)).toBe('AU');
    });

    it('returns empty string when missing', () => {
        expect(resolveCountryCode(undefined, null)).toBe('');
    });

    it('uppercases header', () => {
        expect(resolveCountryCode(undefined, 'jp')).toBe('JP');
    });
});

describe('resolveLocale', () => {
    it('JP -> ja-JP', () => {
        expect(resolveLocale('JP')).toBe('ja-JP');
    });

    it('DE -> de-DE', () => {
        expect(resolveLocale('DE')).toBe('de-DE');
    });

    it('AU -> en-AU', () => {
        expect(resolveLocale('AU')).toBe('en-AU');
    });

    it('unknown -> en-US', () => {
        expect(resolveLocale('XX')).toBe('en-US');
    });

    it('empty -> en-US', () => {
        expect(resolveLocale('')).toBe('en-US');
    });
});

describe('continentDefaultCurrency', () => {
    it('EU -> eur', () => {
        expect(continentDefaultCurrency('EU')).toBe('eur');
    });

    it('OC -> aud', () => {
        expect(continentDefaultCurrency('OC')).toBe('aud');
    });

    it('NA -> usd', () => {
        expect(continentDefaultCurrency('NA')).toBe('usd');
    });

    it('AS -> usd', () => {
        expect(continentDefaultCurrency('AS')).toBe('usd');
    });

    it('SA -> usd', () => {
        expect(continentDefaultCurrency('SA')).toBe('usd');
    });
});
