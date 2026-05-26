import type { Quest, QuestElement, BoardConfig } from './types'
import { DEFAULT_BOARD } from './types'
import { HEROQUEST_LAYOUT } from './board-layout'

export function createQuest(partial?: Partial<Quest>): Quest {
  return {
    id: partial?.id ?? generateId(),
    name: partial?.name ?? 'Untitled Quest',
    description: partial?.description ?? '',
    board: partial?.board ?? { ...DEFAULT_BOARD },
    layout: partial?.layout ?? HEROQUEST_LAYOUT,
    elements: partial?.elements ?? [],
    disabledTiles: partial?.disabledTiles ?? [],
    notes: partial?.notes,
    narrations: partial?.narrations,
  }
}

export function createElement(
  type: QuestElement['type'],
  subtype: string,
  x: number,
  y: number,
  overrides?: Partial<QuestElement>,
): QuestElement {
  return {
    id: generateId(),
    type,
    subtype,
    position: { x, y },
    ...overrides,
  }
}

export function addElement(quest: Quest, element: QuestElement): Quest {
  return { ...quest, elements: [...quest.elements, element] }
}

export function removeElement(quest: Quest, elementId: string): Quest {
  return {
    ...quest,
    elements: quest.elements.filter((e) => e.id !== elementId),
  }
}

export function updateElement(
  quest: Quest,
  elementId: string,
  updates: Partial<QuestElement>,
): Quest {
  return {
    ...quest,
    elements: quest.elements.map((e) =>
      e.id === elementId ? { ...e, ...updates } : e,
    ),
  }
}

export function moveElement(
  quest: Quest,
  elementId: string,
  x: number,
  y: number,
): Quest {
  return updateElement(quest, elementId, { position: { x, y } })
}

export function isWithinBoard(board: BoardConfig, x: number, y: number): boolean {
  return x >= 0 && x < board.width && y >= 0 && y < board.height
}

export function getElementAt(quest: Quest, x: number, y: number): QuestElement | undefined {
  return quest.elements.find(
    (e) => e.position.x === x && e.position.y === y,
  )
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}
