import type { Quest } from './types'

export function serialize(quest: Quest): string {
  return JSON.stringify(quest, null, 2)
}

export function deserialize(json: string): Quest {
  const data = JSON.parse(json)
  if (!data.id || !data.name || !data.board || !Array.isArray(data.elements)) {
    throw new Error('Invalid quest format')
  }
  return data as Quest
}
