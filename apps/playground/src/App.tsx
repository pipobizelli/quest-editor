import { useCallback, useState } from 'react'
import { QuestEditor, THEMES } from '@quest-editor/editor'
import {
  createQuest,
  createElement,
  addElement,
  serialize,
  deserialize,
  type Quest,
} from '@quest-editor/core'

function createSampleQuest(): Quest {
  let quest = createQuest({ name: 'The Trial' })
  // Heroes
  quest = addElement(quest, createElement('hero', 'barbarian', 0, 0))
  // Monsters
  quest = addElement(quest, createElement('monster', 'goblin', 5, 3))
  quest = addElement(quest, createElement('monster', 'skeleton', 8, 7))
  quest = addElement(quest, createElement('monster', 'chaos', 12, 9))
  // NPCs
  quest = addElement(quest, createElement('npc', 'prisoner', 11, 9))
  // Furniture
  quest = addElement(quest, createElement('furniture', 'chest', 12, 5))
  quest = addElement(quest, createElement('furniture', 'table', 2, 2, { width: 3, height: 2 }))
  quest = addElement(quest, createElement('furniture', 'bookcase', 10, 8, { width: 3, height: 1 }))
  // Doors
  quest = addElement(quest, createElement('door', 'door', 4, 3, { orientation: 'vertical' }))
  quest = addElement(quest, createElement('door', 'door', 8, 5, { orientation: 'horizontal' }))
  quest = addElement(quest, createElement('door', 'secret', 9, 9))
  // Traps
  quest = addElement(quest, createElement('trap', 'pittrap', 6, 4, { hidden: true }))
  // Markers
  quest = addElement(quest, createElement('marker', 'stairway', 0, 17, { width: 2, height: 2, metadata: { role: 'start' } }))
  quest = addElement(quest, createElement('marker', 'a', 20, 3))
  return quest
}

const themeKeys = Object.keys(THEMES)

export function App() {
  const [quest, setQuest] = useState(createSampleQuest)
  const [themeId, setThemeId] = useState('dark')
  const [showLabels, setShowLabels] = useState(true)

  const handleExport = useCallback(() => {
    const json = serialize(quest)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${quest.name.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [quest])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const loaded = deserialize(reader.result as string)
          setQuest(loaded)
        } catch (err) {
          alert('Invalid quest file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [])

  const theme = THEMES[themeId]

  return (
    <div style={{ padding: 16, background: theme.canvasBg, minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: theme.panelText }}>Quest Editor</h1>
        <button onClick={handleImport} style={{ ...btnStyle, background: theme.btnBg, color: theme.btnColor, borderColor: theme.btnBorder }}>Import</button>
        <button onClick={handleExport} style={{ ...btnStyle, background: theme.btnBg, color: theme.btnColor, borderColor: theme.btnBorder }}>Export</button>
        <select
          value={themeId}
          onChange={(e) => setThemeId(e.target.value)}
          style={{ ...btnStyle, background: theme.btnBg, color: theme.btnColor, borderColor: theme.btnBorder }}
        >
          {themeKeys.map((key) => (
            <option key={key} value={key}>{THEMES[key].name}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: theme.panelText, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
          Labels
        </label>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <input
          value={quest.name}
          onChange={(e) => setQuest({ ...quest, name: e.target.value })}
          placeholder="Quest name"
          style={{ ...inputStyle, background: theme.btnBg, color: theme.panelText, borderColor: theme.btnBorder, flex: 1 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <textarea
          value={quest.description}
          onChange={(e) => setQuest({ ...quest, description: e.target.value })}
          placeholder="Quest description (markdown)"
          rows={3}
          style={{ ...inputStyle, background: theme.btnBg, color: theme.panelText, borderColor: theme.btnBorder, flex: 1, resize: 'vertical' }}
        />
        <textarea
          value={quest.notes ?? ''}
          onChange={(e) => setQuest({ ...quest, notes: e.target.value || undefined })}
          placeholder="GM notes (markdown)"
          rows={3}
          style={{ ...inputStyle, background: theme.btnBg, color: theme.panelText, borderColor: theme.btnBorder, flex: 1, resize: 'vertical' }}
        />
      </div>
      <QuestEditor
        quest={quest}
        onChange={setQuest}
        width={window.innerWidth - 32}
        height={window.innerHeight - 200}
        theme={themeId}
        showLabels={showLabels}
      />
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '6px 16px',
  border: '1px solid',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid',
  borderRadius: 6,
  fontSize: 14,
  fontFamily: 'system-ui, sans-serif',
}
