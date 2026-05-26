import type { EditorPlugin } from '@quest-editor/editor'
import { createRemixPanel } from './RemixPanel'

export interface RemixConfig {
  language?: string
}

export type { Difficulty } from './prompt'
export { buildRemixPrompt } from './prompt'
export type { RemixSuggestion, ApplySelection } from './apply'
export { applyRemix, createDefaultSelection, normalizeSubtype, resolveElement } from './apply'

export function RemixPlugin(config: RemixConfig = {}): EditorPlugin {
  return {
    id: 'remix',
    name: 'Remix',
    PanelSection: createRemixPanel(config),
  }
}
