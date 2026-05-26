export interface Position {
  x: number
  y: number
}

export type Orientation = 'horizontal' | 'vertical'

export type ElementType = 'monster' | 'furniture' | 'door' | 'trap' | 'treasure' | 'hero' | 'npc' | 'marker'

/** Layer order from back to front (lower index = rendered first = behind) */
export const LAYER_ORDER: ElementType[] = [
  'trap',
  'furniture',
  'door',
  'treasure',
  'monster',
  'npc',
  'hero',
  'marker',
]

export interface QuestElement {
  id: string
  type: ElementType
  subtype: string
  position: Position
  width?: number    // in tiles, default 1
  height?: number   // in tiles, default 1
  rotation?: number // degrees (0, 90, 180, 270, -90, etc.), default 0
  orientation?: Orientation // kept for doors (vertical = right edge, horizontal = bottom edge)
  hidden?: boolean
  metadata?: Record<string, unknown>
}

export interface BoardConfig {
  width: number
  height: number
  cellSize: number
}

export interface Room {
  id: string
  group?: string
  x: number
  y: number
  width: number
  height: number
}

export interface WallSegment {
  direction: 'horizontal' | 'vertical'
  x: number
  y: number
  length: number
}

export interface BoardLayout {
  rooms: Room[]
  walls: WallSegment[]
}

export interface Quest {
  id: string
  name: string
  description: string
  board: BoardConfig
  layout: BoardLayout
  elements: QuestElement[]
  disabledTiles?: Position[]
  notes?: string
  narrations?: Record<string, string>
}

export const DEFAULT_BOARD: BoardConfig = {
  width: 26,
  height: 19,
  cellSize: 32,
}
