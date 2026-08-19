# Elite Skills

High-quality agent skills for AI coding assistants. Works with Claude Code, Cursor, Codex, OpenCode, and 40+ more agents.

[![skills.sh](https://skills.sh/b/jackmcpickle/eliteskills)](https://skills.sh/jackmcpickle/eliteskills)

## Install

Domain (first-party well-known):

```sh
npx skills add https://eliteskills.ai
```

GitHub:

```sh
npx skills add jackmcpickle/eliteskills
```

Browse installs on [skills.sh/jackmcpickle/eliteskills](https://skills.sh/jackmcpickle/eliteskills).

## Available Skills

| Skill           | Description                                             |
| --------------- | ------------------------------------------------------- |
| elite-react     | React patterns, hooks, performance, testing             |
| elite-backend   | DTO-boundary domains — layers, Result, data flow        |
| elite-style     | CSS/design systems, responsive, accessibility           |
| elite-review    | Architecture review with DDD principles                 |
| elite-feature   | Feature enhancement and discovery                       |
| elite-bootstrap | App scaffolding with guided discovery                   |
| elite-testing   | Full testing pyramid — unit, integration, e2e, AI evals |
| elite-deploy    | Deployment strategies, CI/CD, migrations                |
| elite-qa        | Manual QA test plans for human testers                  |
| elite-validate  | Playwright e2e, demos, and walkthroughs                 |

## Install specific skills

```sh
npx skills add https://eliteskills.ai --skill elite-react
npx skills add jackmcpickle/eliteskills --skill elite-testing --skill elite-deploy
```

## What are agent skills?

Agent skills are reusable instruction sets that extend your AI coding assistant's capabilities. They're defined in `SKILL.md` files and loaded by your agent when relevant to your task.

## License

MIT
