# NoReturn – Foundry VTT System (v14) — Version 1.1.5

[![Foundry VTT v14](https://img.shields.io/badge/Foundry_VTT-v14-orange)](https://foundryvtt.com/)
[![Version](https://img.shields.io/badge/Version-1.1.5-blue)](https://github.com/Enfalion/NoReturn-FoundryVTT/releases/latest)
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

## Highlights & Neue Features in Version 1.1.5

### 1. Standardbreite 1254 × 880 px & Dynamischer Tab-Umbruch
- **Optimale Standardgröße:** Charakter- und Robotikbogen öffnen standardmäßig mit `1254 × 880 px` (`min-width: 720px`), sodass ab `1254px` alle 7 Haupt-Tabs in einer einzigen Reihe stehen und das Fenster bei Bedarf flexibel verkleinert werden kann.
- **Responsives Tab-Wrapping:** Unterhalb von `1254px` brechen die Haupt-Tabs (`nav.sheet-tabs`) automatisch und symmetrisch in eine zweite Zeile um (`flex-wrap: wrap; flex: 1 1 auto;`), ohne dass Tabs rechts abgeschnitten werden.

### 2. Header-Fixes: Spezies-Button & Dynamisches Ausblenden des PSI-Tabs
- **Spezies-Dropdown & Button:** Der Anwenden-Button (`applySpeciesPreset`) bleibt durch `flex-wrap: nowrap` in einer gemeinsamen Flex-Zeile immer kompakt rechts neben dem Spezies-Dropdown.
- **Dynamischer PSI-Tab:** Ist als Spezies `Adivasi`, `Evo` oder `Mutant` gewählt, wird der Haupt-Tab `PSI & Bionik` (`[data-tab="psi"]`) automatisch ausgeblendet (`isPsiCapable`).

---

## Highlights & Neue Features in Version 1.1.4

### 1. Breiteres Bogen-Layout, Einzeilige Haupt-Tabs & Kompaktes Spezies-Feld
- **Standardgröße 1080 × 860 px** (`min-width: 960px`) für Charakter- und Robotikbogen – alle 7 Haupt-Tabs (*Attribute & Status*, *Fertigkeiten*, *PSI & Bionik*, *Kampf & Trefferzonen*, *Ausrüstung*, *Cyberware / Bio*, *Biografie & Notizen*) bleiben garantiert in einer einzigen Zeile (`flex-wrap: nowrap`).
- **Spezies-Dropdown** mit `min-width: 135px` und kompaktem 28×28 px Button, sodass z. B. `Nuker` oder `Halb-Kybernetiker` vollständig lesbar sind; kein Zeilenumbruch mehr bei `OA / Gesamt`, `Alpha-Bio` oder `Natürliche Regeneration (Geschwindigkeit)`.

### 2. Kompaktes Panzerungsfeld (RW) mit Aufschlüsselungs-Tooltip
- Im Reiter **„Kampf & Trefferzonen“** stehen das schmale Basis-Eingabefeld (`50px`) und der effektive Gesamtwert `(RW)` direkt nebeneinander in einer Zeile.
- Ein Mouseover-Tooltip auf `(RW)` schlüsselt exakt auf, wie sich der Rüstungswert zusammensetzt (z. B. `Basis: 0 + Bristol-Schutzweste (leicht): +30 = 30 RW`).

### 3. Dynamische Waffen-Feuermodi & Eingerückte Schuss-/Burst-Auswahl im Dialog
- Automatisches Auslesen aller unterstützten Feuermodi einer Waffe (`Einzelschuss (1 Kugel)`, `Semi A (bis Bx)`, `Burst A (bis Bx)`, `Vollautomatik X (Y Kugeln)`) inklusive dynamischer Unter-Optionen (`.nr-firemode-subbox`) für Schussanzahl (`1..B`), Burst-Anzahl (`1..B`), Burst-Art (*Konzentriertes Feuer* vs. *Streufeuer*) und Vollautomatik-Art (*Regulär* vs. *Sperrfeuer*).

### 4. Kontraststarke Chat-Card-Buttons & Avatar-Picker (Foundry VTT v14 FilePicker)
- Alle interaktiven Chat-Buttons (`.noreturn-chat-btn`) nutzen leuchtend rote/weiße Schrift auf dunklem Grund (`#f87171` auf `#14171c` mit `#ef4444` Rahmen).
- Klick auf das Profilbild in Charakter-, Roboter- und Item-Bögen öffnet zuverlässig den Foundry VTT v14 `FilePicker`.

---

## Highlights aus Version 1.1.3

### 1. Korrekte Fertigkeits-Pool-Mathematik & Hazard-Di-Logik
- **Exakte Pool-Berechnung ohne Off-by-One-Bug:** `Gesamt-Würfel = Attributswert (effektiv) + Fertigkeitswert (effektiv) + situative Boni - situative Mali` (z. B. `Schießen 5 + Geschick 2 = 7W6`, gerollt als `6d6 + 1d6x6`).
- **Hazard-Di ersetzt 1 Würfel:** Der explodierende Hazard-Di (`1d6x6`) ersetzt exakt einen Würfel des Pools und reduziert niemals die Gesamtanzahl der gewürfelten W6.

### 2. Automatische Verknüpfung von Waffen-Angriffsproben mit Kampffertigkeiten
- **Vollständige Zuordnung aller 7 GRW-Kampffertigkeiten:** Feuerwaffen (`Schießen + GE`), Schwere Waffen (`Schwere Waffen + GE`), Projektilwaffen (`Projektilwaffen + GE`), Wurfwaffen (`Wurfwaffen + GE`), Sprühwaffen (`Sprühwaffen + GE`), Kurzdistanzwaffen (`Nahkampf + GE`) und Distanzwaffen (`Waffenkampf + GE`).
- **Live-Pool-Anzeige im Waffentab & Angriffsdialog:** Zeigt den kombinierten Angriffspool direkt in der Waffentabelle und im Angriffs-Dialog an.

### 3. Echtes Inventar-Munitions-Management (Laden, Wechseln, Entladen & Dynamischer Schaden)
- **Buttons „Laden / Wechseln“ & „Entladen“:** Prüft kompatible Munitions-Items im Charakterinventar anhand des Kalibers, zieht beim Laden die Patronen aus dem Inventar ab und legt beim Entladen oder Munitionswechsel verbleibende Kugeln aus dem Magazin zurück ins Inventar.
- **Dynamische Schadens- & Durchschlagsberechnung:** Kein Hardcoding auf FMJ mehr – übernimmt dynamisch den geladenen Munitionstyp (`FMJ` +0, `HS` +10 / blockiert ab `MK:B`, `AP` +0 / ignoriert `MK:A`, `AF` +10 / ignoriert `MK:A & B`) sowie benutzerdefinierte Schadensmodifikatoren.

### 4. Feuermodi, Schussanzahl, Rückstoßdämpfung (RD) & Munitionsverbrauch (GRW S. 60–61)
- **Einzelschuss & Repetier:** 1 Kugel Verbrauch, Rückstoß `max(0, 1 - RD)`, Schaden `Grundschaden + (Kugel × 1) + Munitions-Mod`.
- **Semiautomatik (`Semi X(Yx)`):** Auswahl der Abzüge `1..Y` (begrenzt durch Magazin), Rückstoß-Malus `max(0, Abzüge - RD)` vom Angriffspool, Schaden `Grundschaden + (Kugel × Abzüge) + Munitions-Mod`.
- **Burst-Modus (`Burst X(Yx)`):** Auswahl der Bursts `1..Y` sowie **Konzentriertes Feuer** (`+10` Schaden, Gute Treffer je 5 Punkte) oder **Streufeuer** (`+2W6` Angriff, Gute Treffer je 10 Punkte), Rückstoß `max(0, Bursts - RD)`.
- **Vollautomatik (`Auto X(Yg)`):** Auswahl zwischen **Regulärer Angriff** (`+RD W6` Angriff, 0 Rückstoß) und **Sperrfeuer** (`-2W6` Kampfnachteil), zieht `Y` Kugeln ab und trifft **3 zufällige Trefferzonen (je `2W6`)** mit je `Grundschaden + 10 + (Kugel × 2) + Munitions-Mod` (Gute Treffer je 5 Punkte).

### 5. Automatisierter Target-Kampfablauf direkt aus dem Chat
- **Angriff → Verteidigung → Trefferzone & MK-Prüfung → Schadenswiderstand (Soak) → Schaden anwenden:** Interaktive Chat-Buttons führen Schritt für Schritt durch den gesamten Kampfablauf gegen ein anvisiertes Ziel (`game.user.targets`), prüfen automatisch Materialkategorie (`MK: A/B/C`) gegen die geladene Munition, würfeln `KO (inkl. 1 Hazard-Di, ohne Wundmali) + effektiver RW` und tragen den Restschaden per Klick direkt in die getroffene Zone ein.

### 1. PSI-Tab, App-Stufen, Dynamische Sperr-Meldungen & Pyramiden-Validierung
- **Hauptreiter „PSI“ & Bereinigte PSI-Apps:** Der PSI-Reiter heißt nun schlicht **„PSI“**. PSI-Apps (`psiApp`) besitzen ausschließlich eine **App-Stufe** (`tier`), keine eigene Hierarchiestufe.
- **Dynamische Sperr-Meldungen:** Nicht freigeschaltete PSI-Apps zeigen im „Gesperrt“-Badge und Hinweis exakt den Namen und die Hierarchiestufe der fehlenden übergeordneten PSI-Kraft an (z. B. `PSI-Kraft 'Biokinese' (Hierarchiestufe 3) noch nicht erlernt.`).
- **Automatische Pyramiden-Validierung bei PSI-Kräften:** Im Bereich *Übergeordnete PSI-Kräfte (Disziplinen)* prüft das System live die GRW-Pyramidenregel (`Stufe-1-Kräfte >= Stufe-2-Kräfte >= Stufe-3-Kräfte`) und gibt bei Verstößen eine deutliche Warnmeldung aus.
- **Live-Pool-Rechner im PSI-App-Würfeldialog:** Groß hervorgehobene Live-Anzeige des End-Würfelpools mit reaktiven Zählerfeldern (`Dynamischer Pool`, `Vorab gesammelte Kraftstufe`, `Zielkorridor-Änderung / Anpassung`, `Überanstrengungskosten`).

### 2. Aufklappbare Würfel-Spoiler & Hazard-Die-Hervorhebung (Alle Proben)
- **Einklappbarer Spoiler („Gewürfelte Würfel anzeigen“):** Alle Chat-Ausgaben im gesamten System (Attributs-, Fertigkeits-, Initiative-, Waffen-, Schadens-, Soak-, Trefferzonen-, Widerstands- und PSI-Proben) besitzen einen aufklappbaren `<details>`-Spoiler für die Einzelwürfel.
- **Markante Hazard-Die-Kennzeichnung:** Innerhalb der Einzelwürfel-Ansicht wird der **Hazard-Die** (`1d6x6`) durch eine leuchtende Warnfarbe, eigenen Rahmen und ein `⚡`-Symbol klar von regulären Würfeln abgehoben.

### 3. Schusswaffen, Magazin-Kapazität, Kaliber-Ladesystem & Rüstungsdurchschlag
- **Magazin-Kapazität & Nachladen:** Alle Schusswaffen führen ihre exakte Schusskapazität (`magazineCapacity`) und aktuelle Ladung (`ammoCurrent`) inklusive Schnell-Nachlade-Button.
- **Dynamisches Kaliber-Ladesystem:** Auswahl-Dropdown für kompatible Munition aus dem Inventar (oder Standard-Munitionstyp `FMJ`, `AP`, `HS`, `AF`) mit automatischer Schadensanpassung (`+10 TP` bei `HS` und `AF`).
- **Rüstungsdurchschlags-Prüfung im Schadenswiderstand (Soak):** Automatische Prüfung von `FMJ`, `AP` (ignoriert `MK:A`), `HS` (`+10 TP` vs. `MK:A`, `0` Schaden ab `MK:B+`) und `AF` (`+10 TP`, ignoriert `MK:A & B`) gegen die Materialkategorie (`MK: A / B / C`) der getroffenen Zone.

### 4. Bereinigter Reiter „Fertigkeiten & Krankheiten“ & Dynamische Spezies-Automatik
- **3 Unterreiter unter „Fertigkeiten & Krankheiten“:** Saubere Trennung in **Standardfertigkeiten**, **Styleskills** und den eigenen 3. Unterreiter **Krankheiten, Gifte & Infektions-Trigger** (keine doppelte Darstellung mehr).
- **Dynamische Spezies-Werte & Ausblenden des PSI-Tabs:** Ein Wechsel der Spezies im Charakterbogen übernimmt sofort alle Attributs-Modifikatoren, Attributs-Maximalwerte und Basiswerte (Psyche, Organismus, Adrenalin, Infektionsresistenz) und blendet den **PSI**-Reiter automatisch aus, wenn die gewählte Spezies (z. B. *Evo* oder *Mutant*) nicht PSI-fähig ist.

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
