import { Rect, Text, Group, Image } from 'react-konva'
import type { QuestElement, BoardConfig } from '@quest-editor/core'
import { useAsset } from '../hooks/useAsset'

const TYPE_COLORS: Record<string, string> = {
  monster: '#e74c3c',
  furniture: '#8b6914',
  door: '#3498db',
  trap: '#e67e22',
  treasure: '#f1c40f',
  hero: '#2ecc71',
  npc: '#1abc9c',
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

  // Door: secret doors render as a full tile block, others render on the edge
  if (element.type === 'door' && element.subtype !== 'secret') {
    return <DoorNode element={element} cellSize={cellSize} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} />
  }

  return <StandardNode element={element} cellSize={cellSize} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} />
}

function StandardNode({
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
  const image = useAsset(element.type, element.subtype)
  const color = TYPE_COLORS[element.type] ?? '#999'
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
      {image ? (
        <SpriteImage
          image={image}
          areaWidth={elWidth}
          areaHeight={elHeight}
          padding={4}
          opacity={element.hidden ? 0.5 : 1}
        />
      ) : (
        <>
          <Rect
            width={elWidth}
            height={elHeight}
            fill={color}
            opacity={element.hidden ? 0.5 : 0.85}
            cornerRadius={4}
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
        </>
      )}
      {isSelected && (
        <Rect
          width={elWidth}
          height={elHeight}
          fill="transparent"
          stroke="#fff"
          strokeWidth={2}
          cornerRadius={4}
          listening={false}
        />
      )}
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
  const image = useAsset('door', element.subtype)
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
      {image ? (
        <Image
          image={image}
          x={offsetX}
          y={offsetY}
          width={isVertical ? doorThickness * 2 : doorLength}
          height={isVertical ? doorLength : doorThickness * 2}
        />
      ) : (
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
      )}
      {isSelected && (
        <Rect
          width={cellSize}
          height={cellSize}
          fill="transparent"
          stroke="#fff"
          strokeWidth={2}
          listening={false}
        />
      )}
    </Group>
  )
}

/**
 * Renders a sprite image centered within an area, maintaining aspect ratio.
 * The sprite fits inside (areaWidth - padding*2) x (areaHeight - padding*2)
 * without stretching.
 */
function SpriteImage({
  image,
  areaWidth,
  areaHeight,
  padding = 4,
  opacity = 1,
}: {
  image: HTMLImageElement
  areaWidth: number
  areaHeight: number
  padding?: number
  opacity?: number
}) {
  const availW = areaWidth - padding * 2
  const availH = areaHeight - padding * 2
  const imgRatio = image.naturalWidth / image.naturalHeight
  const areaRatio = availW / availH

  let drawW: number
  let drawH: number

  if (imgRatio > areaRatio) {
    // Image is wider than area — fit by width
    drawW = availW
    drawH = availW / imgRatio
  } else {
    // Image is taller than area — fit by height
    drawH = availH
    drawW = availH * imgRatio
  }

  const x = padding + (availW - drawW) / 2
  const y = padding + (availH - drawH) / 2

  return (
    <Image
      image={image}
      x={x}
      y={y}
      width={drawW}
      height={drawH}
      opacity={opacity}
      listening={false}
    />
  )
}
