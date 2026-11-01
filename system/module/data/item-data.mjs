/**
 * Item TypeDataModel subclasses for NoReturn (Foundry VTT v14).
 * Covers: skill, styleskill, psiForce, psiApp, weapon, armor, gear, consumable,
 * cyberware, robotModule, species, mutation, trait, condition, disease, toxin.
 */

export const PSI_FORCE_HIERARCHY = {
  // Hierarchiestufe 1
  cryokinese: 1,
  elektrokinese: 1,
  pyrokinese: 1,
  telekinese: 1,
  // Hierarchiestufe 2
  animakinese: 2,
  momenkinese: 2,
  photokinese: 2,
  psychokinese: 2,
  // Hierarchiestufe 3
  biokinese: 3,
  cronokinese: 3,
  chronokinese: 3,
  morphokinese: 3,
  technokinese: 3,
  // Kategorie B
  kategorie_b: 1
};

export const PSI_FORCE_LABELS = {
  cryokinese: "Cryokinese",
  elektrokinese: "Elektrokinese",
  pyrokinese: "Pyrokinese",
  telekinese: "Telekinese",
  animakinese: "Animakinese",
  momenkinese: "Momenkinese",
  photokinese: "Photokinese",
  psychokinese: "Psychokinese",
  biokinese: "Biokinese",
  cronokinese: "Cronokinese",
  chronokinese: "Cronokinese",
  morphokinese: "Morphokinese",
  technokinese: "Technokinese",
  kategorie_b: "Kategorie B"
};

export const AMMO_TYPE_DEFINITIONS = {
  FMJ: {
    code: "FMJ",
    label: "Vollmantel (FMJ)",
    shortLabel: "FMJ",
    damageBonus: 0,
    ignoresMk: [],
    blockedByMk: [],
    summary: "+0 TP | Standard gegen MK:A–C",
    effect: "+0 TP | Standard gegen MK:A–C"
  },
  AP: {
    code: "AP",
    label: "Hartkern (AP)",
    shortLabel: "AP",
    damageBonus: 0,
    ignoresMk: ["A"],
    blockedByMk: [],
    summary: "+0 TP | Ignoriert Rüstung MK:A komplett",
    effect: "+0 TP | Ignoriert Rüstung MK:A komplett"
  },
  HS: {
    code: "HS",
    label: "Hohlspitz (HS)",
    shortLabel: "HS",
    damageBonus: 10,
    ignoresMk: [],
    blockedByMk: ["B", "C"],
    summary: "+10 TP gegen ungepanzert / MK:A | 0 Schaden ab MK:B+",
    effect: "+10 TP gegen ungepanzert / MK:A | 0 Schaden ab MK:B+"
  },
  AF: {
    code: "AF",
    label: "Anti-Fahrzeug (AF)",
    shortLabel: "AF",
    damageBonus: 10,
    ignoresMk: ["A", "B"],
    blockedByMk: [],
    summary: "+10 TP | Ignoriert Rüstung MK:A & MK:B komplett",
    effect: "+10 TP | Ignoriert Rüstung MK:A & MK:B komplett"
  }
};

