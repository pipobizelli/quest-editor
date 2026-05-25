/**
 * HeroQuest game rules as string constants for LLM prompt injection.
 * Each section is a self-contained XML block that plugins can pick from.
 *
 * Source of truth: docs/heroquest-rules.md, heroquest-spells.md, heroquest-armory.md
 */

// ─── Combat ──────────────────────────────────────────────────────────

export const RULES_COMBAT = `\
- Heroes roll 2d6 for movement; monsters have fixed movement values
- On their turn a Hero may MOVE + ACTION or ACTION + MOVE (one action per turn)
- Actions: Attack, Cast a Spell, Search for Treasure, Search for Secret Doors, Search for Traps, Disarm a Trap
- Attack: roll white combat dice equal to weapon's Attack strength; each Skull = 1 hit
- Defend: roll white combat dice equal to Defend value; each White Shield (heroes) or Black Shield (monsters) = 1 block
- Unblocked hits = Body Point damage; Body 0 = dead
- Combat dice faces: 3 Skulls, 2 White Shields (hero defense), 1 Black Shield (monster defense)
- Diagonal attacks only with: Longsword, Halberd, Greatsword, Staff, Spear
- Ranged weapons (Longbow, Crossbow) can fire at any visible monster but NOT adjacent ones
- A Hero may only attack one monster per turn with one weapon
- Monsters attack adjacent heroes only (one per turn); attack strength is innate, not weapon-based
- Undead (Mind 0: Skeleton, Zombie, Mummy) are immune to mind-affecting spells`

// ─── Traps ───────────────────────────────────────────────────────────

export const RULES_TRAPS = `\
- There are 4 kinds of traps: Pit Traps, Falling Block Traps, Spear Traps, Chest/Furniture Traps
- Trap locations are marked in gold on Quest Maps; monsters do NOT spring hidden traps
- Pit Trap: covered hole; Hero falls in, can attack/defend with minimum 1 die; pit is permanent block
- Falling Block Trap: roll 3 combat dice, each Skull = 1 BP damage (no defense); space becomes permanent block
- Spear Trap: roll 1 combat die, Skull = 1 BP damage and ends turn; Shield = dodged, trap removed
- Chest/Furniture Trap: poisonous gas, explosive latch, or poison needle; found when searching for treasure
- Jumping a trap: need 2+ squares of movement remaining, roll 1 die — Skull = spring trap, Shield = jump over
- Disarming: requires Tool Kit (except Dwarf); roll 1 die — Skull = disarmed, Black Shield = sprung but no damage, White Shield = sprung with damage
- Heroes can search for traps (action) before stepping on them
- Once a pit/falling block trap is sprung, it becomes a permanent obstacle`

// ─── Doors & Line of Sight ──────────────────────────────────────────

export const RULES_DOORS_LOS = `\
- All doors start closed; once opened, a door can never be closed again
- Opening a door is part of movement, NOT an action
- When a door is opened, Zargon reveals the room contents (monsters, furniture, traps)
- Line of Sight: draw a line from center of caster's square to center of target's square
- If the line crosses a wall, closed door, or corner of a wall, the target is NOT visible
- Open doors and figures (heroes/monsters) do NOT block line of sight`

// ─── Hero Spells ─────────────────────────────────────────────────────

export const RULES_HERO_SPELLS = `\
- Wizard gets 3 of 4 spell groups (9 spells); Elf gets 1 group (3 spells)
- Each spell may be cast ONCE per Quest; casting uses the Hero's action
- All spells restored between Quests

AIR SPELLS:
  Genie: Open one door anywhere on board OR attack a figure in LoS with 6 dice
  Swift Wind: Target gains Haste 1 next activation OR caster gains Haste 1 immediately
  Tempest: Target in LoS must miss their next Activation

EARTH SPELLS:
  Heal Body: One target in LoS heals up to 4 lost Body Points
  Pass Through Rock: Target ignores Furniture, Walls, Blocked Squares next move
  Rock Skin: Target gains +1 Defend Die until they take Body Point damage

FIRE SPELLS:
  Ball of Flame: Attack; enemy shields count as Skulls (hits instead of blocks)
  Courage: Target gains extra Attack + 2 Defend dice while enemies are in LoS
  Fire of Wrath: Hit any figure ANYWHERE on board; friendly shields count as Skulls

WATER SPELLS:
  Sleep: Target cannot act, rolls no defense; each turn rolls Mind dice, friendly shield = wake up (no effect on Undead)
  Veil of Mist: Target can pass through enemies on next move
  Water of Healing: One target in LoS heals up to 4 lost Body Points`

// ─── Chaos Spells (Zargon) ──────────────────────────────────────────

