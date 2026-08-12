# skills.sh first-party posture

## Done in-repo

- Domain well-known discovery at `/.well-known/agent-skills/` (built into `public/` on `pnpm build`)
- Primary install CTA: `npx skills add https://eliteskills.ai`
- GitHub fallback: `npx skills add jackmcpickle/eliteskills`
- README skills.sh badge + dual install instructions

## Manual follow-ups

### 1. Official creators list

Filed: [vercel-labs/skills#1931](https://github.com/vercel-labs/skills/issues/1931)

Open/keep that issue requesting Elite Skills on [skills.sh/official](https://skills.sh/official). There is no self-serve config; Vercel curates that list.

### 2. Product GitHub org

`Eliteskills` is an unrelated dormant GitHub _user_, not ours. Create a product org (e.g. `elite-skills` or `eliteskills-ai`), transfer `jackmcpickle/eliteskills`, then update:

- `SKILLS_GITHUB_SOURCE` in `src/constants/skills-install.ts`
- README badge URL
- Official listing request to point at the new owner/repo

Until then, GitHub installs stay on `jackmcpickle/eliteskills`; domain installs already attribute as first-party via `eliteskills.ai`.
