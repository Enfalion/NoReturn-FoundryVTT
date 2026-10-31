/**
 * Item TypeDataModel subclasses for NoReturn (Foundry VTT v14).
 */
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

export class NoReturnCyberwareData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      cyberwareId: new fields.StringField({ required: true, initial: "" }),
      category: new fields.StringField({ required: true, initial: "implantat" }),
      targetZone: new fields.StringField({ required: true, initial: "12" }),
      zone: new fields.StringField({ required: true, initial: "Kopf (12)" }),
      capacityCost: new fields.NumberField({ required: true, min: 0, initial: 0.5 }),
      organismusCost: new fields.NumberField({ required: true, min: 0, initial: 2 }),
      psycheCost: new fields.NumberField({ required: true, min: 0, initial: 1 }),
      price: new fields.NumberField({ required: true, min: 0, initial: 2500 }),
      techLevel: new fields.StringField({ required: true, initial: "IV" }),
      design: new fields.StringField({ required: true, initial: "" }),
      effects: new fields.StringField({ required: true, initial: "" }),
      description: new fields.HTMLField({ required: true, initial: "" })
    };
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
      organismusCost: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      psycheCost: new fields.NumberField({ required: true, min: 0, initial: 0 }),
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
}
