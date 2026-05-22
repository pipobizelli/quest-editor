import { Rect, Circle, Text, Group, Image } from "react-konva";
import type { QuestElement, BoardConfig } from "@quest-editor/core";
import { getCatalogEntry } from "@quest-editor/core";
import { useAsset } from "../hooks/useAsset";

const TYPE_COLORS: Record<string, string> = {
  hero: "#e74c3c",
  furniture: "#8b6914",
  door: "#3498db",
  trap: "#e67e22",
  treasure: "#f1c40f",
  monster: "#2ecc71",
  npc: "#1abc9c",
  marker: "#9b59b6",
};

interface QuestElementNodeProps {
  element: QuestElement;
  board: BoardConfig;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export function QuestElementNode({
  element,
  board,
  isSelected,
  onSelect,
  onDragEnd,
}: QuestElementNodeProps) {
  const { cellSize } = board;

  // Door: secret doors render as a full tile block, others render on the edge
  if (element.type === "door" && element.subtype !== "secret") {
    return (
      <DoorNode
        element={element}
        cellSize={cellSize}
        isSelected={isSelected}
        onSelect={onSelect}
        onDragEnd={onDragEnd}
      />
    );
  }

  return (
    <StandardNode
      element={element}
      cellSize={cellSize}
      isSelected={isSelected}
      onSelect={onSelect}
      onDragEnd={onDragEnd}
    />
  );
}

function StandardNode({
  element,
  cellSize,
  isSelected,
  onSelect,
  onDragEnd,
}: {
  element: QuestElement;
  cellSize: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}) {
  const image = useAsset(element.type, element.subtype);
  const color = TYPE_COLORS[element.type] ?? "#999";
  const elWidth = (element.width ?? 1) * cellSize;
  const elHeight = (element.height ?? 1) * cellSize;

  return (
    <Group
      x={element.position.x * cellSize}
      y={element.position.y * cellSize}
      draggable
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
      onDragEnd={(e) => {
        const x = Math.round(e.target.x() / cellSize);
        const y = Math.round(e.target.y() / cellSize);
        e.target.x(x * cellSize);
        e.target.y(y * cellSize);
        onDragEnd(element.id, x, y);
      }}
    >
      {/* Hit area — always present so drag works even with listening={false} sprites */}
      <Rect width={elWidth} height={elHeight} fill="transparent" />
      {image ? (
        <SpriteImage
          image={image}
          areaWidth={elWidth}
          areaHeight={elHeight}
          padding={getCatalogEntry(element.type, element.subtype)?.padding ?? 1}
          opacity={element.hidden ? 0.5 : 1}
          rotation={element.orientation === "horizontal" ? 90 : 0}
        />
      ) : element.type === 'marker' ? (
        <>
          <Circle
            x={elWidth / 2}
            y={elHeight / 2}
            radius={Math.min(elWidth, elHeight) / 2 - 2}
            fill={color}
            opacity={element.hidden ? 0.5 : 0.85}
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
  );
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
  element: QuestElement;
  cellSize: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}) {
  const image = useAsset("door", element.subtype);
  const isVertical = element.orientation === "vertical";
  const doorThickness = 6;
  const doorLength = cellSize * 0.7;
  const stripWidth = cellSize * 0.7;

  // The door straddles the edge between two tiles.
  // Vertical: centered on the right edge (x + cellSize)
  // Horizontal: centered on the bottom edge (y + cellSize)

  // Fallback position
  const offsetX = isVertical
    ? cellSize - doorThickness / 2
    : (cellSize - doorLength) / 2;
  const offsetY = isVertical
    ? (cellSize - doorLength) / 2
    : cellSize - doorThickness / 2;

  return (
    <Group
      x={element.position.x * cellSize}
      y={element.position.y * cellSize}
      draggable
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
      onDragEnd={(e) => {
        const x = Math.round(e.target.x() / cellSize);
        const y = Math.round(e.target.y() / cellSize);
        e.target.x(x * cellSize);
        e.target.y(y * cellSize);
        onDragEnd(element.id, x, y);
      }}
    >
      {/* Hit area */}
      <Rect width={cellSize} height={cellSize} fill="transparent" />
      {image ? (
        <Group
          x={cellSize / 2}
          y={cellSize / 2}
          rotation={isVertical ? -90 : 0}
          offsetX={cellSize / 2}
          offsetY={cellSize / 2}
          listening={false}
        >
          {/* Sprite is horizontal by default, placed on the bottom edge.
              For vertical doors, the container rotates -90° moving it to the right edge. */}
          <Group y={cellSize - stripWidth / 2}>
            <SpriteImage
              image={image}
              areaWidth={cellSize}
              areaHeight={stripWidth}
              padding={2}
            />
          </Group>
        </Group>
      ) : (
        <Rect
          x={offsetX}
          y={offsetY}
          width={isVertical ? doorThickness : doorLength}
          height={isVertical ? doorLength : doorThickness}
          fill="#3498db"
          cornerRadius={2}
          stroke={isSelected ? "#fff" : "#2980b9"}
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
  );
}

/**
 * Renders a sprite image centered within an area, maintaining aspect ratio.
 * Supports rotation (rotates around center of area).
 */
function SpriteImage({
  image,
  areaWidth,
  areaHeight,
  padding = 4,
  opacity = 1,
  rotation = 0,
}: {
  image: HTMLImageElement;
  areaWidth: number;
  areaHeight: number;
  padding?: number;
  opacity?: number;
  rotation?: number;
}) {
  const availW = areaWidth - padding * 2;
  const availH = areaHeight - padding * 2;
  const imgRatio = image.naturalWidth / image.naturalHeight;
  const areaRatio = availW / availH;

  let drawW: number;
  let drawH: number;

  if (imgRatio > areaRatio) {
    drawW = availW;
    drawH = availW / imgRatio;
  } else {
    drawH = availH;
    drawW = availH * imgRatio;
  }

  const centerX = areaWidth / 2;
  const centerY = areaHeight / 2;

  return (
    <Group
      x={centerX}
      y={centerY}
      rotation={rotation}
      offsetX={centerX}
      offsetY={centerY}
      listening={false}
    >
      <Image
        image={image}
        x={padding + (availW - drawW) / 2}
        y={padding + (availH - drawH) / 2}
        width={drawW}
        height={drawH}
        opacity={opacity}
        listening={false}
      />
    </Group>
  );
}
