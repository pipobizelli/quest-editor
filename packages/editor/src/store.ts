import { create } from 'zustand'
import type { Quest, QuestElement, CatalogEntry, Position } from '@quest-editor/core'
import {
  createQuest,
  createElement,
  addElement,
  removeElement,
  updateElement,
  moveElement,
  toggleTile,
  toggleTilesRect,
} from '@quest-editor/core'
import { revealCorridorTiles, getStairwayTiles, parseTileKey, getGroupedRooms, getElementsByRooms, isWithinBoard, isDisabledTile, isOccupiedTile } from '@quest-editor/core'
import type { EventEmitter } from './events'

function normalizeRotation(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function shouldSwapDimensions(rotation: number): boolean {
  const r = normalizeRotation(rotation)
  return r === 90 || r === 270
}

const MAX_HISTORY = 50

export interface HeroToken {
  subtype: string
}

/**
 * Up to `count` free tiles for hero start positions: the stairway's own tiles first
 * (the stairway marker doesn't block heroes), then expanding rings around it. Returns
 * [] when there's no stairway — the caller then falls back to manual click-to-place.
 */
function heroStartTiles(quest: Quest, count: number): Position[] {
  const stair = getStairwayTiles(quest).map((k) => {
    const [x, y] = parseTileKey(k)
    return { x, y }
  })
  if (stair.length === 0) return []
  const minX = Math.min(...stair.map((t) => t.x))
  const maxX = Math.max(...stair.map((t) => t.x))
  const minY = Math.min(...stair.map((t) => t.y))
  const maxY = Math.max(...stair.map((t) => t.y))
  // Stairway tiles are fine to stand on — ignore markers when checking occupancy.
  const blockers = quest.elements.filter((e) => e.type !== 'marker')
  const seen = new Set<string>()
  const out: Position[] = []
  const tryTile = (x: number, y: number) => {
    const key = `${x},${y}`
    if (seen.has(key)) return
    seen.add(key)
    if (!isWithinBoard(quest.board, x, y)) return
    if (isDisabledTile(quest, x, y)) return
    if (isOccupiedTile(blockers, x, y)) return
    out.push({ x, y })
  }
  for (const t of stair) tryTile(t.x, t.y)
  for (let r = 1; out.length < count && r <= 4; r++) {
    for (let x = minX - r; x <= maxX + r; x++) {
      tryTile(x, minY - r)
      tryTile(x, maxY + r)
    }
    for (let y = minY - r; y <= maxY + r; y++) {
      tryTile(minX - r, y)
      tryTile(maxX + r, y)
    }
  }
  return out.slice(0, count)
}

export interface EditorState {
  quest: Quest
  selectedElementId: string | null
  selectedElementIds: string[]
  tool: 'select' | 'place' | 'erase' | 'disable'
  placingEntry: CatalogEntry | null
  placingRotation: number
  dragRect: { x1: number; y1: number; x2: number; y2: number } | null
  locked: boolean
  lockReason: string | null
  mode: 'edit' | 'play'
  revealedGroups: Set<string>
  revealedTiles: Set<string>
  /** Play-mode discovery: ids of room traps & secret doors found via search. */
  discoveredElements: Set<string>
  /** Play-mode: heroes still awaiting manual click-to-place (no stairway). */
  placingHeroes: HeroToken[]
  /** Original party size for the in-progress manual placement (for the heroes:placed count). */
  _placingTotal: number

  // History
  _history: Quest[]
  _future: Quest[]
  canUndo: boolean
  canRedo: boolean

  setQuest: (quest: Quest) => void
  addElement: (element: QuestElement) => void
  removeElement: (id: string) => void
  removeSelected: () => void
  updateElement: (id: string, updates: Partial<QuestElement>) => void
  moveElement: (id: string, x: number, y: number) => void
  selectElement: (id: string | null) => void
  selectElements: (ids: string[]) => void
  setTool: (tool: EditorState['tool']) => void
  startPlacing: (entry: CatalogEntry) => void
  stopPlacing: () => void
  rotatePlacing: () => void
  rotateSelected: () => void
  toggleDisabledTile: (x: number, y: number) => void
  toggleDisabledRect: (x1: number, y1: number, x2: number, y2: number) => void
  setDragRect: (rect: EditorState['dragRect']) => void
  lock: (reason?: string) => void
  unlock: () => void
  undo: () => void
  redo: () => void
  setMode: (mode: 'edit' | 'play') => void
  /** Play-mode hook: emit `monster:killed` without removing. Host resolves the kill and calls removeElement. */
  killMonster: (id: string) => void
  /** Play-mode search: reveal hidden traps/secret doors in a room (or just emit for treasure) and emit the matching `search:*` event. */
  searchRoom: (groupId: string, kind: 'treasure' | 'traps' | 'secret') => void
  /** Play-mode hook: emit `trap:disarmed` for a discovered trap without removing. Host attributes it and calls removeElement. */
  disarmTrap: (id: string) => void
  /** Play-mode: emit `room:activated` for a revealed room (host opens its search menu). */
  activateRoom: (groupId: string) => void
  /** Play-mode: place a party. Auto-places around the stairway, or enters click-to-place when there's none. */
  placeHeroes: (heroes: HeroToken[]) => void
  /** Play-mode: drop the next queued hero at a tile (click-to-place flow). */
  placeNextHeroAt: (x: number, y: number) => void
  revealRoom: (groupId: string) => void
  revealCorridor: (x: number, y: number) => void
  resetFog: () => void
}

/** Push current quest to history and return the new quest + history state */
function pushHistory(s: EditorState, newQuest: Quest): Partial<EditorState> {
  const history = [...s._history, s.quest].slice(-MAX_HISTORY)
  return {
    quest: newQuest,
    _history: history,
    _future: [],
    canUndo: true,
    canRedo: false,
  }
}

export const createEditorStore = (initialQuest?: Partial<Quest>, emit?: EventEmitter) => {
  const emitEvent: EventEmitter = emit ?? (() => {})

  return create<EditorState>((set, get) => ({
    quest: createQuest(initialQuest),
    selectedElementId: null,
    selectedElementIds: [],
    tool: 'select',
    placingEntry: null,
    placingRotation: 0,
    dragRect: null,
    locked: false,
    lockReason: null,
    mode: 'edit',
    revealedGroups: new Set<string>(),
    revealedTiles: new Set<string>(),
    discoveredElements: new Set<string>(),
    placingHeroes: [],
    _placingTotal: 0,
    _history: [],
    _future: [],
    canUndo: false,
    canRedo: false,

    setQuest: (quest) => {
      set((s) => ({
        ...pushHistory(s, quest),
        selectedElementId: null,
        selectedElementIds: [],
      }))
      emitEvent({ type: 'quest:loaded', quest })
    },
    addElement: (element) => {
      const s = get()
      if (s.locked) return
      set((s) => pushHistory(s, addElement(s.quest, element)))
      emitEvent({ type: 'element:added', element })
    },
    removeElement: (id) => {
      const s = get()
      if (s.locked) return
      const el = s.quest.elements.find((e) => e.id === id)
      set((s) => ({
        ...pushHistory(s, removeElement(s.quest, id)),
        selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
        selectedElementIds: s.selectedElementIds.filter((i) => i !== id),
      }))
      if (el) emitEvent({ type: 'element:removed', element: el })
    },
    removeSelected: () => {
      const s = get()
      if (s.locked) return
      const ids = s.selectedElementIds.length > 0
        ? s.selectedElementIds
        : s.selectedElementId ? [s.selectedElementId] : []
      if (ids.length === 0) return
      const removed = ids.map((id) => s.quest.elements.find((e) => e.id === id)).filter(Boolean) as QuestElement[]
      let quest = s.quest
      for (const id of ids) {
        quest = removeElement(quest, id)
      }
      set((s) => ({
        ...pushHistory(s, quest),
        selectedElementId: null,
        selectedElementIds: [],
      }))
      for (const el of removed) {
        emitEvent({ type: 'element:removed', element: el })
      }
    },
    updateElement: (id, updates) => {
      const s = get()
      if (s.locked) return
      const el = s.quest.elements.find((e) => e.id === id)
      set((s) => pushHistory(s, updateElement(s.quest, id, updates)))
      if (el) emitEvent({ type: 'element:updated', element: el, changes: updates })
    },
    moveElement: (id, x, y) => {
      const s = get()
      if (s.locked) return
      const el = s.quest.elements.find((e) => e.id === id)
      set((s) => pushHistory(s, moveElement(s.quest, id, x, y)))
      if (el) emitEvent({ type: 'element:moved', element: el, from: { ...el.position }, to: { x, y } })
    },
    selectElement: (id) =>
      set((s) => {
        if (s.locked) return s
        return { selectedElementId: id, selectedElementIds: id ? [id] : [] }
      }),
    selectElements: (ids) =>
      set((s) => {
        if (s.locked) return s
        return {
          selectedElementIds: ids,
          selectedElementId: ids.length === 1 ? ids[0] : null,
        }
      }),
    setTool: (tool) =>
      set((s) => {
        if (s.locked) return s
        return {
          tool,
          placingEntry: tool !== 'place' ? null : undefined as any,
          selectedElementId: null,
          selectedElementIds: [],
          dragRect: null,
        }
      }),
    startPlacing: (entry) =>
      set((s) => {
        if (s.locked) return s
        return {
          tool: 'place', placingEntry: entry, placingRotation: 0,
          selectedElementId: null, selectedElementIds: [],
        }
      }),
    stopPlacing: () =>
      set((s) => {
        if (s.locked) return s
        return { tool: 'select', placingEntry: null }
      }),
    rotatePlacing: () =>
      set((s) => {
        if (s.locked) return s
        return { placingRotation: normalizeRotation(s.placingRotation + 90) }
      }),
    rotateSelected: () => {
      const s = get()
      if (s.locked || !s.selectedElementId) return
      const el = s.quest.elements.find((e) => e.id === s.selectedElementId)
      if (!el) return

      if (el.type === 'door' && el.subtype !== 'secret') {
        const newOrientation = el.orientation === 'vertical' ? 'horizontal' : 'vertical'
        set((s) => pushHistory(s, updateElement(s.quest, s.selectedElementId!, {
          orientation: newOrientation,
        })))
      } else {
        const currentRotation = el.rotation ?? 0
        const newRotation = normalizeRotation(currentRotation + 90)
        const w = el.width ?? 1
        const h = el.height ?? 1
        const wasSwapped = shouldSwapDimensions(currentRotation)
        const willSwap = shouldSwapDimensions(newRotation)
        const updates: Partial<QuestElement> = { rotation: newRotation }
        if (wasSwapped !== willSwap) {
          updates.width = h
          updates.height = w
        }
        set((s) => pushHistory(s, updateElement(s.quest, s.selectedElementId!, updates)))
      }
      emitEvent({ type: 'element:rotated', element: el })
    },
    toggleDisabledTile: (x, y) =>
      set((s) => {
        if (s.locked) return s
        return pushHistory(s, toggleTile(s.quest, x, y))
      }),
    toggleDisabledRect: (x1, y1, x2, y2) =>
      set((s) => {
        if (s.locked) return s
        return pushHistory(s, toggleTilesRect(s.quest, x1, y1, x2, y2))
      }),
    setDragRect: (rect) =>
      set((s) => {
        if (s.locked) return s
        return { dragRect: rect }
      }),
    lock: (reason) => set({
      locked: true,
      lockReason: reason ?? null,
      selectedElementId: null,
      selectedElementIds: [],
      placingEntry: null,
      tool: 'select',
    }),
    unlock: () => set({ locked: false, lockReason: null }),
    undo: () => {
      const s = get()
      if (s.locked || s._history.length === 0) return
      const history = [...s._history]
      const previous = history.pop()!
      set({
        quest: previous,
        _history: history,
        _future: [s.quest, ...s._future].slice(0, MAX_HISTORY),
        canUndo: history.length > 0,
        canRedo: true,
        selectedElementId: null,
        selectedElementIds: [],
      })
      emitEvent({ type: 'quest:undo', quest: previous })
    },
    redo: () => {
      const s = get()
      if (s.locked || s._future.length === 0) return
      const future = [...s._future]
      const next = future.shift()!
      set({
        quest: next,
        _history: [...s._history, s.quest].slice(-MAX_HISTORY),
        _future: future,
        canUndo: true,
        canRedo: future.length > 0,
        selectedElementId: null,
        selectedElementIds: [],
      })
      emitEvent({ type: 'quest:redo', quest: next })
    },
    setMode: (mode) => {
      if (mode === 'play') {
        const s = get()
        // Auto-reveal stairway tiles
        const stairTiles = getStairwayTiles(s.quest)
        // Also reveal corridor tiles visible from stairway via ray-cast
        const initialTiles = new Set<string>(stairTiles)
        for (const key of stairTiles) {
          const [x, y] = parseTileKey(key)
          for (const t of revealCorridorTiles(s.quest, x, y)) {
            initialTiles.add(t)
          }
        }
        set({
          mode,
          revealedGroups: new Set<string>(),
          revealedTiles: initialTiles,
          discoveredElements: new Set<string>(),
          placingHeroes: [],
          _placingTotal: 0,
          selectedElementId: null,
          selectedElementIds: [],
          placingEntry: null,
          tool: 'select',
        })
      } else {
        set({ mode, revealedGroups: new Set<string>(), revealedTiles: new Set<string>(), discoveredElements: new Set<string>(), placingHeroes: [], _placingTotal: 0 })
      }
    },
    killMonster: (id) => {
      const s = get()
      if (s.mode !== 'play' || s.locked) return
      const el = s.quest.elements.find((e) => e.id === id)
      if (!el || el.type !== 'monster') return
      // Intercept semantics: do NOT remove here. The host opens its modal and,
      // once the killer is recorded, calls removeElement(id) via the handle.
      emitEvent({ type: 'monster:killed', element: el })
    },
    searchRoom: (groupId, kind) => {
      const s = get()
      if (s.mode !== 'play') return
      if (kind === 'treasure') {
        // Abstract — no board element. Host resolves from the treasure deck/notes.
        emitEvent({ type: 'search:treasure', groupId })
        return
      }
      const group = getGroupedRooms(s.quest).find((g) => g.id === groupId)
      const inRoom = group ? getElementsByRooms(s.quest, group.rooms) : []
      const matches = inRoom.filter((el) =>
        kind === 'traps'
          ? el.type === 'trap'
          : el.type === 'door' && el.subtype === 'secret',
      )
      // Reveal the newly-found ones; emit ALL matches (so a re-search still reports them).
      const fresh = matches.filter((el) => !s.discoveredElements.has(el.id))
      if (fresh.length > 0) {
        const next = new Set(s.discoveredElements)
        for (const el of fresh) next.add(el.id)
        set({ discoveredElements: next })
      }
      emitEvent(
        kind === 'traps'
          ? { type: 'search:traps', groupId, found: matches }
          : { type: 'search:secret', groupId, found: matches },
      )
    },
    disarmTrap: (id) => {
      const s = get()
      if (s.mode !== 'play' || s.locked) return
      const el = s.quest.elements.find((e) => e.id === id)
      if (!el || el.type !== 'trap') return
      // Only a discovered (revealed) trap can be disarmed.
      if (!s.discoveredElements.has(id)) return
      // Intercept: host attributes the disarm and removes via removeElement.
      emitEvent({ type: 'trap:disarmed', element: el })
    },
    activateRoom: (groupId) => {
      const s = get()
      if (s.mode !== 'play') return
      if (!s.revealedGroups.has(groupId)) return
      emitEvent({ type: 'room:activated', groupId })
    },
    placeHeroes: (heroes) => {
      const s = get()
      if (s.mode !== 'play' || heroes.length === 0) return
      const tiles = heroStartTiles(s.quest, heroes.length)
      if (tiles.length >= heroes.length) {
        let quest = s.quest
        for (let i = 0; i < heroes.length; i++) {
          quest = addElement(quest, createElement('hero', heroes[i].subtype, tiles[i].x, tiles[i].y))
        }
        set((st) => pushHistory(st, quest))
        emitEvent({ type: 'heroes:placed', count: heroes.length })
      } else {
        // No stairway (or no room around it) → let the host place them by clicking.
        set({ placingHeroes: [...heroes], _placingTotal: heroes.length })
        emitEvent({ type: 'heroes:need-placement', count: heroes.length })
      }
    },
    placeNextHeroAt: (x, y) => {
      const s = get()
      if (s.mode !== 'play' || s.placingHeroes.length === 0) return
      const blockers = s.quest.elements.filter((e) => e.type !== 'marker')
      if (!isWithinBoard(s.quest.board, x, y) || isDisabledTile(s.quest, x, y) || isOccupiedTile(blockers, x, y)) return
      const [next, ...rest] = s.placingHeroes
      set((st) => ({
        ...pushHistory(st, addElement(st.quest, createElement('hero', next.subtype, x, y))),
        placingHeroes: rest,
      }))
      if (rest.length === 0) {
        emitEvent({ type: 'heroes:placed', count: s._placingTotal })
      }
    },
    revealRoom: (groupId) => {
      const s = get()
      if (s.mode !== 'play') return
      if (s.revealedGroups.has(groupId)) return
      const next = new Set(s.revealedGroups)
      next.add(groupId)
      set({ revealedGroups: next })
      emitEvent({ type: 'room:revealed', groupId })
    },
    revealCorridor: (x, y) => {
      const s = get()
      if (s.mode !== 'play') return
      const tiles = revealCorridorTiles(s.quest, x, y)
      if (tiles.length === 0) return
      const next = new Set(s.revealedTiles)
      let added = false
      for (const t of tiles) {
        if (!next.has(t)) { next.add(t); added = true }
      }
      if (added) set({ revealedTiles: next })
    },
    resetFog: () => set({ revealedGroups: new Set<string>(), revealedTiles: new Set<string>() }),
  }))
}
