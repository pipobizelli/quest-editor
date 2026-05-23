import type { ElementType } from './types'

export interface CatalogEntry {
  type: ElementType
  subtype: string
  label: string
  width: number
  height: number
  padding?: number
  offset?: { x?: number, y?: number }
}

export const CATALOG: CatalogEntry[] = [
  // ── Heroes ──
  { type: 'hero', subtype: 'barbarian', label: 'Barbarian', width: 1, height: 1, padding: 4 },
  { type: 'hero', subtype: 'dwarf', label: 'Dwarf', width: 1, height: 1, padding: 4 },
  { type: 'hero', subtype: 'elf', label: 'Elf', width: 1, height: 1, padding: 4 },
  { type: 'hero', subtype: 'wizard', label: 'Wizard', width: 1, height: 1, padding: 4 },

  // ── Monsters ──
  { type: 'monster', subtype: 'goblin', label: 'Goblin', width: 1, height: 1, padding: 4 },
  { type: 'monster', subtype: 'skeleton', label: 'Skeleton', width: 1, height: 1, padding: 4 },
  { type: 'monster', subtype: 'zombie', label: 'Zombie', width: 1, height: 1, padding: 4 },
  { type: 'monster', subtype: 'mummy', label: 'Mummy', width: 1, height: 1, padding: 4 },
  { type: 'monster', subtype: 'orc', label: 'Orc', width: 1, height: 1, padding: 4 },
  { type: 'monster', subtype: 'fimir', label: 'Fimir', width: 1, height: 1, padding: 4 },
  { type: 'monster', subtype: 'chaos', label: 'Chaos Warrior', width: 1, height: 1, padding: 4 },
  { type: 'monster', subtype: 'gargoyle', label: 'Gargoyle', width: 1, height: 1, padding: 4 },

  // ── NPCs ──
  { type: 'npc', subtype: 'mentor', label: 'Mentor', width: 1, height: 1 },
  { type: 'npc', subtype: 'prisoner', label: 'Prisoner', width: 1, height: 1 },
  { type: 'npc', subtype: 'merchant', label: 'Merchant', width: 1, height: 1 },

  // ── Furniture ──
  { type: 'furniture', subtype: 'table', label: 'Table', width: 3, height: 2, padding: 8 },
  { type: 'furniture', subtype: 'chest', label: 'Chest', width: 1, height: 1 },
  { type: 'furniture', subtype: 'bookcase', label: 'Bookcase', width: 3, height: 1 },
  { type: 'furniture', subtype: 'rack', label: 'Rack', width: 2, height: 3, padding: 8 },
  { type: 'furniture', subtype: 'weaponsrack', label: 'Weapons Rack', width: 3, height: 1 },
  { type: 'furniture', subtype: 'throne', label: 'Throne', width: 1, height: 1 },
  { type: 'furniture', subtype: 'coffin', label: 'Coffin', width: 1, height: 2 },
  { type: 'furniture', subtype: 'tomb', label: 'Tomb', width: 2, height: 3, padding: 8 },
  { type: 'furniture', subtype: 'sorcererstable', label: 'Sorcerer Table', width: 3, height: 2, padding: 8 },
  { type: 'furniture', subtype: 'fireplace', label: 'Fireplace', width: 3, height: 1 },
  { type: 'furniture', subtype: 'cupboard', label: 'Cupboard', width: 3, height: 1 },
  { type: 'furniture', subtype: 'alchemistsbench', label: 'Alchemists Bench', width: 3, height: 2, padding: 8 },
  { type: 'furniture', subtype: 'block', label: 'Block', width: 1, height: 1 },
  { type: 'furniture', subtype: 'doubleblock', label: 'Double Block', width: 2, height: 1 },

  // ── Doors ──
  { type: 'door', subtype: 'door', label: 'Door', width: 1, height: 1 },
  { type: 'door', subtype: 'doorin', label: 'Door (In)', width: 1, height: 1, padding: 0, offset: { y: 5 } },
  { type: 'door', subtype: 'doorout', label: 'Door (Out)', width: 1, height: 1, padding: 0, offset: { y: 5 } },
  { type: 'door', subtype: 'doortrap', label: 'Door Trap', width: 1, height: 1 },
  { type: 'door', subtype: 'doublearrowdoor', label: 'Double Arrow Door', width: 1, height: 1, padding: 0, offset: { y: 5 } },
  { type: 'door', subtype: 'secret', label: 'Secret Door', width: 1, height: 1, offset: { y: -4 } },

  // ── Traps ──
  { type: 'trap', subtype: 'pittrap', label: 'Pit Trap', width: 1, height: 1 },
  { type: 'trap', subtype: 'speartrap', label: 'Spear Trap', width: 1, height: 1 },
  { type: 'trap', subtype: 'fallingrock', label: 'Falling Rock', width: 1, height: 1 },

  // ── Markers ──
  { type: 'marker', subtype: 'stairway', label: 'Stairway', width: 2, height: 2 },
  ...'abcdefghijklm'.split('').map((letter) => ({
    type: 'marker' as ElementType,
    subtype: letter,
    label: `Marker ${letter.toUpperCase()}`,
    width: 1,
    height: 1,
  })),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
    type: 'marker' as ElementType,
    subtype: String(n),
    label: `Marker ${n}`,
    width: 1,
    height: 1,
  })),
]

export function getCatalogByType(type: ElementType): CatalogEntry[] {
  return CATALOG.filter((entry) => entry.type === type)
}

export function getCatalogEntry(type: ElementType, subtype: string): CatalogEntry | undefined {
  return CATALOG.find((entry) => entry.type === type && entry.subtype === subtype)
}
