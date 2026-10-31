/**
 * Item TypeDataModel subclasses for NoReturn (Foundry VTT v14).
 * Covers: skill, styleskill, psiForce, psiApp, weapon, armor, gear, consumable,
 * cyberware, robotModule, species, mutation, trait, condition, disease, toxin.
 */

function createAttributeModifierSchema(fields) {
  return new fields.SchemaField({
    geschick: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    staerke: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    konstitution: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    schnelligkeit: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    wissen: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    wahrnehmung: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    charisma: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    logik: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    fahrzeuge: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    schmerztoleranz: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    adrenalin: new fields.NumberField({ required: true, integer: true, initial: 0 })
  });
}

/**
 * Helper to parse skillModifiers string (e.g. "rennen:+6, ausdauer:+4") into a map of { skillKey: number }.
 */
export function parseSkillModifiers(modStr) {
  const result = {};
  if (!modStr || typeof modStr !== "string") return result;
  for (const part of modStr.split(/[,;]/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [rawKey, rawVal] = trimmed.split(":");
    if (!rawKey || rawVal === undefined) continue;
    const key = rawKey.trim().toLowerCase();
    const val = Number(rawVal.trim());
    if (!Number.isNaN(val) && val !== 0) {
      result[key] = (result[key] || 0) + val;
    }
  }
  return result;
}

export class NoReturnSkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      skillId: new fields.StringField({ required: true, initial: "" }),
      attribute: new fields.StringField({ required: true, initial: "geschick" }),
      category: new fields.StringField({ required: true, initial: "athletik" }),
      zoneReference: new fields.StringField({ required: true, initial: "OA" }),
      level: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      mod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      betaBio: new fields.BooleanField({ required: true, initial: false }),
      unskilledAllowed: new fields.BooleanField({ required: true, initial: true }),
      costGp: new fields.NumberField({ required: true, min: 0, initial: 2 }),
      costEpFormula: new fields.StringField({ required: true, initial: "nextLevel * 4" }),
      prerequisites: new fields.StringField({ required: true, initial: "" }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }

  prepareDerivedData() {
    const actor = this.parent?.parent;
    let attrVal = 0;
    let itemBonusMod = 0;

    if (actor) {
      if (this.attribute) {
        const prim = actor.system?.attributes?.primary?.[this.attribute];
        const sec = actor.system?.attributes?.secondary?.[this.attribute];
        if (prim) attrVal = Number(prim.overall ?? prim.base ?? 0);
        else if (sec) attrVal = Number(sec.total ?? sec.base ?? 0);
      }

      // Check actor's aggregated skill bonuses from species, mutations, traits, styleskills, and active consumables
      const skillBonuses = actor.system?.skillBonuses || {};
      const idKey = (this.skillId || "").toLowerCase();
      const nameKey = (this.parent?.name || "").toLowerCase();
      if (idKey && skillBonuses[idKey]) {
        itemBonusMod += Number(skillBonuses[idKey]) || 0;
      } else if (nameKey && skillBonuses[nameKey]) {
        itemBonusMod += Number(skillBonuses[nameKey]) || 0;
      }
    }

    this.attributeValue = attrVal;
    this.itemBonusMod = itemBonusMod;
    this.effectiveMod = (Number(this.mod) || 0) + itemBonusMod;
    this.pool = Math.max(0, attrVal + (Number(this.level) || 0) + this.effectiveMod);
  }
}

export class NoReturnStyleSkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      styleSkillId: new fields.StringField({ required: true, initial: "" }),
      styleCategory: new fields.StringField({
        required: true,
        choices: ["styleskill", "kampfkunst"],
        initial: "styleskill"
      }),
      attribute: new fields.StringField({ required: true, initial: "geschick" }),
      level: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
      maxLevel: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
      mod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      costGp: new fields.NumberField({ required: true, min: 0, initial: 5 }),
      costEpFormula: new fields.StringField({ required: true, initial: "10" }),
      prerequisites: new fields.StringField({ required: true, initial: "" }),
      passiveBonus: new fields.StringField({ required: true, initial: "" }),
      skillModifiers: new fields.StringField({ required: true, initial: "" }),
      attributeModifiers: createAttributeModifierSchema(fields),
      active: new fields.BooleanField({ required: true, initial: true }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }

  prepareDerivedData() {
    const actor = this.parent?.parent;
    let attrVal = 0;
    if (actor && this.attribute) {
      const prim = actor.system?.attributes?.primary?.[this.attribute];
      const sec = actor.system?.attributes?.secondary?.[this.attribute];
      if (prim) attrVal = Number(prim.overall ?? prim.base ?? 0);
      else if (sec) attrVal = Number(sec.total ?? sec.base ?? 0);
    }
    this.attributeValue = attrVal;
    this.pool = Math.max(0, attrVal + (Number(this.level) || 0) + (Number(this.mod) || 0));
  }
}

