# @quest-editor/core

Core data layer for the Quest Editor — a visual HeroQuest dungeon editor.

Zero UI dependencies. Exports types, pure functions, board layout, monster stats, game rules, and validation utilities.

## Install

```bash
npm install @quest-editor/core
```

## Usage

```ts
import {
  createQuest,
  createElement,
  addElement,
  moveElement,
  serialize,
  deserialize,
} from '@quest-editor/core'

const quest = createQuest({ name: 'The Trial' })
const goblin = createElement('monster', 'goblin', 5, 3)
const updated = addElement(quest, goblin)

const json = serialize(updated)
const loaded = deserialize(json)
```

## What's included

- **Types**: `Quest`, `QuestElement`, `Room`, `BoardLayout`, `Position`, etc.
- **Quest operations**: `createQuest`, `addElement`, `removeElement`, `updateElement`, `moveElement`
- **Board layout**: Original HeroQuest board (26x19) with all 23 rooms
- **Monster stats**: `MONSTER_STATS`, `HERO_STATS`, `getMonsterStats`
- **Game rules**: String constants for LLM prompt injection (`RULES_COMBAT`, `RULES_TRAPS`, `CREATURE_LORE`, etc.)
- **Validation**: `validateQuest` (errors/warnings), `normalizeSubtype`, `isTileBlocked`
- **Room utilities**: `getElementsByRoom`, `getGroupedRooms` (L-shaped rooms), `isRoomNarratable`
- **Fog of War**: `revealCorridorTiles` (ray-cast), `getCorridorTiles`, `getStairwayTiles`
- **Serialization**: `serialize` / `deserialize` for JSON import/export

## License

MIT
