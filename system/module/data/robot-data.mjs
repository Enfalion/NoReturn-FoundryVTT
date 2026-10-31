/**
 * Hybrid DataModel for NoReturn Robotics / Cyborg / Drone Sheet.
 * Combines all standard Character attributes, derived stats, and skills with
 * 11-zone Robotics tuning, Chassis status, Power Supply/Battery, Module Sockets,
 * Energy Drain, and Structural Hitpoints (1st_Edition_NoReturn-Robotikbogen.pdf & Corebook pp. 182-187).
 */
import { parseSkillModifiers, resolvePsiHierarchyTier } from "./item-data.mjs";
import { PLAYABLE_SPECIES_PRESETS } from "./character-data.mjs";

export const ROBOT_ZONE_ORDER = [
  { code: "12", labelKey: "NORETURN.Health.Zones.12", lethal: true },
  { code: "6", labelKey: "NORETURN.Health.Zones.6", lethal: true },
  { code: "8", labelKey: "NORETURN.Health.Zones.8", lethal: true },
  { code: "7", labelKey: "NORETURN.Health.Zones.7", lethal: true },
  { code: "5", labelKey: "NORETURN.Health.Zones.5", lethal: false },
  { code: "9", labelKey: "NORETURN.Health.Zones.9", lethal: false },
  { code: "2", labelKey: "NORETURN.Health.Zones.2", lethal: true },
  { code: "4", labelKey: "NORETURN.Health.Zones.4", lethal: false },
  { code: "10", labelKey: "NORETURN.Health.Zones.10", lethal: false },
  { code: "3", labelKey: "NORETURN.Health.Zones.3", lethal: false },
  { code: "11", labelKey: "NORETURN.Health.Zones.11", lethal: false }
];

export const ROBOT_MODELS = {
  bio: {
    geschick: 2,
    staerke: 2,
    konstitution: 2,
    schnelligkeit: 2,
    tastsinn: 2,
    kapazitaet: 0,
    organismus: 0,
    panzerung: 0,
    mk: "A",
    defaultDesign: "Biologisch / Normal",
    maxHp: 30
  },
  casual: {
    geschick: 1,
    staerke: 2,
    konstitution: 2,
    schnelligkeit: 1,
    tastsinn: 2,
    kapazitaet: 10,
    organismus: 8,
    panzerung: 20,
    mk: "B",
    defaultDesign: "Casual - Steel",
    maxHp: 50
  },
  work: {
    geschick: 1,
    staerke: 4,
    konstitution: 4,
    schnelligkeit: 1,
    tastsinn: 2,
    kapazitaet: 12,
    organismus: 14,
    panzerung: 30,
    mk: "B",
    defaultDesign: "Work - Industrial",
    maxHp: 50
  },
  hightech: {
    geschick: 2,
    staerke: 2,
    konstitution: 2,
    schnelligkeit: 2,
    tastsinn: 4,
    kapazitaet: 8,
    organismus: 4,
    panzerung: 20,
    mk: "B",
    defaultDesign: "High Tech - Pearl",
    maxHp: 50
  },
  android: {
    geschick: 2,
    staerke: 2,
    konstitution: 2,
    schnelligkeit: 2,
    tastsinn: 6,
    kapazitaet: 6,
    organismus: 2,
    panzerung: 0,
    mk: "A",
    defaultDesign: "Android - Skin",
    maxHp: 50
  },
  military: {
    geschick: 3,
    staerke: 6,
    konstitution: 6,
    schnelligkeit: 3,
    tastsinn: 2,
    kapazitaet: 12,
    organismus: 6,
    panzerung: 40,
    mk: "B",
    defaultDesign: "Military - Army",
    maxHp: 50
  }
};

