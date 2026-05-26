import { useState, useCallback } from 'react'
import type { Room } from '@quest-editor/core'
import { isRoomNarratable } from '@quest-editor/core'
import type { PluginPanelProps } from '@quest-editor/editor'
import type { NarratorConfig } from './types'
import { buildPrompt } from './prompt'

export function createNarratorPanel(config: NarratorConfig) {
  return function NarratorPanel({ quest, onUpdateQuest, llmProvider }: PluginPanelProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [narrations, setNarrations] = useState<Map<string, string>>(
      () => new Map(
        quest.layout.rooms
          .filter((r) => (quest as any).narrations?.[r.id])
          .map((r) => [r.id, (quest as any).narrations[r.id]]),
      ),
    )
    const [expandedRoom, setExpandedRoom] = useState<string | null>(null)

    const generateForRoom = useCallback(
      async (room: Room) => {
        if (!llmProvider) return
        setLoading(room.id)
        try {
          const prompt = buildPrompt(quest, room, config.language)
          const text = await llmProvider.generate(prompt)
          setNarrations((prev) => {
            const next = new Map(prev)
            next.set(room.id, text)
            return next
          })
          const questNarrations = { ...((quest as any).narrations ?? {}), [room.id]: text }
          onUpdateQuest({ ...quest, narrations: questNarrations } as any)
        } catch (err) {
          console.error('Narrator error:', err)
        } finally {
          setLoading(null)
        }
      },
      [quest, config, onUpdateQuest, llmProvider],
    )

    if (!llmProvider) {
      return (
        <div style={{ borderTop: '1px solid #555', padding: '8px 12px', fontSize: 11, color: '#888' }}>
          Narrator — no LLM provider configured
        </div>
      )
    }

    const rooms = quest.layout.rooms.filter((room) => isRoomNarratable(quest, room))

    return (
      <div style={{ borderTop: '1px solid #555', padding: '8px 0' }}>
        <div style={{ padding: '4px 12px 8px', fontSize: 12, fontWeight: 600, color: '#ccc' }}>
          Narrator
        </div>
        {rooms.map((room) => {
          const narration = narrations.get(room.id)
          const isExpanded = expandedRoom === room.id
          const isLoading = loading === room.id

          return (
            <div key={room.id} style={{ padding: '0 8px', marginBottom: 4 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    background: narration ? '#1a3a1a' : 'transparent',
                    border: 'none',
                    color: narration ? '#a0d0a0' : '#999',
                    fontSize: 11,
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: 3,
                  }}
                >
                  {isExpanded ? '▾' : '▸'} {room.id}
                </button>
                <button
                  onClick={() => generateForRoom(room)}
                  disabled={isLoading}
                  style={{
                    padding: '2px 6px',
                    background: 'transparent',
                    border: '1px solid #666',
                    color: '#bbb',
                    fontSize: 10,
                    cursor: isLoading ? 'wait' : 'pointer',
                    borderRadius: 3,
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  {isLoading ? '...' : narration ? '↻' : 'Gen'}
                </button>
              </div>
              {isExpanded && narration && (
                <div
                  style={{
                    padding: '6px 8px',
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: '#ddd',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {narration}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }
}
