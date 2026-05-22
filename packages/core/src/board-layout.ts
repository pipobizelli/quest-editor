import type { Room, WallSegment, BoardLayout, BoardConfig } from "./types";
import { DEFAULT_BOARD } from "./types";

// Rooms mapped from the original HeroQuest board
// Coordinates: (x, y) is top-left cell of the room, width/height in cells
const HEROQUEST_ROOMS: Room[] = [
  // ── Top Left section ──
  { id: "room-1", x: 1, y: 1, width: 4, height: 3 }, // top-left
  { id: "room-2", x: 5, y: 1, width: 4, height: 3 }, // top second from left
  { id: "room-3", x: 9, y: 1, width: 3, height: 5 }, // top third (tall)
  { id: "room-4", x: 1, y: 4, width: 4, height: 5 }, // left tall under room-1
  { id: "room-5", x: 5, y: 4, width: 4, height: 5 }, // large center-left

  // ── Bottom Left section ──
  { id: "room-6", x: 1, y: 10, width: 4, height: 4 },
  { id: "room-7", x: 5, y: 10, width: 2, height: 3 },
  { id: "room-8", x: 7, y: 10, width: 2, height: 3 },
  { id: "room-9", x: 1, y: 14, width: 4, height: 4 },
  { id: "room-10", x: 5, y: 13, width: 4, height: 5 },
  { id: "room-11", x: 9, y: 13, width: 3, height: 5 },

  // ── Center Room ──
  { id: "room-12", x: 10, y: 7, width: 6, height: 5 },

  // ── Top Right section ──
  { id: "room-13", x: 14, y: 1, width: 3, height: 5 },
  { id: "room-14", x: 17, y: 1, width: 4, height: 4 },
  { id: "room-15", x: 21, y: 1, width: 4, height: 4 },
  { id: "room-16", x: 17, y: 5, width: 4, height: 4 },
  { id: "room-17", x: 21, y: 5, width: 4, height: 4 },

  // ── Bottom Right section ──
  { id: "room-18", x: 14, y: 13, width: 4, height: 5 },

  // ── L Room ──
  { id: "room-19-a", group: "room-L", x: 17, y: 10, width: 4, height: 3 },
  { id: "room-19-b", group: "room-L", x: 18, y: 13, width: 3, height: 1 },

  { id: "room-20", x: 21, y: 10, width: 4, height: 4 },
  { id: "room-21", x: 18, y: 14, width: 3, height: 4 },
  { id: "room-22", x: 21, y: 14, width: 4, height: 4 },
];

/**
 * Derives wall segments from room definitions + outer border.
 * Walls on shared edges between rooms of the same group are suppressed.
 */
