# NoReturn – Foundry VTT System (v14) — Version 1.1.8 (English)

Official **Foundry Virtual Tabletop (v14)** system implementation for **NoReturn – Post-Apocalyptic Sci-Fi RPG (1st Edition)** by **Enfalion**.

---

## Installation via Manifest URL

In Foundry VTT v14, navigate to **Game Systems → Install System** and paste the following **Manifest URL**:

```text
https://raw.githubusercontent.com/Enfalion/NoReturn-FoundryVTT/main/system/system.json
```

Direct Release Download:
`https://github.com/Enfalion/NoReturn-FoundryVTT/releases/latest/download/noreturn.zip`

---

## Key Highlights in v1.1.8

1. **Clean Column Alignment for Skills & Style Skills:**
   - Fixed column widths and uniform CSS classes for both header (`<th>`) and body (`<td>`) cells.
   - Steppers (`[-][Input][+]`) for `Level` and `Mod.` as well as dice pools are centered beneath their headers.
2. **Strict Hit Zone Isolation & Armor Value (AV) Calculation per Item:**
   - Separate array instances for `coveredZones` in DataModel prevent shared reference mutation across items.
   - Sheet zone dropdowns and item sheet checkboxes strictly target the exact item via `itemId`.
   - Selectable-zone armor items (*Partielle Panzerungsglieder*) protect exclusively the selected single zone (`selectedZone`).
   - Each armor item applies its Armor Value (AV) and Material Category (MC) strictly to its own active zones.
3. **Clean Armor Sheet Labels:**
   - Redundant label suffixes removed; labels now cleanly display `Panzerung (RW)` / `Armor (AV)` and `Materialkategorie (MK)` / `Material Category (MC)`.

---

## Key Highlights from v1.1.7

1. **Horizontal Action Buttons:**
   - Roll, edit, and delete buttons across all table rows (Skills, Styleskills, Conditions, Weapons, Armor, Gear) are arranged horizontally in a single row with compact `28px × 28px` buttons.
2. **Armor Hit Zones 2 to 12 & Clean Description:**
   - Clickable checkbox chips for Hit Zones 2–12 in the armor sheet.
   - All 22 armor items pre-configured according to CRB pp. 232–235 (including Comfort rating).
   - Inline zone selector in the sheet's armor table for single-zone armors (*Partielle Panzerungsglieder*).
   - Clean description field without raw `<p>` HTML tags.
3. **Melee Weapons, Natural Weapons & Weapon Creation Dialog:**
   - Clicking **"+ Add Weapon"** opens a dialog to select weapon type (*Ranged*, *Melee Short-Distance KW*, *Melee Long-Distance DW*, *Natural Weapon / Bioweapon*).
   - Strength damage formula (including Hazard-Die) and automatic hiding of ranged-only fields.
   - All melee and biological weapons from CRB pp. 64–73, 168–177, and 235–236 added to the compendium.
4. **Complete Equipment Sync with CRB pp. 221–261:**
   - New compendium folders & items for *Explosives*, *Weapon Add-Ons*, *Construction & Crafting*, *Hideout Equipment*, *Games & Entertainment*, *Erotica*, *Cosmetics & Hygiene*, *Robotic Companions* (6 playable companion models in items & bestiary), and *Vehicles* (18 models).
5. **Inline Steppers for Skills & Style Skills:**
   - Adjust skill levels and modifiers directly on the sheet using `-` / `+` buttons or direct input fields.
6. **Hover Tooltips for All Dice Pools:**
   - Transparent tooltips on all primary, secondary attributes, skills, and weapons detailing the exact dice pool breakdown.

---

## Key Features in v1.1.3

1. **Skill Pool Math Fix & Hazard-Die Logic:**
   - Exact dice pool calculation `Effective Attribute + Effective Skill + Situational Bonuses - Situational Penalties` (e.g., `Shooting 5 + Dexterity 2 = 7d6`, rolled as `6d6 + 1d6x6`). The exploding Hazard-Die (`1d6x6`) replaces 1 die of the pool and never reduces the total dice count.
2. **Automatic Weapon Attack & Combat Skill Linking:**
   - Automatically links all 7 core rulebook weapon categories to their matching combat skill (*Schießen*, *Schwere Waffen*, *Projektilwaffen*, *Wurfwaffen*, *Sprühwaffen*, *Nahkampf*, *Waffenkampf*) + *Geschick*.
3. **True Inventory Ammunition Management (Load, Swap, Unload & Dynamic Damage):**
   - **"Load / Swap"** and **"Unload"** buttons on every ranged weapon transfer rounds directly between character inventory items and the weapon magazine (`0/x` to `max`) and dynamically compute damage and penetration from the loaded ammo (`FMJ`, `HS`, `AP`, `AF`, or custom modifiers).