export function normalizeCaliber(cal) {
  if (!cal) return "";
  const raw = String(cal).trim();
  if (!raw || raw === "–" || raw === "-") return "";
  return raw
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function isAmmoCompatibleWithWeapon(ammoItem, weaponCaliber = "") {
  if (!ammoItem?.system?.isAmmo) return false;
  const wRaw = String(weaponCaliber ?? "").trim();
  if (!wRaw || wRaw === "–" || wRaw === "-") return false;

  const aRaw = String(ammoItem.system.caliber ?? "").trim();
  if (!aRaw || /p1\s*[-–]\s*p4|r1\s*[-–]\s*r3|universal|alle/i.test(aRaw)) return true;

  const wNorm = normalizeCaliber(wRaw).replace(/,/g, ".");
  const aNorm = normalizeCaliber(aRaw).replace(/,/g, ".");
  if (wNorm === aNorm) return true;

  const wCodes = wRaw.toUpperCase().match(/\b([PR][1-4])\b/g) || [];
  const aCodes = aRaw.toUpperCase().match(/\b([PR][1-4])\b/g) || [];
  if (wCodes.length > 0 && aCodes.length > 0) {
    return aCodes.some((code) => wCodes.includes(code));
  }

  return wNorm.includes(aNorm) || aNorm.includes(wNorm);
}

export function parseMagazineCapacity(magazineStr, explicitCap = 0) {
  const numExplicit = Number(explicitCap) || 0;
  if (numExplicit > 0) return Math.floor(numExplicit);
  if (!magazineStr) return 0;
  const match = String(magazineStr).match(/(\d+)/);
  return match ? Math.max(0, parseInt(match[1], 10)) : 0;
}

export function normalizePsiForceKey(raw, appId = "", itemName = "") {
  const prefixMap = {
    app_cryo: "cryokinese",
    app_elektro: "elektrokinese",
    app_pyro: "pyrokinese",
    app_tele: "telekinese",
    app_anima: "animakinese",
    app_momen: "momenkinese",
    app_photo: "photokinese",
    app_psycho: "psychokinese",
    app_bio: "biokinese",
    app_crono: "cronokinese",
    app_chrono: "cronokinese",
    app_morpho: "morphokinese",
    app_techno: "technokinese",
    app_katb: "kategorie_b"
  };

  const candidates = [raw, appId, itemName];
  for (const c of candidates) {
    if (!c) continue;
    const lower = String(c)
      .toLowerCase()
      .replace(/^psi-kraft:\s*/i, "")
      .replace(/^psi_/, "")
      .replace(/^psiforce_/, "")
      .trim();
    if (!lower) continue;
    if (lower === "chronokinese") return "cronokinese";
    if (PSI_FORCE_HIERARCHY[lower]) return lower;

    const parenMatch = lower.match(/\(([^)]+)\)/);
    if (parenMatch) {
      const inner = parenMatch[1].trim() === "chronokinese" ? "cronokinese" : parenMatch[1].trim();
      if (PSI_FORCE_HIERARCHY[inner]) return inner;
    }

    for (const [pref, mapped] of Object.entries(prefixMap)) {
      if (lower.startsWith(pref)) return mapped;
    }

    for (const fk of Object.keys(PSI_FORCE_HIERARCHY)) {
      if (lower.includes(fk)) return fk === "chronokinese" ? "cronokinese" : fk;
    }
  }
  return "telekinese";
}

/**
 * Resolve the effective hierarchy tier (1-3) for a PSI force key, respecting GM setting overrides
 * or manual item-level overrides. Supports both options object and positional (forceKey, itemTier, manualOverride).
 */
