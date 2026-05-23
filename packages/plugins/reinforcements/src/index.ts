import type { EditorPlugin } from '@quest-editor/editor'
import { createReinforcementsPanel } from './ReinforcementsPanel'

export interface ReinforcementsConfig {
  language?: string
}

export { buildReinforcementsPrompt } from './prompt'

export function ReinforcementsPlugin(config: ReinforcementsConfig = {}): EditorPlugin {
  return {
    id: 'reinforcements',
    name: 'Reinforcements',
    PanelSection: createReinforcementsPanel(config),
  }
}
