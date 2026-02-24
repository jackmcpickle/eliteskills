/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

import type { Runtime } from '@astrojs/cloudflare';

type CloudflareBindings = {
    DB: D1Database;
};

declare global {
    namespace App {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface Locals extends Runtime<CloudflareBindings> { }
    }
}

export { };
