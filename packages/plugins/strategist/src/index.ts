import type { EditorPlugin } from '@quest-editor/editor'
import { createStrategistPanel } from './StrategistPanel'

export interface StrategistConfig {
  language?: string
}

export { buildStrategyPrompt } from './prompt'

export function StrategistPlugin(config: StrategistConfig = {}): EditorPlugin {
  return {
    id: 'strategist',
    name: 'Strategist',
    PanelSection: createStrategistPanel(config),
  }
}
