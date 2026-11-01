# NoReturn – Foundry VTT System (v14) — Version 1.1.2 (English)

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

## Key Features in v1.1.2

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
