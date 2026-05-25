# CLAUDE.md

## Project Overview

Quest Editor is a visual HeroQuest dungeon editor built as a React monorepo. It has AI-powered plugins that use LLM prompts enriched with official HeroQuest game rules.

## Commands

```bash
pnpm dev          # Start playground dev server (Vite)
pnpm build        # Build all packages (tsup)
pnpm test         # Run tests in watch mode (Vitest)
pnpm test:run     # Run tests once
```

## Architecture

- **Monorepo**: pnpm workspaces
- **`packages/core`** (`@quest-editor/core`): Pure TypeScript, no UI deps. Types, quest operations, board layout, monster stats, game rules constants.
- **`packages/editor`** (`@quest-editor/editor`): React + Konva canvas, Zustand store, theme system, plugin system.
- **`packages/plugins/*`**: Each plugin has `prompt.ts` (builds LLM prompt), `index.ts` (exports plugin factory), and a `Panel.tsx` (React UI).
- **`apps/playground`**: Vite app that wires everything together for dev/testing.
- **`docs/`**: HeroQuest rules reference in markdown (rules, monsters, spells, armory).

## Key Patterns

- **Immutable quest operations**: All functions in `core/quest.ts` return new Quest objects (no mutation).
- **Element types**: `hero`, `monster`, `npc`, `furniture`, `door`, `trap`, `treasure`, `marker`.
- **Doors**: Use `orientation` (vertical/horizontal) instead of `rotation`. Non-secret doors render on tile edges.
- **Game rules for LLM**: `core/game-rules.ts` exports rules as string constants. Plugins import and inject them into prompts via XML-structured tags.
- **Themes**: `editor/themes.ts` — default is `stone`. Four built-in: dark, stone, parchment, light.
- **Plugin prompts**: Use XML-structured tags (`<quest>`, `<room>`, `<rules>`, `<game_rules>`, etc.) for clear LLM context.

## Known Issues

- DTS build fails for plugins and editor due to `rootDir` cross-package resolution in tsup. ESM builds work fine. This does not affect development (Vite resolves source directly via `"development"` condition in package.json exports).

## Language

- User prefers Brazilian Portuguese for communication and plugin output.
- Plugin language is set via config: `NarratorPlugin({ language: 'pt' })`.
