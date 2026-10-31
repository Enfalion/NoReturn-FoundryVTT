# NoReturn – Foundry VTT v14 System (English Documentation)

This project implements the complete ruleset of **NoReturn (1st Edition / Collector's Edition)** as a native game system for **Foundry Virtual Tabletop v14**. It leverages the modern Foundry v14 architecture (`foundry.abstract.TypeDataModel` and `ApplicationV2` with `HandlebarsApplicationMixin`).

---

## 1. System Overview & Features

### 1.1 Standard Character Sheet (`character`, `npc`, `creature`)
Modeled after the official *Character Sheet 1.2 (DE)*:
- **Primary Attributes:** `Dexterity (GE)`, `Strength (ST)`, `Constitution (KO)`, `Speed (SK)`, `Knowledge (WI)`, and `Perception (WA)` with modifiers, overall totals, and toggleable *Alpha Biomechanics* (converts all attribute dice into exploding *Hazard-Dice*).
- **Secondary & Special Attributes:** `Charisma (CH)`, `Logic (LO)`, `Vehicles (FA)`, `Pain Tolerance (TO)`, and `Adrenaline` (`Level` and active `Pool`).
- **Condition & Resources:** `Notoriety (Bekanntheit)` (100–1), `Reputation (Ruf)`, `Organism` (including *Afflictions 1–3*), `Psyche`, rollable `Infection Resistance` (without Hazard-Die), `Natural Regeneration`, `Experience (XP)`, `Justice Points (JP)`, `Chaos Points (CP)`, and `Cash (N$)`.
- **Automated Derived Calculations (`prepareDerivedData`):**
  - **Carry Capacity:** `(Strength + Lifting) × 10 kg`.
  - **11 Hit Zones (`2` to `12`):** Selectable toughness tier (`30 HP` Mortal, `50 HP` Robotics & Tough, `70 HP` Incredibly Tough, `90 HP` Epic Resistance).
  - **Pain Tolerance & Wound Penalties:** Automatically calculates the wound stage (`10 stages` per zone) and subtracts `Pain Tolerance` in each damaged zone.
  - **Armor Integration:** Equipped armor items automatically apply their `Armor Value (RW)` and `Material Category (MK)` to covered hit zones and calculate movement penalties when `Comfort > Constitution`.
  - **Unconsciousness & Immobilization Alerts:** Displays automatic status warnings when `Total Penalties >= Speed` (immobilized) or `Total Penalties >= Constitution` (unconscious).

### 1.2 Robotics Sheet (`robot`)
Modeled after the official *Robotics Sheet (1st Edition)*:
- **Zone-Based Robotics Management** across all 11 body zones (`(12) Head`, `(6) R. Chest`, `(8) L. Chest`, `(7) Abdomen`, `(5) R. Arm`, `(9) L. Arm`, `(2) Pelvis`, `(4) R. Thigh`, `(10) L. Thigh`, `(3) R. Lower Leg`, `(11) L. Lower Leg`).
- **Official Robotics Models:** `Biological/Normal`, `Casual (Steel/Dark)`, `Work (Industrial/Brutal)`, `High Tech (Pearl)`, `Android (Skin)`, and `Military (Army/Ghost)` with exact base stats, capacities, armor values, and organism loss.
- **Per-Zone Tuning Upgrades:** Individual level upgrades for `Dexterity`, `Strength`, `Constitution`, `Speed`, `Touch (Smart-Skin)`, and `Armor (+5 pts)` with automatic tracking of remaining zone capacity (`Free / Max`).
- **All-Over Attributes:** Automatic calculation of the rounded average (`round(Sum / 11)`) across all 11 body zones for `DEX`, `STR`, `CON`, `SPD`, and `Touch`, plus `Total Organism Loss`. Both individual zone stats and All-Over stats are directly clickable to trigger rolls.
- **Perception & Cybersense:** Tracks `Sight [Oculus]`, `Hearing [Auris]`, `Smell [Odoratus]`, `Taste [Gustatus]`, and `Touch [Smart-Skin]` to compute `All-Over Perception` (`round(Sum / 5)`).

### 1.3 Dice & Combat Engine (`./system/module/dice/roll.mjs`)
- **d6 Pool + Hazard-Die (`1d6x6`):** Every regular attribute or skill check includes one exploding *Hazard-Die* (explodes and adds on `6`). Supports *Alpha Biomechanics* (all attribute dice explode) and *Beta Biomechanics* (all skill dice explode).
- **Interactive Roll Dialog (`DialogV2`):** Configure difficulty (`Routine MW 5` to `Legendary MW 40`), temporary bonus/penalty dice, spend up to `5 Adrenaline dice` (automatically deducted from the actor's pool), `Combat Disadvantages (-2d6)`, and Burst/Auto mode (`+1d6 bonus damage per 5 instead of 10 margin points`). Hold `Shift + Click` to bypass the dialog for fast rolls.
- **Fumbles & Good Hits:** Automatic detection of critical fumbles (`Total < 5`) and calculation of *Good Hits* (`+1d6 bonus damage` per 10 or 5 points of margin).
- **Hit Zones (`2d6`) & Damage Resistance (`CON + AV`):** Rollable directly from the sheet or weapon damage chat cards.

---

## 2. Foundry VTT v14 Installation Guide

1. Open the user data directory of your Foundry VTT v14 installation (`<FoundryUserData>/Data/systems/`).
2. Create a new directory named `noreturn`:
   ```bash
   mkdir -p <FoundryUserData>/Data/systems/noreturn
   ```
3. Copy all contents of the `./system/` folder into that directory:
   ```bash
   cp -r ./system/* <FoundryUserData>/Data/systems/noreturn/
   ```
4. Restart Foundry VTT (Version 14). The system **NoReturn – Endzeit Rollenspiel (1st Edition)** will appear under *Game Systems* and can be selected when creating a new world.

---

## 3. Compendium Packs (`./system/packs/`)

The system includes four pre-compiled compendium packs:
1. **NoReturn Skills, PSI & Martial Arts (`skills.db`):** All 109 standard skills, special skills, PSI powers, Style Skills, and multi-tier Martial Arts. Drag-and-drop onto a Character or Robotics sheet (dropping an existing skill automatically increments its level).
2. **NoReturn Weapons, Armor & Gear (`items.db`):** 135 items (all close-combat weapons, reach weapons, sidearms, rifles, heavy weapons, protective clothing/armor, pharmaceuticals/drugs, ammunition, explosives, weapon add-ons, crafting tools, and hideout equipment).
3. **NoReturn Robotics, Cyberware & Biomechanics (`robotics.db`):** 25 augmentations (Alpha/Beta Biomechanics, Robotics chassis models Casual/Work/High Tech/Android/Military, zone upgrades, Cybersense, and implants).
4. **NoReturn System Macros (`macros.db`):** 4 quick-access hotbar macros (*Standard Dice Check*, *Roll Hit Zone 2d6*, *Mexican Standoff Initiative*, *Damage Resistance Soak*).

---

## 4. Architecture & Extraction Cache (`./cache/`)

The build separates extracted rules data (`./cache/`) from runtime Foundry VTT v14 code (`./system/`):
- `./cache/mechanics.md`: Complete reference of extracted core mechanics and formulas from the Corebook.
- `./cache/data/*.json`: Structured JSON datasets for skills, weapons, armor, gear, cyberware/robotics, and Actor JSON schemas.
- `./cache/i18n/de.json` & `en.json`: Complete German and English localization dictionaries.
