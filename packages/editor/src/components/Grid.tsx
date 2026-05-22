import { Line, Rect, Text } from 'react-konva'
import type { BoardConfig, BoardLayout, Position } from '@quest-editor/core'

interface GridProps {
  board: BoardConfig
  layout: BoardLayout
  disabledTiles?: Position[]
  dragRect?: { x1: number; y1: number; x2: number; y2: number } | null
}

export function Grid({ board, layout, disabledTiles, dragRect }: GridProps) {
  const { width, height, cellSize } = board
  const gridLines = []
  const wallLines = []
  const roomFills = []

  // Room fills (lighter background for rooms)
  for (const room of layout.rooms) {
    roomFills.push(
      <Rect
        key={`room-${room.id}`}
        x={room.x * cellSize}
        y={room.y * cellSize}
        width={room.width * cellSize}
        height={room.height * cellSize}
        fill="#2a2a3e"
      />,
    )
  }

  // Grid lines (thin, subtle)
  for (let i = 0; i <= width; i++) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i * cellSize, 0, i * cellSize, height * cellSize]}
        stroke="#333"
        strokeWidth={0.5}
      />,
    )
  }
  for (let j = 0; j <= height; j++) {
    gridLines.push(
      <Line
        key={`h-${j}`}
        points={[0, j * cellSize, width * cellSize, j * cellSize]}
        stroke="#333"
        strokeWidth={0.5}
      />,
    )
  }

  // Walls (thick, prominent)
  const wallStroke = '#c8b06b'
  const wallWidth = 3

  for (let i = 0; i < layout.walls.length; i++) {
    const wall = layout.walls[i]
    const x = wall.x * cellSize
    const y = wall.y * cellSize

    if (wall.direction === 'horizontal') {
      wallLines.push(
        <Line
          key={`wall-h-${i}`}
          points={[x, y, x + wall.length * cellSize, y]}
          stroke={wallStroke}
          strokeWidth={wallWidth}
          lineCap="round"
        />,
      )
    } else {
      wallLines.push(
        <Line
          key={`wall-v-${i}`}
          points={[x, y, x, y + wall.length * cellSize]}
          stroke={wallStroke}
          strokeWidth={wallWidth}
          lineCap="round"
        />,
      )
    }
  }

  // Coordinate labels
  const labels = []
  for (let i = 0; i < width; i++) {
    labels.push(
      <Text
        key={`col-${i}`}
        x={i * cellSize}
        y={-14}
        width={cellSize}
        text={String(i)}
        fontSize={10}
        fill="#666"
        align="center"
      />,
    )
  }
  for (let j = 0; j < height; j++) {
    labels.push(
      <Text
        key={`row-${j}`}
        x={-18}
        y={j * cellSize + cellSize / 2 - 5}
        text={String(j)}
        fontSize={10}
        fill="#666"
      />,
    )
  }

  // Disabled tiles overlay
  const disabledOverlay = []
  if (disabledTiles) {
    for (const tile of disabledTiles) {
      disabledOverlay.push(
        <Rect
          key={`disabled-${tile.x}-${tile.y}`}
          x={tile.x * cellSize}
          y={tile.y * cellSize}
          width={cellSize}
          height={cellSize}
          fill="#000"
          opacity={0.5}
        />,
      )
    }
  }

  // Drag selection rectangle preview
  const dragRectNode = dragRect ? (
    <Rect
      x={Math.min(dragRect.x1, dragRect.x2) * cellSize}
      y={Math.min(dragRect.y1, dragRect.y2) * cellSize}
      width={(Math.abs(dragRect.x2 - dragRect.x1) + 1) * cellSize}
      height={(Math.abs(dragRect.y2 - dragRect.y1) + 1) * cellSize}
      fill="#3498db"
      opacity={0.2}
      stroke="#3498db"
      strokeWidth={1}
    />
  ) : null

  return (
    <>
      {roomFills}
      {gridLines}
      {disabledOverlay}
      {wallLines}
      {labels}
      {dragRectNode}
    </>
  )
}