4. **Fire Modes, Shot Count, Recoil Dampening (RD) & Ammo Consumption (CRB p. 60–61):**
   - Supports **Single Shot**, **Bolt-Action (Repetier)**, **Semi-Auto** (selectable trigger pulls `1..X`, recoil `pulls - RD`), **Burst** (*Concentrated Fire* `+10 HP` & Good Hits per 5 margin / *Spread Fire* `+2d6` attack, recoil `bursts - RD`), and **Full Auto** (*Regular* `+RD d6` / *Suppressive Fire* `-2d6`, 3 random hit zones via `2d6`).
5. **Automated Target Combat Flow in Chat:**
   - Interactive Chat workflow: **Attack Roll** → **Target Defense Roll** → **Hit Zone (`2d6`) & Armor/MC Check** → **Damage Resistance (`KO + effective Armor`)** → **Apply Net Damage to Zone**.

1. **PSI Refinement, Pyramid Validation & Live Pool Calculator:**
   - Renamed the main PSI tab to **"PSI"**; PSI Apps now exclusively use **App Tier** (no Hierarchy Tier field on apps).
   - Dynamic lock tooltips/messages on PSI Apps reference the exact required PSI Force name and Hierarchy Tier.
   - Automatic pyramid rule validation for overarching PSI Forces with prominent warning alerts on violation.
   - Overhauled PSI App roll dialog featuring a large live dice pool display and reactive number inputs (`Dynamic Pool`, `Pre-gathered Power Level`, `Target Corridor Adjustment`, `Overexertion Cost`).
2. **Collapsible Dice Spoilers & Hazard-Die Highlighting:**
   - Every roll in the system includes a collapsible **"Show Rolled Dice"** spoiler in Chat with high-contrast visual highlighting for the **Hazard-Die** (`1d6x6`).
3. **Firearms, Magazine Capacity, Caliber Loading System & Armor Penetration:**
   - Numeric magazine capacity (`magazineCapacity`), caliber-matched ammunition selector (`FMJ`, `AP`, `HS`, `AF`), dynamic weapon damage calculation (`+10 HP` for `HS`/`AF`), and armor penetration verification against `MC: A / B / C` during Damage Resistance (Soak) rolls.
4. **Dedicated "Diseases, Poisons & Infection Triggers" Sub-Tab & Dynamic Species Automation:**
   - Clean 3-sub-tab layout under *Skills & Conditions* (*Standard Skills*, *Style Skills*, *Diseases, Poisons & Infection Triggers*).
   - Selecting or changing a species on the Character Sheet immediately applies all species attribute modifiers, attribute maximums, and base stats, and automatically hides the **PSI** tab if the species is not PSI-capable (e.g., *Evo*, *Mutant*).

1. **Initiative Overhaul & Mexican Standoff Dialog:**
   - Binds **Speed + Reaction** (`Schnelligkeit + Reaktion`) into all initiative rolls both from actor sheets and the Foundry Combat Tracker (`NoReturnCombat`).
   - Pure sum evaluation without target numbers (MW) or degrees of success.
   - Pre-roll Initiative Configuration Dialog featuring a **"Mexican Standoff"** checkbox (default: `false`) and situational modifier input (`+/- d6`).
2. **Cyberware & Dynamic Organism Deduction:**
   - Dynamically computes `system.status.organismus.current = system.status.organismus.max - sum(organismCost of all installed cyberware)`.
   - Displays total cyberware organism deduction next to the Organism bar and triggers a critical alert banner when `organismus.current <= 0`.
3. **Style Skills (`styleskill`):**
   - Dedicated sub-tab under *Skills* for all 21 core rulebook Style Skills with drag-and-drop support and automatic skill modifier aggregation.
4. **PSI System (`psiForce`, `psiApp`, `psi.db`, `psi-tables.db`):**
   - Dedicated main tab **PSI & Pyramid** separating overarching PSI Forces (`psiForce`) and 130 concrete PSI Apps (`psiApp`).
   - Enforces the **PSI Pyramid System** across Tiers 1–3 and automatically triggers rolls on **PSI Mishap Tables 1–3** or the **PSI Overload Table** (`psi-tables.db`) in Chat upon failure/fumble.
5. **Hybrid Robotics Sheet (`robot`), Species (`species.db`), Diseases/Toxins (`disease`/`toxin`) & Bestiary (`bestiary.db`):**
   - Full hybrid sheet for robots, androids, and cyborgs with 11 hit zones, chassis status, battery, module sockets, and 5-sense Cybersense matrix.
   - 8 compendium packs organized into thematic folders matching the core rulebook.
