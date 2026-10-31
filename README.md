# NoReturn – Foundry VTT v14 System (v1.1.0)

Willkommen zum offiziellen System-Repository für das postapokalyptische Sci-Fi-Rollenspiel **NoReturn (1. Edition / Collector's Edition)** für **Foundry Virtual Tabletop (Version 14)**.

Welcome to the system repository for the post-apocalyptic sci-fi tabletop RPG **NoReturn (1st Edition / Collector's Edition)** built for **Foundry Virtual Tabletop (Version 14)**.

---

## 🌐 Dokumentation / Documentation

* 🇩🇪 **[Deutsche Dokumentation (README.de.md)](./README.de.md)** – System-Überblick, Funktionsumfang (Charakter- & Hybrid-Robotikbogen, Spezies/Mutationen, Krankheiten & Bestiarium), Würfelmechanik (`W6 + Hazard-Di`), Installationsanleitung für Foundry VTT v14 und Architektur (`./cache` & `./system`).
* 🇬🇧 **[English Documentation (README.en.md)](./README.en.md)** – System overview, feature list (Character & Hybrid Robotics sheets, Species/Mutations, Diseases & Bestiary), dice mechanics (`d6 + Hazard-Die`), Foundry VTT v14 installation guide, and architecture (`./cache` & `./system`).

---

## ⚡ Kurzüberblick / Quick Overview

| Feature | Details |
| :--- | :--- |
| **Foundry VTT Kompatibilität** | Minimum `v14`, Verified `v14` (`ApplicationV2`, `HandlebarsApplicationMixin`, `TypeDataModel`) |
| **Akteur-Typen (`Actor`)** | `character` (Standard-Charakterbogen 1.2 DE), `robot` (Hybrider Charakter- & Robotikbogen), `npc`, `creature` |
| **Gegenstands-Typen (`Item`)** | `skill`, `weapon`, `armor`, `gear`, `consumable` (Drogen & Pharmazeutika), `cyberware`, `robotModule`, `species` (Spielbare Spezies), `mutation` (Mutationen & Abnormitäten), `trait` (Charaktermerkmale), `condition` (Krankheiten & Toxine) |
| **Sprachen (`i18n`)** | Vollständig lokalisiert in **Deutsch** (`lang/de.json`) und **Englisch** (`lang/en.json`) |
| **Kompendien (`./system/packs/`)** | `items.db` (6 Ordner, 145 Items), `skills.db` (4 Ordner, 173 Items), `robotics.db` (3 Ordner, 27 Items), `species.db` (4 Ordner, 73 Items), `bestiary.db` (3 Ordner, 15 Akteure), `macros.db` (4 Makros) |

---

## 📁 Projektstruktur / Project Structure

```text
.
├── cache/                          # Phase 1: Extrahierte Regeln, JSON-Rohdaten & i18n-Basis
│   ├── mechanics.md                # Vollständige Dokumentation der NoReturn-Kernmechaniken
│   ├── data/
│   │   ├── actor-character-schema.json
│   │   ├── actor-robot-schema.json
│   │   ├── armor.json
│   │   ├── bestiary.json
│   │   ├── conditions.json
│   │   ├── consumables.json
│   │   ├── cyberware.json
│   │   ├── gear.json
│   │   ├── skills.json
│   │   ├── species.json
│   │   ├── traits.json
│   │   └── weapons.json
│   └── i18n/
│       ├── de.json
│       └── en.json
├── system/                         # Phase 2 & 3: Installierbares Foundry VTT v14 System
│   ├── system.json                 # Foundry VTT v14 System-Manifest (v1.1.0)
│   ├── lang/                       # Sprachdateien (de.json, en.json)
│   ├── module/
│   │   ├── noreturn.mjs            # System-Einstiegspunkt (Hooks, Registrierung)
│   │   ├── data/                   # TypeDataModel-Klassen (Character, Hybrid Robot, 11 Item-Typen)
│   │   ├── dice/                   # Würfel-Engine (W6 + Hazard-Di, Krankheits-/Giftwiderstand)
│   │   └── sheets/                 # ApplicationV2-Bögen (CharacterSheet, RobotSheet, ItemSheet)
│   ├── packs/                      # Kompilierte Kompendien mit Folder-Hierarchie (*.db)
│   ├── styles/
│   │   └── noreturn.css            # Endzeit-Sci-Fi-Stylesheet
│   └── templates/                  # Vollständig lokalisierte Handlebars-Templates (.hbs)
├── README.md                       # Zweisprachiger Einstiegspunkt
├── README.de.md                    # Vollständige deutsche Dokumentation
└── README.en.md                    # Complete English documentation
```