export class NoReturnRobotData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    const primaryAttrField = (initialBase = 2) =>
      new fields.SchemaField({
        base: new fields.NumberField({ required: true, integer: true, min: 0, initial: initialBase }),
        mod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        overall: new fields.NumberField({ required: true, integer: true, min: 0, initial: initialBase }),
        alphaBio: new fields.BooleanField({ required: true, initial: false })
      });

    const secondaryAttrField = (initialBase = 1, minBase = 0) =>
      new fields.SchemaField({
        base: new fields.NumberField({ required: true, integer: true, min: minBase, initial: initialBase }),
        mod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        total: new fields.NumberField({ required: true, integer: true, min: 0, initial: initialBase })
      });

    const senseField = (initialBase = 2) =>
      new fields.SchemaField({
        base: new fields.NumberField({ required: true, integer: true, min: 0, initial: initialBase }),
        cybersenseStufe: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        mod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        total: new fields.NumberField({ required: true, integer: true, min: 0, initial: initialBase }),
        organismusCost: new fields.NumberField({ required: true, min: 0, initial: 0 }),
        capacityCost: new fields.NumberField({ required: true, min: 0, initial: 0 })
      });

    const zoneSchemas = {};
    const healthZoneSchemas = {};
    for (const z of ROBOT_ZONE_ORDER) {
      zoneSchemas[z.code] = new fields.SchemaField({
        isRobotic: new fields.BooleanField({ required: true, initial: true }),
        model: new fields.StringField({
          required: false,
          blank: true,
          choices: ["bio", "casual", "work", "hightech", "android", "military"],
          initial: "casual"
        }),
        design: new fields.StringField({ required: false, blank: true, initial: "Casual - Steel" }),
        upgrades: new fields.SchemaField({
          geschick: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          staerke: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          konstitution: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          schnelligkeit: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          tastsinn: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          panzerung: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        values: new fields.SchemaField({
          geschick: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
          staerke: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
          konstitution: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
          schnelligkeit: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
          tastsinn: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
          kapazitaetMax: new fields.NumberField({ required: true, min: 0, initial: 10 }),
          kapazitaetUsed: new fields.NumberField({ required: true, min: 0, initial: 0 }),
          kapazitaetFrei: new fields.NumberField({ required: true, initial: 10 }),
          organismus: new fields.NumberField({ required: true, min: 0, initial: 8 }),
          panzerung: new fields.NumberField({ required: true, integer: true, min: 0, initial: 20 }),
          materialCategory: new fields.StringField({ required: false, blank: true, initial: "B" })
        }),
        health: new fields.SchemaField({
          damage: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          max: new fields.NumberField({ required: true, integer: true, min: 10, initial: 50 }),
          penalty: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          lethal: new fields.BooleanField({ required: true, initial: z.lethal })
        })
      });

      healthZoneSchemas[z.code] = new fields.SchemaField({
        damage: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        max: new fields.NumberField({ required: true, integer: true, min: 10, initial: 50 }),
        armor: new fields.NumberField({ required: true, integer: true, min: 0, initial: 20 }),
        equippedArmor: new fields.NumberField({ required: true, integer: true, min: 0, initial: 20 }),
        materialCategory: new fields.StringField({ required: false, blank: true, initial: "B" }),
        penalty: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        lethal: new fields.BooleanField({ required: true, initial: z.lethal })
      });
    }

    return {
      personal: new fields.SchemaField({
        spezies: new fields.StringField({ required: false, blank: true, initial: "Mensch" }),
        geschlecht: new fields.StringField({ required: false, blank: true, initial: "" }),
        alter: new fields.NumberField({ required: true, integer: true, min: 0, initial: 25 }),
        groesse: new fields.StringField({ required: false, blank: true, initial: "1,85 m" }),
        gewicht: new fields.StringField({ required: false, blank: true, initial: "120 kg" }),
        haarfarbe: new fields.StringField({ required: false, blank: true, initial: "" }),
        augenfarbe: new fields.StringField({ required: false, blank: true, initial: "" }),
        hautfarbe: new fields.StringField({ required: false, blank: true, initial: "" }),
        berufung: new fields.StringField({ required: false, blank: true, initial: "Cyborg / Operator" }),
        modell: new fields.StringField({ required: false, blank: true, initial: "Heart Industries Chassis" }),
        seriennummer: new fields.StringField({ required: false, blank: true, initial: "HI-5499-NR" }),
        besitzer: new fields.StringField({ required: false, blank: true, initial: "" }),
        hersteller: new fields.StringField({ required: false, blank: true, initial: "Heart Industries" }),
        techLevel: new fields.StringField({ required: false, blank: true, initial: "IV" })
      }),
      attributes: new fields.SchemaField({
        primary: new fields.SchemaField({
          geschick: primaryAttrField(1),
          staerke: primaryAttrField(2),
          konstitution: primaryAttrField(2),
          schnelligkeit: primaryAttrField(1),
          wissen: primaryAttrField(2),
          wahrnehmung: primaryAttrField(2)
        }),
        secondary: new fields.SchemaField({
          charisma: secondaryAttrField(1, 1),
          logik: secondaryAttrField(2, 1),
          fahrzeuge: secondaryAttrField(1, 1),
          schmerztoleranz: secondaryAttrField(5, 0)
        }),
        special: new fields.SchemaField({
          adrenalin: new fields.SchemaField({
            stufe: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
            pool: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 })
          })
        })
      }),
      chassis: new fields.SchemaField({
        status: new fields.StringField({ required: false, blank: true, initial: "Online / Optimal" }),
        powerSupply: new fields.StringField({ required: false, blank: true, initial: "ZEUS-Kern / Bio-Reaktor" }),
        battery: new fields.SchemaField({
          value: new fields.NumberField({ required: true, min: 0, max: 1000, initial: 100 }),
          max: new fields.NumberField({ required: true, min: 1, max: 1000, initial: 100 })
        }),
        energyDrainBase: new fields.NumberField({ required: true, min: 0, initial: 1 }),
        energyDrain: new fields.NumberField({ required: true, min: 0, initial: 1 }),
        moduleSockets: new fields.SchemaField({
          used: new fields.NumberField({ required: true, min: 0, initial: 0 }),
          max: new fields.NumberField({ required: true, min: 0, initial: 110 }),
          free: new fields.NumberField({ required: true, initial: 110 })
        }),
        structuralHp: new fields.SchemaField({
          value: new fields.NumberField({ required: true, min: 0, initial: 550 }),
          max: new fields.NumberField({ required: true, min: 0, initial: 550 }),
          damage: new fields.NumberField({ required: true, min: 0, initial: 0 })
        })
      }),
      wahrnehmung: new fields.SchemaField({
        sehen: senseField(2),
        hoeren: senseField(2),
        riechen: senseField(2),
        schmecken: senseField(2),
        tastsinnAllOver: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
        allOverWahrnehmung: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 })
      }),
      zones: new fields.SchemaField(zoneSchemas),
      allOver: new fields.SchemaField({
        geschick: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
        staerke: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
        konstitution: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
        schnelligkeit: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
        tastsinn: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
        summeOrganismusverlust: new fields.NumberField({ required: true, min: 0, initial: 88 }),
        restOrganismus: new fields.NumberField({ required: true, min: 0, initial: 12 })
      }),
      secondary: new fields.SchemaField({
        wissen: new fields.NumberField({ required: true, integer: true, min: 1, initial: 2 }),
        charisma: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
        logik: new fields.NumberField({ required: true, integer: true, min: 1, initial: 2 }),
        fahrzeuge: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
        schmerztoleranz: new fields.NumberField({ required: true, integer: true, min: 0, initial: 5 }),
        adrenalin: new fields.SchemaField({
          stufe: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
          pool: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 })
        })
      }),
      status: new fields.SchemaField({
        bekanntheit: new fields.NumberField({ required: true, integer: true, min: 1, max: 100, initial: 100 }),
        ruf: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        organismus: new fields.SchemaField({
          max: new fields.NumberField({ required: true, min: 0, initial: 100 }),
          value: new fields.NumberField({ required: true, min: 0, initial: 12 }),
          leiden1: new fields.StringField({ required: false, blank: true, initial: "" }),
          leiden2: new fields.StringField({ required: false, blank: true, initial: "" }),
          leiden3: new fields.StringField({ required: false, blank: true, initial: "" })
        }),
        psyche: new fields.SchemaField({
          max: new fields.NumberField({ required: true, min: 0, initial: 100 }),
          value: new fields.NumberField({ required: true, min: 0, initial: 80 })
        }),
        infektionsresistenz: new fields.StringField({ required: false, blank: true, initial: "2d6" }),
        regeneration: new fields.SchemaField({
          geschwindigkeit: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          pool: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        tragkraft: new fields.NumberField({ required: true, min: 0, initial: 20 }),
        erfahrung: new fields.SchemaField({
          gesamt: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          aktuell: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        justicepoints: new fields.SchemaField({
          gesamt: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          aktuell: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        chaospoints: new fields.SchemaField({
          gesamt: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          aktuell: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        bargeld: new fields.NumberField({ required: true, min: 0, initial: 0 })
      }),
      health: new fields.SchemaField({
        maxHpTier: new fields.NumberField({
          required: true,
          integer: true,
          choices: [10, 15, 30, 50, 70, 90],
          initial: 50
        }),
        sonstigeMali: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        comfortPenalty: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        gesamteMali: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        zones: new fields.SchemaField(healthZoneSchemas)
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

  prepareDerivedData() {
    let sumGE = 0;
    let sumST = 0;
    let sumKO = 0;
    let sumSK = 0;
    let sumTastsinn = 0;
    let sumOrganismusLoss = 0;
    let totalWoundPenalty = 0;
    let totalCapacityMax = 0;
    let totalCapacityUsed = 0;
    let totalStructuralMax = 0;
    let totalStructuralDamage = 0;

    // Collect installed module capacity/organism/energy costs and item modifiers
    const moduleCapByZone = {};
    const zoneBonusArmor = {};
    let moduleOrgLoss = 0;
    let moduleEnergyDrain = 0;
    let stemmenLevel = 0;

    const itemAttrMods = {
      geschick: 0,
      staerke: 0,
      konstitution: 0,
      schnelligkeit: 0,
      wissen: 0,
      wahrnehmung: 0,
      charisma: 0,
      logik: 0,
      fahrzeuge: 0,
      schmerztoleranz: 0,
      adrenalin: 0
    };
    const skillBonuses = {};
    let activeSpeciesItem = null;

    const addAttrMods = (modsObj, multiplier = 1) => {
      if (!modsObj) return;
      for (const k of Object.keys(itemAttrMods)) {
        const v = Number(modsObj[k] || 0) * multiplier;
        if (v) itemAttrMods[k] += v;
      }
    };

    const addSkillMods = (modStr, multiplier = 1) => {
      const parsed = parseSkillModifiers(modStr);
      for (const [k, v] of Object.entries(parsed)) {
        skillBonuses[k] = (skillBonuses[k] || 0) + v * multiplier;
      }
    };

    const items = this.parent?.items ?? [];
    for (const item of items) {
      if (item.type === "skill" && (item.system.skillId === "stemmen" || item.name.toLowerCase() === "stemmen")) {
        stemmenLevel = Math.max(stemmenLevel, Number(item.system.level || 0));
      } else if ((item.type === "robotModule" || item.type === "cyberware") && item.system.installed !== false) {
        const zCode = String(item.system.targetZone || "").trim();
        const capCost = Number(item.system.capacityCost || 0);
        const orgCost = Math.max(
          Number(item.system.organismCost || 0),
          Number(item.system.organismusCost || 0)
        );
        const eDrain = Number(item.system.energyDrain ?? (capCost > 0 ? capCost * 0.5 : 0.25));
        moduleEnergyDrain += eDrain;
        if (zCode && this.zones[zCode]) {
          moduleCapByZone[zCode] = (moduleCapByZone[zCode] || 0) + capCost;
        }
        moduleOrgLoss += orgCost;
      } else if (item.type === "armor" && item.system.equipped) {
        const rw = Number(item.system.armorValue || 0);
        const coveredZones = Array.isArray(item.system.zones) ? item.system.zones : [];
        for (const zNum of coveredZones) {
          const zCode = String(zNum);
          zoneBonusArmor[zCode] = (zoneBonusArmor[zCode] || 0) + rw;
        }
      } else if (item.type === "species") {
        activeSpeciesItem = item;
        addAttrMods(item.system.attributeModifiers, 1);
        addSkillMods(item.system.skillModifiers, 1);
      } else if (item.type === "mutation" && item.system.active !== false) {
        const lvl = Math.max(1, Number(item.system.level) || 1);
        addAttrMods(item.system.attributeModifiers, lvl);
        addSkillMods(item.system.skillModifiers, lvl);
      } else if (item.type === "trait") {
        addAttrMods(item.system.attributeModifiers, 1);
        addSkillMods(item.system.skillModifiers, 1);
      } else if (item.type === "styleskill" && item.system.active !== false) {
        const lvl = Math.max(1, Number(item.system.level) || 1);
        addAttrMods(item.system.attributeModifiers, lvl);
        addSkillMods(item.system.skillModifiers, lvl);
      } else if (item.type === "consumable" && item.system.active) {
        addAttrMods(item.system.attributeModifiers, 1);
        addSkillMods(item.system.skillModifiers, 1);
      }
    }

    if (!activeSpeciesItem && this.personal?.spezies) {
      const preset = PLAYABLE_SPECIES_PRESETS[this.personal.spezies];
      if (preset) {
        addAttrMods(preset.attributeModifiers, 1);
        addSkillMods(preset.skillModifiers, 1);
        this.speciesSummary = preset;
      }
    } else if (activeSpeciesItem) {
      this.speciesSummary = activeSpeciesItem.system;
    }

    this.skillBonuses = skillBonuses;
    this.itemAttrMods = itemAttrMods;

    const painTolerance =
      Math.max(
        Number(this.attributes?.secondary?.schmerztoleranz?.base ?? 0),
        Number(this.secondary?.schmerztoleranz ?? 0)
      ) +
      (Number(this.attributes?.secondary?.schmerztoleranz?.mod) || 0) +
      (itemAttrMods.schmerztoleranz || 0);

    let tuningEnergyDrain = 0;

    // Calculate each of the 11 zones
    for (const z of ROBOT_ZONE_ORDER) {
      const zone = this.zones[z.code];
      if (!zone) continue;

      const modelKey = zone.isRobotic ? zone.model || "casual" : "bio";
      const preset = ROBOT_MODELS[modelKey] || ROBOT_MODELS.casual;

      const upgGE = Math.max(0, Number(zone.upgrades.geschick) || 0);
      const upgST = Math.max(0, Number(zone.upgrades.staerke) || 0);
      const upgKO = Math.max(0, Number(zone.upgrades.konstitution) || 0);
      const upgSK = Math.max(0, Number(zone.upgrades.schnelligkeit) || 0);
      const upgTast = Math.max(0, Number(zone.upgrades.tastsinn) || 0);
      const upgPanz = Math.max(0, Number(zone.upgrades.panzerung) || 0);

      zone.values.geschick = preset.geschick + upgGE;
      zone.values.staerke = preset.staerke + upgST;
      zone.values.konstitution = preset.konstitution + upgKO;
      zone.values.schnelligkeit = preset.schnelligkeit + upgSK;
      zone.values.tastsinn = preset.tastsinn + upgTast * 3;
      zone.values.panzerung = preset.panzerung + upgPanz * 5 + (zoneBonusArmor[z.code] || 0);
      zone.values.materialCategory = preset.mk;

      const tuningCapUsed =
        upgGE * 0.5 +
        upgST * 0.25 +
        upgKO * 0.25 +
        upgSK * 0.5 +
        upgTast * 0.25 +
        upgPanz * 0.5;
      const installedCapUsed = moduleCapByZone[z.code] || 0;

      zone.values.kapazitaetMax = preset.kapazitaet;
      zone.values.kapazitaetUsed = Number((tuningCapUsed + installedCapUsed).toFixed(2));
      zone.values.kapazitaetFrei = Number((preset.kapazitaet - zone.values.kapazitaetUsed).toFixed(2));
      zone.values.organismus = preset.organismus;

      totalCapacityMax += zone.values.kapazitaetMax;
      totalCapacityUsed += zone.values.kapazitaetUsed;
      tuningEnergyDrain += tuningCapUsed * 0.2;

      // Health & wound stage per zone
      zone.health.max = preset.maxHp;
      zone.health.lethal = z.lethal;
      const stageSize = Math.max(1, zone.health.max / 10);
      const dmg = Math.max(0, Number(zone.health.damage) || 0);
      if (dmg > 0) {
        const woundStage = Math.ceil(dmg / stageSize);
        zone.health.penalty = Math.max(0, woundStage - painTolerance);
      } else {
        zone.health.penalty = 0;
      }

      totalStructuralMax += zone.health.max;
      totalStructuralDamage += dmg;

      // Mirror into health.zones for standard character sheet compatibility
      if (this.health?.zones?.[z.code]) {
        this.health.zones[z.code].damage = dmg;
        this.health.zones[z.code].max = zone.health.max;
        this.health.zones[z.code].armor = zone.values.panzerung;
        this.health.zones[z.code].equippedArmor = zone.values.panzerung;
        this.health.zones[z.code].materialCategory = zone.values.materialCategory;
        this.health.zones[z.code].penalty = zone.health.penalty;
        this.health.zones[z.code].lethal = z.lethal;
      }

      sumGE += zone.values.geschick;
      sumST += zone.values.staerke;
      sumKO += zone.values.konstitution;
      sumSK += zone.values.schnelligkeit;
      sumTastsinn += zone.values.tastsinn;
      sumOrganismusLoss += zone.values.organismus;
      totalWoundPenalty += zone.health.penalty;
    }

    // All over Attributes (Summe / 11, rounded per Corebook p. 107 & Robotikbogen)
    this.allOver.geschick = Math.round(sumGE / 11);
    this.allOver.staerke = Math.round(sumST / 11);
    this.allOver.konstitution = Math.round(sumKO / 11);
    this.allOver.schnelligkeit = Math.round(sumSK / 11);
    this.allOver.tastsinn = Math.round(sumTastsinn / 11);

    // Senses & All over Wahrnehmung
    const senseConfigs = [
      { key: "sehen", orgPerLevel: 1, capPerLevel: 0.25 },
      { key: "hoeren", orgPerLevel: 1, capPerLevel: 0.25 },
      { key: "riechen", orgPerLevel: 0.5, capPerLevel: 0.25 },
      { key: "schmecken", orgPerLevel: 0.5, capPerLevel: 0.25 }
    ];

    let senseSum = 0;
    let cybersenseOrgLoss = 0;
    let cybersenseCapUsed = 0;
    for (const sc of senseConfigs) {
      const s = this.wahrnehmung[sc.key];
      const csLevel = Math.max(0, Number(s.cybersenseStufe) || 0);
      s.total = Math.max(0, (Number(s.base) || 0) + csLevel * 2 + (Number(s.mod) || 0));
      s.organismusCost = csLevel * sc.orgPerLevel;
      s.capacityCost = csLevel * sc.capPerLevel;
      senseSum += s.total;
      cybersenseCapUsed += s.capacityCost;
      if (!this.zones["12"]?.isRobotic) {
        cybersenseOrgLoss += s.organismusCost;
      }
    }

    this.wahrnehmung.tastsinnAllOver = this.allOver.tastsinn;
    this.wahrnehmung.allOverWahrnehmung = Math.round(
      (senseSum + this.wahrnehmung.tastsinnAllOver) / 5
    );

    // Chassis / Component metrics
    this.chassis.moduleSockets.max = Number(totalCapacityMax.toFixed(2));
    this.chassis.moduleSockets.used = Number((totalCapacityUsed + cybersenseCapUsed).toFixed(2));
    this.chassis.moduleSockets.free = Number(
      (this.chassis.moduleSockets.max - this.chassis.moduleSockets.used).toFixed(2)
    );
    this.chassis.energyDrain = Number(
      ((Number(this.chassis.energyDrainBase) || 0) + moduleEnergyDrain + tuningEnergyDrain).toFixed(2)
    );
    this.chassis.structuralHp.max = totalStructuralMax;
    this.chassis.structuralHp.damage = totalStructuralDamage;
    this.chassis.structuralHp.value = Math.max(0, totalStructuralMax - totalStructuralDamage);

    // Total Organismus loss
    this.allOver.summeOrganismusverlust = Number(
      (sumOrganismusLoss + cybersenseOrgLoss + moduleOrgLoss).toFixed(2)
    );
    const orgMax = Number(this.status?.organismus?.max) || 100;
    const restOrg = Number((orgMax - this.allOver.summeOrganismusverlust).toFixed(2));
    this.allOver.restOrganismus = restOrg;
    this.status.organismus.cyberwareCost = this.allOver.summeOrganismusverlust;
    this.status.organismus.current = restOrg;
    this.status.organismus.value = restOrg;
    this.organismus = {
      max: orgMax,
      current: restOrg,
      value: restOrg,
      cyberwareCost: this.allOver.summeOrganismusverlust
    };
    this.isOrganismCritical = restOrg <= 0;

    const psiForces = items.filter((i) => i.type === "psiForce" && i.system.psiCategory === "A");
    const getForceTier = (f) =>
      resolvePsiHierarchyTier(
        f.system.psiForce || f.name,
        f.system.hierarchyTier,
        Boolean(f.system.manualHierarchyOverride)
      );
    const t1Forces = psiForces.filter((f) => getForceTier(f) === 1).length;
    const t2Forces = psiForces.filter((f) => getForceTier(f) === 2).length;
    const t3Forces = psiForces.filter((f) => getForceTier(f) === 3).length;
    this.psiSummary = {
      t1Forces,
      t2Forces,
      t3Forces,
      forceHierarchyValid: t2Forces <= t1Forces && t3Forces <= t2Forces
    };

    // Hybrid Primary & Secondary Attributes (combining All-Over / Base + Mod + Item Modifiers)
    const physicalKeys = ["geschick", "staerke", "konstitution", "schnelligkeit"];
    for (const k of physicalKeys) {
      const pAttr = this.attributes.primary[k];
      pAttr.base = this.allOver[k];
      pAttr.itemMod = itemAttrMods[k] || 0;
      pAttr.overall = Math.max(0, this.allOver[k] + (Number(pAttr.mod) || 0) + pAttr.itemMod);
    }

    // Wissen & Wahrnehmung
    const wissenBase = Math.max(
      Number(this.attributes.primary.wissen.base) || 1,
      Number(this.secondary.wissen) || 1
    );
    this.attributes.primary.wissen.base = wissenBase;
    this.attributes.primary.wissen.itemMod = itemAttrMods.wissen || 0;
    this.attributes.primary.wissen.overall = Math.max(
      0,
      wissenBase + (Number(this.attributes.primary.wissen.mod) || 0) + (itemAttrMods.wissen || 0)
    );
    this.secondary.wissen = this.attributes.primary.wissen.overall;

    this.attributes.primary.wahrnehmung.base = this.wahrnehmung.allOverWahrnehmung;
    this.attributes.primary.wahrnehmung.itemMod = itemAttrMods.wahrnehmung || 0;
    this.attributes.primary.wahrnehmung.overall = Math.max(
      0,
      this.wahrnehmung.allOverWahrnehmung +
        (Number(this.attributes.primary.wahrnehmung.mod) || 0) +
        (itemAttrMods.wahrnehmung || 0)
    );

    // Secondary Attributes (Charisma, Logik, Fahrzeuge, Schmerztoleranz)
    const secKeys = ["charisma", "logik", "fahrzeuge", "schmerztoleranz"];
    for (const k of secKeys) {
      const sAttr = this.attributes.secondary[k];
      const fallbackVal = Number(this.secondary[k]) || 0;
      if (sAttr.base === undefined || sAttr.base === null) sAttr.base = fallbackVal;
      sAttr.itemMod = itemAttrMods[k] || 0;
      sAttr.total = Math.max(0, (Number(sAttr.base) || 0) + (Number(sAttr.mod) || 0) + sAttr.itemMod);
      this.secondary[k] = sAttr.total;
    }

    // Special Attribute: Adrenalin
    this.attributes.special.adrenalin.effectiveStufe = Math.max(
      0,
      (Number(this.attributes.special.adrenalin.stufe) || 0) + (itemAttrMods.adrenalin || 0)
    );
    this.secondary.adrenalin.stufe = this.attributes.special.adrenalin.stufe;
    this.secondary.adrenalin.pool = this.attributes.special.adrenalin.pool;

    // Carry Capacity (Tragkraft) = (Effective Stärke + Stemmen + Bonus) * 10 kg
    const stemmenBonus = skillBonuses["stemmen"] || 0;
    this.status.tragkraft =
      (this.attributes.primary.staerke.overall + stemmenLevel + stemmenBonus) * 10;

    // Total Penalties
    this.health.gesamteMali = totalWoundPenalty + (Number(this.health.sonstigeMali) || 0);
    this.isUnconscious =
      this.health.gesamteMali >= this.attributes.primary.konstitution.overall &&
      this.attributes.primary.konstitution.overall > 0;
    this.isImmobilized =
      this.health.gesamteMali >= this.attributes.primary.schnelligkeit.overall &&
      this.attributes.primary.schnelligkeit.overall > 0;
  }
}
