import { Rect, Text, Group } from 'react-konva'
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
        width={cellSize}
        height={cellSize}
        fill={color}
        opacity={element.hidden ? 0.5 : 0.85}
        cornerRadius={4}
        stroke={isSelected ? '#fff' : undefined}
        strokeWidth={isSelected ? 2 : 0}
      />
      <Text
        text={element.subtype.charAt(0).toUpperCase()}
        width={cellSize}
        height={cellSize}
        align="center"
        verticalAlign="middle"
        fontSize={14}
        fill="#fff"
        listening={false}
      />
    </Group>
  )
}
