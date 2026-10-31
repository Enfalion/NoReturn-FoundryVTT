# NoReturn – Foundry VTT System (v14) — Version 1.1.1

[![Foundry VTT v14](https://img.shields.io/badge/Foundry_VTT-v14-orange)](https://foundryvtt.com/)
[![Version](https://img.shields.io/badge/Version-1.1.1-blue)](https://github.com/Enfalion/NoReturn-FoundryVTT/releases/latest)
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

## Highlights & Neue Features in Version 1.1.1

### 1. Überarbeitete Initiative, Maßgeschneiderte Würfeldialoge & Saubere Abbruch-Logik
- **6 Spezifische Würfel-Interfaces nach GRW:** Maßgeschneiderte Dialogfenster für **Attributsprobe**, **Fertigkeitsprobe**, **Initiative** (Mexican Standoff + Situationsmodifikator, keine Schwellenwerte), **Waffen-/Angriffsprobe** (Reichweite, Zielzone, Deckung, Feuermodus), **Widerstandsprobe (Krankheit/Gift)** (Giftstufe, Schadensintervall, Zähigkeits-Modifikator) und **PSI-Probe** (dynamischer Würfelpool, Überanstrengungskosten, Zielkorridor).
- **Strikte Abbruch-Logik:** Ein Klick auf „Abbrechen“, `Escape` oder das Schließen-Symbol (`X`) bricht jeden Würfeldialog sauber ab, ohne einen Wurf oder eine Chat-Nachricht auszulösen.

### 2. Cyberware & Dynamischer Organismus-Abzug
- **Dynamische Organismus-Berechnung:** Alle Cyberware- und Robotik-Implantate besitzen die Felder `system.organismCost` und `system.installed`. In `prepareDerivedData()` wird der aktuelle Organismuswert dynamisch berechnet:
  `system.status.organismus.current = system.status.organismus.max - Summe(organismCost aller installierten Implantate)`.
- **Visuelle Anzeige & Warnbanner:** Der gesamte Cyberware-Abzug wird direkt neben der Organismus-Anzeige ausgewiesen. Fällt der aktuelle Organismus auf `0` oder darunter, erscheint ein unübersehbares Warnbanner auf dem Charakter- und Robotikbogen.

### 3. Eigener Styleskills-Unterreiter & Automatische Verrechnung
- **Dedizierter Styleskills-Sub-Tab:** Unter **Fertigkeiten** steht ein eigener Unterreiter für alle **21 Styleskills** (`type: "styleskill"`) bereit.
- **Drag-and-Drop & Passive Boni:** Styleskills lassen sich per Drag-and-Drop aus dem Kompendium hinzufügen; ihre hinterlegten Fertigkeits-Modifikatoren (`skillModifiers`) fließen automatisch in alle relevanten Proben ein.

### 4. Vollständiges PSI-System nach GRW (Kategorie A & B, Hierarchiestufen 1–3 & Dynamischer Würfelpool)
- **Eigener Hauptreiter „PSI & Pyramide“:** Vollständige Trennung in übergeordnete **PSI-Kräfte** (`psiForce`, **Kategorie A** & **Kategorie B**) und **130 konkrete PSI-Apps** (`psiApp`), problemlos per Drag-and-Drop auf den Charakterbogen ziehbar (`defensiveMode` mit `blank: true`).
- **Exakte Hierarchiestufen nach GRW (mit SL-Override):**
  - **Hierarchiestufe 1:** Cryokinese, Elektrokinese, Pyrokinese, Telekinese
  - **Hierarchiestufe 2:** Animakinese, Momenkinese, Photokinese, Psychokinese
  - **Hierarchiestufe 3:** Biokinese, Cronokinese, Morphokinese, Technokinese
- **Dynamischer PSI-Würfelpool & Fehlschlagtabellen (`psi-tables.db`):** Anzeige und freie Auswahl der Würfelanzahl im PSI-Dialog (inkl. Überanstrengungskosten) gegen den exakten Zielkorridor (`8–12`, `11–15`, `15–19`, `19–22`, `23–25`) sowie automatische Auslösung der **PSI-Fehlschlagtabelle 1–3** bzw. **PSI-Overload-Tabelle** bei Fehlschlag.

### 5. Hybrid-Robotikbogen (`robot`), Spezies-System, Krankheiten & Bestiarium
- **Vollwertiger Hybrid-Robotikbogen:** Unterstützt reine Roboter, Androiden und Cyborgs mit 11 Trefferzonen, Chassis-Status, ZEUS-Batterie, Energie-Drain, Modul-Sockeln und 5-Sinne-Cybersense-Matrix.
- **Spezies & Mutationen (`species.db`):** Alle 18 spielbaren Spezies/Subspezies sowie 55 sichtbare/verborgene Mutationen, biologische Abnormitäten und Auffälligkeiten.
- **Krankheiten & Toxine (`disease`, `toxin`, `condition`):** Ein-Klick-Widerstandsproben im Chat gegen die jeweilige Intensität (MW) inklusive Anzeige von Inkubation, Intervall, Symptomen und Gegenmitteln.
- **Bestiarium (`bestiary.db`):** Sofort spielfertige Akteure in den Ordnern *Mutierte Bestien*, *Rivalen & Gesetzlose* sowie *Roboter & Drohnen*.

### 6. Strukturierte Kompendien nach GRW-Schema
Alle 8 Kompendien (`items.db`, `skills.db`, `psi.db`, `psi-tables.db`, `robotics.db`, `species.db`, `bestiary.db`, `macros.db`) sind beim Öffnen in Foundry VTT direkt in übersichtliche Unterordner (`Folder`-Dokumente) gegliedert.