export function resolvePsiHierarchyTier(forceKey, optionsOrTier = {}, maybeManualOverride = false) {
  let manualOverride = false;
  let itemTier = null;
  if (optionsOrTier && typeof optionsOrTier === "object") {
    manualOverride = Boolean(optionsOrTier.manualOverride);
    itemTier = optionsOrTier.itemTier ?? null;
  } else {
    itemTier = optionsOrTier;
    manualOverride = Boolean(maybeManualOverride);
  }

  if (manualOverride && itemTier) {
    return Math.clamp(Number(itemTier) || 1, 1, 3);
  }
  const normalized = normalizePsiForceKey(forceKey);

  try {
    const rawSetting = game?.settings?.get("noreturn", "psiHierarchyOverrides");
    if (rawSetting && typeof rawSetting === "string") {
      for (const part of rawSetting.split(/[,;]/)) {
        const [k, v] = part.split(":");
        if (k && v && normalizePsiForceKey(k.trim()) === normalized) {
          const parsed = Number(v.trim());
          if (parsed >= 1 && parsed <= 3) return parsed;
        }
      }
    }
  } catch (_err) {
    // Settings not registered yet during early init
  }

  if (PSI_FORCE_HIERARCHY[normalized]) {
    return PSI_FORCE_HIERARCHY[normalized];
  }
  return Math.clamp(Number(itemTier) || 1, 1, 3);
}

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
      skillId: new fields.StringField({ required: false, blank: true, initial: "" }),
      attribute: new fields.StringField({ required: false, blank: true, initial: "geschick" }),
      category: new fields.StringField({ required: false, blank: true, initial: "athletik" }),
      zoneReference: new fields.StringField({ required: false, blank: true, initial: "OA" }),
      level: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      mod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      betaBio: new fields.BooleanField({ required: true, initial: false }),
      unskilledAllowed: new fields.BooleanField({ required: true, initial: true }),
      costGp: new fields.NumberField({ required: true, min: 0, initial: 2 }),
      costEpFormula: new fields.StringField({ required: false, blank: true, initial: "nextLevel * 4" }),
      prerequisites: new fields.StringField({ required: false, blank: true, initial: "" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
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
      styleId: new fields.StringField({ required: false, blank: true, initial: "" }),
      styleSkillId: new fields.StringField({ required: false, blank: true, initial: "" }),
      styleCategory: new fields.StringField({
        required: false,
        blank: true,
        initial: "styleskill"
      }),
      attribute: new fields.StringField({ required: false, blank: true, initial: "geschick" }),
      secondaryAttribute: new fields.StringField({ required: false, blank: true, initial: "" }),
      level: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      maxLevel: new fields.NumberField({ required: true, integer: true, min: 1, initial: 3 }),
      mod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      costGp: new fields.NumberField({ required: true, min: 0, initial: 5 }),
      costEp: new fields.NumberField({ required: true, min: 0, initial: 10 }),
      costEpFormula: new fields.StringField({ required: false, blank: true, initial: "10" }),
      requirements: new fields.StringField({ required: false, blank: true, initial: "" }),
      prerequisites: new fields.StringField({ required: false, blank: true, initial: "" }),
      passiveBonus: new fields.StringField({ required: false, blank: true, initial: "" }),
      skillModifiers: new fields.StringField({ required: false, blank: true, initial: "" }),
      attributeModifiers: createAttributeModifierSchema(fields),
      active: new fields.BooleanField({ required: true, initial: true }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }

  prepareDerivedData() {
    if (!this.styleSkillId && this.styleId) this.styleSkillId = this.styleId;
    if (!this.styleId && this.styleSkillId) this.styleId = this.styleSkillId;
    if (!this.requirements && this.prerequisites) this.requirements = this.prerequisites;
    if (!this.prerequisites && this.requirements) this.prerequisites = this.requirements;

    const actor = this.parent?.parent;
    let attrVal = 0;
    if (actor && this.attribute) {
      const prim = actor.system?.attributes?.primary?.[this.attribute];
      const sec = actor.system?.attributes?.secondary?.[this.attribute];
      if (prim) attrVal = Number(prim.overall ?? prim.base ?? 0);
      else if (sec) attrVal = Number(sec.total ?? sec.base ?? 0);
    }
    this.attributeValue = attrVal;
    this.effectiveMod = Number(this.mod) || 0;
    this.pool = Math.max(0, attrVal + (Number(this.level) || 0) + this.effectiveMod);
  }
}

export class NoReturnPsiForceData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      forceId: new fields.StringField({ required: false, blank: true, initial: "telekinese" }),
      category: new fields.StringField({ required: false, blank: true, initial: "A" }),
      psiCategory: new fields.StringField({ required: false, blank: true, initial: "A" }),
      hierarchyTier: new fields.NumberField({ required: true, integer: true, min: 1, max: 3, initial: 1 }),
      manualHierarchyOverride: new fields.BooleanField({ required: true, initial: false }),
      attribute: new fields.StringField({ required: false, blank: true, initial: "" }),
      level: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      mod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      mastery: new fields.BooleanField({ required: true, initial: false }),
      canOverload: new fields.BooleanField({ required: true, initial: true }),
      costGp: new fields.NumberField({ required: true, min: 0, initial: 10 }),
      costEpFormula: new fields.StringField({ required: false, blank: true, initial: "nextLevel * 4" }),
      prerequisites: new fields.StringField({ required: false, blank: true, initial: "" }),
      showEffect: new fields.StringField({ required: false, blank: true, initial: "" }),
      elementalEffect: new fields.StringField({ required: false, blank: true, initial: "" }),
      active: new fields.BooleanField({ required: true, initial: true }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }

  prepareDerivedData() {
    const cat = (this.category || this.psiCategory || "A").toUpperCase() === "B" ? "B" : "A";
    this.category = cat;
    this.psiCategory = cat;

    const normalizedKey = normalizePsiForceKey(this.forceId, "", this.parent?.name);

    this.hierarchyTier = resolvePsiHierarchyTier(normalizedKey, {
      manualOverride: Boolean(this.manualHierarchyOverride),
      itemTier: this.hierarchyTier
    });

    this.effectiveMod = Number(this.mod) || 0;
    this.pool = Math.max(1, (Number(this.level) || 1) + this.effectiveMod);
    this.appCounts = { 1: 0, 2: 0, 3: 0 };
    this.pyramidValid = true;
    this.pyramidReason = "";

    const actor = this.parent?.parent;
    if (actor?.items) {
      let t1Forces = 0;
      let t2Forces = 0;
      let t3Forces = 0;
      for (const i of actor.items) {
        if (i.type === "psiForce") {
          const iCat = (i.system.category || i.system.psiCategory || "A").toUpperCase() === "B" ? "B" : "A";
          if (iCat === "A") {
            const fk = normalizePsiForceKey(i.system.forceId, "", i.name);
            const ft = resolvePsiHierarchyTier(fk, {
              manualOverride: Boolean(i.system.manualHierarchyOverride),
              itemTier: i.system.hierarchyTier
            });
            if (ft === 1) t1Forces += 1;
            else if (ft === 2) t2Forces += 1;
            else if (ft === 3) t3Forces += 1;
          }
          continue;
        }
        if (i.type !== "psiApp") continue;
        const appForceKey = normalizePsiForceKey(i.system.psiForce, i.system.appId, i.name);
        if (appForceKey === normalizedKey) {
          const t = Math.clamp(Number(i.system.tier || i.system.level || 1), 1, 3);
          this.appCounts[t] = (this.appCounts[t] || 0) + 1;
        }
      }

      if (cat === "A") {
        if (this.hierarchyTier === 2 && t1Forces < t2Forces) {
          this.pyramidValid = false;
          this.pyramidReason =
            t1Forces === 0
              ? "Pyramiden-Verstoß: Es muss zuerst mindestens 1 PSI-Kraft der Hierarchiestufe 1 erlernt werden!"
              : `Pyramiden-Verstoß: Für ${t2Forces} Kräfte der Hierarchiestufe 2 werden mindestens ${t2Forces} Kräfte der Hierarchiestufe 1 benötigt (aktuell ${t1Forces}).`;
        } else if (this.hierarchyTier === 3 && (t2Forces < t3Forces || t1Forces < t3Forces)) {
          this.pyramidValid = false;
          this.pyramidReason =
            t2Forces === 0
              ? "Pyramiden-Verstoß: Es muss zuerst mindestens je 1 PSI-Kraft der Hierarchiestufe 1 und 2 erlernt werden!"
              : `Pyramiden-Verstoß: Für ${t3Forces} Kräfte der Hierarchiestufe 3 werden mindestens je ${t3Forces} Kräfte der Hierarchiestufe 1 (${t1Forces}) und Hierarchiestufe 2 (${t2Forces}) benötigt.`;
        }
      }
    }
  }
}

