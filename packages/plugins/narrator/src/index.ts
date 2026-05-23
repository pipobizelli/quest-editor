import type { EditorPlugin } from '@quest-editor/editor'
import type { NarratorConfig } from './types'
import { createNarratorPanel } from './NarratorPanel'

export type { NarratorConfig } from './types'
export { buildPrompt } from './prompt'

export function NarratorPlugin(config: NarratorConfig = {}): EditorPlugin {
  return {
    id: 'narrator',
    name: 'Narrator',
    PanelSection: createNarratorPanel(config),
  }
}
