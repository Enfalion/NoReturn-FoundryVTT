# NoReturn – Foundry VTT System (v14) — Version 1.1.0

[![Foundry VTT v14](https://img.shields.io/badge/Foundry_VTT-v14-orange)](https://foundryvtt.com/)
[![Version](https://img.shields.io/badge/Version-1.1.0-blue)](https://github.com/Enfalion/NoReturn-FoundryVTT/releases/latest)
[![Author](https://img.shields.io/badge/Autor-Enfalion-success)](https://github.com/Enfalion/NoReturn-FoundryVTT)

Offizielle **Foundry Virtual Tabletop (Version 14)** Systemimplementierung für **NoReturn – Das Endzeit-Rollenspiel (1. Edition)**.

- **Deutsch:** [README.de.md](README.de.md)
- **English:** [README.en.md](README.en.md)

---

## Schnellinstallation über Manifest-URL (Foundry VTT v14)

1. Öffne **Foundry VTT (v14)** und wechsle im Hauptmenü auf den Reiter **Game Systems (Spielsysteme)**.
2. Klicke unten auf **Install System (System installieren)**.
3. Füge im Feld **Manifest URL** exakt folgende URL ein:
   ```text
   https://raw.githubusercontent.com/Enfalion/NoReturn-FoundryVTT/main/system/system.json
   ```
4. Klicke auf **Install (Installieren)**. Foundry VTT lädt automatisch das aktuelle Release-Paket (`noreturn.zip`) herunter und richtet das System ein.

---

## Highlights & Neue Features in Version 1.1.0

### 1. Überarbeitete Initiative & Mexican-Standoff-Dialog
- **Reaktion in Initiative integriert:** Sowohl über den Charakter-/Robotikbogen als auch direkt über den Foundry VTT Combat Tracker (`NoReturnCombat`) fließt die Fertigkeit **Reaktion** automatisch in die Initiativeformel ein (`Schnelligkeit + Reaktion` W6 inklusive 1 Hazard-Di).
- **Reine Summe ohne Mindestwurf:** Bei Initiativewürfen werden keinerlei Schwellenwerte (MW) oder Erfolgsgrade mehr abgefragt – es zählt ausschließlich die gewürfelte Gesamtsumme.
- **Konfigurationsdialog vor jedem Initiativewurf:** Vor jedem Wurf öffnet sich ein Dialog mit einer Checkbox **„Mexican Standoff“** (Standard: deaktiviert) sowie einem Eingabefeld für situative Modifikatoren (`+/- W6`).

### 2. Cyberware & Dynamischer Organismus-Abzug
- **Dynamische Organismus-Berechnung:** Alle Cyberware- und Robotik-Implantate besitzen die Felder `system.organismCost` und `system.installed`. In `prepareDerivedData()` wird der aktuelle Organismuswert dynamisch berechnet:
  `system.status.organismus.current = system.status.organismus.max - Summe(organismCost aller installierten Implantate)`.
- **Visuelle Anzeige & Warnbanner:** Der gesamte Cyberware-Abzug wird direkt neben der Organismus-Anzeige ausgewiesen. Fällt der aktuelle Organismus auf `0` oder darunter, erscheint ein unübersehbares Warnbanner auf dem Charakter- und Robotikbogen.

### 3. Eigener Styleskills-Unterreiter & Automatische Verrechnung
- **Dedizierter Styleskills-Sub-Tab:** Unter **Fertigkeiten** steht ein eigener Unterreiter für alle **21 Styleskills** (`type: "styleskill"`) bereit.
- **Drag-and-Drop & Passive Boni:** Styleskills lassen sich per Drag-and-Drop aus dem Kompendium hinzufügen; ihre hinterlegten Fertigkeits-Modifikatoren (`skillModifiers`) fließen automatisch in alle relevanten Proben ein.

### 4. Vollständiges PSI-System (Eigener Hauptreiter, Apps, Pyramide & Fehlschlagtabellen)
- **Eigener Hauptreiter „PSI & Pyramide“:** Vollständige Trennung von normalen Fertigkeiten in übergeordnete **PSI-Kräfte** (`psiForce`, 12 Kategorie-A-Kräfte + Kategorie B HMO) und **130 konkrete PSI-Apps** (`psiApp`).
- **PSI-Pyramidensystem-Validierung:** Automatische Prüfung der Pyramidenregel beim Drag-and-Drop und beim Aktivieren/Würfeln (um eine Kraft oder App der Stufe 2 bzw. 3 zu erlernen/aktivieren, müssen jeweils mindestens 2 Kräfte bzw. Apps der darunterliegenden Stufe beherrscht werden).
- **Zielkorridor-Proben & Automatische Fehlschlagtabellen (`psi-tables.db`):** PSI-Apps würfeln direkt gegen ihren Zielkorridor (z. B. `8–12`, `11–15`, `15–19`, `19–22`, `23–25`) inklusive Kraftstufen `[KS]` und Meisterschafts-Reroll. Bei einem Patzer außerhalb des Zielkorridors wird automatisch die passende **PSI-Fehlschlagtabelle 1–3** bzw. **PSI-Overload-Tabelle** im Chat ausgelöst.

### 5. Hybrid-Robotikbogen (`robot`), Spezies-System, Krankheiten & Bestiarium
- **Vollwertiger Hybrid-Robotikbogen:** Unterstützt reine Roboter, Androiden und Cyborgs mit 11 Trefferzonen, Chassis-Status, ZEUS-Batterie, Energie-Drain, Modul-Sockeln und 5-Sinne-Cybersense-Matrix.
- **Spezies & Mutationen (`species.db`):** Alle 18 spielbaren Spezies/Subspezies sowie 55 sichtbare/verborgene Mutationen, biologische Abnormitäten und Auffälligkeiten.
- **Krankheiten & Toxine (`disease`, `toxin`, `condition`):** Ein-Klick-Widerstandsproben im Chat gegen die jeweilige Intensität (MW) inklusive Anzeige von Inkubation, Intervall, Symptomen und Gegenmitteln.
- **Bestiarium (`bestiary.db`):** Sofort spielfertige Akteure in den Ordnern *Mutierte Bestien*, *Rivalen & Gesetzlose* sowie *Roboter & Drohnen*.

### 6. Strukturierte Kompendien nach GRW-Schema
Alle 8 Kompendien (`items.db`, `skills.db`, `psi.db`, `psi-tables.db`, `robotics.db`, `species.db`, `bestiary.db`, `macros.db`) sind beim Öffnen in Foundry VTT direkt in übersichtliche Unterordner (`Folder`-Dokumente) gegliedert.
