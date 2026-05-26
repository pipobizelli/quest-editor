import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QuestEditor, THEMES, type LLMProvider, type QuestEditorHandle } from '@quest-editor/editor'
import { NarratorPlugin } from '@quest-editor/plugin-narrator'
import { StrategistPlugin } from '@quest-editor/plugin-strategist'
import { ReinforcementsPlugin } from '@quest-editor/plugin-reinforcements'
import { RemixPlugin } from '@quest-editor/plugin-remix'
import {
  createQuest,
  serialize,
  deserialize,
  type Quest,
} from '@quest-editor/core'
const themeKeys = Object.keys(THEMES)

export function App() {
  const editorRef = useRef<QuestEditorHandle>(null)
  const [quest, setQuest] = useState<Quest>(() => createQuest({ name: 'Loading...' }))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/quests/barak_tor.json')
      .then((r) => r.text())
      .then((json) => {
        setQuest(deserialize(json))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])
  const [themeId, setThemeId] = useState('stone')
  const [showLabels, setShowLabels] = useState(true)
  const [showRoomIds, setShowRoomIds] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('narrator-api-key') ?? '')

  const llmProvider = useMemo<LLMProvider | undefined>(() => {
    if (!apiKey) return undefined
    return {
      generate: async (prompt: string) => {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          },
        )
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        return data.candidates[0].content.parts[0].text
      },
    }
  }, [apiKey])

  const plugins = useMemo(() => [
    NarratorPlugin({ language: 'pt' }),
    StrategistPlugin({ language: 'pt' }),
    ReinforcementsPlugin({ language: 'pt' }),
    RemixPlugin({ language: 'pt' }),
  ], [])

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
        <button
          onClick={() => {
            const ed = editorRef.current
            if (!ed) return
            if (ed.isLocked()) { ed.unlock() } else { ed.lock('Locked for testing') }
          }}
          style={{ ...btnStyle, background: theme.btnBg, color: theme.btnColor, borderColor: theme.btnBorder }}
        >
          Lock
        </button>
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
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: theme.panelText, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={showRoomIds} onChange={(e) => setShowRoomIds(e.target.checked)} />
          Rooms
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); localStorage.setItem('narrator-api-key', e.target.value) }}
          placeholder="Gemini API key"
          style={{ ...inputStyle, background: theme.btnBg, color: theme.panelText, borderColor: theme.btnBorder, width: 200, fontSize: 12 }}
        />
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
        ref={editorRef}
        quest={quest}
        onChange={setQuest}
        width={window.innerWidth - 32}
        height={window.innerHeight - 200}
        theme={themeId}
        showLabels={showLabels}
        showRoomIds={showRoomIds}
        plugins={plugins}
        llmProvider={llmProvider}
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