export class NoReturnPsiForceData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      forceId: new fields.StringField({ required: true, initial: "telekinese" }),
      psiCategory: new fields.StringField({ required: true, choices: ["A", "B"], initial: "A" }),
      hierarchyTier: new fields.NumberField({ required: true, integer: true, min: 1, max: 3, initial: 1 }),
      level: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
      mod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      costGp: new fields.NumberField({ required: true, min: 0, initial: 10 }),
      costEpFormula: new fields.StringField({ required: true, initial: "nextLevel * 4" }),
      showEffect: new fields.StringField({ required: true, initial: "" }),
      elementalEffect: new fields.StringField({ required: true, initial: "" }),
      active: new fields.BooleanField({ required: true, initial: true }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }

  prepareDerivedData() {
    this.pool = Math.max(1, (Number(this.level) || 1) + (Number(this.mod) || 0));
  }
}

export class NoReturnPsiAppData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      appId: new fields.StringField({ required: true, initial: "" }),
      psiForce: new fields.StringField({ required: true, initial: "telekinese" }),
      psiForceLabel: new fields.StringField({ required: true, initial: "Telekinese" }),
      tier: new fields.NumberField({ required: true, integer: true, min: 1, max: 3, initial: 1 }),
      level: new fields.NumberField({ required: true, integer: true, min: 1, max: 3, initial: 1 }),
      targetRange: new fields.StringField({ required: true, initial: "8-12" }),
      targetMin: new fields.NumberField({ required: true, integer: true, min: 1, initial: 8 }),
      targetMax: new fields.NumberField({ required: true, integer: true, min: 1, initial: 12 }),
      noobValue: new fields.NumberField({ required: true, integer: true, min: 0, initial: 14 }),
      masteryLevel: new fields.NumberField({ required: true, integer: true, min: 0, initial: 6 }),
      upkeepPenalty: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      cost: new fields.StringField({ required: true, initial: "1 Aktion (2 Aktionen mit [KS])" }),
      exhaustionCost: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      range: new fields.StringField({ required: true, initial: "Sichtfeld" }),
      duration: new fields.StringField({ required: true, initial: "Sofort" }),
      rollFormula: new fields.StringField({ required: true, initial: "@psiForce" }),
      defensiveMode: new fields.StringField({
        required: true,
        choices: ["", "block", "dodge"],
        initial: ""
      }),
      costGp: new fields.NumberField({ required: true, min: 0, initial: 3 }),
      costEp: new fields.NumberField({ required: true, min: 0, initial: 5 }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }

  prepareDerivedData() {
    const resolvedTier = Math.clamp(Number(this.tier || this.level || 1), 1, 3);
    this.tier = resolvedTier;
    this.level = resolvedTier;

    // Parse targetRange if targetMin/targetMax not explicitly aligned
    if (this.targetRange && this.targetRange.includes("-")) {
      const [minStr, maxStr] = this.targetRange.split("-");
      const minVal = Number(minStr.trim());
      const maxVal = Number(maxStr.trim());
      if (!Number.isNaN(minVal) && !Number.isNaN(maxVal)) {
        this.targetMin = minVal;
        this.targetMax = maxVal;
      }
    }

    const actor = this.parent?.parent;
    this.forceLevel = 0;
    this.forcePool = 0;
    this.isMastered = false;
    this.pyramidValid = true;
    this.pyramidReason = "";

    if (actor) {
      const forceKey = (this.psiForce || "").toLowerCase().replace(/^psi_/, "");
      // Find matching psiForce or legacy psi skill on actor
      const forceItem = actor.items?.find((i) => {
        if (i.type === "psiForce") {
          return (i.system.forceId || "").toLowerCase().replace(/^psi_/, "") === forceKey;
        }
        if (i.type === "skill" && i.system.category === "psi") {
          return (i.system.skillId || "").toLowerCase().replace(/^psi_/, "") === forceKey;
        }
        return false;
      });

      if (forceItem) {
        this.forceLevel = Number(forceItem.system.level) || 0;
        this.forcePool = Math.max(1, this.forceLevel + (Number(forceItem.system.mod) || 0));
      }

      this.isMastered = this.masteryLevel > 0 && this.forceLevel >= this.masteryLevel;

      // Validate PSI Pyramid for this force on the actor
      const sameForceApps = (actor.items ?? []).filter(
        (i) =>
          i.type === "psiApp" &&
          (i.system.psiForce || "").toLowerCase().replace(/^psi_/, "") === forceKey
      );
      const t1Count = sameForceApps.filter((a) => (Number(a.system.tier || a.system.level) || 1) === 1).length;
      const t2Count = sameForceApps.filter((a) => (Number(a.system.tier || a.system.level) || 1) === 2).length;
      const t3Count = sameForceApps.filter((a) => (Number(a.system.tier || a.system.level) || 1) === 3).length;

      if (this.forceLevel <= 0 && forceKey !== "kategorie_b") {
        this.pyramidValid = false;
        this.pyramidReason = `PSI-Kraft „${this.psiForceLabel || this.psiForce}“ nicht erlernt.`;
      } else if (resolvedTier === 2 && t1Count < t2Count) {
        this.pyramidValid = false;
        this.pyramidReason = `PSI-Pyramide: Für ${t2Count} App(s) der Stufe 2 werden mindestens ${t2Count} App(s) der Stufe 1 in ${this.psiForceLabel} benötigt (aktuell: ${t1Count}).`;
      } else if (resolvedTier === 3 && (t2Count < t3Count || t1Count < t2Count)) {
        this.pyramidValid = false;
        this.pyramidReason = `PSI-Pyramide: Für ${t3Count} App(s) der Stufe 3 werden mindestens je ${t3Count} App(s) der Stufen 1 und 2 in ${this.psiForceLabel} benötigt (Stufe 1: ${t1Count}, Stufe 2: ${t2Count}).`;
      }
    }
  }
}

