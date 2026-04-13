# Elite Skills

High-quality agent skills for AI coding assistants. Works with Claude Code, Cursor, Codex, OpenCode, and 40+ more agents.

## Install

```sh
npx skills add jackmcpickle/eliteskills
```

## Available Skills

| Skill | Description |
|-------|-------------|
| elite-react | React patterns, hooks, performance, testing |
| elite-backend | Python backend — FastAPI, Django, async patterns |
| elite-style | CSS/design systems, responsive, accessibility |
| elite-review | Architecture review with DDD principles |
| elite-feature | Feature enhancement and discovery |
| elite-bootstrap | App scaffolding with guided discovery |
| elite-testing | Full testing pyramid — unit, integration, e2e, AI evals |
| elite-deploy | Deployment strategies, CI/CD, migrations |

## Install specific skills

```sh
npx skills add jackmcpickle/eliteskills --skill elite-react
npx skills add jackmcpickle/eliteskills --skill elite-testing --skill elite-deploy
```

## What are agent skills?

Agent skills are reusable instruction sets that extend your AI coding assistant's capabilities. They're defined in `SKILL.md` files and loaded by your agent when relevant to your task.

## License

MIT