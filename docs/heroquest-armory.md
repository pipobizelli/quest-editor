# HeroQuest — Armory

> Equipment reference for the quest-editor LLM agents. Prices in Gold Coins.

---

## Weapons

### One-Handed Weapons

| Weapon      | Price | Attack Dice | Diagonal | Throwable | Restrictions          |
|-------------|-------|-------------|----------|-----------|-----------------------|
| Dagger      | 25    | 1           | No       | Yes*      | —                     |
| Shortsword  | 150   | 2           | No       | No        | Not Wizard            |
| Broadsword  | 250   | 3           | No       | No        | Not Wizard            |
| Longsword   | 350   | 3           | Yes      | No        | Not Wizard            |
| Hand Axe    | 200   | 2           | No       | Yes*      | Not Wizard            |

*Throwable weapons can be thrown at any monster you can "see", but are **lost once thrown**.

### Two-Handed Weapons

Cannot use a Shield while wielding a two-handed weapon.

| Weapon     | Price | Attack Dice | Diagonal | Ranged | Restrictions              |
|------------|-------|-------------|----------|--------|---------------------------|
| Staff      | 100   | 1           | Yes      | No     | No shield                 |
| Spear      | 250   | 2           | Yes      | Throw* | Not Wizard, no shield     |
| Halberd    | 300   | 3           | Yes      | No     | Not Wizard, no shield     |
| Battle Axe | 450   | 4           | No       | No     | Not Elf/Wizard, no shield |
| Greatsword | 550   | 4           | Yes      | No     | Not Elf/Wizard, no shield |
| Crossbow   | 700   | 3           | —        | Yes**  | Not Barbarian/Elf         |
| Longbow    | 850   | 4           | —        | Yes**  | Not Dwarf/Wizard          |

*Spear can be thrown (lost after throwing).
**Ranged weapons can fire at any visible monster, but **cannot** fire at adjacent monsters. Unlimited ammo.

---

## Armor

| Armor      | Price | Defend Bonus | Restrictions                     | Notes                                         |
|------------|-------|--------------|----------------------------------|-----------------------------------------------|
| Shield     | 150   | +1 Defend    | Not Wizard, not with 2H weapons  | Hand-held armor                               |
| Helmet     | 125   | +1 Defend    | Not Wizard                       | Protective headpiece                          |
| Chain Mail | 500   | +1 Defend    | Not Wizard                       | Combinable with Helmet and/or Shield          |
| Plate Mail | 850   | +2 Defend    | Not Elf/Wizard                   | Movement reduced to 1d6. Combinable with Helmet and Shield |

### Armor Stacking

Armor pieces can be combined:
- **Helmet + Shield** = +2 Defend
- **Chain Mail + Helmet** = +2 Defend
- **Chain Mail + Shield** = +2 Defend
- **Chain Mail + Helmet + Shield** = +3 Defend
- **Plate Mail + Helmet + Shield** = +4 Defend (but only 1d6 movement)

Base Defend for all Heroes = **2 dice**. Armor adds to this.

---

## Items

| Item     | Price | Effect                                                                              |
|----------|-------|-------------------------------------------------------------------------------------|
| Tool Kit | 250   | Allows disarming unsprung traps (50% chance). Required for all Heroes except Dwarf. |
| Rope     | 75    | Chance to avoid a sprung pit trap. See player book for procedure.                   |

---

## Who Can Use What — Quick Reference

| Equipment   | Barbarian | Dwarf | Elf | Wizard |
|-------------|-----------|-------|-----|--------|
| Dagger      | Yes       | Yes   | Yes | Yes    |
| Shortsword  | Yes       | Yes   | Yes | No     |
| Broadsword  | Yes       | Yes   | Yes | No     |
| Longsword   | Yes       | Yes   | Yes | No     |
| Hand Axe    | Yes       | Yes   | Yes | No     |
| Staff       | Yes       | Yes   | Yes | Yes    |
| Spear       | Yes       | Yes   | Yes | No     |
| Halberd     | Yes       | Yes   | Yes | No     |
| Battle Axe  | Yes       | Yes   | No  | No     |
| Greatsword  | Yes       | Yes   | No  | No     |
| Crossbow    | No        | Yes   | No  | Yes    |
| Longbow     | Yes       | No    | Yes | No     |
| Shield      | Yes       | Yes   | Yes | No     |
| Helmet      | Yes       | Yes   | Yes | No     |
| Chain Mail  | Yes       | Yes   | Yes | No     |
| Plate Mail  | Yes       | Yes   | No  | No     |
| Tool Kit    | Yes       | Yes   | Yes | Yes    |
| Rope        | Yes       | Yes   | Yes | Yes    |

---

## Tactical Notes (for Strategist Agent)

### Best Loadouts by Hero

**Barbarian** (8 Body, 2 Mind — melee powerhouse):
- Early: Broadsword (free) + Shield (150) + Helmet (125) = 3 Atk / 5 Def
- Mid: Longsword (350) + Shield + Helmet + Chain Mail = 3 Atk / 6 Def (diagonal)
- Late: Greatsword (550) + Plate Mail + Helmet = 4 Atk / 6 Def (1d6 movement)

**Dwarf** (7 Body, 3 Mind — durable, innate trap disarm):
- Early: Shortsword (free) + Shield (150) = 2 Atk / 4 Def
- Mid: Longsword (350) + Shield + Chain Mail + Helmet = 3 Atk / 6 Def
- Late: Greatsword (550) + Plate Mail + Helmet = 4 Atk / 6 Def

**Elf** (6 Body, 4 Mind — hybrid fighter/caster):
- Early: Shortsword (free) + Shield (150) = 2 Atk / 4 Def
- Mid: Longsword (350) + Chain Mail + Helmet = 3 Atk / 5 Def
- Late: Longbow (850) = 4 Atk ranged + spells for support

**Wizard** (4 Body, 6 Mind — fragile spellcaster):
- Early: Dagger (free) + Staff (100) = 1 Atk diagonal (safe position)
- Mid: Crossbow (700) = 3 Atk ranged
- Note: Cannot wear any armor except base 2 Defend