export class NoReturnWeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      weaponId: new fields.StringField({ required: true, initial: "" }),
      category: new fields.StringField({ required: true, initial: "faustfeuerwaffe" }),
      weaponType: new fields.StringField({ required: true, choices: ["melee", "ranged"], initial: "ranged" }),
      skill: new fields.StringField({ required: true, initial: "schiessen" }),
      attackBonus: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      parryBonus: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      damageFormula: new fields.StringField({ required: true, initial: "20" }),
      damageFlat: new fields.NumberField({ required: true, integer: true, initial: 20 }),
      damageBonusPerHit: new fields.NumberField({ required: true, integer: true, initial: 4 }),
      caliber: new fields.StringField({ required: true, initial: "9mm (P3)" }),
      magazine: new fields.StringField({ required: true, initial: "15(m)" }),
      recoilDampening: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
      fireModes: new fields.StringField({ required: true, initial: "Semi 1(5x)" }),
      range: new fields.StringField({ required: true, initial: "Pistole" }),
      techLevel: new fields.StringField({ required: true, initial: "II" }),
      price: new fields.NumberField({ required: true, min: 0, initial: 300 }),
      equipped: new fields.BooleanField({ required: true, initial: true }),
      taped: new fields.BooleanField({ required: true, initial: false }),
      features: new fields.StringField({ required: true, initial: "" }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }
}

export class NoReturnArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      armorId: new fields.StringField({ required: true, initial: "" }),
      armorValue: new fields.NumberField({ required: true, integer: true, min: 0, initial: 15 }),
      materialCategory: new fields.StringField({ required: true, choices: ["A", "B", "C"], initial: "A" }),
      comfort: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      zones: new fields.ArrayField(new fields.NumberField({ integer: true }), {
        required: true,
        initial: [6, 7, 8]
      }),
      zonesLabel: new fields.StringField({ required: true, initial: "6 bis 8" }),
      price: new fields.NumberField({ required: true, min: 0, initial: 400 }),
      techLevel: new fields.StringField({ required: true, initial: "II" }),
      equipped: new fields.BooleanField({ required: true, initial: true }),
      features: new fields.StringField({ required: true, initial: "" }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }
}

