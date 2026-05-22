import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Stage, Layer } from 'react-konva'
import type { Quest, QuestElement, ElementType } from '@quest-editor/core'
import { LAYER_ORDER, createElement } from '@quest-editor/core'
import type Konva from 'konva'
import { Grid } from './Grid'
import { QuestElementNode } from './QuestElementNode'
import { ElementPanel } from './ElementPanel'
import { createEditorStore, type EditorState } from '../store'
import type { StoreApi } from 'zustand'
import { useStore } from 'zustand'

export interface QuestEditorProps {
  quest?: Quest
  onChange?: (quest: Quest) => void
  width?: number
  height?: number
}

const PANEL_WIDTH = 220

export function QuestEditor({
  quest: externalQuest,
  onChange,
  width: containerWidth = 800,
  height: containerHeight = 600,
}: QuestEditorProps) {
  const storeRef = useRef<StoreApi<EditorState> | null>(null)
  if (!storeRef.current) {
    storeRef.current = createEditorStore(externalQuest)
  }
  const store = storeRef.current

  const quest = useStore(store, (s) => s.quest)
  const selectedElementId = useStore(store, (s) => s.selectedElementId)
  const selectElement = useStore(store, (s) => s.selectElement)
  const doMoveElement = useStore(store, (s) => s.moveElement)
  const doAddElement = useStore(store, (s) => s.addElement)
  const placingEntry = useStore(store, (s) => s.placingEntry)
  const startPlacing = useStore(store, (s) => s.startPlacing)
  const stopPlacing = useStore(store, (s) => s.stopPlacing)
  const removeSelected = useStore(store, (s) => s.removeSelected)
  const tool = useStore(store, (s) => s.tool)

  const stageRef = useRef<Konva.Stage>(null)
  const canvasWidth = containerWidth - PANEL_WIDTH

  // Calculate initial scale and position to fit and center the board
  const labelPadding = 20
  const boardPixelWidth = quest.board.width * quest.board.cellSize + labelPadding
  const boardPixelHeight = quest.board.height * quest.board.cellSize + labelPadding
  const fitScale = Math.min(
    canvasWidth / boardPixelWidth,
    containerHeight / boardPixelHeight,
  ) * 0.95

  const [scale, setScale] = useState(fitScale)
  const [stagePos, setStagePos] = useState({
    x: (canvasWidth - boardPixelWidth * fitScale) / 2 + labelPadding * fitScale,
    y: (containerHeight - boardPixelHeight * fitScale) / 2 + labelPadding * fitScale,
  })

  // Group elements by type for layered rendering
  const elementsByType = useMemo(() => {
    const map = new Map<ElementType, QuestElement[]>()
    for (const el of quest.elements) {
      const list = map.get(el.type) ?? []
      list.push(el)
      map.set(el.type, list)
    }
    return map
  }, [quest.elements])

  useEffect(() => {
    if (externalQuest) {
      store.getState().setQuest(externalQuest)
    }
  }, [externalQuest, store])

  useEffect(() => {
    onChange?.(quest)
  }, [quest, onChange])

  // Keyboard: Delete/Backspace removes selected element, Escape cancels placing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = store.getState()
        if (state.selectedElementId) {
          e.preventDefault()
          state.removeSelected()
        }
      }
      if (e.key === 'Escape') {
        store.getState().stopPlacing()
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

    const scaleBy = 1.08
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
      doMoveElement(id, x, y)
    },
    [doMoveElement],
  )

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return

      const state = store.getState()

      // Place mode: add element at clicked position
      if (state.tool === 'place' && state.placingEntry) {
        const stage = stageRef.current
        if (!stage) return

        const pointer = stage.getPointerPosition()
        if (!pointer) return

        const x = Math.floor((pointer.x - stage.x()) / stage.scaleX() / quest.board.cellSize)
        const y = Math.floor((pointer.y - stage.y()) / stage.scaleY() / quest.board.cellSize)

        const entry = state.placingEntry
        const overrides: Partial<QuestElement> = {}
        if (entry.width > 1) overrides.width = entry.width
        if (entry.height > 1) overrides.height = entry.height
        if (entry.type === 'door' && entry.subtype !== 'secret') {
          overrides.orientation = 'vertical'
        }

        const element = createElement(entry.type, entry.subtype, x, y, overrides)
        doAddElement(element)
        return
      }

      // Select mode: deselect
      selectElement(null)
    },
    [store, quest.board.cellSize, doAddElement, selectElement],
  )

  return (
    <div style={{ display: 'flex', height: containerHeight }}>
      <ElementPanel
        placingEntry={placingEntry}
        selectedElementId={selectedElementId}
        onSelect={startPlacing}
        onDeselect={stopPlacing}
        onDeleteSelected={removeSelected}
      />
      <Stage
        ref={stageRef}
        width={canvasWidth}
        height={containerHeight}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        draggable
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        style={{ cursor: tool === 'place' ? 'crosshair' : 'default' }}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setStagePos({ x: e.target.x(), y: e.target.y() })
          }
        }}
      >
        {/* Board layer — grid + walls (non-interactive) */}
        <Layer listening={false}>
          <Grid board={quest.board} layout={quest.layout} />
        </Layer>

        {/* Element layers — one per category, ordered back to front */}
        {LAYER_ORDER.map((layerType) => {
          const elements = elementsByType.get(layerType)
          if (!elements?.length) return null
          return (
            <Layer key={layerType}>
              {elements.map((el) => (
                <QuestElementNode
                  key={el.id}
                  element={el}
                  board={quest.board}
                  isSelected={el.id === selectedElementId}
                  onSelect={selectElement}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </Layer>
          )
        })}
      </Stage>
    </div>
  )
}
