import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Stage, Layer } from 'react-konva'
import type { Quest, QuestElement, ElementType } from '@quest-editor/core'
import { LAYER_ORDER } from '@quest-editor/core'
import type Konva from 'konva'
import { Grid } from './Grid'
import { QuestElementNode } from './QuestElementNode'
import { createEditorStore, type EditorState } from '../store'
import type { StoreApi } from 'zustand'
import { useStore } from 'zustand'

export interface QuestEditorProps {
  quest?: Quest
  onChange?: (quest: Quest) => void
  width?: number
  height?: number
}

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

  const stageRef = useRef<Konva.Stage>(null)

  // Calculate initial scale and position to fit and center the board
  const labelPadding = 20 // space for row/column labels
  const boardPixelWidth = quest.board.width * quest.board.cellSize + labelPadding
  const boardPixelHeight = quest.board.height * quest.board.cellSize + labelPadding
  const fitScale = Math.min(
    containerWidth / boardPixelWidth,
    containerHeight / boardPixelHeight,
  ) * 0.95 // slight margin

  const [scale, setScale] = useState(fitScale)
  const [stagePos, setStagePos] = useState({
    x: (containerWidth - boardPixelWidth * fitScale) / 2 + labelPadding * fitScale,
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
      if (e.target === e.target.getStage()) {
        selectElement(null)
      }
    },
    [selectElement],
  )

  return (
    <Stage
      ref={stageRef}
      width={containerWidth}
      height={containerHeight}
      scaleX={scale}
      scaleY={scale}
      x={stagePos.x}
      y={stagePos.y}
      draggable
      onWheel={handleWheel}
      onClick={handleStageClick}
      onTap={handleStageClick}
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
  )
}
