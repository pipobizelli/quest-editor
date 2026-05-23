import { useState } from 'react'
import type { ElementType, CatalogEntry } from '@quest-editor/core'
import { LAYER_ORDER, getCatalogByType } from '@quest-editor/core'

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
  assetBasePath = '/assets',
}: ElementPanelProps) {
  const [openCategory, setOpenCategory] = useState<ElementType | null>('hero')

  const toggleCategory = (type: ElementType) => {
    setOpenCategory((prev) => (prev === type ? null : type))
  }

  // Show categories in a logical order for the panel
  const panelOrder: ElementType[] = ['hero', 'monster', 'npc', 'furniture', 'door', 'trap', 'treasure', 'marker']

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600 }}>Elements</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {placingEntry && (
            <>
              <button onClick={onRotate} style={rotateBtnStyle} title="Rotate (R)">
                ↻ {placingRotation}°
              </button>
              <button onClick={onDeselect} style={cancelBtnStyle}>
                Cancel
              </button>
            </>
          )}
          {selectedElementId && !placingEntry && (
            <>
              <button onClick={onRotateSelected} style={rotateBtnStyle} title="Rotate (R)">
                ↻
              </button>
              <button onClick={onDeleteSelected} style={deleteBtnStyle}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      <div style={toolbarStyle}>
        <button
          onClick={() => onSetTool('select')}
          style={{ ...toolBtnStyle, ...(tool === 'select' ? toolActiveBtnStyle : {}) }}
          title="Select (Esc)"
        >
          Select
        </button>
        <button
          onClick={() => onSetTool('disable')}
          style={{ ...toolBtnStyle, ...(tool === 'disable' ? toolActiveBtnStyle : {}) }}
          title="Disable tiles (D)"
        >
          Disable
        </button>
      </div>

      <div style={listStyle}>
        {panelOrder.map((type) => {
          const entries = getCatalogByType(type)
          if (!entries.length) return null
          const isOpen = openCategory === type

          return (
            <div key={type}>
              <button
                onClick={() => toggleCategory(type)}
                style={categoryBtnStyle}
              >
                <span>{isOpen ? '▾' : '▸'} {TYPE_LABELS[type]}</span>
                <span style={countStyle}>{entries.length}</span>
              </button>
              {isOpen && (
                <div style={entriesGridStyle}>
                  {entries.map((entry) => {
                    const isActive = placingEntry?.type === entry.type && placingEntry?.subtype === entry.subtype
                    return (
                      <button
                        key={`${entry.type}-${entry.subtype}`}
                        onClick={() => isActive ? onDeselect() : onSelect(entry)}
                        style={{
                          ...entryBtnStyle,
                          ...(isActive ? entryActiveBtnStyle : {}),
                        }}
                        title={entry.label}
                      >
                        <img
                          src={`${assetBasePath}/${entry.type}/${entry.subtype}.png`}
                          alt={entry.label}
                          style={entryImgStyle}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                            ;(e.target as HTMLImageElement).nextElementSibling as HTMLElement
                          }}
                        />
                        <span style={entryLabelStyle}>{entry.label}</span>
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

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  padding: '6px 12px',
  borderBottom: '1px solid #333',
}

const toolBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '4px 8px',
  background: '#1a2540',
  color: '#999',
  border: '1px solid #333',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 11,
}

const toolActiveBtnStyle: React.CSSProperties = {
  background: '#2a4a6b',
  color: '#eee',
  borderColor: '#3498db',
}

const panelStyle: React.CSSProperties = {
  width: 220,
  background: '#16213e',
  borderRight: '1px solid #333',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  flexShrink: 0,
}

const headerStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #333',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 14,
}

const listStyle: React.CSSProperties = {
  overflowY: 'auto',
  flex: 1,
}

const categoryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'none',
  border: 'none',
  borderBottom: '1px solid #222',
  color: '#ccc',
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const countStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#666',
}

const entriesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 4,
  padding: 6,
  background: '#111a2e',
}

const entryBtnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: 6,
  background: '#1a2540',
  border: '1px solid transparent',
  borderRadius: 6,
  cursor: 'pointer',
  color: '#ccc',
}

const entryActiveBtnStyle: React.CSSProperties = {
  border: '1px solid #3498db',
  background: '#1a3050',
}

const entryImgStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  objectFit: 'contain',
}

const entryLabelStyle: React.CSSProperties = {
  fontSize: 10,
  textAlign: 'center',
  lineHeight: '1.2',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%',
}

const rotateBtnStyle: React.CSSProperties = {
  padding: '3px 8px',
  background: '#2a4a6b',
  color: '#eee',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '3px 10px',
  background: '#333',
  color: '#eee',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
}

const deleteBtnStyle: React.CSSProperties = {
  padding: '3px 10px',
  background: '#6b1a1a',
  color: '#eee',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
}