export class NoReturnGearData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      gearId: new fields.StringField({ required: true, initial: "" }),
      category: new fields.StringField({ required: true, initial: "allgemein" }),
      quantity: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      weight: new fields.NumberField({ required: true, min: 0, initial: 0.2 }),
      price: new fields.NumberField({ required: true, min: 0, initial: 50 }),
      techLevel: new fields.StringField({ required: true, initial: "II" }),
      effects: new fields.StringField({ required: true, initial: "" }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }
}

export class NoReturnConsumableData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      consumableId: new fields.StringField({ required: true, initial: "" }),
      category: new fields.StringField({ required: true, initial: "droge" }),
      quantity: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      dosage: new fields.StringField({ required: true, initial: "1 Dosis" }),
      duration: new fields.StringField({ required: true, initial: "4 Stunden" }),
      addictionRating: new fields.StringField({ required: true, initial: "Mittel" }),
      statBoosts: new fields.StringField({ required: true, initial: "" }),
      drawbacks: new fields.StringField({ required: true, initial: "" }),
      active: new fields.BooleanField({ required: true, initial: false }),
      attributeModifiers: createAttributeModifierSchema(fields),
      skillModifiers: new fields.StringField({ required: true, initial: "" }),
      price: new fields.NumberField({ required: true, min: 0, initial: 100 }),
      weight: new fields.NumberField({ required: true, min: 0, initial: 0.05 }),
      techLevel: new fields.StringField({ required: true, initial: "III" }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }
}

export class NoReturnCyberwareData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      cyberwareId: new fields.StringField({ required: true, initial: "" }),
      category: new fields.StringField({ required: true, initial: "implantat" }),
      targetZone: new fields.StringField({ required: true, initial: "12" }),
      zone: new fields.StringField({ required: true, initial: "Kopf (12)" }),
      capacityCost: new fields.NumberField({ required: true, min: 0, initial: 0.5 }),
      organismCost: new fields.NumberField({ required: true, min: 0, initial: 2 }),
      organismusCost: new fields.NumberField({ required: true, min: 0, initial: 2 }),
      psycheCost: new fields.NumberField({ required: true, min: 0, initial: 1 }),
      energyDrain: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      installed: new fields.BooleanField({ required: true, initial: true }),
      price: new fields.NumberField({ required: true, min: 0, initial: 2500 }),
      techLevel: new fields.StringField({ required: true, initial: "IV" }),
      design: new fields.StringField({ required: true, initial: "" }),
      effects: new fields.StringField({ required: true, initial: "" }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }

  prepareDerivedData() {
    // Keep organismCost and organismusCost synchronized
    const cost = Math.max(Number(this.organismCost) || 0, Number(this.organismusCost) || 0);
    this.organismCost = cost;
    this.organismusCost = cost;
  }
}

export class NoReturnRobotModuleData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      moduleId: new fields.StringField({ required: true, initial: "" }),
      category: new fields.StringField({ required: true, initial: "implantat" }),
      targetZone: new fields.StringField({ required: true, initial: "5" }),
      zone: new fields.StringField({ required: true, initial: "r. Arm (5)" }),
      capacity: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      capacityCost: new fields.NumberField({ required: true, min: 0, initial: 1 }),
      organismCost: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      organismusCost: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      psycheCost: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      energyDrain: new fields.NumberField({ required: true, min: 0, initial: 0.5 }),
      installed: new fields.BooleanField({ required: true, initial: true }),
      price: new fields.NumberField({ required: true, min: 0, initial: 2500 }),
      techLevel: new fields.StringField({ required: true, initial: "III" }),
      design: new fields.StringField({ required: true, initial: "" }),
      stats: new fields.SchemaField({
        geschick: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        staerke: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        konstitution: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        schnelligkeit: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        tastsinn: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        panzerung: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        materialCategory: new fields.StringField({ required: true, initial: "B" })
      }),
      effects: new fields.StringField({ required: true, initial: "" }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }

  prepareDerivedData() {
    const cost = Math.max(Number(this.organismCost) || 0, Number(this.organismusCost) || 0);
    this.organismCost = cost;
    this.organismusCost = cost;
  }
}