export class NoReturnPsiAppData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      appId: new fields.StringField({ required: false, blank: true, initial: "" }),
      psiForce: new fields.StringField({ required: false, blank: true, initial: "Telekinese" }),
      psiForceLabel: new fields.StringField({ required: false, blank: true, initial: "" }),
      category: new fields.StringField({ required: false, blank: true, initial: "A" }),
      psiCategory: new fields.StringField({ required: false, blank: true, initial: "A" }),
      forceHierarchyTier: new fields.NumberField({ required: true, integer: true, min: 1, max: 3, initial: 1 }),
      manualHierarchyOverride: new fields.BooleanField({ required: true, initial: false }),
      tier: new fields.NumberField({ required: true, integer: true, min: 1, max: 3, initial: 1 }),
      level: new fields.NumberField({ required: true, integer: true, min: 1, max: 3, initial: 1 }),
      targetRange: new fields.StringField({ required: false, blank: true, initial: "8-12" }),
      targetMin: new fields.NumberField({ required: true, integer: true, min: 1, initial: 8 }),
      targetMax: new fields.NumberField({ required: true, integer: true, min: 1, initial: 12 }),
      noobValue: new fields.NumberField({ required: true, integer: true, min: 0, initial: 14 }),
      masteryLevel: new fields.NumberField({ required: true, integer: true, min: 0, initial: 6 }),
      upkeepPenalty: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      cost: new fields.StringField({ required: false, blank: true, initial: "1 Aktion (2 Aktionen mit [KS])" }),
      exhaustionCost: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      range: new fields.StringField({ required: false, blank: true, initial: "Sichtfeld" }),
      duration: new fields.StringField({ required: false, blank: true, initial: "Sofort" }),
      rollFormula: new fields.StringField({ required: false, blank: true, initial: "@psiForce" }),
      defensiveMode: new fields.StringField({
        required: false,
        blank: true,
        initial: ""
      }),
      active: new fields.BooleanField({ required: true, initial: true }),
      effects: new fields.StringField({ required: false, blank: true, initial: "" }),
      costGp: new fields.NumberField({ required: true, min: 0, initial: 3 }),
      costEp: new fields.NumberField({ required: true, min: 0, initial: 5 }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }

  prepareDerivedData() {
    const cat = (this.category || this.psiCategory || "A").toUpperCase() === "B" ? "B" : "A";
    this.category = cat;
    this.psiCategory = cat;

    const resolvedTier = Math.clamp(Number(this.tier || this.level || 1), 1, 3);
    this.tier = resolvedTier;
    this.level = resolvedTier;

    const canonicalForceKey = normalizePsiForceKey(this.psiForce, this.appId, this.parent?.name);
    const resolvedLabel = PSI_FORCE_LABELS[canonicalForceKey] || this.psiForce || "Telekinese";
    this.psiForceLabel = resolvedLabel;
    if (!this.psiForce || normalizePsiForceKey(this.psiForce) === canonicalForceKey) {
      this.psiForce = resolvedLabel;
    }

    this.forceHierarchyTier = resolvePsiHierarchyTier(canonicalForceKey, {
      manualOverride: Boolean(this.manualHierarchyOverride),
      itemTier: this.forceHierarchyTier
    });

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
    this.forcePool = 1;
    this.pool = 1;
    this.isMastered = false;
    this.pyramidValid = true;
    this.pyramidReason = "";

    if (actor) {
      const forceItem = actor.items?.find((i) => {
        if (i.type === "psiForce") {
          const fk = normalizePsiForceKey(i.system.forceId, "", i.name);
          return fk === canonicalForceKey;
        }
        if (i.type === "skill" && i.system.category === "psi") {
          const sk = normalizePsiForceKey(i.system.skillId, "", i.name);
          return sk === canonicalForceKey;
        }
        return false;
      });

      if (forceItem) {
        this.forceLevel = Number(forceItem.system.level) || 1;
        this.forcePool = Math.max(1, this.forceLevel + (Number(forceItem.system.mod) || 0));
      } else if (cat === "B") {
        this.forceLevel = Number(actor.system?.attributes?.primary?.wissen?.overall || 1);
        this.forcePool = Math.max(1, this.forceLevel);
      }

      this.pool = this.forcePool;
      this.isMastered =
        Boolean(forceItem?.system?.mastery) ||
        (this.masteryLevel > 0 && this.forceLevel >= this.masteryLevel);

      const sameForceApps = (actor.items ?? []).filter((i) => {
        if (i.type !== "psiApp") return false;
        const ak = normalizePsiForceKey(i.system.psiForce, i.system.appId, i.name);
        return ak === canonicalForceKey;
      });

      const t1Count = sameForceApps.filter((a) => (Number(a.system.tier || a.system.level) || 1) === 1).length;
      const t2Count = sameForceApps.filter((a) => (Number(a.system.tier || a.system.level) || 1) === 2).length;
      const t3Count = sameForceApps.filter((a) => (Number(a.system.tier || a.system.level) || 1) === 3).length;

      if (!forceItem && cat === "A") {
        this.pyramidValid = false;
        this.pyramidReason = `PSI-Kraft '${this.psiForceLabel}' (Hierarchiestufe ${this.forceHierarchyTier}) noch nicht erlernt.`;
      } else if (resolvedTier === 2 && t1Count < t2Count) {
        this.pyramidValid = false;
        this.pyramidReason = `PSI-Pyramide (${this.psiForceLabel}): Für ${t2Count} App(s) der App-Stufe 2 werden mindestens ${t2Count} App(s) der App-Stufe 1 benötigt (aktuell: ${t1Count}).`;
      } else if (resolvedTier === 3 && (t2Count < t3Count || t1Count < t2Count)) {
        this.pyramidValid = false;
        this.pyramidReason = `PSI-Pyramide (${this.psiForceLabel}): Für ${t3Count} App(s) der App-Stufe 3 werden mindestens je ${t3Count} App(s) der App-Stufen 1 (${t1Count}) und 2 (${t2Count}) benötigt.`;
      }
    }
  }
}

