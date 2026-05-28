# @quest-editor/plugin-strategist

AI-powered tactical advisor plugin for the Quest Editor. Provides strategy suggestions for Zargon (the Game Master) in HeroQuest sessions.

## Install

```bash
npm install @quest-editor/plugin-strategist
```

## Usage

```tsx
import { QuestEditor } from '@quest-editor/editor'
import { StrategistPlugin } from '@quest-editor/plugin-strategist'

const plugins = [StrategistPlugin({ language: 'pt' })]

<QuestEditor quest={quest} onChange={setQuest} plugins={plugins} llmProvider={llmProvider} />
```

## Features

- **Board analysis**: Analyzes full quest layout with monster positions
- **Tactical tips**: Suggests ambush points, chokepoint defense, flanking
- **Full rules knowledge**: Combat, spells (Hero + Chaos), traps, armory, line of sight
- **Monster stats**: Uses complete monster stat tables for recommendations

## Peer Dependencies

- `@quest-editor/core` ^0.1.0
- `@quest-editor/editor` ^0.1.0
- `react` ^18.0.0

## License

MIT
