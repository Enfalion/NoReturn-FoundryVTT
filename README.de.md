# NoReturn – Foundry VTT v14 System (Deutsche Dokumentation)

Dieses Projekt implementiert das komplette Regelwerk von **NoReturn (1. Edition / Collector's Edition)** als natives Spielsystem für **Foundry Virtual Tabletop v14**. Es nutzt konsequent die moderne Foundry-v14-Architektur (`foundry.abstract.TypeDataModel` sowie `ApplicationV2` mit `HandlebarsApplicationMixin`).

---

## 1. System-Überblick & Funktionsumfang

### 1.1 Standard-Charakterbogen (`character`, `npc`, `creature`)
Basierend auf dem offiziellen *Charakterbogen 1.2 (DE)*:
- **Primär-Attribute:** `Geschick (GE)`, `Stärke (ST)`, `Konstitution (KO)`, `Schnelligkeit (SK)`, `Wissen (WI)` und `Wahrnehmung (WA)` inklusive Modifikatoren, Overall-Wert und umschaltbarer *Alpha-Biomechanik* (macht alle Attributswürfel zum explodierenden *Hazard-Di*).
- **Sekundär- & Besondere Attribute:** `Charisma (CH)`, `Logik (LO)`, `Fahrzeuge (FA)`, `Schmerztoleranz (TO)` sowie `Adrenalin` (`Stufe` und aktueller `Pool`).
- **Zustand & Ressourcen:** `Bekanntheit` (100–1), `Ruf`, `Organismus` (inkl. *Leiden 1–3*), `Psyche`, würfelbare `Infektionsresistenz` (ohne Hazard-Di), `Natürliche Regeneration`, `Erfahrung (EP)`, `Justicepoints (JP)`, `Chaospoints (CP)` und `Bargeld (N$)`.
- **Item-gesteuerte Spezies, Mutationen, Merkmale & Pharmazeutika:**
  - **Aktives Spezies-Dropdown & `species`-Items:** Auswahl der aktiven Spezies (`Mensch`, `Adivasi`, `Evo`, `Mutant`, `Zeneritone`, `Prodigy`, `Blendling`) direkt auf dem Charakterbogen oder per Drag-and-Drop aus `species.db`. Berechnet automatisch Attributslimits, Basiswerte (`Psyche`, `Organismus`, `Adrenalin`, `Infektionsresistenz`) sowie Fertigkeitsboni (z. B. `+6W6 Rennen` für Adivasi).
  - **Mutationen & Abnormitäten (`mutation`):** Sichtbare und verborgene Mutationen, biologische Abnormitäten und Auffälligkeiten modifizieren Attribute, natürliche Panzerung, Trefferpunkte, Regeneration und Fertigkeiten dynamisch.
  - **Charaktermerkmale (`trait`):** Positive Justice-Merkmale, negative Chaos-Merkmale, Begabungen und Talente mit automatischen Fertigkeits- und Attributsmodifikatoren.
  - **Drogen & Pharmazeutika (`consumable`):** Umschaltbarer Aktiv-Status für Stimulanzien und Medikamente mit Dosierung, Wirkungsdauer, Suchtpotenzial und automatischen Attributs-/Fertigkeits-Boosts.
  - **Krankheiten & Toxine (`condition`):** Inkubationszeit, Prüfintervall, Intensität, Symptomstadien und interaktiver **Widerstandsprobe-Trigger** (`NoReturnRoll.rollConditionResistance`) direkt aus dem Bogen in den Chat.

### 1.2 Hybrider Robotikbogen (`robot`)
Der Robotikbogen ist als **vollwertiger Hybrid-Bogen** aufgebaut und vereint alle Kernfunktionen eines Spielercharakters mit dem offiziellen *Robotikbogen (1. Edition)*:
- **Vollständige Charakter-Attribute & Fertigkeiten:** Besitzt alle primären, sekundären und abgeleiteten Attribute sowie das komplette Fertigkeits-, Waffen-, Rüstungs- und Ausrüstungssystem des Standardbogens (alle Attribute und Fertigkeiten sind direkt aus der Robotik-Ansicht würfelbar).
- **Dediziertes Robotik- & Chassis-Dashboard:**
  - **Chassis-Status**, **Energieversorgung / Reaktor**, **Batterie / Energiereserve**, **Modul-Steckplätze** (`Belegt / Max / Frei`), **Energieverbrauch** (`Basis + Module`) und **Struktur-Trefferpunkte**.
- **Zonenbasiertes 11-Zonen-Tuning:** Verwaltung von `Biologisch/Normal`, `Casual`, `Work`, `High Tech`, `Android` und `Military` je Körperzone inkl. Stufen-Upgrades, `All over Attribute` (`round(Summe / 11)`) und `Cybersense-Wahrnehmung` (`round(Summe / 5)`).

### 1.3 Würfel- & Kampf-Engine (`./system/module/dice/roll.mjs`)
- **W6-Pool + Hazard-Di (`1d6x6`):** Unterstützt Standard-Proben, *Alpha-Biomechanik* und *Beta-Biomechanik*.
- **Interaktiver Würfeldialog (`DialogV2`):** Schwierigkeit (`Routine MW 5` bis `Legendär MW 40`), Bonus-/Maluswürfel, `Adrenalin-Würfel`, `Kampfnachteile (-2W6)` und Salvenmodus.
- **Krankheits- & Gift-Widerstandsprobe (`rollConditionResistance`):** Prüft automatisch gegen die `Intensität (MW)` der Krankheit oder des Gifts und gibt bei Fehlschlag die Symptomstadien, Schäden, Mali und Gegenmittel im Chat aus.

---

## 2. Kompendien & Ordner-Hierarchie (`./system/packs/`)

Alle Kompendien nutzen native Foundry-v14-`Folder`-Dokumente (`folder: "<folder_id>"`):

1. **Waffen, Rüstungen & Ausrüstung (`items.db`):**
   - `Nahkampfwaffen`
   - `Fernkampfwaffen`
   - `Rüstungen & Schutzkleidung`
   - `Drogen & Pharmazeutika` (`consumable`)
   - `Alltägliche Ausrüstung & Werkzeuge` (`gear`)
   - `Cyberware & Implantate` (`cyberware`)
2. **Fertigkeiten, PSI & Kampfkünste (`skills.db`):**
   - `Standardfertigkeiten` (`skill`)
   - `PSI-Kräfte & Disziplinen` (`skill`)
   - `Charaktermerkmale` (`trait`)
   - `Krankheiten & Toxine` (`condition`)
3. **Robotik, Cyberware & Biomechanik (`robotics.db`):**
   - `Chassis & Rahmen`
   - `Erweiterungsmodule`
   - `Sensoren & Prozessoren`
4. **Spezies, Mutationen & Abnormitäten (`species.db`):**
   - `Spielbare Spezies` (`species`)
   - `Mutationen (Sichtbar & Verborgen)` (`mutation`)
   - `Biologische Abnormitäten` (`mutation`)
   - `Auffälligkeiten` (`mutation`)
5. **Kreaturen & NSC (`bestiary.db`):**
   - `Mutierte Bestien` (`Beutelsegler`, `Grollhorn`, `Nemoratte`, `Oryx`, `Pyräne`, `Steincobra`, `Pandora-Zombie`, `Wilder Cardo-Rudelläufer`)
   - `Rivalen & Gesetzlose` (`Outraider-Plünderer`, `Söldner-Veteran der Gilde`, `Zentrums-Vollstrecker`, `Sektierer der Neuen Dämmerung`)
   - `Roboter & Drohnen` (`Wach- & Aufklärungsdrohne MK-II „Späher“`, `Zentrums-Wachroboter „Sentinel V4“`, `Schwerer Kampfandroide „Aegis-Titan“`)
6. **System-Makros (`macros.db`):** 4 Schnellzugriffs-Makros für die Makroleiste.

---

## 3. Installationsanleitung für Foundry VTT v14

1. Öffnen Sie das Datenverzeichnis Ihrer Foundry-VTT-v14-Installation (`<FoundryUserData>/Data/systems/`).
2. Erstellen Sie dort einen neuen Ordner namens `noreturn`:
   ```bash
   mkdir -p <FoundryUserData>/Data/systems/noreturn
   ```
3. Kopieren Sie den gesamten Inhalt des Verzeichnisses `./system/` in diesen Ordner:
   ```bash
   cp -r ./system/* <FoundryUserData>/Data/systems/noreturn/
   ```
4. Starten Sie Foundry VTT (Version 14) neu.