export class NoReturnWeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      weaponId: new fields.StringField({ required: false, blank: true, initial: "" }),
      category: new fields.StringField({ required: false, blank: true, initial: "faustfeuerwaffe" }),
      weaponType: new fields.StringField({ required: false, blank: true, initial: "ranged" }),
      skill: new fields.StringField({ required: false, blank: true, initial: "schusswaffen" }),
      attackBonus: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      parryBonus: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      damageFormula: new fields.StringField({ required: false, blank: true, initial: "1d6+10" }),
      damageDice: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      damageFlat: new fields.NumberField({ required: true, integer: true, initial: 10 }),
      damageBonusPerHit: new fields.NumberField({ required: true, integer: true, initial: 4 }),
      caliber: new fields.StringField({ required: false, blank: true, initial: "9mm" }),
      magazine: new fields.StringField({ required: false, blank: true, initial: "15 (Stange)" }),
      magazineCapacity: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      ammoCurrent: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      loadedAmmoId: new fields.StringField({ required: false, blank: true, initial: "" }),
      loadedAmmoType: new fields.StringField({ required: false, blank: true, initial: "FMJ" }),
      loadedAmmoName: new fields.StringField({ required: false, blank: true, initial: "" }),
      recoilDampening: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
      fireModes: new fields.StringField({ required: false, blank: true, initial: "Semi (1)" }),
      range: new fields.StringField({ required: false, blank: true, initial: "Fernkampfwaffe" }),
      techLevel: new fields.StringField({ required: false, blank: true, initial: "II" }),
      price: new fields.NumberField({ required: true, min: 0, initial: 300 }),
      weight: new fields.NumberField({ required: true, min: 0, initial: 1.0 }),
      equipped: new fields.BooleanField({ required: true, initial: true }),
      taped: new fields.BooleanField({ required: true, initial: false }),
      features: new fields.StringField({ required: false, blank: true, initial: "" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }

  prepareDerivedData() {
    const normCal = normalizeCaliber(this.caliber);
    const derivedMagCap = parseMagazineCapacity(this.magazine, this.magazineCapacity);
    this.magazineCapacity = derivedMagCap;
    this.isRanged = Boolean(
      normCal ||
        derivedMagCap > 0 ||
        (this.category || "").toLowerCase().includes("fernkampf") ||
        ["schusswaffen", "schwere_waffen", "schiessen", "projektilwaffen", "energiewaffen"].includes(
          (this.skill || "").toLowerCase()
        )
    );

    const actor = this.parent?.parent;
    let resolvedAmmoType = (this.loadedAmmoType || "FMJ").toUpperCase();
    if (!AMMO_TYPE_DEFINITIONS[resolvedAmmoType]) resolvedAmmoType = "FMJ";
    let resolvedAmmoName = this.loadedAmmoName || AMMO_TYPE_DEFINITIONS[resolvedAmmoType].label;

    if (actor?.items && this.loadedAmmoId) {
      const ammoItem = actor.items.get(this.loadedAmmoId);
      if (ammoItem) {
        const itemTypeCode = String(ammoItem.system?.ammoType || "FMJ").toUpperCase();
        if (AMMO_TYPE_DEFINITIONS[itemTypeCode]) {
          resolvedAmmoType = itemTypeCode;
        }
        resolvedAmmoName = ammoItem.name;
      }
    }

    const ammoDef = AMMO_TYPE_DEFINITIONS[resolvedAmmoType] || AMMO_TYPE_DEFINITIONS.FMJ;
    this.loadedAmmoType = resolvedAmmoType;
    this.loadedAmmoName = resolvedAmmoName;
    this.ammoSummary = ammoDef.summary;
    this.ammoDamageBonus = this.isRanged ? ammoDef.damageBonus : 0;

    // Parse base dice and flat damage from damageFormula if needed
    const rawFormula = String(this.damageFormula || "1d6").trim();
    const diceMatch = rawFormula.match(/(\d+)\s*[dDwW]\s*(\d+)/);
    const flatMatch = rawFormula.match(/([+-]\s*\d+)(?!\s*[dDwW])/);
    const baseDice = diceMatch ? parseInt(diceMatch[1], 10) : Number(this.damageDice) || 1;
    const baseDieFaces = diceMatch ? parseInt(diceMatch[2], 10) : 6;
    const baseFlat = flatMatch
      ? parseInt(flatMatch[1].replace(/\s+/g, ""), 10)
      : diceMatch
      ? 0
      : Number(this.damageFlat) || 0;

    const totalFlat = baseFlat + this.ammoDamageBonus;
    this.effectiveDamageFlat = totalFlat;
    const signStr = totalFlat > 0 ? `+${totalFlat}` : totalFlat < 0 ? `${totalFlat}` : "";
    this.effectiveDamageFormula = `${baseDice}d${baseDieFaces}${signStr}`;
    this.effectiveDamageDisplay =
      this.ammoDamageBonus > 0
        ? `${baseDice}W${baseDieFaces}${signStr} (${resolvedAmmoType})`
        : `${baseDice}W${baseDieFaces}${signStr}`;
  }
}

