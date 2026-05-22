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