export class NoReturnSpeciesData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      speciesId: new fields.StringField({ required: true, initial: "mensch" }),
      subspecies: new fields.StringField({ required: true, initial: "Homo Sapiens" }),
      costGp: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      legality: new fields.StringField({ required: true, initial: "Beim Zentrum registriert und legal" }),
      psiAllowed: new fields.BooleanField({ required: true, initial: true }),
      freePsiCount: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      baseStats: new fields.SchemaField({
        psyche: new fields.NumberField({ required: true, integer: true, min: 0, max: 100, initial: 80 }),
        organismus: new fields.NumberField({ required: true, integer: true, min: 0, max: 100, initial: 100 }),
        adrenalin: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
        infektionsresistenz: new fields.StringField({ required: true, initial: "2d6" })
      }),
      attributeModifiers: createAttributeModifierSchema(fields),
      attributeLimits: new fields.SchemaField({
        primaryMax: new fields.NumberField({ required: true, integer: true, min: 1, initial: 4 }),
        secondaryMax: new fields.NumberField({ required: true, integer: true, min: 1, initial: 4 })
      }),
      skillModifiers: new fields.StringField({ required: true, initial: "" }),
      specialRules: new fields.StringField({ required: true, initial: "" }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }
}

export class NoReturnMutationData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      mutationId: new fields.StringField({ required: true, initial: "" }),
      category: new fields.StringField({
        required: true,
        choices: ["sichtbar", "verborgen", "abnormitaet", "auffaelligkeit"],
        initial: "sichtbar"
      }),
      level: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
      maxLevel: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
      costMp: new fields.NumberField({ required: true, min: 0, initial: 1 }),
      costGp: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      costAp: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      organismusCost: new fields.NumberField({ required: true, initial: 0 }),
      psycheCost: new fields.NumberField({ required: true, initial: 0 }),
      heritability: new fields.StringField({ required: true, initial: "0%" }),
      active: new fields.BooleanField({ required: true, initial: true }),
      attributeModifiers: createAttributeModifierSchema(fields),
      combatBonuses: new fields.SchemaField({
        armorBonus: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        materialCategory: new fields.StringField({ required: true, initial: "A" }),
        maxHpOverride: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        regenSpeed: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        regenPool: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      skillModifiers: new fields.StringField({ required: true, initial: "" }),
      effects: new fields.StringField({ required: true, initial: "" }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }
}

export class NoReturnTraitData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      traitId: new fields.StringField({ required: true, initial: "" }),
      traitType: new fields.StringField({
        required: true,
        choices: ["justice", "chaos", "begabung", "talent"],
        initial: "justice"
      }),
      cost: new fields.NumberField({ required: true, integer: true, min: 0, initial: 10 }),
      costCurrency: new fields.StringField({
        required: true,
        choices: ["JP", "CP", "GP", "EP"],
        initial: "JP"
      }),
      opposingTrait: new fields.StringField({ required: true, initial: "" }),
      passiveModifiers: new fields.StringField({ required: true, initial: "" }),
      skillModifiers: new fields.StringField({ required: true, initial: "" }),
      attributeModifiers: createAttributeModifierSchema(fields),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }
}

export class NoReturnConditionData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      conditionId: new fields.StringField({ required: true, initial: "" }),
      conditionType: new fields.StringField({
        required: true,
        choices: ["krankheit", "gift", "umwelt"],
        initial: "krankheit"
      }),
      incubationTime: new fields.StringField({ required: true, initial: "1–2 Stunden" }),
      testInterval: new fields.StringField({ required: true, initial: "24 Stunden" }),
      resistanceFormula: new fields.StringField({ required: true, initial: "@status.infektionsresistenz" }),
      intensity: new fields.NumberField({ required: true, integer: true, min: 1, initial: 5 }),
      identificationMw: new fields.NumberField({ required: true, integer: true, min: 0, initial: 10 }),
      currentStage: new fields.NumberField({ required: true, integer: true, min: 0, max: 5, initial: 1 }),
      symptomStages: new fields.StringField({ required: true, initial: "" }),
      damagePerStage: new fields.StringField({ required: true, initial: "" }),
      penaltiesPerStage: new fields.StringField({ required: true, initial: "" }),
      antidote: new fields.StringField({ required: true, initial: "" }),
      transmission: new fields.StringField({ required: true, initial: "Blut- oder Schleimhautkontakt" }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
  }
}
