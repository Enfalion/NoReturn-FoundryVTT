# NoReturn – Foundry VTT v14 System (English Documentation)

This project implements the complete ruleset of **NoReturn (1st Edition / Collector's Edition)** as a native game system for **Foundry Virtual Tabletop v14**. It leverages the modern Foundry v14 architecture (`foundry.abstract.TypeDataModel` and `ApplicationV2` with `HandlebarsApplicationMixin`).

---

## 1. System Overview & Features

### 1.1 Standard Character Sheet (`character`, `npc`, `creature`)
Modeled after the official *Character Sheet 1.2 (DE)*:
- **Primary Attributes:** `Dexterity (GE)`, `Strength (ST)`, `Constitution (KO)`, `Speed (SK)`, `Knowledge (WI)`, and `Perception (WA)` with modifiers, overall totals, and toggleable *Alpha Biomechanics* (converts all attribute dice into exploding *Hazard-Dice*).
- **Secondary & Special Attributes:** `Charisma (CH)`, `Logic (LO)`, `Vehicles (FA)`, `Pain Tolerance (TO)`, and `Adrenaline` (`Level` and active `Pool`).
- **Item-Driven Species, Mutations, Traits & Pharmaceuticals:**
  - **Active Species Dropdown & `species` Items:** Choose the active species (`Mensch`, `Adivasi`, `Evo`, `Mutant`, `Zeneritone`, `Prodigy`, `Blendling`) directly on the sheet or drag-and-drop from `species.db`. Dynamically calculates attribute limits, base stats (`Psyche`, `Organism`, `Adrenaline`, `Infection Resistance`), and skill bonuses.
  - **Mutations & Abnormalities (`mutation`):** Visible and hidden mutations, biological abnormalities, and peculiarities dynamically modify attributes, natural armor, hit points, regeneration, and skills.
  - **Character Traits (`trait`):** Positive Justice traits, negative Chaos traits, aptitudes, and talents with automatic passive skill and attribute modifiers.
  - **Drugs & Pharmaceuticals (`consumable`):** Toggleable active state for stimulants and medical compounds with dosage, duration, addiction rating, and automatic stat boosts/drawbacks.
  - **Diseases & Toxins (`condition`):** Incubation time, test interval, intensity, symptom stages, and an interactive **Resistance Check Trigger** (`NoReturnRoll.rollConditionResistance`) directly from the sheet into chat.

### 1.2 Hybrid Robotics Sheet (`robot`)
The Robotics Sheet uses a **Hybrid Actor Architecture** that combines all standard player character features with the official *Robotics Sheet (1st Edition)*:
- **Full Character Attributes & Skills:** Includes all primary, secondary, and derived attributes plus the complete skill, weapon, armor, and gear tabs of the standard character sheet (all attributes and skills can be rolled directly from the robotics view).
- **Dedicated Robotics & Chassis Dashboard:**
  - **Chassis Status**, **Power Supply / Reactor**, **Battery / Power Reserve**, **Module Sockets** (`Used / Max / Free`), **Energy Drain** (`Base + Modules`), and **Structural Hitpoints**.
- **11-Zone Robotics Tuning:** Per-zone configuration (`Biological/Normal`, `Casual`, `Work`, `High Tech`, `Android`, `Military`), level upgrades, `All-Over Attributes` (`round(Sum / 11)`), and `Cybersense Perception` (`round(Sum / 5)`).

### 1.3 Dice & Combat Engine (`./system/module/dice/roll.mjs`)
- **d6 Pool + Hazard-Die (`1d6x6`):** Supports standard checks, *Alpha Biomechanics*, and *Beta Biomechanics*.
- **Interactive Roll Dialog (`DialogV2`):** Difficulty (`Routine MW 5` to `Legendary MW 40`), bonus/penalty dice, `Adrenaline dice`, `Combat Disadvantages (-2d6)`, and Burst/Auto mode.
- **Disease & Toxin Resistance Check (`rollConditionResistance`):** Automatically evaluates resistance rolls against the condition's `Intensity (MW)` and outputs symptom stages, damage, penalties, and antidotes on failure.

---

## 2. Compendium Packs & Folder Hierarchy (`./system/packs/`)

All compendium packs are organized with Foundry v14 `Folder` documents (`folder: "<folder_id>"`):

1. **Weapons, Armor & Gear (`items.db`):**
   - `Nahkampfwaffen` (Melee Weapons)
   - `Fernkampfwaffen` (Ranged Weapons)
   - `Rüstungen & Schutzkleidung` (Armor)
   - `Drogen & Pharmazeutika` (Drugs / Consumables)
   - `Alltägliche Ausrüstung & Werkzeuge` (Gear)
   - `Cyberware & Implantate` (Cyberware)
2. **Skills, PSI & Martial Arts (`skills.db`):**
   - `Standardfertigkeiten` (Standard Skills)
   - `PSI-Kräfte & Disziplinen` (PSI Powers)
   - `Charaktermerkmale` (Character Traits)
   - `Krankheiten & Toxine` (Diseases & Toxins)
3. **Robotics, Cyberware & Biomechanics (`robotics.db`):**
   - `Chassis & Rahmen` (Chassis & Frames)
   - `Erweiterungsmodule` (Expansion Modules)
   - `Sensoren & Prozessoren` (Sensors & Processors)
4. **Species, Mutations & Abnormalities (`species.db`):**
   - `Spielbare Spezies` (Playable Species)
   - `Mutationen (Sichtbar & Verborgen)` (Visible & Hidden Mutations)
   - `Biologische Abnormitäten` (Biological Abnormalities)
   - `Auffälligkeiten` (Peculiarities)
5. **Creatures & NPCs (`bestiary.db`):**
   - `Mutierte Bestien` (Mutated Beasts)
   - `Rivalen & Gesetzlose` (Rivals & Outlaws)
   - `Roboter & Drohnen` (Robots & Drones)
6. **System Macros (`macros.db`):** 4 quick-access hotbar macros.

---

## 3. Foundry VTT v14 Installation Guide

1. Open the user data directory of your Foundry VTT v14 installation (`<FoundryUserData>/Data/systems/`).
2. Create a new directory named `noreturn`:
   ```bash
   mkdir -p <FoundryUserData>/Data/systems/noreturn
   ```
3. Copy all contents of the `./system/` folder into that directory:
   ```bash
   cp -r ./system/* <FoundryUserData>/Data/systems/noreturn/
   ```
4. Restart Foundry VTT (Version 14).
