# NoReturn – Foundry VTT v14 System (Deutsche Dokumentation)

Dieses Projekt implementiert das komplette Regelwerk von **NoReturn (1. Edition / Collector's Edition)** als natives Spielsystem für **Foundry Virtual Tabletop v14**. Es nutzt konsequent die moderne Foundry-v14-Architektur (`foundry.abstract.TypeDataModel` sowie `ApplicationV2` mit `HandlebarsApplicationMixin`).

---

## 1. System-Überblick & Funktionsumfang

### 1.1 Standard-Charakterbogen (`character`, `npc`, `creature`)
Basierend auf dem offiziellen *Charakterbogen 1.2 (DE)*:
- **Primär-Attribute:** `Geschick (GE)`, `Stärke (ST)`, `Konstitution (KO)`, `Schnelligkeit (SK)`, `Wissen (WI)` und `Wahrnehmung (WA)` inklusive Modifikatoren, Overall-Wert und umschaltbarer *Alpha-Biomechanik* (macht alle Attributswürfel zum explodierenden *Hazard-Di*).
- **Sekundär- & Besondere Attribute:** `Charisma (CH)`, `Logik (LO)`, `Fahrzeuge (FA)`, `Schmerztoleranz (TO)` sowie `Adrenalin` (`Stufe` und aktueller `Pool`).
- **Zustand & Ressourcen:** `Bekanntheit` (100–1), `Ruf`, `Organismus` (inkl. *Leiden 1–3*), `Psyche`, würfelbare `Infektionsresistenz` (ohne Hazard-Di), `Natürliche Regeneration`, `Erfahrung (EP)`, `Justicepoints (JP)`, `Chaospoints (CP)` und `Bargeld (N$)`.
- **Automatische Berechnungen (`prepareDerivedData`):**
  - **Tragkraft:** `(Stärke + Stemmen) × 10 kg`.
  - **11 Trefferzonen (`2` bis `12`):** Wählbare Widerstandsklasse (`30 TP` Normalsterblich, `50 TP` Robotik & Hart, `70 TP` Unglaublich hart, `90 TP` Epischer Widerstand).
  - **Schmerztoleranz & Wundmali:** Berechnet je Zone automatisch die aktuelle Schadensstufe (`10 Stufen` je Zone) und zieht die `Schmerztoleranz` ab.
  - **Rüstungs-Integration:** Ausgerüstete Rüstungen addieren ihren `Rüstungswert (RW)` und ihre `Materialkategorie (MK)` automatisch auf die abgedeckten Trefferzonen und berechnen eventuelle Bewegungs-Mali durch `Komfort > Konstitution`.
  - **Bewusstlosigkeits- & Bewegungs-Warnung:** Automatische Warnanzeige, sobald `Gesamte Mali >= Schnelligkeit` (bewegungsunfähig) oder `Gesamte Mali >= Konstitution` (bewusstlos).

### 1.2 Robotikbogen (`robot`)
Basierend auf dem offiziellen *Robotikbogen (1. Edition)*:
- **Zonenbasierte Robotik-Verwaltung** für alle 11 Körperzonen (`(12) Kopf`, `(6) r. Brust`, `(8) l. Brust`, `(7) Bauch`, `(5) r. Arm`, `(9) l. Arm`, `(2) Becken`, `(4) r. Oberschenkel`, `(10) l. Oberschenkel`, `(3) r. Unterschenkel`, `(11) l. Unterschenkel`).
- **Offizielle Robotik-Modelle:** `Biologisch/Normal`, `Casual (Steel/Dark)`, `Work (Industrial/Brutal)`, `High Tech (Pearl)`, `Android (Skin)` und `Military (Army/Ghost)` mit exakten Basiswerten, Kapazitäten, Panzerungen und Organismusverlusten.
- **Stufen-Upgrades je Zone (Tuning):** Individuelle Steigerung von `Geschick`, `Stärke`, `Konstitution`, `Schnelligkeit`, `Tastsinn (Smart-Skin)` und `Panzerung (+5p.)` unter automatischer Berechnung der verbleibenden Zonen-Kapazität (`Frei / Max`).
- **All over Attribute:** Automatische Berechnung des gerundeten Durchschnitts (`round(Summe / 11)`) über alle 11 Körperzonen für `GE`, `ST`, `KO`, `SK` und `Tastsinn` sowie der `Summe Organismusverlust`. Sowohl einzelne Zonenwerte als auch die All-Over-Werte sind direkt per Klick würfelbar.
- **Wahrnehmung & Cybersense:** Verwaltung von `Sehen [Oculus]`, `Hören [Auris]`, `Riechen [Odoratus]`, `Schmecken [Gustatus]` und `Tastsinn [Smart-Skin]` zur Berechnung der `All over Wahrnehmung` (`round(Summe / 5)`).

### 1.3 Würfel- & Kampf-Engine (`./system/module/dice/roll.mjs`)
- **W6-Pool + Hazard-Di (`1d6x6`):** Jede reguläre Probe enthält standardmäßig genau einen explodierenden *Hazard-Di* (bei einer `6` wird weitergerollt und addiert). Unterstützt *Alpha-Biomechanik* (alle Attributswürfel explodieren) und *Beta-Biomechanik* (alle Fertigkeitswürfel explodieren).
- **Interaktiver Würfeldialog (`DialogV2`):** Auswahl der Schwierigkeit (`Routine MW 5` bis `Legendär MW 40`), temporäre Bonus-/Maluswürfel, Einsatz von bis zu `5 Adrenalin-Würfeln` (werden automatisch vom Pool abgezogen), `Kampfnachteile (-2W6)` und Salvenmodus (`+1W6 Schaden je 5 statt 10 Punkte Überschuss`). Mit `Shift + Klick` kann der Dialog für Schnellwürfe übersprungen werden.
- **Patzer & Gute Treffer:** Automatische Erkennung von Patzern (`Gesamtergebnis < 5`) sowie Berechnung der *Guten Treffer* (`+1W6 Bonusschaden` je 10 bzw. 5 Punkte Überschuss).
- **Trefferzonen (`2W6`) & Schadenswiderstand (`KO + RW`):** Direkt aus dem Bogen oder der Schadens-Chatkarte ausführbar.

---

## 2. Installationsanleitung für Foundry VTT v14

1. Öffnen Sie das Datenverzeichnis Ihrer Foundry-VTT-v14-Installation (`<FoundryUserData>/Data/systems/`).
2. Erstellen Sie dort einen neuen Ordner namens `noreturn`:
   ```bash
   mkdir -p <FoundryUserData>/Data/systems/noreturn
   ```
3. Kopieren Sie den gesamten Inhalt des Verzeichnisses `./system/` in diesen Ordner:
   ```bash
   cp -r ./system/* <FoundryUserData>/Data/systems/noreturn/
   ```
4. Starten Sie Foundry VTT (Version 14) neu. Das System **NoReturn – Endzeit Rollenspiel (1st Edition)** erscheint nun unter *Game Systems* und kann zum Erstellen einer neuen Spielwelt ausgewählt werden.

---

## 3. Nutzung der Kompendien (`./system/packs/`)

Das System liefert vier vorkompilierte Kompendien mit:
1. **NoReturn Fertigkeiten, PSI & Kampfkünste (`skills.db`):** Alle 109 Standardfertigkeiten, Spezialfertigkeiten, PSI-Kräfte, Style-Skills und mehrstufigen Kampfkünste. Per Drag-and-Drop auf einen Charakter- oder Robotikbogen ziehbar (mehrfaches Ziehen erhöht automatisch die Stufe).
2. **NoReturn Waffen, Rüstungen & Ausrüstung (`items.db`):** 135 Gegenstände (alle Kurzdistanzwaffen, Distanzwaffen, Faustfeuerwaffen, Gewehre, Schwere Waffen, Schutzkleidung/Rüstungen, Pharmazeutika/Drogen, Munition, Sprengstoffe, Waffen-Add-Ons, Konstruktionswerkzeuge und Hort-Ausstattung).
3. **NoReturn Robotik, Cyberware & Biomechanik (`robotics.db`):** 25 Augmentierungen (Alpha-/Beta-Biomechanik, Robotik-Modelle Casual/Work/High Tech/Android/Military, Zonen-Upgrades, Cybersense und Implantate).
4. **NoReturn System-Makros (`macros.db`):** 4 Schnellzugriffs-Makros für die Makroleiste (*Freie Würfelprobe*, *Trefferzone 2W6*, *Mexican Standoff Initiative*, *Schadenswiderstand*).

---

## 4. Architektur & Zwischenspeicher (`./cache/`)

Die Systemerstellung folgt einer strikten Trennung zwischen Datenextraktion (`./cache/`) und Laufzeit-Code (`./system/`):
- `./cache/mechanics.md`: Vollständige Referenz der extrahierten Regeln und Formeln aus dem Grundregelwerk.
- `./cache/data/*.json`: Strukturierte JSON-Datensätze aller Fertigkeiten, Waffen, Rüstungen, Güter, Cyberware/Robotik sowie der JSON-Schemata für Charakter- und Robotikbogen.
- `./cache/i18n/de.json` & `en.json`: Vollständige Sprachdateien für Deutsch und Englisch.
