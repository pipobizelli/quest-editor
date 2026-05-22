import { Rect, Text, Group, Line } from 'react-konva'
import type { QuestElement, BoardConfig } from '@quest-editor/core'

const TYPE_COLORS: Record<string, string> = {
  monster: '#e74c3c',
  furniture: '#8b6914',
  door: '#3498db',
  trap: '#e67e22',
  treasure: '#f1c40f',
  hero: '#2ecc71',
  marker: '#9b59b6',
}

interface QuestElementNodeProps {
  element: QuestElement
  board: BoardConfig
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
}

export function QuestElementNode({
  element,
  board,
  isSelected,
  onSelect,
  onDragEnd,
}: QuestElementNodeProps) {
  const { cellSize } = board
  const color = TYPE_COLORS[element.type] ?? '#999'

  // Door: rendered on the edge between two tiles
  if (element.type === 'door') {
    return <DoorNode element={element} cellSize={cellSize} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} />
  }

  const elWidth = (element.width ?? 1) * cellSize
  const elHeight = (element.height ?? 1) * cellSize

  return (
    <Group
      x={element.position.x * cellSize}
      y={element.position.y * cellSize}
      draggable
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
      onDragEnd={(e) => {
        const x = Math.round(e.target.x() / cellSize)
        const y = Math.round(e.target.y() / cellSize)
        e.target.x(x * cellSize)
        e.target.y(y * cellSize)
        onDragEnd(element.id, x, y)
      }}
    >
      <Rect
        width={elWidth}
        height={elHeight}
        fill={color}
        opacity={element.hidden ? 0.5 : 0.85}
        cornerRadius={4}
        stroke={isSelected ? '#fff' : undefined}
        strokeWidth={isSelected ? 2 : 0}
      />
      <Text
        text={element.subtype.charAt(0).toUpperCase()}
        width={elWidth}
        height={elHeight}
        align="center"
        verticalAlign="middle"
        fontSize={14}
        fill="#fff"
        listening={false}
      />
    </Group>
  )
}

/**
 * Door element — rendered on the boundary between two tiles.
 * Position is the left/top tile. Orientation determines direction:
 * - vertical: door on the right edge of the tile (between x and x+1)
 * - horizontal: door on the bottom edge of the tile (between y and y+1)
 */
function DoorNode({
  element,
  cellSize,
  isSelected,
  onSelect,
  onDragEnd,
}: {
  element: QuestElement
  cellSize: number
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
}) {
  const isVertical = element.orientation === 'vertical'
  const doorThickness = 6
  const doorLength = cellSize * 0.7

  // Position the door on the edge between tiles
  const offsetX = isVertical ? cellSize - doorThickness / 2 : (cellSize - doorLength) / 2
  const offsetY = isVertical ? (cellSize - doorLength) / 2 : cellSize - doorThickness / 2

  return (
    <Group
      x={element.position.x * cellSize}
      y={element.position.y * cellSize}
      draggable
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
      onDragEnd={(e) => {
        const x = Math.round(e.target.x() / cellSize)
        const y = Math.round(e.target.y() / cellSize)
        e.target.x(x * cellSize)
        e.target.y(y * cellSize)
        onDragEnd(element.id, x, y)
      }}
    >
      {/* Hit area (invisible, full tile for easier clicking) */}
      <Rect
        width={cellSize}
        height={cellSize}
        fill="transparent"
      />
      {/* Door visual */}
      <Rect
        x={offsetX}
        y={offsetY}
        width={isVertical ? doorThickness : doorLength}
        height={isVertical ? doorLength : doorThickness}
        fill="#3498db"
        cornerRadius={2}
        stroke={isSelected ? '#fff' : '#2980b9'}
        strokeWidth={isSelected ? 2 : 1}
      />
    </Group>
  )
}