export function deriveWalls(
  rooms: Room[],
  board: BoardConfig = DEFAULT_BOARD,
): WallSegment[] {
  // Track individual unit edges.
  // Horizontal edge key: "h:x,y" (from grid point (x,y) to (x+1,y))
  // Vertical edge key: "v:x,y" (from grid point (x,y) to (x,y+1))
  // Each edge maps to the set of groups that claim it.
  const edgeGroups = new Map<string, Set<string>>();

  function addEdge(key: string, group: string) {
    let groups = edgeGroups.get(key);
    if (!groups) {
      groups = new Set();
      edgeGroups.set(key, groups);
    }
    groups.add(group);
  }

  // Collect edges from rooms
  for (const room of rooms) {
    const group = room.group ?? room.id;

    // Top edge: horizontal edges at y=room.y, from x=room.x to x=room.x+room.width
    for (let x = room.x; x < room.x + room.width; x++) {
      addEdge(`h:${x},${room.y}`, group);
    }
    // Bottom edge
    for (let x = room.x; x < room.x + room.width; x++) {
      addEdge(`h:${x},${room.y + room.height}`, group);
    }
    // Left edge: vertical edges at x=room.x, from y=room.y to y=room.y+room.height
    for (let y = room.y; y < room.y + room.height; y++) {
      addEdge(`v:${room.x},${y}`, group);
    }
    // Right edge
    for (let y = room.y; y < room.y + room.height; y++) {
      addEdge(`v:${room.x + room.width},${y}`, group);
    }
  }

  // An edge is a wall if it's claimed by exactly one group
  // (shared edges between same-group rooms are claimed twice by the same group,
  //  but the Set only stores it once, so they still have size 1 — we need a counter)
  const edgeCounts = new Map<string, Map<string, number>>();

  for (const room of rooms) {
    const group = room.group ?? room.id;
    for (let x = room.x; x < room.x + room.width; x++) {
      incEdge(edgeCounts, `h:${x},${room.y}`, group);
      incEdge(edgeCounts, `h:${x},${room.y + room.height}`, group);
    }
    for (let y = room.y; y < room.y + room.height; y++) {
      incEdge(edgeCounts, `v:${room.x},${y}`, group);
      incEdge(edgeCounts, `v:${room.x + room.width},${y}`, group);
    }
  }

  // Collect wall edges: an edge is a wall if NOT claimed 2+ times by the same group
  const wallEdges = new Set<string>();

  for (const [key, groupCounts] of edgeCounts) {
    let suppressed = false;
    for (const [, count] of groupCounts) {
      if (count >= 2) {
        suppressed = true;
        break;
      }
    }
    if (!suppressed) {
      wallEdges.add(key);
    }
  }

  // Convert individual edges into merged wall segments
  const walls: WallSegment[] = [];

  // Outer border
  walls.push({ direction: "horizontal", x: 0, y: 0, length: board.width });
  walls.push({
    direction: "horizontal",
    x: 0,
    y: board.height,
    length: board.width,
  });
  walls.push({ direction: "vertical", x: 0, y: 0, length: board.height });
  walls.push({
    direction: "vertical",
    x: board.width,
    y: 0,
    length: board.height,
  });

  // Merge consecutive horizontal edges into segments
  const hEdges = [...wallEdges].filter((k) => k.startsWith("h:")).sort();
  const visited = new Set<string>();

  for (const edge of hEdges) {
    if (visited.has(edge)) continue;
    visited.add(edge);

    const [xStr, yStr] = edge.slice(2).split(",");
    const startX = parseInt(xStr);
    const y = parseInt(yStr);
    let length = 1;

    // Extend right
    while (
      wallEdges.has(`h:${startX + length},${y}`) &&
      !visited.has(`h:${startX + length},${y}`)
    ) {
      visited.add(`h:${startX + length},${y}`);
      length++;
    }

    walls.push({ direction: "horizontal", x: startX, y, length });
  }

  // Merge consecutive vertical edges into segments
  const vEdges = [...wallEdges].filter((k) => k.startsWith("v:")).sort();
  visited.clear();

  for (const edge of vEdges) {
    if (visited.has(edge)) continue;
    visited.add(edge);

    const [xStr, yStr] = edge.slice(2).split(",");
    const x = parseInt(xStr);
    const startY = parseInt(yStr);
    let length = 1;

    // Extend down
    while (
      wallEdges.has(`v:${x},${startY + length}`) &&
      !visited.has(`v:${x},${startY + length}`)
    ) {
      visited.add(`v:${x},${startY + length}`);
      length++;
    }

    walls.push({ direction: "vertical", x, y: startY, length });
  }

  return walls;
}

function incEdge(
  map: Map<string, Map<string, number>>,
  key: string,
  group: string,
) {
  let groupCounts = map.get(key);
  if (!groupCounts) {
    groupCounts = new Map();
    map.set(key, groupCounts);
  }
  groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
}

export const HEROQUEST_LAYOUT: BoardLayout = {
  rooms: HEROQUEST_ROOMS,
  walls: deriveWalls(HEROQUEST_ROOMS),
};
