# @quest-editor/editor

Visual React editor component for the Quest Editor — a HeroQuest dungeon editor.

Provides an interactive canvas with drag-and-drop, zoom, pan, themes, plugin system, undo/redo, lock system, fog of war, and real-time validation.

## Install

```bash
npm install @quest-editor/core @quest-editor/editor react react-dom konva react-konva zustand
```

## Usage

```tsx
import { useState } from 'react'
import { QuestEditor } from '@quest-editor/editor'
import { createQuest } from '@quest-editor/core'

function App() {
  const [quest, setQuest] = useState(() => createQuest({ name: 'My Quest' }))

  return (
    <QuestEditor
      quest={quest}
      onChange={setQuest}
      width={800}
      height={600}
      theme="stone"
    />
  )
}
```

## Features

- **Canvas**: Konva-based grid with drag-and-drop element placement
- **Themes**: Dark, Stone (default), Parchment, Light
- **Undo/Redo**: Cmd+Z / Cmd+Shift+Z with 50-step history
- **Lock system**: `lock()` / `unlock()` API for plugins
- **Fog of War**: Play mode with room reveal via door clicks and corridor ray-cast
- **Validation**: Real-time error/warning panel
- **Events**: `onEvent` callback for tracking element changes, quest loads, room reveals, and the play-mode `monster:killed` / `search:*` / `trap:disarmed` hooks
- **Play-mode hooks**: Clicking a monster fires `monster:killed`; clicking a discovered trap fires `trap:disarmed` (both intercept — the editor does not remove; the host removes via `removeElement`). `searchRoom(groupId, kind)` reveals hidden room traps / secret doors and emits `search:*`
- **Plugin system**: Extensible panel sections via `EditorPlugin` interface
- **Ref API**: `QuestEditorHandle` with `lock`, `unlock`, `undo`, `redo`, `setMode`, `revealRoom`, `getRevealedGroups`, `removeElement`, `searchRoom`

## Peer Dependencies

- `react` ^18.0.0
- `react-dom` ^18.0.0
- `konva` ^9.0.0
- `react-konva` ^18.0.0
- `zustand` ^5.0.0

## License

MIT
