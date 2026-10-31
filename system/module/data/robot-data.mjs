/**
 * DataModel for NoReturn Robotics / Cyborg Sheet.
 * Based on 1st_Edition_NoReturn-Robotikbogen.pdf and Corebook pp. 182-187.
 */
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
    for (const z of ROBOT_ZONE_ORDER) {
      zoneSchemas[z.code] = new fields.SchemaField({
        isRobotic: new fields.BooleanField({ required: true, initial: true }),
        model: new fields.StringField({
          required: true,
          choices: ["bio", "casual", "work", "hightech", "android", "military"],
          initial: "casual"
        }),
        design: new fields.StringField({ required: true, initial: "Casual - Steel" }),
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
          materialCategory: new fields.StringField({ required: true, initial: "B" })
        }),
        health: new fields.SchemaField({
          damage: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          max: new fields.NumberField({ required: true, integer: true, min: 10, initial: 50 }),
          penalty: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          lethal: new fields.BooleanField({ required: true, initial: z.lethal })
        })
      });
    }

    return {
      personal: new fields.SchemaField({
        modell: new fields.StringField({ required: true, initial: "Heart Industries Chassis" }),
        seriennummer: new fields.StringField({ required: true, initial: "HI-5499-NR" }),
        besitzer: new fields.StringField({ required: true, initial: "" }),
        hersteller: new fields.StringField({ required: true, initial: "Heart Industries" }),
        techLevel: new fields.StringField({ required: true, initial: "IV" })
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
        organismus: new fields.SchemaField({
          max: new fields.NumberField({ required: true, min: 0, initial: 100 }),
          value: new fields.NumberField({ required: true, min: 0, initial: 12 })
        }),
        psyche: new fields.SchemaField({
          max: new fields.NumberField({ required: true, min: 0, initial: 100 }),
          value: new fields.NumberField({ required: true, min: 0, initial: 80 })
        }),
        tragkraft: new fields.NumberField({ required: true, min: 0, initial: 20 }),
        bargeld: new fields.NumberField({ required: true, min: 0, initial: 0 })
      }),
      health: new fields.SchemaField({
        sonstigeMali: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        gesamteMali: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      notes: new fields.HTMLField({ required: true, initial: "" })
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

    // Collect installed module capacity/organism costs per zone
    const moduleCapByZone = {};
    let moduleOrgLoss = 0;
    let stemmenLevel = 0;

    const items = this.parent?.items ?? [];
    for (const item of items) {
      if (item.type === "skill" && (item.system.skillId === "stemmen" || item.name.toLowerCase() === "stemmen")) {
        stemmenLevel = Math.max(stemmenLevel, Number(item.system.level || 0));
      } else if (item.type === "robotModule" || item.type === "cyberware") {
        const zCode = String(item.system.targetZone || "").trim();
        const capCost = Number(item.system.capacityCost || 0);
        const orgCost = Number(item.system.organismusCost || 0);
        if (zCode && this.zones[zCode]) {
          moduleCapByZone[zCode] = (moduleCapByZone[zCode] || 0) + capCost;
        } else {
          moduleOrgLoss += orgCost;
        }
      }
    }

    const painTolerance = Number(this.secondary.schmerztoleranz) || 0;

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
      // Smart-Skin adds +3 per level
      zone.values.tastsinn = preset.tastsinn + upgTast * 3;
      zone.values.panzerung = preset.panzerung + upgPanz * 5;
      zone.values.materialCategory = preset.mk;

      // Capacity calculation (Corebook p. 183 & 185)
      // GE: 0.5, ST: 0.25, KO: 0.25, SK: 0.5, Smart-Skin: 0.25, Panzerung (+5p): 0.5
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

      // Health & wound stage per zone (50 TP for robotic zones = 5 TP/stage; 30 TP for bio = 3 TP/stage)
      zone.health.max = preset.maxHp;
      zone.health.lethal = z.lethal;
      const stageSize = zone.health.max / 10;
      const dmg = Math.max(0, Number(zone.health.damage) || 0);
      if (dmg > 0) {
        const woundStage = Math.ceil(dmg / stageSize);
        zone.health.penalty = Math.max(0, woundStage - painTolerance);
      } else {
        zone.health.penalty = 0;
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

    // Senses & All over Wahrnehmung (Corebook p. 107 & 185, Robotikbogen)
    const senseConfigs = [
      { key: "sehen", orgPerLevel: 1, capPerLevel: 0.25 },
      { key: "hoeren", orgPerLevel: 1, capPerLevel: 0.25 },
      { key: "riechen", orgPerLevel: 0.5, capPerLevel: 0.25 },
      { key: "schmecken", orgPerLevel: 0.5, capPerLevel: 0.25 }
    ];

    let senseSum = 0;
    let cybersenseOrgLoss = 0;
    for (const sc of senseConfigs) {
      const s = this.wahrnehmung[sc.key];
      const csLevel = Math.max(0, Number(s.cybersenseStufe) || 0);
      // Each Cybersense level grants +2 steps
      s.total = Math.max(0, (Number(s.base) || 0) + csLevel * 2 + (Number(s.mod) || 0));
      s.organismusCost = csLevel * sc.orgPerLevel;
      s.capacityCost = csLevel * sc.capPerLevel;
      senseSum += s.total;
      if (!this.zones["12"]?.isRobotic) {
        cybersenseOrgLoss += s.organismusCost;
      }
    }

    this.wahrnehmung.tastsinnAllOver = this.allOver.tastsinn;
    this.wahrnehmung.allOverWahrnehmung = Math.round(
      (senseSum + this.wahrnehmung.tastsinnAllOver) / 5
    );

    // Total Organismus loss
    this.allOver.summeOrganismusverlust = Number(
      (sumOrganismusLoss + cybersenseOrgLoss + moduleOrgLoss).toFixed(2)
    );
    this.allOver.restOrganismus = Math.max(
      0,
      Number((100 - this.allOver.summeOrganismusverlust).toFixed(2))
    );
    this.status.organismus.value = this.allOver.restOrganismus;

    // Carry Capacity (Tragkraft) = (All-Over Stärke + Stemmen) * 10 kg
    this.status.tragkraft = (this.allOver.staerke + stemmenLevel) * 10;

    // Total Penalties
    this.health.gesamteMali = totalWoundPenalty + (Number(this.health.sonstigeMali) || 0);

    // Provide unified attributes object so roll helpers and initiative formulas work identically to Character actors
    this.attributes = {
      primary: {
        geschick: { base: this.allOver.geschick, mod: 0, overall: this.allOver.geschick, alphaBio: false },
        staerke: { base: this.allOver.staerke, mod: 0, overall: this.allOver.staerke, alphaBio: false },
        konstitution: { base: this.allOver.konstitution, mod: 0, overall: this.allOver.konstitution, alphaBio: false },
        schnelligkeit: { base: this.allOver.schnelligkeit, mod: 0, overall: this.allOver.schnelligkeit, alphaBio: false },
        wissen: { base: this.secondary.wissen, mod: 0, overall: this.secondary.wissen, alphaBio: false },
        wahrnehmung: {
          base: this.wahrnehmung.allOverWahrnehmung,
          mod: 0,
          overall: this.wahrnehmung.allOverWahrnehmung,
          alphaBio: false
        }
      },
      secondary: {
        charisma: { base: this.secondary.charisma, mod: 0, total: this.secondary.charisma },
        logik: { base: this.secondary.logik, mod: 0, total: this.secondary.logik },
        fahrzeuge: { base: this.secondary.fahrzeuge, mod: 0, total: this.secondary.fahrzeuge },
        schmerztoleranz: { base: this.secondary.schmerztoleranz, mod: 0, total: this.secondary.schmerztoleranz }
      },
      special: {
        adrenalin: this.secondary.adrenalin
      }
    };
  }
}
