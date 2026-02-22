const ZERO_DECIMAL = new Set([
    'bif',
    'clp',
    'djf',
    'gnf',
    'jpy',
    'kmf',
    'krw',
    'mga',
    'pyg',
    'rwf',
    'ugx',
    'vnd',
    'vuv',
    'xaf',
    'xof',
    'xpf',
]);

/** Whether a currency uses zero decimal places (e.g. JPY, KRW). */
export function isZeroDecimalCurrency(currency: string): boolean {
    return ZERO_DECIMAL.has(currency.toLowerCase());
}

/** Format price for display using Intl.NumberFormat. */
export function formatMoney(
    amount: number,
    currency: string,
    locale: string = 'en-US',
): string {
    const upper = currency.toUpperCase();
    const maxFrac = isZeroDecimalCurrency(currency) ? 0 : 2;
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: upper,
        minimumFractionDigits: 0,
        maximumFractionDigits: maxFrac,
    }).format(amount);
}
