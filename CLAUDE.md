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
- **`packages/editor`** (`@quest-editor/editor`): React + Konva canvas, Zustand store, theme system, plugin system, lock system.
- **`packages/plugins/narrator`**: AI narration for room reveals. Uses creature lore and trap awareness.
- **`packages/plugins/strategist`**: AI tactical advice for Zargon. Full rules knowledge (combat, spells, traps, armory).
- **`packages/plugins/reinforcements`**: AI monster placement suggestions. Outputs JSON with positions.
- **`packages/plugins/remix`**: AI quest remixing with difficulty levels. Upgrades monsters, repositions elements, adds/removes content. Has extracted `apply.ts` with pure logic.
- **`apps/playground`**: Vite app for dev/testing. Loads `public/quests/barak_tor.json` as default quest.
- **`docs/`**: HeroQuest rules reference (rules, monsters, spells, armory, remix guidelines).

## Key Patterns

- **Immutable quest operations**: All functions in `core/quest.ts` return new Quest objects (no mutation).
- **Element types**: `hero`, `monster`, `npc`, `furniture`, `door`, `trap`, `treasure`, `marker`.
- **Doors**: Use `orientation` (vertical/horizontal) instead of `rotation`. Non-secret doors render on tile edges.
- **Game rules for LLM**: `core/game-rules.ts` exports rules as string constants. Plugins import and inject them into prompts via XML-structured tags.
- **Themes**: `editor/themes.ts` — default is `stone`. Four built-in: dark, stone, parchment, light.
- **Plugin prompts**: Use XML-structured tags (`<quest>`, `<room>`, `<rules>`, `<game_rules>`, etc.) for clear LLM context.
- **Lock system**: `lock(reason?)` / `unlock()` on store and via `QuestEditorHandle` ref. All mutating actions are guarded. `setQuest` is intentionally NOT guarded so plugins can apply changes. Visual: canvas at 0.45 opacity + SVG spinner.
- **Plugin props**: `PluginPanelProps` includes `quest`, `onUpdateQuest`, `llmProvider`, `lock`, `unlock`, `locked`.

## Remix Plugin Internals

- **apply.ts**: Extracted pure functions — `applyRemix`, `resolveElement`, `normalizeSubtype`, `isTileBlocked`, `createDefaultSelection`.
- **normalizeSubtype**: Maps LLM aliases to valid catalog entries (e.g., `chaos_warrior` → `chaos`, `falling_block` → `fallingrock`). Returns `null` for unknown subtypes.
- **isTileBlocked**: Rejects disabled tiles AND occupied tiles (including multi-tile furniture).
- **resolveElement**: 3-level fallback for when LLM returns wrong IDs: exact ID → subtype+position → position only → subtype only.
- **Monster families**: Living (goblin→orc→fimir→chaos→gargoyle) and Undead (skeleton→zombie→mummy) must never cross in upgrades.
- **Selective apply**: Per-change checkboxes. User can uncheck individual changes before applying.

## Testing

- 119 tests across 10 files. Run with `pnpm test:run`.
- Vitest workspace config includes: `packages/core`, `packages/editor`, and all 4 plugin packages.
- Each plugin has `__tests__/prompt.test.ts`. Remix also has `__tests__/apply.test.ts`.
- Editor has `__tests__/store.test.ts` and `__tests__/lock.test.ts`.

## Known Issues

- DTS build fails for plugins and editor due to `rootDir` cross-package resolution in tsup. ESM builds work fine. This does not affect development (Vite resolves source directly via `"development"` condition in package.json exports).

## Language

- User prefers Brazilian Portuguese for communication and plugin output.
- Plugin language is set via config: `NarratorPlugin({ language: 'pt' })`.
