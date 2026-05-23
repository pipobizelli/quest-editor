export interface MonsterStats {
  subtype: string
  label: string
  movement: number
  attack: number
  defend: number
  body: number
  mind: number
}

export const MONSTER_STATS: MonsterStats[] = [
  // ── Base Game ──
  { subtype: 'goblin', label: 'Goblin', movement: 10, attack: 2, defend: 1, body: 1, mind: 1 },
  { subtype: 'orc', label: 'Orc', movement: 8, attack: 3, defend: 2, body: 1, mind: 2 },
  { subtype: 'fimir', label: 'Fimir', movement: 6, attack: 3, defend: 3, body: 2, mind: 3 },
  { subtype: 'skeleton', label: 'Skeleton', movement: 6, attack: 2, defend: 2, body: 1, mind: 0 },
  { subtype: 'zombie', label: 'Zombie', movement: 5, attack: 2, defend: 3, body: 1, mind: 0 },
  { subtype: 'mummy', label: 'Mummy', movement: 4, attack: 3, defend: 4, body: 2, mind: 0 },
  { subtype: 'chaos', label: 'Chaos Warrior', movement: 7, attack: 4, defend: 4, body: 3, mind: 3 },
  { subtype: 'gargoyle', label: 'Gargoyle', movement: 6, attack: 4, defend: 5, body: 3, mind: 4 },
]

export const HERO_STATS = [
  { subtype: 'barbarian', label: 'Barbarian', movement: 8, attack: 3, defend: 2, body: 8, mind: 2 },
  { subtype: 'dwarf', label: 'Dwarf', movement: 6, attack: 2, defend: 2, body: 7, mind: 3 },
  { subtype: 'elf', label: 'Elf', movement: 8, attack: 2, defend: 2, body: 6, mind: 4 },
  { subtype: 'wizard', label: 'Wizard', movement: 6, attack: 1, defend: 2, body: 4, mind: 6 },
]

export function getMonsterStats(subtype: string): MonsterStats | undefined {
  return MONSTER_STATS.find((m) => m.subtype === subtype)
}

export function formatStatsTable(stats: MonsterStats[]): string {
  const header = 'Name            | Mv | Atk | Def | Body | Mind'
  const divider = '----------------|----|----|-----|------|-----'
  const rows = stats.map((s) =>
    `${s.label.padEnd(16)}| ${String(s.movement).padStart(2)} | ${String(s.attack).padStart(2)} | ${String(s.defend).padStart(3)} | ${String(s.body).padStart(4)} | ${String(s.mind).padStart(4)}`,
  )
  return [header, divider, ...rows].join('\n')
}
