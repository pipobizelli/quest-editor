import { useRef, useEffect, useState, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react'
import { Stage, Layer, Rect as KonvaRect } from 'react-konva'
import type { Quest, QuestElement, ElementType } from '@quest-editor/core'
import { LAYER_ORDER, createElement, getGroupedRooms, getGroupsForDoor, getCorridorTiles, isTileInRoom, tileKey, parseTileKey, buildDisabledSet } from '@quest-editor/core'
import type Konva from 'konva'
import { Grid } from './Grid'
import { QuestElementNode } from './QuestElementNode'
import { ElementPanel } from './ElementPanel'
import { createEditorStore, type EditorState } from '../store'
import type { EditorEvent } from '../events'
import { ThemeContext, useEditorTheme } from '../ThemeContext'
import { DEFAULT_THEME, THEMES, type EditorTheme } from '../themes'
import type { EditorPlugin, LLMProvider } from '../plugins'
import type { StoreApi } from 'zustand'
import { useStore } from 'zustand'

export interface QuestEditorProps {
  quest?: Quest
  onChange?: (quest: Quest) => void
  onEvent?: (event: EditorEvent) => void
  width?: number
  height?: number
  theme?: EditorTheme | string
  showLabels?: boolean
  showRoomIds?: boolean
  plugins?: EditorPlugin[]
  llmProvider?: LLMProvider
}

export interface QuestEditorHandle {
  lock: (reason?: string) => void
  unlock: () => void
  isLocked: () => boolean
  undo: () => void
  redo: () => void
  setMode: (mode: 'edit' | 'play') => void
  /** Reveal a room group programmatically (play mode only). Emits room:revealed. */
  revealRoom: (groupId: string) => void
  /** Currently revealed room groups — lets a host persist/restore fog state. */
  getRevealedGroups: () => string[]
  /** Remove an element by id. Used by hosts to take a killed monster off the board after a play-mode hook. */
  removeElement: (id: string) => void
  /** Play mode: search a room group. Reveals found traps/secret doors and emits the matching `search:*` event. */
  searchRoom: (groupId: string, kind: 'treasure' | 'traps' | 'secret') => void
}

const PANEL_WIDTH = 220

export const QuestEditor = forwardRef<QuestEditorHandle, QuestEditorProps>(function QuestEditor({
  quest: externalQuest,
  onChange,
  onEvent,
  width: containerWidth = 800,
  height: containerHeight = 600,
  theme: themeProp,
  showLabels = true,
  showRoomIds = false,
  plugins = [],
  llmProvider,
}, ref) {
  const resolvedTheme = typeof themeProp === 'string' ? (THEMES[themeProp] ?? DEFAULT_THEME) : (themeProp ?? DEFAULT_THEME)
  // Stable ref for the event callback so the store doesn't need to be recreated
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent
  const storeRef = useRef<StoreApi<EditorState> | null>(null)
  if (!storeRef.current) {
    storeRef.current = createEditorStore(externalQuest, (e) => onEventRef.current?.(e))
  }
  const store = storeRef.current

  const quest = useStore(store, (s) => s.quest)
  const selectedElementId = useStore(store, (s) => s.selectedElementId)
  const selectedElementIds = useStore(store, (s) => s.selectedElementIds)
  const selectElement = useStore(store, (s) => s.selectElement)
  const selectElements = useStore(store, (s) => s.selectElements)
  const doMoveElement = useStore(store, (s) => s.moveElement)
  const doAddElement = useStore(store, (s) => s.addElement)
  const placingEntry = useStore(store, (s) => s.placingEntry)
  const placingRotation = useStore(store, (s) => s.placingRotation)
  const startPlacing = useStore(store, (s) => s.startPlacing)
  const stopPlacing = useStore(store, (s) => s.stopPlacing)
  const removeSelected = useStore(store, (s) => s.removeSelected)
  const rotatePlacing = useStore(store, (s) => s.rotatePlacing)
  const rotateSelected = useStore(store, (s) => s.rotateSelected)
  const tool = useStore(store, (s) => s.tool)
  const dragRect = useStore(store, (s) => s.dragRect)
  const setDragRect = useStore(store, (s) => s.setDragRect)
  const setTool = useStore(store, (s) => s.setTool)
  const locked = useStore(store, (s) => s.locked)
  const lockReason = useStore(store, (s) => s.lockReason)
  const lock = useStore(store, (s) => s.lock)
  const unlock = useStore(store, (s) => s.unlock)
  const mode = useStore(store, (s) => s.mode)
  const revealedGroups = useStore(store, (s) => s.revealedGroups)
  const revealedTiles = useStore(store, (s) => s.revealedTiles)
  const discoveredElements = useStore(store, (s) => s.discoveredElements)
  const setMode = useStore(store, (s) => s.setMode)
  const revealRoom = useStore(store, (s) => s.revealRoom)
  const revealCorridor = useStore(store, (s) => s.revealCorridor)

  useImperativeHandle(ref, () => ({
    lock: (reason?: string) => store.getState().lock(reason),
    unlock: () => store.getState().unlock(),
    isLocked: () => store.getState().locked,
    undo: () => store.getState().undo(),
    redo: () => store.getState().redo(),
    setMode: (m) => store.getState().setMode(m),
    revealRoom: (groupId) => store.getState().revealRoom(groupId),
    getRevealedGroups: () => Array.from(store.getState().revealedGroups),
    removeElement: (id) => store.getState().removeElement(id),
    searchRoom: (groupId, kind) => store.getState().searchRoom(groupId, kind),
  }), [store])

  const stageRef = useRef<Konva.Stage>(null)
  const isDraggingRect = useRef(false)
  const canvasWidth = containerWidth - PANEL_WIDTH

  // Calculate scale and position to fit and center the board
  const labelPadding = 20
  const boardPixelWidth = quest.board.width * quest.board.cellSize + labelPadding
  const boardPixelHeight = quest.board.height * quest.board.cellSize + labelPadding

  const getCenteredView = useCallback(() => {
    const s = Math.min(canvasWidth / boardPixelWidth, containerHeight / boardPixelHeight) * 0.95
    return {
      scale: s,
      pos: {
        x: (canvasWidth - boardPixelWidth * s) / 2 + labelPadding * s,
        y: (containerHeight - boardPixelHeight * s) / 2 + labelPadding * s,
      },
    }
  }, [canvasWidth, containerHeight, boardPixelWidth, boardPixelHeight, labelPadding])

  const initial = getCenteredView()
  const [scale, setScale] = useState(initial.scale)
  const [stagePos, setStagePos] = useState(initial.pos)

  const recenter = useCallback(() => {
    const v = getCenteredView()
    setScale(v.scale)
    setStagePos(v.pos)
  }, [getCenteredView])

  const roomGroups = useMemo(() => getGroupedRooms(quest), [quest])

  // All tiles that should have fog (rooms + corridors, excluding disabled tiles)
  const fogTiles = useMemo(() => {
    if (mode !== 'play') return []
    const disabled = buildDisabledSet(quest)
    const tiles: string[] = []
    // Corridor fog
    for (const key of getCorridorTiles(quest)) {
      if (!revealedTiles.has(key)) tiles.push(key)
    }
    // Room fog (tile by tile, skipping disabled)
    for (const group of roomGroups) {
      if (revealedGroups.has(group.id)) continue
      for (const room of group.rooms) {
        for (let x = room.x; x < room.x + room.width; x++) {
          for (let y = room.y; y < room.y + room.height; y++) {
            const key = tileKey(x, y)
            if (!disabled.has(key)) tiles.push(key)
          }
        }
      }
    }
    return tiles
  }, [mode, quest, revealedTiles, revealedGroups, roomGroups])

  // In play mode, compute which room group each element belongs to

  const elementGroupMap = useMemo(() => {
    if (mode !== 'play') return null
    const map = new Map<string, string>() // elementId → groupId
    for (const group of roomGroups) {
      for (const room of group.rooms) {
        for (const el of quest.elements) {
          if (map.has(el.id)) continue
          const ex = el.position.x
          const ey = el.position.y
          const ew = el.width ?? 1
          const eh = el.height ?? 1
          if (ex + ew > room.x && ex < room.x + room.width &&
              ey + eh > room.y && ey < room.y + room.height) {
            map.set(el.id, group.id)
          }
        }
      }
    }
    return map
  }, [mode, quest, roomGroups])

  // Group elements by type for layered rendering, filtering hidden in play mode
  const elementsByType = useMemo(() => {
    const map = new Map<ElementType, QuestElement[]>()
    for (const el of quest.elements) {
      if (mode === 'play') {
        const groupId = elementGroupMap?.get(el.id)
        const isSecretDoor = el.type === 'door' && el.subtype === 'secret'
        // Secret doors and ROOM traps are found by searching — hidden until discovered,
        // even after the room is revealed. (Corridor traps fall through to tile-reveal below.)
        if (isSecretDoor || (el.type === 'trap' && groupId)) {
          if (!discoveredElements.has(el.id)) continue
        }
        // Normal doors, markers, and structural blocks are always visible
        else if (el.type === 'door' || el.type === 'marker') { /* visible */ }
        else if (el.type === 'furniture' && (el.subtype === 'block' || el.subtype === 'doubleblock')) { /* visible */ }
        // All other elements: only visible in revealed areas
        else {
          // In a room — check if room group is revealed
          if (groupId && !revealedGroups.has(groupId)) continue
          // In a corridor — check if tile is revealed
          if (!groupId && !revealedTiles.has(tileKey(el.position.x, el.position.y))) continue
        }
      }
      const list = map.get(el.type) ?? []
      list.push(el)
      map.set(el.type, list)
    }
    return map
  }, [quest.elements, mode, elementGroupMap, revealedGroups, revealedTiles, discoveredElements])

  // Sync external quest into store (only when it actually changes from outside)
  const lastExternalQuestRef = useRef(externalQuest)
  useEffect(() => {
    if (externalQuest && externalQuest !== lastExternalQuestRef.current) {
      lastExternalQuestRef.current = externalQuest
      store.getState().setQuest(externalQuest)
    }
  }, [externalQuest, store])

  // Notify parent of internal changes
  const lastNotifiedQuestRef = useRef(quest)
  useEffect(() => {
    if (quest !== lastNotifiedQuestRef.current) {
      lastNotifiedQuestRef.current = quest
      lastExternalQuestRef.current = quest
      onChange?.(quest)
    }
  }, [quest, onChange])

  // Convert pointer position to tile coordinates
  const pointerToTile = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return null
    const pointer = stage.getPointerPosition()
    if (!pointer) return null
    const x = Math.floor((pointer.x - stage.x()) / stage.scaleX() / quest.board.cellSize)
    const y = Math.floor((pointer.y - stage.y()) / stage.scaleY() / quest.board.cellSize)
    return { x, y }
  }, [quest.board.cellSize])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Cmd+Z / Ctrl+Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        store.getState().undo()
        return
      }
      // Redo: Cmd+Shift+Z / Ctrl+Shift+Z or Cmd+Y / Ctrl+Y
      if ((e.metaKey || e.ctrlKey) && (e.key === 'Z' || e.key === 'y')) {
        e.preventDefault()
        store.getState().redo()
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = store.getState()
        if (state.mode === 'play') {
          // Play mode: Delete on a selected monster/trap fires the intercept hook
          // (kill / disarm) instead of removing it — the host resolves and removes.
          const id = state.selectedElementId
          if (!id) return
          const el = state.quest.elements.find((x) => x.id === id)
          if (el?.type === 'monster') {
            e.preventDefault()
            state.killMonster(id)
          } else if (el?.type === 'trap') {
            e.preventDefault()
            state.disarmTrap(id)
          }
          return
        }
        if (state.selectedElementId || state.selectedElementIds.length > 0) {
          e.preventDefault()
          state.removeSelected()
        }
      }
      if (e.key === 'Escape') {
        const state = store.getState()
        if (state.tool !== 'select') {
          state.setTool('select')
        } else {
          state.stopPlacing()
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        const state = store.getState()
        if (state.tool === 'place') {
          state.rotatePlacing()
        } else if (state.selectedElementId) {
          state.rotateSelected()
        }
      }
      if (e.key === 's' || e.key === 'S') {
        store.getState().setTool('select')
      }
      if (e.key === 'd' || e.key === 'D') {
        store.getState().setTool('disable')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [store])

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const scaleBy = 1.03
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    const clampedScale = Math.max(0.3, Math.min(3, newScale))

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    setScale(clampedScale)
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    })
  }, [])

  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      if (mode === 'play') return
      doMoveElement(id, x, y)
    },
    [doMoveElement, mode],
  )

  // In play mode, clicking a door reveals the connected rooms
  const handleElementSelect = useCallback(
    (id: string) => {
      if (mode === 'play') {
        const el = quest.elements.find((e) => e.id === id)
        if (el?.type === 'door') {
          const groups = getGroupsForDoor(quest, el)
          for (const groupId of groups) {
            revealRoom(groupId)
          }
          return
        }
        // Monsters and discovered traps: select them so the Zargon can press
        // Delete/Backspace to kill / disarm (which fires the intercept hook).
        if (el?.type === 'monster' || el?.type === 'trap') {
          selectElement(id)
        }
        return
      }
      selectElement(id)
    },
    [mode, quest, selectElement, revealRoom],
  )

  // Mouse down: start drag rect for disable or select
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return
      const state = store.getState()
      if (state.tool !== 'disable' && state.tool !== 'select') return

      const tile = pointerToTile()
      if (!tile) return

      isDraggingRect.current = true
      setDragRect({ x1: tile.x, y1: tile.y, x2: tile.x, y2: tile.y })
    },
    [store, pointerToTile, setDragRect],
  )

  // Mouse move: update drag rect
  const handleMouseMove = useCallback(
    () => {
      if (!isDraggingRect.current) return

      const tile = pointerToTile()
      if (!tile) return

      const state = store.getState()
      if (!state.dragRect) return

      setDragRect({ ...state.dragRect, x2: tile.x, y2: tile.y })
    },
    [store, pointerToTile, setDragRect],
  )

  // Mouse up: apply drag rect
  const handleMouseUp = useCallback(
    () => {
      if (!isDraggingRect.current) return
      isDraggingRect.current = false

      const state = store.getState()
      if (!state.dragRect) return

      const { x1, y1, x2, y2 } = state.dragRect
      const minX = Math.min(x1, x2)
      const maxX = Math.max(x1, x2)
      const minY = Math.min(y1, y2)
      const maxY = Math.max(y1, y2)

      if (state.tool === 'disable') {
        state.toggleDisabledRect(x1, y1, x2, y2)
      } else if (state.tool === 'select') {
        // Find elements within the rect
        const ids = state.quest.elements
          .filter((el) => {
            const ex = el.position.x
            const ey = el.position.y
            const ew = (el.width ?? 1) - 1
            const eh = (el.height ?? 1) - 1
            return ex + ew >= minX && ex <= maxX && ey + eh >= minY && ey <= maxY
          })
          .map((el) => el.id)
        state.selectElements(ids)
      }

      setDragRect(null)
    },
    [store, setDragRect],
  )

  // Play mode: clicking the board reveals corridor tiles via ray-cast
  const handlePlayClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return
      const tile = pointerToTile()
      if (!tile) return
      // Corridor tile → reveal it; room floor → activate the room (host opens search menu)
      if (!isTileInRoom(quest, tile.x, tile.y)) {
        revealCorridor(tile.x, tile.y)
      } else {
        for (const g of roomGroups) {
          if (g.rooms.some((r) => tile.x >= r.x && tile.x < r.x + r.width && tile.y >= r.y && tile.y < r.y + r.height)) {
            store.getState().activateRoom(g.id)
            break
          }
        }
      }
    },
    [quest, pointerToTile, revealCorridor, roomGroups, store],
  )

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return

      const state = store.getState()

      // Place mode: add element at clicked position
      if (state.tool === 'place' && state.placingEntry) {
        const tile = pointerToTile()
        if (!tile) return

        const entry = state.placingEntry
        const rotation = state.placingRotation
        const swapped = rotation === 90 || rotation === 270
        const overrides: Partial<QuestElement> = { rotation }
        if (swapped) {
          overrides.width = entry.height > 1 ? entry.height : entry.width
          overrides.height = entry.width > 1 ? entry.width : entry.height
        } else {
          if (entry.width > 1) overrides.width = entry.width
          if (entry.height > 1) overrides.height = entry.height
        }
        // Keep orientation for doors
        if (entry.type === 'door' && entry.subtype !== 'secret') {
          overrides.orientation = swapped ? 'horizontal' : 'vertical'
        }

        const element = createElement(entry.type, entry.subtype, tile.x, tile.y, overrides)
        doAddElement(element)
        return
      }

      // Disable mode is handled by mouseDown/mouseUp for drag support
      if (state.tool === 'disable') return

      // Select mode: deselect (only if no drag rect was used)
      if (!state.dragRect) {
        selectElement(null)
      }
    },
    [store, pointerToTile, doAddElement, selectElement],
  )

  const cursorMap = {
    select: 'default',
    place: 'crosshair',
    erase: 'not-allowed',
    disable: 'cell',
  }

  return (
    <ThemeContext.Provider value={resolvedTheme}>
    <div style={{ display: 'flex', height: containerHeight, background: resolvedTheme.canvasBg }}>
      <ElementPanel
        placingEntry={placingEntry}
        placingRotation={placingRotation}
        selectedElementId={selectedElementId}
        onSelect={startPlacing}
        onDeselect={stopPlacing}
        onDeleteSelected={removeSelected}
        onRotate={rotatePlacing}
        onRotateSelected={rotateSelected}
        tool={tool}
        onSetTool={setTool}
        onRecenter={recenter}
        plugins={plugins}
        quest={quest}
        onUpdateQuest={(q) => store.getState().setQuest(q)}
        llmProvider={llmProvider}
        locked={locked}
        lock={lock}
        unlock={unlock}
        onEvent={(e) => onEventRef.current?.(e)}
        mode={mode}
        onSetMode={setMode}
      />
      <div style={{ position: 'relative', flex: 1 }}>
        <Stage
          ref={stageRef}
          width={canvasWidth}
          height={containerHeight}
          scaleX={scale}
          scaleY={scale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={!locked && mode === 'edit' && (tool === 'select' || tool === 'place')}
          onWheel={handleWheel}
          onClick={locked ? undefined : mode === 'play' ? handlePlayClick : handleStageClick}
          onTap={locked ? undefined : mode === 'play' ? handlePlayClick : handleStageClick}
          onMouseDown={(locked || mode === 'play') ? undefined : handleMouseDown}
          onMouseMove={(locked || mode === 'play') ? undefined : handleMouseMove}
          onMouseUp={(locked || mode === 'play') ? undefined : handleMouseUp}
          style={{ cursor: locked ? 'not-allowed' : mode === 'play' ? 'default' : cursorMap[tool], opacity: locked ? 0.45 : 1, transition: 'opacity 0.3s ease' }}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) {
              setStagePos({ x: e.target.x(), y: e.target.y() })
            }
          }}
        >
          {/* Board layer — grid + walls + disabled tiles (non-interactive) */}
          <Layer listening={false}>
            <Grid
              board={quest.board}
              layout={quest.layout}
              disabledTiles={quest.disabledTiles}
              dragRect={dragRect}
              showLabels={showLabels}
              showRoomIds={showRoomIds}
            />
          </Layer>

          {/* Element layers — one per category, ordered back to front */}
          {LAYER_ORDER.map((layerType) => {
            const elements = elementsByType.get(layerType)
            if (!elements?.length) return null
            return (
              <Layer key={layerType} listening={!locked}>
                {elements.map((el) => (
                  <QuestElementNode
                    key={el.id}
                    element={el}
                    board={quest.board}
                    isSelected={selectedElementIds.includes(el.id)}
                    onSelect={handleElementSelect}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </Layer>
            )
          })}

          {/* Fog of War — dark overlay on unrevealed tiles (skips disabled tiles) */}
          {mode === 'play' && (
            <Layer listening={false}>
              {fogTiles.map((key) => {
                const [x, y] = parseTileKey(key)
                return (
                  <KonvaRect
                    key={`fog-${key}`}
                    x={x * quest.board.cellSize}
                    y={y * quest.board.cellSize}
                    width={quest.board.cellSize}
                    height={quest.board.cellSize}
                    fill="#111"
                    opacity={0.85}
                  />
                )
              })}
            </Layer>
          )}
        </Stage>
        {locked && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.7)',
              color: '#ccc',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: 'quest-editor-spin 1s linear infinite' }}>
                <circle cx="9" cy="9" r="7" fill="none" stroke="#555" strokeWidth="2" />
                <circle cx="9" cy="9" r="7" fill="none" stroke="#ccc" strokeWidth="2" strokeDasharray="32" strokeDashoffset="24" strokeLinecap="round" />
              </svg>
              <style>{`@keyframes quest-editor-spin { to { transform: rotate(360deg) } }`}</style>
              {lockReason ?? 'Editor locked'}
            </div>
          </div>
        )}
      </div>
    </div>
    </ThemeContext.Provider>
  )
})
