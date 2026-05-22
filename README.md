# Quest Editor

A visual board editor for creating and editing HeroQuest-style dungeon quests. Built as a reusable library that can be embedded in any React application.

## What it does

Quest Editor provides an interactive grid-based canvas where game masters can design quest layouts by placing and arranging elements on a board. The editor renders the original HeroQuest board with its rooms, corridors, and walls, and allows placing monsters, furniture, traps, doors, heroes, and other elements via drag-and-drop.

Key features:

- **Interactive canvas** with zoom, pan, and drag-and-drop (mouse and touch)
- **Accurate board layout** of the original HeroQuest board with all 23 rooms mapped, including L-shaped rooms
- **Import/Export** quests as JSON files
- **Reusable** — the editor is a standalone React component that can be dropped into any project

## Project structure

This is a monorepo with three packages:

```
packages/core      → @quest-editor/core     Types, quest logic, board layout, serialization
packages/editor    → @quest-editor/editor   React component (react-konva + zustand)
apps/playground    → playground             Demo app for development and testing
```

**`@quest-editor/core`** has zero UI dependencies. It exports types, board data, and pure functions for manipulating quests. Use it standalone if you only need the data layer.

**`@quest-editor/editor`** exports the `QuestEditor` React component and the zustand store factory. It depends on `react`, `react-dom`, `react-konva`, `konva`, and `zustand`.

## Usage

Install both packages in your project:

```bash
pnpm add @quest-editor/core @quest-editor/editor
```

Then use the editor component:

```tsx
import { useState } from 'react'
import { QuestEditor } from '@quest-editor/editor'
import { createQuest, serialize } from '@quest-editor/core'

function App() {
  const [quest, setQuest] = useState(() => createQuest({ name: 'My Quest' }))

  return (
    <QuestEditor
      quest={quest}
      onChange={setQuest}
      width={800}
      height={600}
    />
  )
}
```

### Working with quest data

```ts
import {
  createQuest,
  createElement,
  addElement,
  removeElement,
  moveElement,
  serialize,
  deserialize,
} from '@quest-editor/core'

// Create a new quest
const quest = createQuest({ name: 'The Trial' })

// Add elements
const goblin = createElement('monster', 'goblin', 5, 3)
const updated = addElement(quest, goblin)

// Move an element
const moved = moveElement(updated, goblin.id, 10, 7)

// Export to JSON
const json = serialize(moved)

// Import from JSON
const loaded = deserialize(json)
```

### Quest JSON format

```json
{
  "id": "a1b2c3d4",
  "name": "The Trial",
  "description": "",
  "board": { "width": 26, "height": 19, "cellSize": 32 },
  "layout": {
    "rooms": [
      { "id": "room-1", "x": 1, "y": 1, "width": 4, "height": 3 }
    ],
    "walls": []
  },
  "elements": [
    { "id": "e1f2g3h4", "type": "monster", "subtype": "goblin", "position": { "x": 5, "y": 3 } }
  ]
}
```

### Board layout

The default board layout matches the original HeroQuest board (26x19 grid). Non-rectangular rooms are supported by grouping multiple rectangles with a shared `group` field — walls between grouped rooms are automatically suppressed.

## Development

Requires Node >= 18 and pnpm.

```bash
pnpm install
pnpm dev          # Start the playground at localhost:5173
pnpm test         # Run tests in watch mode
pnpm test:run     # Run tests once
pnpm build        # Build all packages
```

## Tech stack

| Layer | Tool |
|---|---|
| Monorepo | pnpm workspaces |
| UI | React 18 |
| Canvas | Konva + react-konva |
| State | Zustand |
| Build | Vite (playground), tsup (packages) |
| Tests | Vitest |
