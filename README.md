# NoReturn – Foundry VTT v14 System

Willkommen zum offiziellen System-Repository für das postapokalyptische Sci-Fi-Rollenspiel **NoReturn (1. Edition / Collector's Edition)** für **Foundry Virtual Tabletop (Version 14)**.

Welcome to the system repository for the post-apocalyptic sci-fi tabletop RPG **NoReturn (1st Edition / Collector's Edition)** built for **Foundry Virtual Tabletop (Version 14)**.

---

## 🌐 Dokumentation / Documentation

* 🇩🇪 **[Deutsche Dokumentation (README.de.md)](./README.de.md)** – System-Überblick, Funktionsumfang (Charakter- & Robotikbogen), Würfelmechanik (`W6 + Hazard-Di`), Installationsanleitung für Foundry VTT v14 und Architektur (`./cache` & `./system`).
* 🇬🇧 **[English Documentation (README.en.md)](./README.en.md)** – System overview, feature list (Character & Robotics sheets), dice mechanics (`d6 + Hazard-Die`), Foundry VTT v14 installation guide, and architecture (`./cache` & `./system`).

---

## ⚡ Kurzüberblick / Quick Overview

| Feature | Details |
| :--- | :--- |
| **Foundry VTT Kompatibilität** | Minimum `v14`, Verified `v14` (`ApplicationV2`, `HandlebarsApplicationMixin`, `TypeDataModel`) |
| **Akteur-Typen (`Actor`)** | `character` (Standard-Charakterbogen 1.2 DE), `robot` (Robotikbogen 1. Edition), `npc`, `creature` |
| **Gegenstands-Typen (`Item`)** | `skill` (109 Fertigkeiten, PSI, Style-Skills & Kampfkünste), `weapon` (41 Waffen), `armor` (22 Rüstungen), `gear` (72 Güter & Pharmazeutika), `cyberware` & `robotModule` (25 Augmentierungen) |
| **Sprachen (`i18n`)** | Vollständig lokalisiert in **Deutsch** (`lang/de.json`) und **Englisch** (`lang/en.json`) |
| **Kompendien (`./system/packs/`)** | `skills.db` (109 Einträge), `items.db` (135 Einträge), `robotics.db` (25 Einträge), `macros.db` (4 Makros) |

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
│   │   ├── cyberware.json
│   │   ├── gear.json
│   │   ├── skills.json
│   │   └── weapons.json
│   └── i18n/
│       ├── de.json
│       └── en.json
├── system/                         # Phase 2 & 3: Installierbares Foundry VTT v14 System
│   ├── system.json                 # Foundry VTT v14 System-Manifest
│   ├── lang/                       # Sprachdateien (de.json, en.json)
│   ├── module/
│   │   ├── noreturn.mjs            # System-Einstiegspunkt (Hooks, Registrierung)
│   │   ├── data/                   # TypeDataModel-Klassen (Character, Robot, Items)
│   │   ├── dice/                   # Würfel-Engine (W6 + explodierender Hazard-Di)
│   │   └── sheets/                 # ApplicationV2-Bögen (CharacterSheet, RobotSheet, ItemSheet)
│   ├── packs/                      # Kompilierte Kompendien (skills.db, items.db, robotics.db, macros.db)
│   ├── styles/
│   │   └── noreturn.css            # Endzeit-Sci-Fi-Stylesheet
│   └── templates/                  # Vollständig lokalisierte Handlebars-Templates (.hbs)
├── README.md                       # Zweisprachiger Einstiegspunkt
├── README.de.md                    # Vollständige deutsche Dokumentation
└── README.en.md                    # Complete English documentation
```
