# NoReturn – Foundry VTT System (v14) — Version 1.1.1 (Deutsch)

Offizielle Systemimplementierung des postapokalyptischen Sci-Fi-Rollenspiels **NoReturn (1. Edition)** für **Foundry Virtual Tabletop v14** von **Enfalion**.

---

## Installation über Manifest-URL

Kopiere folgende Manifest-URL in Foundry VTT v14 unter **Spielsysteme → System installieren → Manifest-URL**:

```text
https://raw.githubusercontent.com/Enfalion/NoReturn-FoundryVTT/main/system/system.json
```

Direkter Release-Download:
`https://github.com/Enfalion/NoReturn-FoundryVTT/releases/latest/download/noreturn.zip`

---

## Systemumfang & Neuerungen in v1.1.1

1. **Initiative-Überarbeitung & Mexican-Standoff-Dialog:**
   - Automatische Einbindung von **Schnelligkeit + Reaktion** (inkl. Hazard-Di) sowohl im Charakter-/Robotikbogen als auch im Foundry Combat Tracker (`NoReturnCombat`).
   - Vollständige Entfernung von Mindestwürfen (MW) und Erfolgsgraden bei Initiativewürfen (reine Summenberechnung).
   - Vorgeschalteter Konfigurationsdialog mit Checkbox **„Mexican Standoff“** (Standard: `false`) und situativen Modifikatoren (`+/- W6`).
2. **Cyberware & Dynamischer Organismus-Abzug:**
   - Dynamische Berechnung von `system.status.organismus.current = system.status.organismus.max - Summe(organismCost aller installierten Cyberware-Items)`.
   - Anzeige des Gesamtabzugs neben der Organismus-Leiste und kritisches Warnbanner bei `organismus.current <= 0`.
3. **Styleskills (`styleskill`):**
   - Eigener Sub-Tab unter *Fertigkeiten* für alle 21 Styleskills aus dem Grundregelwerk inklusive automatischer Verrechnung passiver Fertigkeitsboni (`skillModifiers`).
4. **PSI-System (`psiForce`, `psiApp`, `psi.db`, `psi-tables.db`):**
   - Eigener Hauptreiter **PSI & Pyramide** im Charakter- und Robotikbogen.
   - Strikte Validierung des **PSI-Pyramidensystems** für Kräfte und Apps der Stufen 1–3.
   - Zielkorridor-Würfelmechanik (`[targetMin, targetMax]`) mit Kraftstufen `[KS]` und automatischem Wurf auf **PSI-Fehlschlagtabelle 1–3** bzw. **PSI-Overload-Tabelle** bei Fehlschlag/Patzer.
5. **Hybrid-Robotikbogen (`robot`), Spezies (`species.db`), Krankheiten (`disease`/`toxin`) & Bestiarium (`bestiary.db`):**
   - Vollständiger Hybridbogen für Cyborgs, Androiden und Roboter mit Zonen-Tuning, Modul-Sockeln, Batterie und Cybersense.
   - 8 vollständig in thematische Unterordner strukturierte Kompendien nach GRW-Schema.
