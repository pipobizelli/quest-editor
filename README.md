# Quest Editor

A visual board editor for creating and editing HeroQuest dungeon quests. Built as a reusable library that can be embedded in any React application, with AI-powered plugins for narration, tactical analysis, and dynamic reinforcements.

## What it does

Quest Editor provides an interactive grid-based canvas where game masters can design quest layouts by placing and arranging elements on a board. The editor renders the original HeroQuest board with its rooms, corridors, and walls, and allows placing monsters, furniture, traps, doors, heroes, and other elements via drag-and-drop.

Key features:

- **Interactive canvas** with zoom, pan, and drag-and-drop (mouse and touch)
- **Accurate board layout** of the original HeroQuest board with all 23 rooms mapped, including L-shaped rooms
- **AI plugins** — narrator, strategist, and reinforcements powered by any LLM provider
- **HeroQuest rules** — full game rules reference integrated into plugin prompts
- **Themes** — Dark, Stone (default), Parchment, Light
- **Import/Export** quests as JSON files
- **Reusable** — the editor is a standalone React component that can be dropped into any project

## Project structure

```
quest-editor/
├── apps/
│   └── playground/              # Vite dev app for testing the editor
├── packages/
│   ├── core/                    # Game logic, types, catalog, board layout, rules
│   ├── editor/                  # React editor component (Konva canvas + panel)
│   └── plugins/
│       ├── narrator/            # AI narration for room reveals
│       ├── strategist/          # AI tactical advice for Zargon
│       └── reinforcements/      # AI monster placement suggestions
├── docs/                        # HeroQuest rules reference (for humans and LLMs)
│   ├── heroquest-rules.md       # Core rules: turns, combat, movement, traps
│   ├── heroquest-monsters.md    # Monster stats and behavior
│   ├── heroquest-spells.md      # 12 Hero Spells + 12 Chaos Spells
│   └── heroquest-armory.md      # Weapons, armor, items with prices
└── package.json
```

**`@quest-editor/core`** has zero UI dependencies. It exports types, board data, game rules constants, and pure functions for manipulating quests.

**`@quest-editor/editor`** exports the `QuestEditor` React component and the zustand store factory. It depends on `react`, `react-dom`, `react-konva`, `konva`, and `zustand`.

**Plugins** extend the editor with AI-powered panel sections. Each plugin builds structured prompts using HeroQuest rules from core.

## Usage

Install both packages in your project:

```bash
npm install @quest-editor/core @quest-editor/editor konva react-konva zustand
```

Then use the editor component:

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

### With plugins

```bash
npm install @quest-editor/plugin-narrator @quest-editor/plugin-strategist @quest-editor/plugin-reinforcements @quest-editor/plugin-remix
```

```tsx
import { QuestEditor, type LLMProvider } from '@quest-editor/editor'
import { NarratorPlugin } from '@quest-editor/plugin-narrator'
import { StrategistPlugin } from '@quest-editor/plugin-strategist'
import { ReinforcementsPlugin } from '@quest-editor/plugin-reinforcements'

const llmProvider: LLMProvider = {
  generate: async (prompt) => {
    // Call your LLM API here (Gemini, OpenAI, Claude, etc.)
    const response = await callLLM(prompt)
    return response.text
  },
}

const plugins = [
  NarratorPlugin({ language: 'pt' }),
  StrategistPlugin({ language: 'pt' }),
  ReinforcementsPlugin({ language: 'pt' }),
]

<QuestEditor
  quest={quest}
  onChange={setQuest}
  width={800}
  height={600}
  theme="stone"
  plugins={plugins}
  llmProvider={llmProvider}
/>
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

## Plugins

All plugins accept a `language` config (default: `'en'`, supports `'pt'` for Brazilian Portuguese and others).

### Narrator

Generates atmospheric room narrations when a hero opens a door. Uses creature lore for rich monster descriptions and trap awareness for subtle environmental hints (without revealing hidden traps).

### Strategist

Provides tactical advice for Zargon (the Game Master). Analyzes the full board and suggests monster positioning, ambush tactics, chokepoint defense, and spell usage. Has complete knowledge of HeroQuest rules: combat, spells (Hero + Chaos), traps, armory, and line of sight.

### Reinforcements

Suggests additional monster placements to increase quest difficulty. Outputs structured JSON with monster types, grid positions, and tactical reasons. Understands trap synergy and return-path blocking. Validates subtypes and rejects placements on disabled/occupied tiles.

### Remix

Remixes a quest for replayability and increased difficulty. Three levels: Hard, Heroic, Legendary. Can upgrade monsters (within family: living/undead), reposition elements, add/remove monsters and traps, and rearrange layouts. Per-change checkboxes let you pick which suggestions to apply. Integrates undo for safe experimentation.

## Events

The editor emits events for tracking game statistics and session analytics:

```tsx
import { QuestEditor, type EditorEvent } from '@quest-editor/editor'

