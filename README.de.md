# NoReturn – Foundry VTT System (v14) — Version 1.1.7 (Deutsch)

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

## Highlights & Neuerungen in v1.1.7

1. **Horizontale Action-Buttons:**
   - Würfel-, Bearbeiten- und Löschen-Buttons sind in allen Tabellenzeilen (Fertigkeiten, Styleskills, Krankheiten, Waffen, Rüstungen, Ausrüstung) horizontal nebeneinander als kompakte `28px × 28px` Buttons angeordnet.
2. **Rüstungen & Kleidung mit Trefferzonen 2 bis 12:**
   - Clickable Checkbox-Chips für Trefferzonen 2–12 im Rüstungs-Sheet.
   - Alle 22 Rüstungen nach GRW S. 232–235 vorkonfiguriert (inkl. Komfort-Wert).
   - Inline-Zonenauswahl direkt in der Rüstungstabelle für Teilpanzerungen (*Partielle Panzerungsglieder*).
   - Bereinigtes Notiz-/Beschreibungsfeld ohne HTML-Tags.
3. **Nahkampfwaffen & Natürliche Waffen:**
   - Neuer Auswahldialog beim Hinzufügen von Waffen (*Fernkampf*, *Kurzdistanz KW*, *Distanzwaffe DW*, *Natürliche Waffe*).
   - Stärke-Schadensformel (inkl. Hazard-Di) und Ausblendung von Fernkampffeldern.
   - Alle Nahkampf- und Biowaffen aus GRW S. 64–73, 168–177 und 235–236 im Kompendium ergänzt.
4. **Kompletter Ausrüstungsabgleich GRW S. 221–261:**
   - Neue Ordner & Items für *Sprengstoffe*, *Waffen Add-Ons*, *Konstruktion & Crafting*, *Hort-Ausstattung*, *Spiel & Unterhaltung*, *Erotika*, *Kosmetik & Hygiene*, *Robotische Gefährten* (6 spielbare Modelle in Items und Bestiarium) sowie *Fahrzeuge* (18 Modelle).
5. **Inline-Stepper für Fertigkeiten & Styleskills:**
   - Stufen und Modifikatoren direkt auf dem Bogen per `−` / `+` Buttons oder Direkteingabe anpassbar.
6. **Mouseover-Tooltips für Würfelpools:**
   - Hover-Tooltips für alle Primär-, Sekundär-Attribute, Fertigkeiten und Waffen mit genauer Aufschlüsselung der Würfel-Zusammensetzung.

---

## Systemumfang & Neuerungen in v1.1.3

1. **Korrektur der Fertigkeits-Pool-Berechnung (Off-by-One / Hazard-Di Fix):**
   - Exakte Pool-Mathematik `Attributswert (effektiv) + Fertigkeitswert (effektiv) + situative Boni - situative Mali` (z. B. `Schießen 5 + Geschick 2 = 7W6`, gerollt als `6d6 + 1d6x6`). Der Hazard-Di ersetzt exakt 1 Würfel des Pools und zieht keinen Würfel ab.
2. **Automatische Verknüpfung von Waffen-Angriffsproben mit Kampffertigkeiten:**
   - Alle 7 GRW-Kampffertigkeiten (*Schießen*, *Schwere Waffen*, *Projektilwaffen*, *Wurfwaffen*, *Sprühwaffen*, *Nahkampf*, *Waffenkampf*) werden automatisch mit `Geschick` und dem Waffenbonus zum Angriffs-Pool verknüpft.
3. **Echtes Inventar-Munitions-Management (Laden, Wechseln, Entladen & Dynamischer Schaden):**
   - Buttons **„Laden / Wechseln“** und **„Entladen“** an jeder Fernkampfwaffe transferieren Patronen echt zwischen Charakterinventar und Waffenmagazin (`0/x` bis `max`) und berechnen Schaden und Durchschlag dynamisch anhand der geladenen Munition (`FMJ`, `HS`, `AP`, `AF` oder eigene Schadens-Modifikatoren).
4. **Feuermodi, Schussanzahl, Rückstoßdämpfung (RD) & Munitionsverbrauch (GRW S. 60–61):**
   - Unterstützt **Einzelschuss**, **Repetier**, **Semiautomatik** (wählbare Abzüge `1..X`, Rückstoß `Abzüge - RD`), **Burst** (*Konzentriertes Feuer* `+10 TP` & Gute Treffer je 5 Pkt. / *Streufeuer* `+2W6` Angriff, Rückstoß `Bursts - RD`) und **Vollautomatik** (*Regulär* `+RD W6` / *Sperrfeuer* `-2W6`, 3 Zufallszonen à `2W6`).
5. **Automatisierter Target-Kampfablauf aus dem Chat:**
   - Interaktiver Workflow: **Angriff** → **Verteidigung würfeln** → **Trefferzone (`2W6`) & Rüstungs-/MK-Prüfung** → **Schadenswiderstand (`KO + effektiver RW`)** → **Restschaden direkt auf Zone anwenden**.

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
