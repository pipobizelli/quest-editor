import { Line, Rect, Text } from 'react-konva'
import type { BoardConfig, BoardLayout, Position } from '@quest-editor/core'
import { useEditorTheme } from '../ThemeContext'

interface GridProps {
  board: BoardConfig
  layout: BoardLayout
  disabledTiles?: Position[]
  dragRect?: { x1: number; y1: number; x2: number; y2: number } | null
  showLabels?: boolean
  showRoomIds?: boolean
}

export function Grid({ board, layout, disabledTiles, dragRect, showLabels = true, showRoomIds = false }: GridProps) {
  const { width, height, cellSize } = board
  const theme = useEditorTheme()
  const gridLines = []
  const wallLines = []
  const roomFills = []

  for (const room of layout.rooms) {
    roomFills.push(
      <Rect
        key={`room-${room.id}`}
        x={room.x * cellSize}
        y={room.y * cellSize}
        width={room.width * cellSize}
        height={room.height * cellSize}
        fill={theme.roomFill}
      />,
    )
    if (showRoomIds) {
      roomFills.push(
        <Text
          key={`roomid-${room.id}`}
          x={room.x * cellSize + 4}
          y={room.y * cellSize + 2}
          text={room.id}
          fontSize={8}
          fill={theme.labelColor}
          opacity={0.5}
        />,
      )
    }
  }

  for (let i = 0; i <= width; i++) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i * cellSize, 0, i * cellSize, height * cellSize]}
        stroke={theme.gridLine}
        strokeWidth={0.5}
      />,
    )
  }
  for (let j = 0; j <= height; j++) {
    gridLines.push(
      <Line
        key={`h-${j}`}
        points={[0, j * cellSize, width * cellSize, j * cellSize]}
        stroke={theme.gridLine}
        strokeWidth={0.5}
      />,
    )
  }

  for (let i = 0; i < layout.walls.length; i++) {
    const wall = layout.walls[i]
    const x = wall.x * cellSize
    const y = wall.y * cellSize

    if (wall.direction === 'horizontal') {
      wallLines.push(
        <Line
          key={`wall-h-${i}`}
          points={[x, y, x + wall.length * cellSize, y]}
          stroke={theme.wallStroke}
          strokeWidth={theme.wallWidth}
          lineCap="round"
        />,
      )
    } else {
      wallLines.push(
        <Line
          key={`wall-v-${i}`}
          points={[x, y, x, y + wall.length * cellSize]}
          stroke={theme.wallStroke}
          strokeWidth={theme.wallWidth}
          lineCap="round"
        />,
      )
    }
  }

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
        fill={theme.labelColor}
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
        fill={theme.labelColor}
      />,
    )
  }

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
          fill={theme.disabledFill}
          opacity={theme.disabledOpacity}
        />,
      )
    }
  }

  const dragRectNode = dragRect ? (
    <Rect
      x={Math.min(dragRect.x1, dragRect.x2) * cellSize}
      y={Math.min(dragRect.y1, dragRect.y2) * cellSize}
      width={(Math.abs(dragRect.x2 - dragRect.x1) + 1) * cellSize}
      height={(Math.abs(dragRect.y2 - dragRect.y1) + 1) * cellSize}
      fill={theme.dragRectFill}
      opacity={0.2}
      stroke={theme.dragRectStroke}
      strokeWidth={1}
    />
  ) : null

  return (
    <>
      {roomFills}
      {gridLines}
      {disabledOverlay}
      {wallLines}
      {showLabels && labels}
      {dragRectNode}
    </>
  )
}
