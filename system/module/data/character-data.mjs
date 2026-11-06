/**
 * DataModel for Standard NoReturn Characters, NPCs, and Creatures.
 * Based on 1st_Edition_NoReturn-Charakterbogen_1.2(DE)_edit.pdf and Corebook rules.
 * Dynamically calculates modifiers from embedded species, mutation, trait, styleskill,
 * cyberware, and consumable items.
 */
import { parseSkillModifiers, resolvePsiHierarchyTier } from "./item-data.mjs";

export const HIT_ZONES = [
  { code: "12", labelKey: "NORETURN.Health.Zones.12", lethal: true },
  { code: "11", labelKey: "NORETURN.Health.Zones.11", lethal: false },
  { code: "10", labelKey: "NORETURN.Health.Zones.10", lethal: false },
  { code: "9", labelKey: "NORETURN.Health.Zones.9", lethal: false },
  { code: "8", labelKey: "NORETURN.Health.Zones.8", lethal: true },
  { code: "7", labelKey: "NORETURN.Health.Zones.7", lethal: true },
  { code: "6", labelKey: "NORETURN.Health.Zones.6", lethal: true },
  { code: "5", labelKey: "NORETURN.Health.Zones.5", lethal: false },
  { code: "4", labelKey: "NORETURN.Health.Zones.4", lethal: false },
  { code: "3", labelKey: "NORETURN.Health.Zones.3", lethal: false },
  { code: "2", labelKey: "NORETURN.Health.Zones.2", lethal: true }
];

export const PLAYABLE_SPECIES_PRESETS = {
  Mensch: {
    speciesId: "mensch",
    name: "Mensch",
    subspecies: "Homo Sapiens",
    costGp: 0,
    legality: "Beim Zentrum registriert und legal",
    psiAllowed: true,
    freePsiCount: 0,
    baseStats: { psyche: 80, organismus: 100, adrenalin: 2, infektionsresistenz: "2d6" },
    attributeModifiers: {},
    attributeLimits: { primaryMax: 4, secondaryMax: 4 },
    skillModifiers: "",
    specialRules: "Standard-Mensch (PSI Kategorie A erlaubt)."
  },
  Adivasi: {
    speciesId: "adivasi",
    name: "Adivasi",
    subspecies: "Homo Sapiens Adivasi (Indigo)",
    costGp: 40,
    legality: "Illegal in Zentrumsgebieten (geduldet im Reservat)",
    psiAllowed: true,
    freePsiCount: 0,
    baseStats: { psyche: 100, organismus: 100, adrenalin: 2, infektionsresistenz: "2d6+3" },
    attributeModifiers: {},
    attributeLimits: { primaryMax: 4, secondaryMax: 4 },
    skillModifiers: "rennen:+6",
    specialRules: "Rennen +6W6, immer -1 Chaospoint, Giftresistenz Stufe 2, Rundum-Ultraschallsicht (bei freien Ohren), Common Sense."
  },
  Evo: {
    speciesId: "evo",
    name: "Evo",
    subspecies: "Homo Sapiens Evolutio (Zitadellen-Züchtung)",
    costGp: 30,
    legality: "Beim Zentrum registriert und legal",
    psiAllowed: false,
    freePsiCount: 0,
    baseStats: { psyche: 80, organismus: 100, adrenalin: 2, infektionsresistenz: "2d6" },
    attributeModifiers: { konstitution: 1 },
    attributeLimits: { primaryMax: 5, secondaryMax: 4 },
    skillModifiers: "",
    specialRules: "Konstitution +1 Startwert (Erschaffungsmaximum 5 in KO), nicht PSI-begabt."
  },
  Mutant: {
    speciesId: "mutant",
    name: "Mutant",
    subspecies: "Tier-Mensch-Hybrid (Mutantengrad 1–12)",
    costGp: 10,
    legality: "Illegal (500 N$ Kopfgeld durch das Zentrum)",
    psiAllowed: false,
    freePsiCount: 0,
    baseStats: { psyche: 70, organismus: 100, adrenalin: 3, infektionsresistenz: "1d6" },
    attributeModifiers: {},
    attributeLimits: { primaryMax: 4, secondaryMax: 4 },
    skillModifiers: "",
    specialRules: "Mutantengrad 1–12 (je 10 GP = 1 MP für sichtbare/verborgene Mutationen), nicht PSI-begabt."
  },
  Zeneritone: {
    speciesId: "zeneritone",
    name: "Zeneritone",
    subspecies: "Homo Sapiens Zener",
    costGp: 0,
    legality: "Bei Entdeckung als Zeneritone illegal (Lebendergreifung durch Zentrum)",
    psiAllowed: true,
    freePsiCount: 7,
    baseStats: { psyche: 50, organismus: 100, adrenalin: 2, infektionsresistenz: "1d6-2" },
    attributeModifiers: {},
    attributeLimits: { primaryMax: 3, secondaryMax: 4 },
    skillModifiers: "",
    specialRules: "Kindliche Statur (8–11 J.), erhält bei Erschaffung 7 kostenlose PSI-Kräfte (Kategorie A) auf Stufe 1."
  },
  Prodigy: {
    speciesId: "prodigy",
    name: "Prodigy",
    subspecies: "Homo Sapiens Prodigium",
    costGp: 10,
    legality: "Bei Entdeckung als Prodigy illegal (hohes Kopfgeld)",
    psiAllowed: true,
    freePsiCount: 3,
    baseStats: { psyche: 60, organismus: 100, adrenalin: 2, infektionsresistenz: "1d6-1" },
    attributeModifiers: {},
    attributeLimits: { primaryMax: 4, secondaryMax: 4 },
    skillModifiers: "",
    specialRules: "Erhält bei Erschaffung 3 kostenlose PSI-Kräfte (Kategorie A) auf Stufe 1."
  },
  Blendling: {
    speciesId: "blendling",
    name: "Blendling",
    subspecies: "§842.74.RD (Mensch-Adivasi-Hybrid)",
    costGp: 20,
    legality: "Illegal (300 N$ Kopfgeld durch das Zentrum)",
    psiAllowed: true,
    freePsiCount: 0,
    baseStats: { psyche: 90, organismus: 100, adrenalin: 2, infektionsresistenz: "1d6+3" },
    attributeModifiers: {},
    attributeLimits: { primaryMax: 4, secondaryMax: 4 },
    skillModifiers: "rennen:+4",
    specialRules: "Rennen +4W6, immer -1 Chaospoint, Mutantenkraft Giftresistenz Stufe 1 automatisch."
  }
};

