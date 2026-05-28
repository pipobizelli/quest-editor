# @quest-editor/plugin-remix

AI-powered quest remixing plugin for the Quest Editor. Creates harder variants of HeroQuest quests for replayability, with monster upgrades, repositioning, and layout changes.

## Install

```bash
npm install @quest-editor/plugin-remix
```

## Usage

```tsx
import { QuestEditor } from '@quest-editor/editor'
import { RemixPlugin } from '@quest-editor/plugin-remix'

const plugins = [RemixPlugin({ language: 'pt' })]

<QuestEditor quest={quest} onChange={setQuest} plugins={plugins} llmProvider={llmProvider} />
```

## Features

- **Three difficulty levels**: Hard, Heroic, Legendary
- **Monster upgrades**: Upgrade within family (Living: goblin→orc→fimir→chaos→gargoyle, Undead: skeleton→zombie→mummy)
- **Repositioning**: Move existing monsters/traps to strategic positions
- **Add/Remove**: New monsters, traps, and element removal
- **Selective apply**: Per-change checkboxes — pick which suggestions to apply
- **Subtype normalization**: Handles LLM aliases (chaos_warrior→chaos, falling_block→fallingrock)
- **Tile validation**: Rejects placements on disabled or occupied tiles (including multi-tile furniture)
- **ID fallback**: 3-level matching when LLM returns wrong element IDs

## Peer Dependencies

- `@quest-editor/core` ^0.1.0
- `@quest-editor/editor` ^0.1.0
- `react` ^18.0.0

## License

MIT
