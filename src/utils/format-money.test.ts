import { describe, it, expect } from 'vitest';
import { formatMoney, isZeroDecimalCurrency } from './format-money';

describe('isZeroDecimalCurrency', () => {
    it('jpy is zero-decimal', () => {
        expect(isZeroDecimalCurrency('jpy')).toBe(true);
        expect(isZeroDecimalCurrency('JPY')).toBe(true);
    });

    it('usd is not zero-decimal', () => {
        expect(isZeroDecimalCurrency('usd')).toBe(false);
    });

    it('eur is not zero-decimal', () => {
        expect(isZeroDecimalCurrency('eur')).toBe(false);
    });

    it('krw is zero-decimal', () => {
        expect(isZeroDecimalCurrency('krw')).toBe(true);
    });
});

describe('formatMoney', () => {
    it('formats USD whole number', () => {
        expect(formatMoney(29, 'usd', 'en-US')).toBe('$29');
    });

    it('formats USD with cents', () => {
        expect(formatMoney(29.99, 'usd', 'en-US')).toBe('$29.99');
    });

    it('formats EUR in de-DE', () => {
        const result = formatMoney(29, 'eur', 'de-DE');
        expect(result).toContain('29');
        expect(result).toContain('€');
    });

    it('formats AUD in en-AU', () => {
        const result = formatMoney(29, 'aud', 'en-AU');
        expect(result).toContain('29');
        expect(result).toContain('$');
    });

    it('formats JPY with no decimals', () => {
        const result = formatMoney(4399, 'jpy', 'ja-JP');
        expect(result).toContain('4,399');
        expect(result).toContain('￥');
        expect(result).not.toContain('.');
    });

    it('formats JPY in en-US locale', () => {
        const result = formatMoney(799, 'jpy', 'en-US');
        expect(result).toContain('799');
        expect(result).toContain('¥');
    });

    it('defaults to en-US locale', () => {
        expect(formatMoney(9, 'usd')).toBe('$9');
    });
});
