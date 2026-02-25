import { formatMoney } from '@/utils/format-money';

interface PriceData {
    locale: string;
    continent: string;
    prices: Record<string, { price: number; currency: string }>;
}

const CACHE_KEY = 'es_prices';
/** 1 hour */
const CACHE_TTL = 3600000;

function getCached(): PriceData | null {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { data: PriceData; ts: number };
        if (Date.now() - parsed.ts > CACHE_TTL) return null;
        return parsed.data;
    } catch {
        return null;
    }
}

function setCache(data: PriceData): void {
    try {
        sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data, ts: Date.now() }),
        );
    } catch {
        /* quota exceeded */
    }
}

function applyPrices(data: PriceData): void {
    document
        .querySelectorAll<HTMLElement>('[data-product-id]')
        .forEach((el) => {
            const id = el.dataset.productId;
            if (!id) return;
            const entry = data.prices[id];
            if (!entry) return;
            el.textContent = formatMoney(
                entry.price,
                entry.currency,
                data.locale,
            );
        });
}

async function loadPrices(): Promise<void> {
    const cached = getCached();
    if (cached) {
        if (cached.continent !== 'NA') applyPrices(cached);
        return;
    }

    try {
        const res = await fetch('/api/prices');
        if (!res.ok) return;
        const data: PriceData = await res.json();
        setCache(data);
        if (data.continent !== 'NA') applyPrices(data);
    } catch {
        /* network error — keep defaults */
    }
}

document.addEventListener('astro:page-load', () => void loadPrices());
