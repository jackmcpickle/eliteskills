import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './drizzle',
    schema: './src/libs/db/schema.ts',
    dialect: 'sqlite',
});