export const RULES_CHAOS_SPELLS = `\
- Chaos Spells are used by Zargon's special monsters (as noted in Quest Notes)
- 12 Chaos Spells total; each usable once per Quest

AIR ELEMENTAL CHAOS:
  Cloud of Chaos: Target a room in LoS; all figures cannot act; roll Mind dice for sixes to end
  Hurricane: Push target in LoS in straight line away until wall/door/trap (triggers traps!)
  Lightning Bolt: Line of squares from caster to wall; all figures in path lose 2 BP
  Summon Orcs: Roll 1d6 — 1-3: 4 Orcs, 4-5: 5 Orcs, 6: 6 Orcs; placed near caster, activate this turn
  Summon Undead: Roll 1d6 — 1-2: 4 Skeletons, 3-4: 3 Skeletons + 2 Zombies, 5-6: 2 Zombies + 2 Mummies

FIRE ELEMENTAL CHAOS:
  Conflagration: Attack with dice; friendly shields count as Skulls
  Firestorm: Hit all figures in same room (except caster); enemy shields count as Skulls

WATER ELEMENTAL CHAOS:
  Rust: Destroy one item with Metal keyword carried by target in LoS
  Torpor: Target cannot act, no defense; roll Defend Dice equal to Mind for friendly shields to end

CONTROL PHILOSOPHIC CHAOS:
  Command: Control target in LoS; rightful controller rolls Mind dice each turn, sixes end effect
  Fear: Target rolls only 1 Defend Die; roll Mind dice each turn, sixes end effect

PROTECTION PHILOSOPHIC CHAOS:
  Escape: Remove caster from board; reappear at Quest Book location`

// ─── Armory ──────────────────────────────────────────────────────────

export const RULES_ARMORY = `\
WEAPONS (One-Handed):
  Dagger (25gc) — 1 Atk, throwable (lost on throw)
  Shortsword (150gc) — 2 Atk [not Wizard]
  Broadsword (250gc) — 3 Atk [not Wizard]
  Longsword (350gc) — 3 Atk, diagonal [not Wizard]
  Hand Axe (200gc) — 2 Atk, throwable (lost) [not Wizard]

WEAPONS (Two-Handed — no shield):
  Staff (100gc) — 1 Atk, diagonal
  Spear (250gc) — 2 Atk, diagonal, throwable (lost) [not Wizard]
  Halberd (300gc) — 3 Atk, diagonal [not Wizard]
  Battle Axe (450gc) — 4 Atk [not Elf/Wizard]
  Greatsword (550gc) — 4 Atk, diagonal [not Elf/Wizard]
  Crossbow (700gc) — 3 Atk, ranged (not adjacent) [not Barbarian/Elf]
  Longbow (850gc) — 4 Atk, ranged (not adjacent) [not Dwarf/Wizard]

ARMOR:
  Shield (150gc) — +1 Def [not Wizard, not with 2H]
  Helmet (125gc) — +1 Def [not Wizard]
  Chain Mail (500gc) — +1 Def, stackable with Helmet/Shield [not Wizard]
  Plate Mail (850gc) — +2 Def, movement reduced to 1d6, stackable with Helmet/Shield [not Elf/Wizard]

ITEMS:
  Tool Kit (250gc) — 50% chance to disarm unsprung traps [Dwarf doesn't need one]
  Rope (75gc) — chance to avoid sprung pit trap`

// ─── Monster Behavior ────────────────────────────────────────────────

export const RULES_MONSTER_BEHAVIOR = `\
- Zargon moves ALL monsters each turn, after all Heroes have acted
- Each monster: one move + one action (or action + move), same as Heroes
- Monster movement is FIXED (not dice); they must move the full distance or less
- Monsters CAN: move/attack diagonally, open/close doors, share squares, pass over Heroes
- Monsters CANNOT: search for treasure, search for secret doors, move through walls/blocked squares
- Monsters do NOT spring hidden traps
- Monsters are revealed when Heroes open doors or look down corridors
- Each monster may perform one action: ATTACK or CAST A CHAOS SPELL (if noted in Quest Notes)
- Wandering Monsters appear when Heroes draw certain Treasure Cards; placed adjacent to searching Hero`

// ─── Creature Lore (for Narrator) ────────────────────────────────────

export const CREATURE_LORE = `\
GOBLIN: Small, cowardly but cunning green-skinned creatures. They attack in packs, wielding crude scimitars and rusted blades. Their yellow eyes gleam in the dark.
ORC: Muscular, brutish green warriors armored in crude plate. They carry heavy axes and are more disciplined than goblins. Their guttural war cries echo through the stone halls.
FIMIR: Mysterious one-eyed reptilian creatures from the swamps. They carry heavy maces and shields, and their scaly hide gleams wetly in torchlight.
SKELETON: Animated bones held together by dark magic, armed with scythes and rusted weapons. They move with unnatural jerky precision and make no sound but the clatter of bone.
ZOMBIE: Shambling corpses raised by necromancy. Their rotting flesh and hollow eyes inspire dread. They are slow but surprisingly resilient, absorbing blows that would fell the living.
MUMMY: Ancient warriors wrapped in decaying bandages, preserved by dark rituals. They move with ponderous inevitability, their desiccated hands gripping ceremonial weapons.
CHAOS WARRIOR: Elite soldiers of Zargon clad in ornate crimson armor etched with chaos runes. They are skilled, disciplined, and utterly devoted to the forces of darkness.
GARGOYLE: Massive stone-like creatures with bat wings and cruel claws. Once mistaken for mere statuary, they come alive with terrifying speed. Their stony hide deflects most blows.`
