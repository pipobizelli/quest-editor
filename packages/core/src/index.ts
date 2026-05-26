export type {
  Position,
  Orientation,
  ElementType,
  QuestElement,
  BoardConfig,
  Room,
  WallSegment,
  BoardLayout,
  Quest,
} from './types'

export { DEFAULT_BOARD, LAYER_ORDER } from './types'

export {
  createQuest,
  createElement,
  addElement,
  removeElement,
  updateElement,
  moveElement,
  isWithinBoard,
  getElementAt,
} from './quest'

export { serialize, deserialize } from './serialization'

export { HEROQUEST_LAYOUT, deriveWalls } from './board-layout'

export type { CatalogEntry } from './catalog'
export { CATALOG, getCatalogByType, getCatalogEntry } from './catalog'

export { isTileDisabled, toggleTile, toggleTilesRect } from './tiles'

export { normalizeSubtype, isDisabledTile, isOccupiedTile, isTileBlocked } from './validation'

export type { IssueSeverity, QuestIssue } from './validate'
export { validateQuest } from './validate'

export type { RoomGroup } from './rooms'
export { getElementsByRoom, getElementsByRooms, getElementsByAllRooms, roomHasDoor, isRoomValid, isRoomNarratable, getGroupedRooms, isGroupNarratable } from './rooms'

export type { MonsterStats } from './monster-stats'
export { MONSTER_STATS, HERO_STATS, getMonsterStats, formatStatsTable } from './monster-stats'

export {
  RULES_COMBAT,
  RULES_TRAPS,
  RULES_DOORS_LOS,
  RULES_HERO_SPELLS,
  RULES_CHAOS_SPELLS,
  RULES_ARMORY,
  RULES_MONSTER_BEHAVIOR,
  CREATURE_LORE,
  RULES_REMIX_GUIDELINES,
} from './game-rules'
