/**
 * DataModel for Standard NoReturn Characters, NPCs, and Creatures.
 * Based on 1st_Edition_NoReturn-Charakterbogen_1.2(DE)_edit.pdf and Corebook rules.
 */
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

export class NoReturnCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    const primaryAttrField = () =>
      new fields.SchemaField({
        base: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
        mod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
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
        materialCategory: new fields.StringField({ required: true, initial: "A" }),
        penalty: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        lethal: new fields.BooleanField({ required: true, initial: z.lethal })
      });
    }

    return {
      personal: new fields.SchemaField({
        spezies: new fields.StringField({ required: true, initial: "Mensch" }),
        geschlecht: new fields.StringField({ required: true, initial: "" }),
        alter: new fields.NumberField({ required: true, integer: true, min: 0, initial: 25 }),
        groesse: new fields.StringField({ required: true, initial: "1,78 m" }),
        gewicht: new fields.StringField({ required: true, initial: "75 kg" }),
        haarfarbe: new fields.StringField({ required: true, initial: "" }),
        augenfarbe: new fields.StringField({ required: true, initial: "" }),
        hautfarbe: new fields.StringField({ required: true, initial: "" }),
        berufung: new fields.StringField({ required: true, initial: "" })
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
            stufe: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
            pool: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 })
          })
        })
      }),
      status: new fields.SchemaField({
        bekanntheit: new fields.NumberField({ required: true, integer: true, min: 1, max: 100, initial: 100 }),
        ruf: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        organismus: new fields.SchemaField({
          max: new fields.NumberField({ required: true, min: 0, max: 100, initial: 100 }),
          value: new fields.NumberField({ required: true, min: 0, max: 100, initial: 100 }),
          leiden1: new fields.StringField({ required: true, initial: "" }),
          leiden2: new fields.StringField({ required: true, initial: "" }),
          leiden3: new fields.StringField({ required: true, initial: "" })
        }),
        psyche: new fields.SchemaField({
          max: new fields.NumberField({ required: true, integer: true, min: 0, max: 100, initial: 100 }),
          value: new fields.NumberField({ required: true, integer: true, min: 0, max: 100, initial: 80 })
        }),
        infektionsresistenz: new fields.StringField({ required: true, initial: "1d6" }),
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
          choices: [30, 50, 70, 90],
          initial: 30
        }),
        sonstigeMali: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        comfortPenalty: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        gesamteMali: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        zones: new fields.SchemaField(zoneSchemas)
      }),
      traits: new fields.SchemaField({
        charaktermerkmale: new fields.StringField({ required: true, initial: "" }),
        mutationen: new fields.StringField({ required: true, initial: "" }),
        begabungen: new fields.StringField({ required: true, initial: "" }),
        talente: new fields.StringField({ required: true, initial: "" }),
        styleSkills: new fields.StringField({ required: true, initial: "" }),
        kampfsportarten: new fields.StringField({ required: true, initial: "" })
      }),
      notes: new fields.HTMLField({ required: true, initial: "" })
    };
  }

  prepareDerivedData() {
    // 1. Primary Attributes
    for (const attr of Object.values(this.attributes.primary)) {
      attr.overall = Math.max(0, (attr.base || 0) + (attr.mod || 0));
    }

    // 2. Secondary Attributes
    for (const attr of Object.values(this.attributes.secondary)) {
      attr.total = Math.max(0, (attr.base || 0) + (attr.mod || 0));
    }

    const painTolerance = this.attributes.secondary.schmerztoleranz.total;
    const konstitution = this.attributes.primary.konstitution.overall;
    const schnelligkeit = this.attributes.primary.schnelligkeit.overall;
    const staerke = this.attributes.primary.staerke.overall;

    // 3. Aggregate equipped armor & stemmen skill from parent Actor's items
    let stemmenLevel = 0;
    let maxArmorComfort = 0;
    const zoneBonusArmor = {};
    const zoneMaterial = {};
    for (const z of HIT_ZONES) {
      zoneBonusArmor[z.code] = 0;
      zoneMaterial[z.code] = "A";
    }

    const items = this.parent?.items ?? [];
    for (const item of items) {
      if (item.type === "skill" && (item.system.skillId === "stemmen" || item.name.toLowerCase() === "stemmen")) {
        stemmenLevel = Math.max(stemmenLevel, Number(item.system.level || 0));
      } else if (item.type === "armor" && item.system.equipped) {
        const comfort = Number(item.system.comfort || 0);
        if (comfort > maxArmorComfort) maxArmorComfort = comfort;
        const rw = Number(item.system.armorValue || 0);
        const mk = item.system.materialCategory || "A";
        const coveredZones = Array.isArray(item.system.zones) ? item.system.zones : [];
        for (const zNum of coveredZones) {
          const zCode = String(zNum);
          if (zCode in zoneBonusArmor) {
            zoneBonusArmor[zCode] += rw;
            if (mk > zoneMaterial[zCode]) zoneMaterial[zCode] = mk;
          }
        }
      }
    }

    // 4. Carry Capacity (Tragkraft) = (Stärke + Stemmen) * 10 kg
    this.status.tragkraft = (staerke + stemmenLevel) * 10;

    // 5. Armor Comfort Penalty
    this.health.comfortPenalty = Math.max(0, maxArmorComfort - konstitution);

    // 6. Hit Zones & Wound Penalties
    const tierMax = Number(this.health.maxHpTier) || 30;
    const stageSize = Math.max(1, tierMax / 10);
    let totalWoundPenalty = 0;

    for (const z of HIT_ZONES) {
      const zone = this.health.zones[z.code];
      if (!zone) continue;
      zone.max = tierMax;
      zone.lethal = z.lethal;
      zone.equippedArmor = (zone.armor || 0) + (zoneBonusArmor[z.code] || 0);
      if (zoneMaterial[z.code] > (zone.materialCategory || "A")) {
        zone.materialCategory = zoneMaterial[z.code];
      }
      const dmg = Math.max(0, Number(zone.damage) || 0);
      if (dmg > 0) {
        const woundStage = Math.ceil(dmg / stageSize);
        zone.penalty = Math.max(0, woundStage - painTolerance);
      } else {
        zone.penalty = 0;
      }
      totalWoundPenalty += zone.penalty;
    }

    this.health.gesamteMali =
      totalWoundPenalty + (Number(this.health.sonstigeMali) || 0) + this.health.comfortPenalty;

    this.isUnconscious = this.health.gesamteMali >= konstitution && konstitution > 0;
    this.isImmobilized = this.health.gesamteMali >= schnelligkeit && schnelligkeit > 0;
  }
}
