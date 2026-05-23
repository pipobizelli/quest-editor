import type { Quest } from '@quest-editor/core'

export interface LLMProvider {
  generate: (prompt: string) => Promise<string>
}

export interface EditorPlugin {
  id: string
  name: string
  /** React component rendered below the toolbar in the panel */
  PanelSection?: React.ComponentType<PluginPanelProps>
}

export interface PluginPanelProps {
  quest: Quest
  onUpdateQuest: (quest: Quest) => void
  llmProvider?: LLMProvider
}
