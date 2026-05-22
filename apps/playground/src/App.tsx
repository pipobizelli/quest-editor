import { useCallback, useState } from 'react'
import { QuestEditor } from '@quest-editor/editor'
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
  quest = addElement(quest, createElement('hero', 'barbarian', 0, 0))
  quest = addElement(quest, createElement('monster', 'goblin', 5, 3))
  quest = addElement(quest, createElement('monster', 'skeleton', 8, 7))
  quest = addElement(quest, createElement('furniture', 'chest', 12, 5))
  quest = addElement(quest, createElement('furniture', 'table', 2, 2, { width: 2, height: 1 }))
  quest = addElement(quest, createElement('furniture', 'bookcase', 10, 8, { width: 1, height: 3 }))
  quest = addElement(quest, createElement('door', 'wooden', 4, 3, { orientation: 'vertical' }))
  quest = addElement(quest, createElement('door', 'wooden', 8, 5, { orientation: 'horizontal' }))
  quest = addElement(quest, createElement('trap', 'pit', 6, 4, { hidden: true }))
  quest = addElement(quest, createElement('treasure', 'gold', 15, 10))
  return quest
}

export function App() {
  const [quest, setQuest] = useState(createSampleQuest)

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

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Quest Editor</h1>
        <button onClick={handleImport} style={btnStyle}>Import</button>
        <button onClick={handleExport} style={btnStyle}>Export</button>
      </div>
      <QuestEditor
        quest={quest}
        onChange={setQuest}
        width={window.innerWidth - 32}
        height={window.innerHeight - 80}
      />
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '6px 16px',
  background: '#16213e',
  color: '#eee',
  border: '1px solid #333',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
}
