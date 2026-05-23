import { useState } from 'react'
import type { ElementType, CatalogEntry } from '@quest-editor/core'
import { getCatalogByType } from '@quest-editor/core'
import { useEditorTheme } from '../ThemeContext'
import type { EditorTheme } from '../themes'

const TYPE_LABELS: Record<ElementType, string> = {
  hero: 'Heroes',
  monster: 'Monsters',
  npc: 'NPCs',
  furniture: 'Furniture',
  door: 'Doors',
  trap: 'Traps',
  treasure: 'Treasure',
  marker: 'Markers',
}

export interface ElementPanelProps {
  placingEntry: CatalogEntry | null
  placingRotation: number
  selectedElementId: string | null
  onSelect: (entry: CatalogEntry) => void
  onDeselect: () => void
  onDeleteSelected: () => void
  onRotate: () => void
  onRotateSelected: () => void
  tool: string
  onSetTool: (tool: 'select' | 'place' | 'erase' | 'disable') => void
  onRecenter: () => void
  assetBasePath?: string
}

export function ElementPanel({
  placingEntry,
  placingRotation,
  selectedElementId,
  onSelect,
  onDeselect,
  onDeleteSelected,
  onRotate,
  onRotateSelected,
  tool,
  onSetTool,
  onRecenter,
  assetBasePath = '/assets',
}: ElementPanelProps) {
  const [openCategory, setOpenCategory] = useState<ElementType | null>('hero')
  const t = useEditorTheme()

  const toggleCategory = (type: ElementType) => {
    setOpenCategory((prev) => (prev === type ? null : type))
  }

  const panelOrder: ElementType[] = ['hero', 'monster', 'npc', 'furniture', 'door', 'trap', 'treasure', 'marker']

  return (
    <div style={{ width: 220, background: t.panelBg, borderRight: `1px solid ${t.panelBorder}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: t.panelText }}>
        <span style={{ fontWeight: 600 }}>Elements</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {placingEntry && (
            <>
              <button onClick={onRotate} style={{ padding: '3px 8px', background: t.rotateBtnBg, color: t.btnColor, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }} title="Rotate (R)">
                ↻ {placingRotation}°
              </button>
              <button onClick={onDeselect} style={{ padding: '3px 10px', background: t.btnBg, color: t.btnColor, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                Cancel
              </button>
            </>
          )}
          {selectedElementId && !placingEntry && (
            <>
              <button onClick={onRotateSelected} style={{ padding: '3px 8px', background: t.rotateBtnBg, color: t.btnColor, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }} title="Rotate (R)">
                ↻
              </button>
              <button onClick={onDeleteSelected} style={{ padding: '3px 10px', background: t.deleteBtnBg, color: t.btnColor, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '6px 12px', borderBottom: `1px solid ${t.panelBorder}` }}>
        <button
          onClick={() => onSetTool('select')}
          style={{ flex: 1, padding: '4px 8px', background: tool === 'select' ? t.toolBtnActiveBg : t.toolBtnBg, color: tool === 'select' ? t.toolBtnActiveColor : t.toolBtnColor, border: `1px solid ${tool === 'select' ? t.toolBtnActiveBorder : t.panelBorder}`, borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
          title="Select (S)"
        >
          Select
        </button>
        <button
          onClick={() => onSetTool('disable')}
          style={{ flex: 1, padding: '4px 8px', background: tool === 'disable' ? t.toolBtnActiveBg : t.toolBtnBg, color: tool === 'disable' ? t.toolBtnActiveColor : t.toolBtnColor, border: `1px solid ${tool === 'disable' ? t.toolBtnActiveBorder : t.panelBorder}`, borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
          title="Disable tiles (D)"
        >
          Disable
        </button>
        <button
          onClick={onRecenter}
          style={{ padding: '4px 8px', background: t.toolBtnBg, color: t.toolBtnColor, border: `1px solid ${t.panelBorder}`, borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
          title="Recenter board"
        >
          ⌖
        </button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {panelOrder.map((type) => {
          const entries = getCatalogByType(type)
          if (!entries.length) return null
          const isOpen = openCategory === type

          return (
            <div key={type}>
              <button
                onClick={() => toggleCategory(type)}
                style={{ width: '100%', padding: '8px 12px', background: t.categoryBg, border: 'none', borderBottom: `1px solid ${t.categoryBorder}`, color: t.panelText, fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{isOpen ? '▾' : '▸'} {TYPE_LABELS[type]}</span>
                <span style={{ fontSize: 11, color: t.panelTextMuted }}>{entries.length}</span>
              </button>
              {isOpen && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 6 }}>
                  {entries.map((entry) => {
                    const isActive = placingEntry?.type === entry.type && placingEntry?.subtype === entry.subtype
                    return (
                      <button
                        key={`${entry.type}-${entry.subtype}`}
                        onClick={() => isActive ? onDeselect() : onSelect(entry)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 6, background: isActive ? t.entryActiveBg : t.entryBg, border: `1px solid ${isActive ? t.entryActiveBorder : 'transparent'}`, borderRadius: 6, cursor: 'pointer', color: t.panelText }}
                        title={entry.label}
                      >
                        <img
                          src={`${assetBasePath}/${entry.type}/${entry.subtype}.png`}
                          alt={entry.label}
                          style={{ width: 32, height: 32, objectFit: 'contain' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                        <span style={{ fontSize: 10, textAlign: 'center', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{entry.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
