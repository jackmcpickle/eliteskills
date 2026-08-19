# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.2.1](https://github.com/jackmcpickle/eliteskills/compare/v1.2.0...v1.2.1) (2026-08-19)

## 1.2.0 (2026-08-19)

### Features

- add build-time OG image generation ([c52a1e7](https://github.com/jackmcpickle/eliteskills/commit/c52a1e711ffc244968bd468cc6cf26f826b271fe))
- add discount options ([4e1f056](https://github.com/jackmcpickle/eliteskills/commit/4e1f056475387aaed6a0e0ec1498facacef6ed6a))
- add elite-qa skill to website ([8a05d2e](https://github.com/jackmcpickle/eliteskills/commit/8a05d2ebe8e076113d956fed88b1aead250eef3e))
- add elite-review skill with clean code principles ([6a7a255](https://github.com/jackmcpickle/eliteskills/commit/6a7a255ce1efa96840e961c4c5a72265759b088d))
- add elite-testing and elite-deploy skills ([3aa88fc](https://github.com/jackmcpickle/eliteskills/commit/3aa88fc5bc3c9a99d045410d678aa58506cae3a7))
- add elite-validate Playwright e2e presentation skill ([#28](https://github.com/jackmcpickle/eliteskills/issues/28)) ([cd19628](https://github.com/jackmcpickle/eliteskills/commit/cd19628b5509e0b036f6bfd06c447a65c52f2f4d))
- add page transitions ([835b9b3](https://github.com/jackmcpickle/eliteskills/commit/835b9b34d9056af857c5643cc6251ee07a19a22b))
- **bootstrap:** add app bootstrap skill ([66a0293](https://github.com/jackmcpickle/eliteskills/commit/66a029357c152cfd94820fc03338951e3c162e6f))
- **bootstrap:** release app bootstrap skill page ([3b27547](https://github.com/jackmcpickle/eliteskills/commit/3b27547831bd482767ff11d223f14affae4d7fc3))
- first-party skills.sh domain discovery and install CTAs ([#29](https://github.com/jackmcpickle/eliteskills/issues/29)) ([aacaca7](https://github.com/jackmcpickle/eliteskills/commit/aacaca7926712687cc2a3e5596293f412ec4c345))
- **lint:** add commit linters and checks ([55d929f](https://github.com/jackmcpickle/eliteskills/commit/55d929ffe60c1d765c6bec1a0b8b0e9a89344ab6))
- make skills open source — remove commerce layer, add Vercel skills CLI support ([ecc6246](https://github.com/jackmcpickle/eliteskills/commit/ecc6246522028318d162cdc50f6ad694ae08c2ca))
- rename astro-web to elite-web and add Web skill product ([c997fb0](https://github.com/jackmcpickle/eliteskills/commit/c997fb00a96005490c2cbc465e93ec6a20ce2060))
- update home page styles ([4ac121d](https://github.com/jackmcpickle/eliteskills/commit/4ac121dd999366e6ba9b399ec37a3b0f7346ad48))

### Bug Fixes

- animation ([e2c668c](https://github.com/jackmcpickle/eliteskills/commit/e2c668c57d124d10889aa14353ca935af4883647))
- apply D1 migrations before e2e tests in CI ([b5f5de3](https://github.com/jackmcpickle/eliteskills/commit/b5f5de3f2dcb62882eaa472276688fcc5d8772b6))
- **bootstrap:** make CLAUDE.md generation minimal — commands only ([d51c6f7](https://github.com/jackmcpickle/eliteskills/commit/d51c6f7d7a8a12ca269459d2947351e81948a7be))
- **ci:** drop setup-node registry-url so OIDC can publish ([#33](https://github.com/jackmcpickle/eliteskills/issues/33)) ([d8f44c8](https://github.com/jackmcpickle/eliteskills/commit/d8f44c87d105705c54831bf88f68ed1f95c58ffa))
- **ci:** remove stale test:cli and D1 migration steps ([bbba1e7](https://github.com/jackmcpickle/eliteskills/commit/bbba1e774f1c503cbd79c62bb979bc23a826be7d))
- **ci:** use OIDC for npm publish ([#32](https://github.com/jackmcpickle/eliteskills/issues/32)) ([b31ece8](https://github.com/jackmcpickle/eliteskills/commit/b31ece8bb844f716199753aea4e5c8d0f0a48360))
- e2e tests use correct product IDs and selectors ([03f4a7b](https://github.com/jackmcpickle/eliteskills/commit/03f4a7b35d1a953f8ac5f04f4c01f3623afeba32))
- **e2e:** replace checkout tests with open-source site flows ([68c77c8](https://github.com/jackmcpickle/eliteskills/commit/68c77c883021cd51b15857e3eca4dd18f9d2a600))
- format and type form-submit.ts for CI ([dbfbc0b](https://github.com/jackmcpickle/eliteskills/commit/dbfbc0b3b8b3be13fa804470c356cd5b04536929))
- format neon-fade, skip CI jobs when secrets missing, increase e2e timeout ([0a26b90](https://github.com/jackmcpickle/eliteskills/commit/0a26b902b7aa5dc094291c60995aaf75aeca73dc))
- formatting in e2e test ([f5bdbb3](https://github.com/jackmcpickle/eliteskills/commit/f5bdbb33cb87960700c7a944b5aabbe304354397))
- lint config ([56de897](https://github.com/jackmcpickle/eliteskills/commit/56de8975fb1ad8dbfa385298a3cf27289ae405ff))
- parallelize LLM tests, add report artifact, make non-blocking ([b9be9c3](https://github.com/jackmcpickle/eliteskills/commit/b9be9c3a9bb0dd8ca79d63ee0bfb9f6693ecca7a))
- remove stale update-prices import from BaseLayout ([7b10799](https://github.com/jackmcpickle/eliteskills/commit/7b1079992ce79c74c43354b51c0c3052ed74741a))
- skip CI jobs gracefully when secrets not configured ([f42f1ab](https://github.com/jackmcpickle/eliteskills/commit/f42f1ab4bdf9a3d10a0919e4433a7e673718724f))
- static pages ([81f4bc4](https://github.com/jackmcpickle/eliteskills/commit/81f4bc494b6af572400d6db16c219dd3ff07b110))

## 1.1.0 (2026-02-25)

### Features

- add discount options ([4e1f056](https://github.com/jackmcpickle/eliteskills/commit/4e1f056475387aaed6a0e0ec1498facacef6ed6a))
- add page transitions ([835b9b3](https://github.com/jackmcpickle/eliteskills/commit/835b9b34d9056af857c5643cc6251ee07a19a22b))
- **lint:** add commit linters and checks ([55d929f](https://github.com/jackmcpickle/eliteskills/commit/55d929ffe60c1d765c6bec1a0b8b0e9a89344ab6))
- update home page styles ([4ac121d](https://github.com/jackmcpickle/eliteskills/commit/4ac121dd999366e6ba9b399ec37a3b0f7346ad48))

### Bug Fixes

- animation ([e2c668c](https://github.com/jackmcpickle/eliteskills/commit/e2c668c57d124d10889aa14353ca935af4883647))
- lint config ([56de897](https://github.com/jackmcpickle/eliteskills/commit/56de8975fb1ad8dbfa385298a3cf27289ae405ff))
