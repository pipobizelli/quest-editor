# @quest-editor/plugin-narrator

AI-powered narration plugin for the Quest Editor. Generates atmospheric room descriptions for the Game Master to read aloud during HeroQuest sessions.

## Install

```bash
npm install @quest-editor/plugin-narrator
```

## Usage

```tsx
import { QuestEditor } from '@quest-editor/editor'
import { NarratorPlugin } from '@quest-editor/plugin-narrator'

const plugins = [NarratorPlugin({ language: 'pt' })]

<QuestEditor quest={quest} onChange={setQuest} plugins={plugins} llmProvider={llmProvider} />
```

## Features

- **Room narrations**: Atmospheric descriptions based on room contents (monsters, furniture, traps)
- **Creature lore**: Rich monster descriptions using HeroQuest lore
- **Tone presets**: Dark Fantasy, Gore, Humorous, Poetic, Suspense, Children-friendly + custom
- **Cross-room context**: Each narration builds on previous ones for a narrative arc
- **Generate All**: Batch generate narrations for all rooms sequentially
- **GM Script export**: Download all narrations as a markdown file
- **Grouped rooms**: L-shaped rooms generate one combined narration
- **Trap awareness**: Subtle atmospheric hints without revealing hidden traps

## Peer Dependencies

- `@quest-editor/core` ^0.1.0
- `@quest-editor/editor` ^0.1.0
- `react` ^18.0.0

## License

MIT