export class NoReturnArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      armorId: new fields.StringField({ required: false, blank: true, initial: "" }),
      armorValue: new fields.NumberField({ required: true, integer: true, min: 0, initial: 15 }),
      materialCategory: new fields.StringField({ required: false, blank: true, initial: "A" }),
      comfort: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      zones: new fields.ArrayField(new fields.NumberField({ integer: true }), {
        required: true,
        initial: [6, 7, 8]
      }),
      zonesLabel: new fields.StringField({ required: false, blank: true, initial: "6 bis 8" }),
      price: new fields.NumberField({ required: true, min: 0, initial: 400 }),
      techLevel: new fields.StringField({ required: false, blank: true, initial: "II" }),
      equipped: new fields.BooleanField({ required: true, initial: true }),
      features: new fields.StringField({ required: false, blank: true, initial: "" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}

export class NoReturnGearData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      gearId: new fields.StringField({ required: false, blank: true, initial: "" }),
      category: new fields.StringField({ required: false, blank: true, initial: "allgemein" }),
      caliber: new fields.StringField({ required: false, blank: true, initial: "" }),
      ammoType: new fields.StringField({ required: false, blank: true, initial: "" }),
      isAmmo: new fields.BooleanField({ required: true, initial: false }),
      quantity: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      weight: new fields.NumberField({ required: true, min: 0, initial: 0.2 }),
      price: new fields.NumberField({ required: true, min: 0, initial: 50 }),
      techLevel: new fields.StringField({ required: false, blank: true, initial: "II" }),
      effects: new fields.StringField({ required: false, blank: true, initial: "" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }

  prepareDerivedData() {
    const nameLower = (this.parent?.name || "").toLowerCase();
    const catLower = (this.category || "").toLowerCase();
    if (!this.ammoType) {
      if (nameLower.includes("(ap)") || nameLower.includes("hartkern")) this.ammoType = "AP";
      else if (nameLower.includes("(hs)") || nameLower.includes("hohlspitz")) this.ammoType = "HS";
      else if (nameLower.includes("(af)") || nameLower.includes("anti-fahrzeug")) this.ammoType = "AF";
      else if (
        nameLower.includes("(fmj)") ||
        nameLower.includes("vollmantel") ||
        nameLower.includes("munition") ||
        catLower === "munition"
      ) {
        this.ammoType = "FMJ";
      }
    }
    if (!this.caliber && (this.isAmmo || catLower === "munition" || nameLower.includes("munition"))) {
      // Infer caliber from item name if not explicitly set, e.g. "Munition 9mm (FMJ)"
      const calCandidates = [
        "9mm",
        ".45",
        ".357",
        ".50",
        "5,56mm",
        "7,62mm",
        "4,6mm",
        "12ga",
        ".308",
        "12,7mm",
        "Pfeile",
        "Bolzen",
        "Kleinkaliber",
        "Brennstofftank",
        "Granate",
        "Rakete",
        "Energiezelle"
      ];
      for (const cand of calCandidates) {
        if (nameLower.includes(cand.toLowerCase())) {
          this.caliber = cand;
          break;
        }
      }
    }
    this.isAmmo = Boolean(this.isAmmo || this.caliber || catLower === "munition" || this.ammoType);
  }
}

export class NoReturnConsumableData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      consumableId: new fields.StringField({ required: false, blank: true, initial: "" }),
      category: new fields.StringField({ required: false, blank: true, initial: "droge" }),
      quantity: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      dosage: new fields.StringField({ required: false, blank: true, initial: "1 Dosis" }),
      duration: new fields.StringField({ required: false, blank: true, initial: "4 Stunden" }),
      addictionRating: new fields.StringField({ required: false, blank: true, initial: "Mittel" }),
      statBoosts: new fields.StringField({ required: false, blank: true, initial: "" }),
      drawbacks: new fields.StringField({ required: false, blank: true, initial: "" }),
      active: new fields.BooleanField({ required: true, initial: false }),
      attributeModifiers: createAttributeModifierSchema(fields),
      skillModifiers: new fields.StringField({ required: false, blank: true, initial: "" }),
      price: new fields.NumberField({ required: true, min: 0, initial: 100 }),
      weight: new fields.NumberField({ required: true, min: 0, initial: 0.05 }),
      techLevel: new fields.StringField({ required: false, blank: true, initial: "III" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}

export class NoReturnCyberwareData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      cyberwareId: new fields.StringField({ required: false, blank: true, initial: "" }),
      category: new fields.StringField({ required: false, blank: true, initial: "implantat" }),
      targetZone: new fields.StringField({ required: false, blank: true, initial: "12" }),
      zone: new fields.StringField({ required: false, blank: true, initial: "Kopf (12)" }),
      capacityCost: new fields.NumberField({ required: true, min: 0, initial: 0.5 }),
      organismCost: new fields.NumberField({ required: true, min: 0, initial: 2 }),
      organismusCost: new fields.NumberField({ required: true, min: 0, initial: 2 }),
      psycheCost: new fields.NumberField({ required: true, min: 0, initial: 1 }),
      energyDrain: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      installed: new fields.BooleanField({ required: true, initial: true }),
      price: new fields.NumberField({ required: true, min: 0, initial: 2500 }),
      techLevel: new fields.StringField({ required: false, blank: true, initial: "IV" }),
      design: new fields.StringField({ required: false, blank: true, initial: "" }),
      effects: new fields.StringField({ required: false, blank: true, initial: "" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }

  prepareDerivedData() {
    const cost = Math.max(Number(this.organismCost) || 0, Number(this.organismusCost) || 0);
    this.organismCost = cost;
    this.organismusCost = cost;
  }
}

export class NoReturnRobotModuleData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      moduleId: new fields.StringField({ required: false, blank: true, initial: "" }),
      category: new fields.StringField({ required: false, blank: true, initial: "implantat" }),
      targetZone: new fields.StringField({ required: false, blank: true, initial: "5" }),
      zone: new fields.StringField({ required: false, blank: true, initial: "r. Arm (5)" }),
      capacity: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      capacityCost: new fields.NumberField({ required: true, min: 0, initial: 1 }),
      organismCost: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      organismusCost: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      psycheCost: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      energyDrain: new fields.NumberField({ required: true, min: 0, initial: 0.5 }),
      installed: new fields.BooleanField({ required: true, initial: true }),
      price: new fields.NumberField({ required: true, min: 0, initial: 2500 }),
      techLevel: new fields.StringField({ required: false, blank: true, initial: "III" }),
      design: new fields.StringField({ required: false, blank: true, initial: "" }),
      stats: new fields.SchemaField({
        geschick: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        staerke: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        konstitution: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        schnelligkeit: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        tastsinn: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        panzerung: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        materialCategory: new fields.StringField({ required: false, blank: true, initial: "B" })
      }),
      effects: new fields.StringField({ required: false, blank: true, initial: "" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
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
      speciesId: new fields.StringField({ required: false, blank: true, initial: "mensch" }),
      subspecies: new fields.StringField({ required: false, blank: true, initial: "Homo Sapiens" }),
      costGp: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      legality: new fields.StringField({ required: false, blank: true, initial: "Beim Zentrum registriert und legal" }),
      psiAllowed: new fields.BooleanField({ required: true, initial: true }),
      freePsiCount: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      baseStats: new fields.SchemaField({
        psyche: new fields.NumberField({ required: true, integer: true, min: 0, max: 100, initial: 80 }),
        organismus: new fields.NumberField({ required: true, integer: true, min: 0, max: 100, initial: 100 }),
        adrenalin: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
        infektionsresistenz: new fields.StringField({ required: false, blank: true, initial: "2d6" })
      }),
      attributeLimits: new fields.SchemaField({
        primaryMax: new fields.NumberField({ required: true, integer: true, min: 1, initial: 4 }),
        secondaryMax: new fields.NumberField({ required: true, integer: true, min: 1, initial: 4 })
      }),
      attributeModifiers: createAttributeModifierSchema(fields),
      skillModifiers: new fields.StringField({ required: false, blank: true, initial: "" }),
      specialRules: new fields.StringField({ required: false, blank: true, initial: "" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}

export class NoReturnMutationData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      mutationId: new fields.StringField({ required: false, blank: true, initial: "" }),
      category: new fields.StringField({
        required: false,
        blank: true,
        initial: "sichtbar"
      }),
      level: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
      maxLevel: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
      costMp: new fields.NumberField({ required: true, min: 0, initial: 1 }),
      costGp: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      costAp: new fields.NumberField({ required: true, min: 0, initial: 0 }),
      organismusCost: new fields.NumberField({ required: true, initial: 0 }),
      psycheCost: new fields.NumberField({ required: true, initial: 0 }),
      heritability: new fields.StringField({ required: false, blank: true, initial: "0%" }),
      active: new fields.BooleanField({ required: true, initial: true }),
      attributeModifiers: createAttributeModifierSchema(fields),
      combatBonuses: new fields.SchemaField({
        armorBonus: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        materialCategory: new fields.StringField({ required: false, blank: true, initial: "A" }),
        maxHpOverride: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        regenSpeed: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        regenPool: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      skillModifiers: new fields.StringField({ required: false, blank: true, initial: "" }),
      effects: new fields.StringField({ required: false, blank: true, initial: "" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}

export class NoReturnTraitData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      traitId: new fields.StringField({ required: false, blank: true, initial: "" }),
      traitType: new fields.StringField({
        required: false,
        blank: true,
        initial: "justice"
      }),
      cost: new fields.NumberField({ required: true, integer: true, min: 0, initial: 10 }),
      costCurrency: new fields.StringField({
        required: false,
        blank: true,
        initial: "JP"
      }),
      opposingTrait: new fields.StringField({ required: false, blank: true, initial: "" }),
      passiveModifiers: new fields.StringField({ required: false, blank: true, initial: "" }),
      skillModifiers: new fields.StringField({ required: false, blank: true, initial: "" }),
      attributeModifiers: createAttributeModifierSchema(fields),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}

export class NoReturnConditionData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      conditionId: new fields.StringField({ required: false, blank: true, initial: "" }),
      conditionType: new fields.StringField({
        required: false,
        blank: true,
        initial: "krankheit"
      }),
      incubationTime: new fields.StringField({ required: false, blank: true, initial: "1–2 Stunden" }),
      testInterval: new fields.StringField({ required: false, blank: true, initial: "24 Stunden" }),
      resistanceFormula: new fields.StringField({ required: false, blank: true, initial: "@status.infektionsresistenz" }),
      intensity: new fields.NumberField({ required: true, integer: true, min: 1, initial: 5 }),
      identificationMw: new fields.NumberField({ required: true, integer: true, min: 0, initial: 10 }),
      currentStage: new fields.NumberField({ required: true, integer: true, min: 0, max: 5, initial: 1 }),
      symptomStages: new fields.StringField({ required: false, blank: true, initial: "" }),
      damagePerStage: new fields.StringField({ required: false, blank: true, initial: "" }),
      penaltiesPerStage: new fields.StringField({ required: false, blank: true, initial: "" }),
      antidote: new fields.StringField({ required: false, blank: true, initial: "" }),
      transmission: new fields.StringField({ required: false, blank: true, initial: "Blut- oder Schleimhautkontakt" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}