function handleEvent(event: EditorEvent) {
  switch (event.type) {
    case 'element:removed':
      if (event.element.type === 'monster') {
        console.log(`Monster killed: ${event.element.subtype}`)
      }
      break
    case 'element:moved':
      console.log(`Moved from (${event.from.x},${event.from.y}) to (${event.to.x},${event.to.y})`)
      break
  }
}

<QuestEditor quest={quest} onChange={setQuest} onEvent={handleEvent} />
```

### Event types

| Event | Fields | When |
|---|---|---|
| `element:added` | `element` | Element placed on board |
| `element:removed` | `element` | Element deleted |
| `element:moved` | `element`, `from`, `to` | Element dragged to new position |
| `element:updated` | `element`, `changes` | Element properties changed |
| `element:rotated` | `element` | Element rotated |
| `quest:loaded` | `quest` | Quest loaded, imported, or set by plugin |
| `quest:undo` | `quest` | Undo performed |
| `quest:redo` | `quest` | Redo performed |
| `room:revealed` | `groupId` | Room group revealed in play mode (door click / `revealRoom`) |
| `monster:killed` | `element` | **Play mode**: a selected monster was deleted (Delete/Backspace). Intercept hook — the editor does NOT remove it; the host reacts (e.g. a "who killed it?" modal) and removes via `handle.removeElement(id)` |
| `room:activated` | `groupId` | **Play mode**: a revealed room's floor was clicked — host can open a search menu and call `searchRoom` |
| `search:treasure` | `groupId` | **Play mode**: `searchRoom(groupId, 'treasure')` — abstract (no board element); host resolves from the treasure deck/notes |
| `search:traps` | `groupId`, `found` | **Play mode**: `searchRoom(groupId, 'traps')` revealed any hidden room traps; `found` lists them (empty = none there) |
| `search:secret` | `groupId`, `found` | **Play mode**: `searchRoom(groupId, 'secret')` revealed any hidden secret doors |
| `trap:disarmed` | `element` | **Play mode**: a selected discovered trap was deleted (Delete/Backspace). Intercept hook — host attributes the disarm and removes via `handle.removeElement(id)` |
| `heroes:need-placement` | `count` | **Play mode**: `placeHeroes` found no stairway — host shows a hint; each board click drops the next hero |
| `heroes:placed` | `count` | **Play mode**: the party finished placement (auto around the stairway, or click-to-place) |
| `plugin:event` | `pluginId`, `action`, `data` | Custom event from a plugin |

Plugins can emit custom events via the `emit` function in `PluginPanelProps`:

```tsx
// Inside a plugin panel
emit('narration:generated', { roomId: 'room-1', text: '...' })
// → { type: 'plugin:event', pluginId: 'narrator', action: 'narration:generated', data: { ... } }
```

## Validation

Real-time quest validation in the editor panel. Checks for:

- Missing stairway (error)
- Elements outside board bounds (error)
- Elements on disabled tiles (error)
- Unknown element subtypes (warning)
- Doors without orientation (warning)
- Rooms with content but no connected door (warning)
- Overlapping monsters/heroes/NPCs (warning)

## Game Rules

The `docs/` folder contains the complete HeroQuest rules reference, serving as source of truth for both humans and LLM agents. These rules are also exported as TypeScript string constants from `@quest-editor/core`:

```ts
import {
  RULES_COMBAT,
  RULES_TRAPS,
  RULES_DOORS_LOS,
  RULES_HERO_SPELLS,
  RULES_CHAOS_SPELLS,
  RULES_ARMORY,
  RULES_MONSTER_BEHAVIOR,
  CREATURE_LORE,
} from '@quest-editor/core'
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Cmd+Z` / `Ctrl+Z` | Undo |
| `Cmd+Shift+Z` / `Ctrl+Y` | Redo |
| `R` | Rotate selected/placing element |
| `S` | Switch to Select tool |
| `D` | Switch to Disable tile tool |
| `Delete` / `Backspace` | Delete selected element(s) |
| `Escape` | Cancel current action |

## Themes

Four built-in themes: `dark`, `stone` (default), `parchment`, `light`. Pass a theme name or a custom `EditorTheme` object to the `theme` prop.

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
| Types | TypeScript 5 |
