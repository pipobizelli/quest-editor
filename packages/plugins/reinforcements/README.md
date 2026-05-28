# @quest-editor/plugin-reinforcements

AI-powered reinforcement plugin for the Quest Editor. Suggests additional monster placements to increase HeroQuest quest difficulty.

## Install

```bash
npm install @quest-editor/plugin-reinforcements
```

## Usage

```tsx
import { QuestEditor } from '@quest-editor/editor'
import { ReinforcementsPlugin } from '@quest-editor/plugin-reinforcements'

const plugins = [ReinforcementsPlugin({ language: 'pt' })]

<QuestEditor quest={quest} onChange={setQuest} plugins={plugins} llmProvider={llmProvider} />
```

## Features

- **Monster suggestions**: 3-6 monsters placed in strategic positions
- **Return path blocking**: Prioritizes positions that block the heroes' retreat
- **Subtype validation**: Normalizes LLM output to valid catalog entries
- **Tile validation**: Rejects placements on disabled or occupied tiles
- **Thematic consistency**: Matches the quest's existing monster types

## Peer Dependencies

- `@quest-editor/core` ^0.1.0
- `@quest-editor/editor` ^0.1.0
- `react` ^18.0.0

## License

MIT
