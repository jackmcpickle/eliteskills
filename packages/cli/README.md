# @eliteskills/cli

CLI for browsing, purchasing, and installing Elite Skills.

Skills are AI instruction sets that install into `.claude/skills/` and work with any AI coding tool (Claude, Cursor, Copilot, etc.).

## Usage

```
npx @eliteskills/cli <command>
```

### Commands

| Command | Description |
|---|---|
| `find [keyword]` | Search the skill catalog |
| `install <skill> [token]` | Install a skill or start purchase flow |
| `add <skill> [token]` | Alias for `install` |
| `buy <skill>` | Alias for `install` |

## For humans

### Browse available skills

```bash
npx @eliteskills/cli find
npx @eliteskills/cli find react
```

### Purchase and install a skill

If you don't have a token yet, the CLI walks you through purchasing:

```bash
npx @eliteskills/cli install react
# Do you have an install token? (y/n): n
# Enter your name: Jane Doe
# Enter your email: jane@example.com
# ✓ Payment link sent to jane@example.com
# ✓ Open: https://eliteskills.ai/pay?token=...
# After payment, run: npx @eliteskills/cli install react <token>
```

After payment you receive a token via email. Install with:

```bash
npx @eliteskills/cli install react abc123def
# ✓ Installed react (17 files) to .claude/skills/
```

If you already have a token when prompted:

```bash
npx @eliteskills/cli install react
# Do you have an install token? (y/n): y
# Enter your install token: abc123def
# ✓ Installed react (17 files) to .claude/skills/
```

## For LLMs / AI agents

LLMs can drive the CLI non-interactively by always passing the token as an argument (skipping all prompts).

### Step 1 — Discover skills

```bash
npx @eliteskills/cli find react
```

The `find` command queries `GET https://eliteskills.ai/api/cli/skills` and returns matching skills with slug, title, description, highlights, and a `productId`.

### Step 2 — Purchase (if no token)

Use the payment API directly (see `https://eliteskills.ai/llms.txt` for full docs):

1. `POST https://eliteskills.ai/api/cli/payment-session` — returns a `sessionToken` (no API key required)
2. `POST https://eliteskills.ai/api/payment-link` with `Authorization: Bearer <sessionToken>` and `{ productId, name, email }` — returns a `paymentUrl`

Present the `paymentUrl` to the user. After payment they receive an install token via email.

### Step 3 — Install

```bash
npx @eliteskills/cli install react <token>
```

This downloads and extracts the skill zip into `.claude/skills/` in the current directory. No prompts are shown when a token is provided.

### Example: full non-interactive flow

```bash
# Search
npx @eliteskills/cli find react

# Install with known token
npx @eliteskills/cli install react abc123def
```

## Files installed

Skills extract into `.claude/skills/<skill-name>/` relative to the current working directory. Each skill contains instruction files (`.md`) that AI coding tools read automatically.