export class NoReturnCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    const primaryAttrField = () =>
      new fields.SchemaField({
        base: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
        mod: new fields.NumberField({ required: true, integer: true, min: -20, initial: 0 }),
        overall: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
        alphaBio: new fields.BooleanField({ required: true, initial: false })
      });

    const secondaryAttrField = (initialBase = 1, minBase = 1) =>
      new fields.SchemaField({
        base: new fields.NumberField({ required: true, integer: true, min: minBase, initial: initialBase }),
        mod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        total: new fields.NumberField({ required: true, integer: true, min: 0, initial: initialBase })
      });

    const zoneSchemas = {};
    for (const z of HIT_ZONES) {
      zoneSchemas[z.code] = new fields.SchemaField({
        damage: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        max: new fields.NumberField({ required: true, integer: true, min: 10, initial: 30 }),
        armor: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        equippedArmor: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        materialCategory: new fields.StringField({ required: false, blank: true, initial: "A" }),
        penalty: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        lethal: new fields.BooleanField({ required: true, initial: z.lethal })
      });
    }

    return {
      personal: new fields.SchemaField({
        spezies: new fields.StringField({ required: false, blank: true, initial: "Mensch" }),
        geschlecht: new fields.StringField({ required: false, blank: true, initial: "" }),
        alter: new fields.NumberField({ required: true, integer: true, min: 0, initial: 25 }),
        groesse: new fields.StringField({ required: false, blank: true, initial: "1,78 m" }),
        gewicht: new fields.StringField({ required: false, blank: true, initial: "75 kg" }),
        haarfarbe: new fields.StringField({ required: false, blank: true, initial: "" }),
        augenfarbe: new fields.StringField({ required: false, blank: true, initial: "" }),
        hautfarbe: new fields.StringField({ required: false, blank: true, initial: "" }),
        berufung: new fields.StringField({ required: false, blank: true, initial: "" })
      }),
      attributes: new fields.SchemaField({
        primary: new fields.SchemaField({
          geschick: primaryAttrField(),
          staerke: primaryAttrField(),
          konstitution: primaryAttrField(),
          schnelligkeit: primaryAttrField(),
          wissen: primaryAttrField(),
          wahrnehmung: primaryAttrField()
        }),
        secondary: new fields.SchemaField({
          charisma: secondaryAttrField(1, 1),
          logik: secondaryAttrField(1, 1),
          fahrzeuge: secondaryAttrField(1, 1),
          schmerztoleranz: secondaryAttrField(0, 0)
        }),
        special: new fields.SchemaField({
          adrenalin: new fields.SchemaField({
            stufe: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
            pool: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 })
          })
        })
      }),
      status: new fields.SchemaField({
        bekanntheit: new fields.NumberField({ required: true, integer: true, min: 1, max: 100, initial: 100 }),
        ruf: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        organismus: new fields.SchemaField({
          max: new fields.NumberField({ required: true, min: 0, max: 200, initial: 100 }),
          value: new fields.NumberField({ required: true, min: -100, max: 200, initial: 100 }),
          current: new fields.NumberField({ required: true, min: -100, max: 200, initial: 100 }),
          damage: new fields.NumberField({ required: true, min: 0, max: 200, initial: 0 }),
          leiden1: new fields.StringField({ required: false, blank: true, initial: "" }),
          leiden2: new fields.StringField({ required: false, blank: true, initial: "" }),
          leiden3: new fields.StringField({ required: false, blank: true, initial: "" })
        }),
        psyche: new fields.SchemaField({
          max: new fields.NumberField({ required: true, integer: true, min: 0, max: 100, initial: 100 }),
          value: new fields.NumberField({ required: true, integer: true, min: 0, max: 100, initial: 80 })
        }),
        infektionsresistenz: new fields.StringField({ required: false, blank: true, initial: "2d6" }),
        regeneration: new fields.SchemaField({
          geschwindigkeit: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
          pool: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        tragkraft: new fields.NumberField({ required: true, min: 0, initial: 10 }),
        erfahrung: new fields.SchemaField({
          gesamt: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          aktuell: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        justicepoints: new fields.SchemaField({
          gesamt: new fields.NumberField({ required: true, integer: true, min: 0, initial: 3 }),
          aktuell: new fields.NumberField({ required: true, integer: true, min: 0, initial: 3 })
        }),
        chaospoints: new fields.SchemaField({
          gesamt: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          aktuell: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        bargeld: new fields.NumberField({ required: true, min: 0, initial: 5000 })
      }),
      health: new fields.SchemaField({
        maxHpTier: new fields.NumberField({
          required: true,
          integer: true,
          choices: [15, 30, 50, 70, 90],
          initial: 30
        }),
        sonstigeMali: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        comfortPenalty: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        gesamteMali: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        zones: new fields.SchemaField(zoneSchemas)
      }),
      traits: new fields.SchemaField({
        charaktermerkmale: new fields.StringField({ required: false, blank: true, initial: "" }),
        mutationen: new fields.StringField({ required: false, blank: true, initial: "" }),
        begabungen: new fields.StringField({ required: false, blank: true, initial: "" }),
        talente: new fields.StringField({ required: false, blank: true, initial: "" }),
        styleSkills: new fields.StringField({ required: false, blank: true, initial: "" }),
        kampfsportarten: new fields.StringField({ required: false, blank: true, initial: "" })
      }),
      notes: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }

  prepareBaseData() {
    for (const attr of Object.values(this.attributes?.primary || {})) {
      attr.overall = Math.max(0, (Number(attr.base) || 0) + (Number(attr.mod) || 0));
    }
    for (const attr of Object.values(this.attributes?.secondary || {})) {
      attr.total = Math.max(0, (Number(attr.base) || 0) + (Number(attr.mod) || 0));
    }
  }

  prepareDerivedData() {
    const items = this.parent?.items ?? [];

    // 1. Collect dynamic modifiers from Species, Mutations, Traits, StyleSkills, Cyberware, and Active Consumables
    const attrKeys = [
      "geschick",
      "staerke",
      "konstitution",
      "schnelligkeit",
      "wissen",
      "wahrnehmung",
      "charisma",
      "logik",
      "fahrzeuge",
      "schmerztoleranz",
      "adrenalin"
    ];
    const itemAttrMods = {};
    const speciesAttrMods = {};
    const cyberAttrMods = {};
    const otherItemAttrMods = {};
    const attrModSources = {};
    for (const k of attrKeys) {
      itemAttrMods[k] = 0;
      speciesAttrMods[k] = 0;
      cyberAttrMods[k] = 0;
      otherItemAttrMods[k] = 0;
      attrModSources[k] = [];
    }

    const skillBonuses = {};
    const skillBonusSources = {};
    let mutationArmorBonus = 0;
    let mutationArmorMk = "A";
    let mutationMaxHpOverride = 0;
    let mutationRegenSpeed = 0;
    let mutationRegenPool = 0;
    let activeSpeciesItem = null;
    let cyberwareOrganismCost = 0;
    let hasParcourStyle = false;
    let akrobatikLevel = 0;

    const addAttrMods = (modsObj, multiplier = 1, bucket = "other", sourceLabel = "") => {
      if (!modsObj) return;
      for (const k of attrKeys) {
        const v = Number(modsObj[k] || 0) * multiplier;
        if (v) {
          itemAttrMods[k] += v;
          if (bucket === "species") speciesAttrMods[k] += v;
          else if (bucket === "cyber") cyberAttrMods[k] += v;
          else otherItemAttrMods[k] += v;
          if (sourceLabel) {
            attrModSources[k].push(`${sourceLabel}: ${v >= 0 ? `+${v}` : v}`);
          }
        }
      }
    };

    const addSkillMods = (modStr, multiplier = 1, sourceLabel = "") => {
      const parsed = parseSkillModifiers(modStr);
      for (const [k, v] of Object.entries(parsed)) {
        const delta = v * multiplier;
        if (!delta) continue;
        skillBonuses[k] = (skillBonuses[k] || 0) + delta;
        if (!skillBonusSources[k]) skillBonusSources[k] = [];
        if (sourceLabel) {
          skillBonusSources[k].push(`${sourceLabel} ${delta >= 0 ? `+${delta}` : delta}`);
        }
      }
    };

    let hasPsionicAbnormality = false;
    const selectedSpeciesKey = this.personal?.spezies || "Mensch";
    const selectedPreset = PLAYABLE_SPECIES_PRESETS[selectedSpeciesKey] || null;

    for (const item of items) {
      if (item.type === "species") {
        activeSpeciesItem = item;
      } else if (item.type === "mutation" && item.system.active !== false) {
        if (
          item.system.mutationId === "abn_psionische_abartigkeit" ||
          item.name.toLowerCase().includes("psionische abartigkeit")
        ) {
          hasPsionicAbnormality = true;
        }
        const lvl = Math.max(1, Number(item.system.level) || 1);
        addAttrMods(item.system.attributeModifiers, lvl, "other", item.name);
        addSkillMods(item.system.skillModifiers, lvl, item.name);
        const cb = item.system.combatBonuses;
        if (cb) {
          if (cb.armorBonus > mutationArmorBonus) {
            mutationArmorBonus = Number(cb.armorBonus) || 0;
            mutationArmorMk = cb.materialCategory || "A";
          }
          if (cb.maxHpOverride > mutationMaxHpOverride) {
            mutationMaxHpOverride = Number(cb.maxHpOverride) || 0;
          }
          if (cb.regenSpeed > mutationRegenSpeed) {
            mutationRegenSpeed = Number(cb.regenSpeed) || 0;
          }
          if (cb.regenPool > mutationRegenPool) {
            mutationRegenPool = Number(cb.regenPool) || 0;
          }
        }
      } else if (item.type === "trait") {
        addAttrMods(item.system.attributeModifiers, 1, "other", item.name);
        addSkillMods(item.system.skillModifiers, 1, item.name);
      } else if (item.type === "styleskill" && item.system.active !== false) {
        const lvl = Math.max(1, Number(item.system.level) || 1);
        addAttrMods(item.system.attributeModifiers, lvl, "other", item.name);
        addSkillMods(item.system.skillModifiers, lvl, item.name);
        if (
          item.system.styleSkillId === "style_parcour" ||
          item.name.toLowerCase().includes("parcour")
        ) {
          hasParcourStyle = true;
        }
      } else if (item.type === "consumable" && item.system.active) {
        addAttrMods(item.system.attributeModifiers, 1, "other", item.name);
        addSkillMods(item.system.skillModifiers, 1, item.name);
      } else if ((item.type === "cyberware" || item.type === "robotModule") && item.system.installed !== false) {
        const orgCost = Math.max(
          Number(item.system.organismCost) || 0,
          Number(item.system.organismusCost) || 0
        );
        cyberwareOrganismCost += orgCost;
        addAttrMods(item.system.attributeModifiers, 1, "cyber", item.name);
        if (item.system.stats) {
          addAttrMods(item.system.stats, 1, "cyber", item.name);
        }
        addSkillMods(item.system.skillModifiers, 1, item.name);
      } else if (item.type === "skill") {
        if (item.system.skillId === "akrobatik" || item.name.toLowerCase() === "akrobatik") {
          akrobatikLevel = Math.max(akrobatikLevel, Number(item.system.level) || 0);
        }
      }
    }

    // Apply Style-Skill: Parcour (adds Akrobatik level to Klettern & Springen)
    if (hasParcourStyle && akrobatikLevel > 0) {
      skillBonuses["klettern"] = (skillBonuses["klettern"] || 0) + akrobatikLevel;
      skillBonuses["springen"] = (skillBonuses["springen"] || 0) + akrobatikLevel;
      if (!skillBonusSources["klettern"]) skillBonusSources["klettern"] = [];
      if (!skillBonusSources["springen"]) skillBonusSources["springen"] = [];
      skillBonusSources["klettern"].push(`Parcour +${akrobatikLevel}`);
      skillBonusSources["springen"].push(`Parcour +${akrobatikLevel}`);
    }

    // Dynamically apply species modifiers & limits based on selected species (or matching embedded species item)
    if (activeSpeciesItem && (!selectedPreset || activeSpeciesItem.name === selectedSpeciesKey)) {
      addAttrMods(activeSpeciesItem.system.attributeModifiers, 1, "species", activeSpeciesItem.name);
      addSkillMods(activeSpeciesItem.system.skillModifiers, 1, activeSpeciesItem.name);
      this.speciesSummary = activeSpeciesItem.system;
    } else if (selectedPreset) {
      addAttrMods(selectedPreset.attributeModifiers, 1, "species", selectedPreset.name);
      addSkillMods(selectedPreset.skillModifiers, 1, selectedPreset.name);
      this.speciesSummary = selectedPreset;
    } else if (activeSpeciesItem) {
      addAttrMods(activeSpeciesItem.system.attributeModifiers, 1, "species", activeSpeciesItem.name);
      addSkillMods(activeSpeciesItem.system.skillModifiers, 1, activeSpeciesItem.name);
      this.speciesSummary = activeSpeciesItem.system;
    }

    const speciesPsiAllowed =
      this.speciesSummary?.psiAllowed !== undefined
        ? Boolean(this.speciesSummary.psiAllowed)
        : true;
    this.isPsiAllowed = speciesPsiAllowed && !hasPsionicAbnormality;

    const primaryMaxDefault = Number(this.speciesSummary?.attributeLimits?.primaryMax) || 4;
    const secondaryMaxDefault = Number(this.speciesSummary?.attributeLimits?.secondaryMax) || 4;

    this.skillBonuses = skillBonuses;
    this.skillBonusSources = skillBonusSources;
    this.itemAttrMods = itemAttrMods;

    // 2. Dynamic Organismus calculation (Punkt 3):
    // system.organismus.current = system.organismus.max - (sum of system.organismCost of installed cyberware) - manual damage
    const orgMax = Number(this.status.organismus.max) || 100;
    const manualOrgDamage = Math.max(0, Number(this.status.organismus.damage) || 0);
    const orgCurrent = orgMax - cyberwareOrganismCost - manualOrgDamage;
    this.status.organismus.cyberwareCost = cyberwareOrganismCost;
    this.status.organismus.current = orgCurrent;
    this.status.organismus.value = orgCurrent;
    this.organismus = {
      max: orgMax,
      current: orgCurrent,
      value: orgCurrent,
      cyberwareCost: cyberwareOrganismCost,
      damage: manualOrgDamage
    };
    this.isOrganismCritical = orgCurrent <= 0;

    // 3. Primary Attributes (base + manual mod + item modifier) + species limits + Pool Tooltips (Punkt 6)
    for (const [key, attr] of Object.entries(this.attributes.primary)) {
      const dynMod = itemAttrMods[key] || 0;
      const spMod = speciesAttrMods[key] || 0;
      const cybMod = cyberAttrMods[key] || 0;
      const othMod = otherItemAttrMods[key] || 0;
      attr.itemMod = dynMod;
      if (selectedSpeciesKey === "Evo" && key !== "konstitution") {
        attr.maxLimit = 4;
      } else {
        attr.maxLimit = primaryMaxDefault;
      }
      const baseVal = Number(attr.base) || 0;
      const manMod = Number(attr.mod) || 0;
      attr.overall = Math.max(0, baseVal + manMod + dynMod);
      const hazardCount = attr.overall > 0 ? (attr.alphaBio ? attr.overall : 1) : 0;
      const srcDetails = attrModSources[key]?.length ? ` [${attrModSources[key].join(", ")}]` : "";
      const othPart = othMod !== 0 ? ` + Mutationen/Merkmale/Drogen: ${othMod >= 0 ? `+${othMod}` : othMod}` : "";
      attr.poolTooltip = `Basis-Stufe: ${baseVal} + Modifikator: ${manMod >= 0 ? `+${manMod}` : manMod} + Spezies-Bonus: ${spMod >= 0 ? `+${spMod}` : spMod} + Cyberware/Biomechanik: ${cybMod >= 0 ? `+${cybMod}` : cybMod}${othPart}${srcDetails} = ${attr.overall}W6 (davon ${hazardCount} Hazard-Di${attr.alphaBio ? ", Alpha-Bio aktiv" : ""})`;
    }

    // 4. Secondary Attributes (base + manual mod + item modifier) + species limits + Pool Tooltips (Punkt 6)
    for (const [key, attr] of Object.entries(this.attributes.secondary)) {
      const dynMod = itemAttrMods[key] || 0;
      const spMod = speciesAttrMods[key] || 0;
      const cybMod = cyberAttrMods[key] || 0;
      const othMod = otherItemAttrMods[key] || 0;
      attr.itemMod = dynMod;
      attr.maxLimit = secondaryMaxDefault;
      const baseVal = Number(attr.base) || 0;
      const manMod = Number(attr.mod) || 0;
      attr.total = Math.max(0, baseVal + manMod + dynMod);
      const srcDetails = attrModSources[key]?.length ? ` [${attrModSources[key].join(", ")}]` : "";
      const othPart = othMod !== 0 ? ` + Mutationen/Merkmale/Drogen: ${othMod >= 0 ? `+${othMod}` : othMod}` : "";
      if (key === "schmerztoleranz") {
        attr.poolTooltip = `Basis-Stufe: ${baseVal} + Modifikator: ${manMod >= 0 ? `+${manMod}` : manMod} + Spezies-Bonus: ${spMod >= 0 ? `+${spMod}` : spMod} + Cyberware/Biomechanik: ${cybMod >= 0 ? `+${cybMod}` : cybMod}${othPart}${srcDetails} = ${attr.total} (reduziert Wundmali je Zone)`;
      } else {
        attr.poolTooltip = `Basis-Stufe: ${baseVal} + Modifikator: ${manMod >= 0 ? `+${manMod}` : manMod} + Spezies-Bonus: ${spMod >= 0 ? `+${spMod}` : spMod} + Cyberware/Biomechanik: ${cybMod >= 0 ? `+${cybMod}` : cybMod}${othPart}${srcDetails} = ${attr.total}W6 (davon ${attr.total > 0 ? 1 : 0} Hazard-Di)`;
      }
    }

    // Adrenaline effective level
    this.attributes.special.adrenalin.effectiveStufe = Math.max(
      0,
      (Number(this.attributes.special.adrenalin.stufe) || 0) + (itemAttrMods.adrenalin || 0)
    );

    // Apply regeneration bonuses from mutations/abnormalities if higher than base
    if (mutationRegenSpeed > this.status.regeneration.geschwindigkeit) {
      this.status.regeneration.geschwindigkeit = mutationRegenSpeed;
    }
    if (mutationRegenPool > this.status.regeneration.pool) {
      this.status.regeneration.pool = mutationRegenPool;
    }

    const painTolerance = this.attributes.secondary.schmerztoleranz.total;
    const konstitution = this.attributes.primary.konstitution.overall;
    const schnelligkeit = this.attributes.primary.schnelligkeit.overall;
    const staerke = this.attributes.primary.staerke.overall;

    // 5. Aggregate equipped armor & stemmen skill from parent Actor's items (Punkt 2: Zonen-Rüstung 2 bis 12)
    let stemmenLevel = 0;
    let maxArmorComfort = 0;
    const zoneBonusArmor = {};
    const zoneMaterial = {};
    const zoneArmorSources = {};
    for (const z of HIT_ZONES) {
      zoneBonusArmor[z.code] = mutationArmorBonus;
      zoneMaterial[z.code] = mutationArmorBonus > 0 ? mutationArmorMk : "A";
      zoneArmorSources[z.code] = [];
      if (mutationArmorBonus > 0) {
        zoneArmorSources[z.code].push(`Mutationen: +${mutationArmorBonus} (MK:${mutationArmorMk})`);
      }
    }

    for (const item of items) {
      if (item.type === "skill" && (item.system.skillId === "stemmen" || item.name.toLowerCase() === "stemmen")) {
        stemmenLevel = Math.max(stemmenLevel, Number(item.system.level || 0));
      } else if (item.type === "armor" && item.system.equipped) {
        if (item.system.prepareDerivedData) {
          item.system.prepareDerivedData();
        }
        const comfort = Number(item.system.comfort || 0);
        if (comfort > maxArmorComfort) maxArmorComfort = comfort;
        const rw = Number(item.system.armorValue || 0);
        const mk = String(item.system.materialCategory || "A").toUpperCase();
        const coveredZones =
          Array.isArray(item.system.coveredZones) && item.system.coveredZones.length > 0
            ? item.system.coveredZones
            : Array.isArray(item.system.zones)
            ? item.system.zones
            : [];
        for (const zNum of coveredZones) {
          const zCode = String(zNum);
          if (zCode in zoneBonusArmor) {
            zoneBonusArmor[zCode] += rw;
            zoneArmorSources[zCode].push(`${item.name}: +${rw} (MK:${mk})`);
            if (mk > zoneMaterial[zCode]) zoneMaterial[zCode] = mk;
          }
        }
      }
    }

    // 6. Carry Capacity (Tragkraft) = (Stärke + Stemmen + Bonus) * 10 kg
    const stemmenBonus = skillBonuses["stemmen"] || 0;
    this.status.tragkraft = (staerke + stemmenLevel + stemmenBonus) * 10;

    // 7. Armor Comfort Penalty
    this.health.comfortPenalty = Math.max(0, maxArmorComfort - konstitution);

    // 8. Hit Zones & Wound Penalties
    const tierMax = Math.max(Number(this.health.maxHpTier) || 30, mutationMaxHpOverride);
    const stageSize = Math.max(1, tierMax / 10);
    let totalWoundPenalty = 0;

    for (const z of HIT_ZONES) {
      const zone = this.health.zones[z.code];
      if (!zone) continue;
      zone.max = tierMax;
      zone.lethal = z.lethal;
      const baseArmor = Number(zone.armor) || 0;
      zone.equippedArmor = baseArmor + (zoneBonusArmor[z.code] || 0);
      if (zoneMaterial[z.code] > (zone.materialCategory || "A")) {
        zone.materialCategory = zoneMaterial[z.code];
      }
      const breakdownParts = [`Basis: ${baseArmor}`, ...(zoneArmorSources[z.code] || [])];
      zone.armorBreakdown = `${breakdownParts.join(" + ")} = ${zone.equippedArmor} RW (MK:${zone.materialCategory || "A"})`;
      const dmg = Math.max(0, Number(zone.damage) || 0);
      if (dmg > 0) {
        const woundStage = Math.ceil(dmg / stageSize);
        zone.penalty = Math.max(0, woundStage - painTolerance);
      } else {
        zone.penalty = 0;
      }
      totalWoundPenalty += zone.penalty;
    }

    this.health.gesamteMali = totalWoundPenalty + (Number(this.health.sonstigeMali) || 0);

    this.isUnconscious = this.health.gesamteMali >= konstitution && konstitution > 0;
    this.isImmobilized = this.health.gesamteMali >= schnelligkeit && schnelligkeit > 0;

    // 9. PSI Hierarchy & Pyramid Summary (Punkt 3)
    const psiForces = items.filter(
      (i) => i.type === "psiForce" && (i.system.psiCategory || i.system.category || "A") === "A"
    );
    const getForceTier = (f) =>
      resolvePsiHierarchyTier(f.system.forceId || f.name, {
        manualOverride: Boolean(f.system.manualHierarchyOverride),
        itemTier: f.system.hierarchyTier
      });
    const t1Forces = psiForces.filter((f) => getForceTier(f) === 1).length;
    const t2Forces = psiForces.filter((f) => getForceTier(f) === 2).length;
    const t3Forces = psiForces.filter((f) => getForceTier(f) === 3).length;
    const forceHierarchyValid = t2Forces <= t1Forces && t3Forces <= t2Forces && t3Forces <= t1Forces;
    const forceHierarchyWarnings = [];
    if (t2Forces > t1Forces) {
      forceHierarchyWarnings.push(
        t1Forces === 0
          ? `Pyramiden-Verstoß: ${t2Forces} PSI-Kraft/Kräfte der Hierarchiestufe 2 erlernt, ohne dass eine PSI-Kraft der Hierarchiestufe 1 vorhanden ist!`
          : `Pyramiden-Verstoß: Für ${t2Forces} PSI-Kräfte der Hierarchiestufe 2 werden mindestens ${t2Forces} Kräfte der Hierarchiestufe 1 benötigt (aktuell: ${t1Forces}).`
      );
    }
    if (t3Forces > t2Forces || t3Forces > t1Forces) {
      forceHierarchyWarnings.push(
        t2Forces === 0
          ? `Pyramiden-Verstoß: ${t3Forces} PSI-Kraft/Kräfte der Hierarchiestufe 3 erlernt, ohne dass eine PSI-Kraft der Hierarchiestufe 2 vorhanden ist!`
          : `Pyramiden-Verstoß: Für ${t3Forces} PSI-Kräfte der Hierarchiestufe 3 werden mindestens je ${t3Forces} Kräfte der Hierarchiestufe 1 (${t1Forces}) und Hierarchiestufe 2 (${t2Forces}) benötigt.`
      );
    }
    this.psiSummary = {
      t1Forces,
      t2Forces,
      t3Forces,
      forceHierarchyValid,
      forceHierarchyWarnings,
      forceHierarchyWarningText: forceHierarchyWarnings.join(" ")
    };

    // 10. Re-prepare embedded items so skill/weapon/PSI pools reflect final derived attributes & bonuses (Punkt 1 & 2)
    for (const item of items) {
      if (
        item?.system?.prepareDerivedData &&
        ["skill", "styleskill", "weapon", "psiForce", "psiApp", "gear"].includes(item.type)
      ) {
        item.system.prepareDerivedData();
      }
    }
  }
}
