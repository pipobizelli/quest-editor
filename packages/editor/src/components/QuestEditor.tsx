import { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer } from 'react-konva'
import type { Quest, QuestElement } from '@quest-editor/core'
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

  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const stageRef = useRef<Konva.Stage>(null)

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
      <Layer>
        <Grid board={quest.board} layout={quest.layout} />
        {quest.elements.map((el: QuestElement) => (
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
    </Stage>
  )
}
