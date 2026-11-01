# NoReturn – Foundry VTT System (v14) — Version 1.1.2 (Deutsch)

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

## Systemumfang & Neuerungen in v1.1.2

1. **PSI-Feinschliff, Pyramiden-Validierung & Live-Pool-Rechner:**
   - Umbenennung des Hauptreiters in **„PSI“**; PSI-Apps besitzen ausschließlich eine **App-Stufe** (keine eigene Hierarchiestufe).
   - Dynamische Sperr-Meldungen bei PSI-Apps verknüpfen exakt den Namen und die Hierarchiestufe der benötigten PSI-Kraft.
   - Automatische Pyramiden-Validierung für übergeordnete PSI-Kräfte inkl. Warnhinweis bei Regelverstößen.
   - Überarbeiteter PSI-App-Würfeldialog mit großem Live-Würfelpool-Rechner und reaktiven Zähler-Inputs (`Dynamischer Pool`, `Vorab gesammelte Kraftstufe`, `Zielkorridor-Änderung / Anpassung`, `Überanstrengungskosten`).
2. **Aufklappbare Würfel-Spoiler & Hazard-Die-Hervorhebung:**
   - Alle Würfelproben im System verfügen über den einklappbaren Spoiler **„Gewürfelte Würfel anzeigen“** mit leuchtender Hervorhebung des **Hazard-Die** (`1d6x6`).
3. **Schusswaffen, Magazin-Kapazität, Kaliber-Ladesystem & Panzerungsdurchschlag:**
   - Numerische Magazinkapazität (`magazineCapacity`), Munitions-Dropdown nach Kaliber (`FMJ`, `AP`, `HS`, `AF`), dynamische Schadensberechnung (`+10 TP` bei `HS`/`AF`) und Rüstungsdurchschlags-Prüfung gegen `MK: A / B / C` beim Schadenswiderstand.
4. **Dritter Unterreiter „Krankheiten, Gifte & Infektions-Trigger“ & Dynamische Spezies-Automatik:**
   - Eigener 3. Sub-Tab unter *Fertigkeiten & Krankheiten* (keine doppelte Anzeige mehr).
   - Sofortige Übernahme aller Spezies-Modifikatoren, Attributs-Maximalwerte und Basiswerte bei Spezies-Wechsel sowie automatisches Ausblenden des PSI-Reiters bei Spezies ohne PSI-Fähigkeit (z. B. *Evo*, *Mutant*).

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
