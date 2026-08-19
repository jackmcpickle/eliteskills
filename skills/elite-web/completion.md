# Completion Checklist

Run before considering Astro work done:

```bash
pnpm check && pnpm lint && pnpm build
```

Optionally: `pnpm fmt:check`

## Per-Page Verification

For every new or modified page:

- [ ] Wraps in `<BaseLayout>` with unique `title` and `description`
- [ ] Canonical URL set
- [ ] Open Graph tags present
- [ ] JSON-LD appropriate to page type
- [ ] No unused frontmatter variables (astro check clean)

## Per-Module Verification

For every new feature **module**:

- [ ] Lives under `src/modules/{feature}/`
- [ ] Has `index.ts` barrel export
- [ ] Components use consistent section padding and max-width
- [ ] Client scripts use `is:inline` where required

## Deploy Verification

- [ ] `pnpm build` produces `dist/`
- [ ] `wrangler deploy` succeeds (or preview URL accessible)
- [ ] New routes appear in sitemap

**Done when:** all commands green; every modified page passes per-page checklist.
