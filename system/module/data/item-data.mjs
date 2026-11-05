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
  if (!ammoItem?.system) return false;
  const sys = ammoItem.system;
  const isAmmoItem = Boolean(
    sys.isAmmo ||
      (sys.category || "").toLowerCase() === "munition" ||
      sys.ammoType ||
      (ammoItem.type === "consumable" && sys.caliber)
  );
  if (!isAmmoItem) return false;

  const wRaw = String(weaponCaliber ?? "").trim();
  if (!wRaw || wRaw === "–" || wRaw === "-") return false;

  const aRaw = String(sys.caliber ?? "").trim();
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

/**
 * Safely read an actor's effective attribute value (overall / total), even if called
 * during prepareEmbeddedDocuments() before actor.prepareDerivedData() has finished (Punkt 1).
 */
export function getEffectiveActorAttribute(actor, attrKey) {
  if (!actor || !attrKey) return 0;
  const key = String(attrKey).trim().toLowerCase();
  const prim = actor.system?.attributes?.primary?.[key];
  if (prim) {
    if (actor.type === "robot" && ["geschick", "staerke", "konstitution", "schnelligkeit", "wahrnehmung"].includes(key)) {
      return Math.max(0, Number(prim.overall ?? actor.system?.allOver?.[key] ?? prim.base ?? 1));
    }
    if (prim.itemMod !== undefined) {
      return Math.max(0, Number(prim.overall) || 0);
    }
    return Math.max(0, (Number(prim.base) || 0) + (Number(prim.mod) || 0));
  }
  const sec = actor.system?.attributes?.secondary?.[key];
  if (sec) {
    if (sec.itemMod !== undefined) {
      return Math.max(0, Number(sec.total) || 0);
    }
    return Math.max(0, (Number(sec.base) || 0) + (Number(sec.mod) || 0));
  }
  return 0;
}

export function normalizeSkillKey(raw = "") {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/[\s-]+/g, "_");
}

/**
 * Resolve the matching combat skill and attack dice pool for a weapon on an actor (Punkt 2).
 * Maps weapon subtypes/categories/skills to GRW combat skills:
 *  - Feuerwaffen (Pistolen, Gewehre, SMGs, Schrotflinten): Schießen + Geschick
 *  - Schwere Waffen: Schwere Waffen + Geschick
 *  - Projektilwaffen (Bögen, Armbrüste): Projektilwaffen + Geschick
 *  - Wurfwaffen / Granaten: Wurfwaffen + Geschick
 *  - Sprühwaffen / Flammenwerfer: Sprühwaffen + Geschick
 *  - Kurzdistanzwaffen (KW / Messer / waffenlos): Nahkampf + Geschick
 *  - Distanzwaffen (DW / Schwerter / Stangenwaffen): Waffenkampf + Geschick
 */
export function resolveWeaponCombatSkill(actor, weapon) {
  const sys = weapon?.system || weapon || {};
  const rawSkill = normalizeSkillKey(sys.skill || "");
  const rawCat = normalizeSkillKey(sys.category || "");
  const rawRange = normalizeSkillKey(sys.range || "");
  const rawName = normalizeSkillKey(weapon?.name || "");
  const combined = `${rawSkill} ${rawCat} ${rawRange} ${rawName}`;

  let canonicalId = "schiessen";
  let canonicalLabel = "Schießen";
  let aliases = ["schiessen", "schusswaffen", "feuerwaffen"];

  if (
    rawSkill.includes("schwere") ||
    rawSkill === "geschuetze" ||
    rawCat.includes("schwere") ||
    combined.includes("granatwerfer") ||
    combined.includes("raketenwerfer") ||
    combined.includes("maschinengewehr")
  ) {
    canonicalId = "schwere_waffen";
    canonicalLabel = "Schwere Waffen";
    aliases = ["schwere_waffen", "schwere_waffe", "geschuetze"];
  } else if (
    rawSkill.includes("projektil") ||
    combined.includes("armbrust") ||
    combined.includes("bogen") ||
    normalizeCaliber(sys.caliber) === "bolzen" ||
    normalizeCaliber(sys.caliber) === "pfeil"
  ) {
    canonicalId = "projektilwaffen";
    canonicalLabel = "Projektilwaffen";
    aliases = ["projektilwaffen", "projektilwaffe"];
  } else if (rawSkill.includes("wurf") || rawCat.includes("wurf") || combined.includes("wurfmesser")) {
    canonicalId = "wurfwaffen";
    canonicalLabel = "Wurfwaffen";
    aliases = ["wurfwaffen", "wurfwaffe"];
  } else if (rawSkill.includes("sprueh") || combined.includes("flammenwerfer") || combined.includes("sprueh")) {
    canonicalId = "spruehwaffen";
    canonicalLabel = "Sprühwaffen";
    aliases = ["spruehwaffen", "spruehwaffe"];
  } else if (
    rawSkill === "waffenkampf" ||
    rawCat.includes("distanz") ||
    rawRange.includes("distanzwaffe") ||
    (sys.weaponType === "melee" && (rawCat.includes("distanz") || rawSkill.includes("waffenkampf")))
  ) {
    canonicalId = "waffenkampf";
    canonicalLabel = "Waffenkampf";
    aliases = ["waffenkampf", "distanzwaffen", "distanzwaffe"];
  } else if (
    rawSkill === "nahkampf" ||
    rawCat.includes("kurzdistanz") ||
    rawRange.includes("kurzdistanz") ||
    sys.weaponType === "melee"
  ) {
    canonicalId = "nahkampf";
    canonicalLabel = "Nahkampf";
    aliases = ["nahkampf", "kurzdistanzwaffen", "waffenlos"];
  } else {
    canonicalId = "schiessen";
    canonicalLabel = "Schießen";
    aliases = ["schiessen", "schusswaffen", "feuerwaffen"];
  }

  let skillItem = null;
  if (actor?.items) {
    skillItem = actor.items.find((i) => {
      if (i.type !== "skill") return false;
      const iId = normalizeSkillKey(i.system?.skillId || "");
      const iName = normalizeSkillKey(i.name || "");
      return aliases.includes(iId) || aliases.includes(iName) || iId === rawSkill || iName === rawSkill;
    });
  }

  const attrDice = Math.max(1, getEffectiveActorAttribute(actor, "geschick") || 1);
  const skillLevel = skillItem ? Math.max(0, Number(skillItem.system?.level) || 0) : 0;
  const skillMod =
    skillItem && skillLevel > 0
      ? Number(skillItem.system?.effectiveMod ?? skillItem.system?.mod) || 0
      : 0;
  const weaponAttackBonus = Number(sys.attackBonus) || 0;
  // GRW rule: If skill is 0 (unlearned), roll only with Attribute (+ weapon bonus) without penalty.
  // If skill > 0, base pool is Attribute + Skill + SkillMod + WeaponAttackBonus.
  const baseAttackPool = Math.max(
    1,
    attrDice + (skillLevel > 0 ? skillLevel + skillMod : 0) + weaponAttackBonus
  );

  return {
    canonicalId,
    canonicalLabel,
    skillItem,
    skillLevel,
    skillMod,
    attrKey: "geschick",
    attrLabel: "Geschick",
    attrDice,
    weaponAttackBonus,
    baseAttackPool
  };
}

/**
 * Parse a weapon's fireModes string (e.g. "Semi 1(5x), Burst 2(3x), Auto 44(15g)", "Single 1(1x)", "Repetier 1(1x)")
 * into structured fire mode capabilities according to GRW S. 60-61 (Punkt 4).
 */
export function parseWeaponFireModes(fireModesStr = "", weaponSys = {}) {
  const raw = String(fireModesStr || "").trim();
  const isRanged = Boolean(
    weaponSys.isRanged ||
      weaponSys.weaponType === "ranged" ||
      (weaponSys.caliber && weaponSys.caliber !== "–" && weaponSys.weaponType !== "melee")
  );

  const modes = {
    single: { supported: false, key: "single", label: "Einzelschuss (E)", bulletsPerShot: 1, maxShots: 1 },
    repetier: { supported: false, key: "repetier", label: "Repetier (R)", bulletsPerShot: 1, maxShots: 1 },
    semi: { supported: false, key: "semi", label: "Semiautomatik (S)", bulletsPerTrigger: 1, maxTriggers: 1 },
    burst: { supported: false, key: "burst", label: "Burst-Modus (B)", bulletsPerBurst: 3, maxBursts: 1 },
    auto: { supported: false, key: "auto", label: "Vollautomatik (A)", listedDamage: 0, bulletsConsumed: 10 }
  };

  if (!isRanged || /nahkampf/i.test(raw)) {
    modes.single.supported = true;
    modes.single.label = "Einzelangriff (Nahkampf)";
    return { ...modes, availableModes: [modes.single] };
  }

  const singleMatch = raw.match(/Single\s*(\d+)?\s*(?:\(\s*(\d+)\s*x\s*\))?/i);
  if (singleMatch || /einzel/i.test(raw)) {
    modes.single.supported = true;
    modes.single.bulletsPerShot = Number(singleMatch?.[1]) || 1;
    modes.single.maxShots = Number(singleMatch?.[2]) || 1;
  }

  const repMatch = raw.match(/Repetier\s*(\d+)?\s*(?:\(\s*(\d+)\s*x\s*\))?/i);
  if (repMatch) {
    modes.repetier.supported = true;
    modes.repetier.bulletsPerShot = Number(repMatch[1]) || 1;
    modes.repetier.maxShots = Number(repMatch[2]) || 1;
  }

  const semiMatch = raw.match(/Semi\s*(\d+)?\s*(?:\(\s*(\d+)\s*x?\s*\))?/i);
  if (semiMatch) {
    modes.semi.supported = true;
    const n1 = Number(semiMatch[1]) || 1;
    const n2 = Number(semiMatch[2]) || 0;
    if (n2 > 0) {
      modes.semi.bulletsPerTrigger = n1;
      modes.semi.maxTriggers = n2;
    } else {
      modes.semi.bulletsPerTrigger = 1;
      modes.semi.maxTriggers = Math.max(1, n1);
    }
  }

  const burstMatch = raw.match(/Burst\s*(\d+)?\s*(?:\(\s*(\d+)\s*x?\s*\))?/i);
  if (burstMatch) {
    modes.burst.supported = true;
    modes.burst.bulletsPerBurst = Number(burstMatch[1]) || 3;
    modes.burst.maxBursts = Number(burstMatch[2]) || 2;
  }

  const autoMatch = raw.match(/Auto\s*(\d+)?\s*(?:\(\s*(\d+)\s*g\s*\))?/i);
  if (autoMatch) {
    modes.auto.supported = true;
    modes.auto.listedDamage = Number(autoMatch[1]) || 0;
    modes.auto.bulletsConsumed = Number(autoMatch[2]) || 10;
  }

  // Always allow single shot on ranged weapons if no explicit single/repetier was parsed
  if (!modes.single.supported && !modes.repetier.supported) {
    modes.single.supported = true;
  }

  const availableModes = [];
  if (modes.single.supported) availableModes.push(modes.single);
  if (modes.repetier.supported) availableModes.push(modes.repetier);
  if (modes.semi.supported) availableModes.push(modes.semi);
  if (modes.burst.supported) availableModes.push(modes.burst);
  if (modes.auto.supported) availableModes.push(modes.auto);

  return { ...modes, availableModes };
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
        attrVal = getEffectiveActorAttribute(actor, this.attribute);
      }

      const skillBonuses = actor.system?.skillBonuses || {};
      const idKey = (this.skillId || "").toLowerCase();
      const nameKey = (this.parent?.name || "").toLowerCase();
      const normNameKey = normalizeSkillKey(this.parent?.name || "");
      if (idKey && skillBonuses[idKey]) {
        itemBonusMod += Number(skillBonuses[idKey]) || 0;
      } else if (nameKey && skillBonuses[nameKey]) {
        itemBonusMod += Number(skillBonuses[nameKey]) || 0;
      } else if (normNameKey && skillBonuses[normNameKey]) {
        itemBonusMod += Number(skillBonuses[normNameKey]) || 0;
      }
    }

    this.attributeValue = attrVal;
    this.itemBonusMod = itemBonusMod;
    this.effectiveMod = (Number(this.mod) || 0) + itemBonusMod;
    const lvl = Math.max(0, Number(this.level) || 0);
    // GRW rule: Pool = Attributswert (aktuell/effektiv) + Fertigkeitswert (aktuell/effektiv) + Modifikatoren
    this.pool = Math.max(0, attrVal + lvl + this.effectiveMod);
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
      attrVal = getEffectiveActorAttribute(actor, this.attribute);
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
      skill: new fields.StringField({ required: false, blank: true, initial: "schiessen" }),
      attackBonus: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      parryBonus: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      damageFormula: new fields.StringField({ required: false, blank: true, initial: "20" }),
      damageDice: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      damageFlat: new fields.NumberField({ required: true, integer: true, initial: 20 }),
      damageBonusPerHit: new fields.NumberField({ required: true, integer: true, initial: 4 }),
      caliber: new fields.StringField({ required: false, blank: true, initial: "9mm (P3)" }),
      magazine: new fields.StringField({ required: false, blank: true, initial: "15(m)" }),
      magazineCapacity: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      ammoCurrent: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      loadedAmmoId: new fields.StringField({ required: false, blank: true, initial: "" }),
      loadedAmmoType: new fields.StringField({ required: false, blank: true, initial: "" }),
      loadedAmmoName: new fields.StringField({ required: false, blank: true, initial: "" }),
      loadedAmmoDamageMod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      loadedAmmoBulletDamage: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      recoilDampening: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
      fireModes: new fields.StringField({ required: false, blank: true, initial: "Semi 1(5x)" }),
      range: new fields.StringField({ required: false, blank: true, initial: "Pistole" }),
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
    const isMeleeExplicit =
      this.weaponType === "melee" ||
      ["nahkampf", "waffenkampf"].includes(normalizeSkillKey(this.skill)) ||
      /nahkampf/i.test(this.fireModes || "");
    this.isRanged =
      !isMeleeExplicit &&
      Boolean(
        this.weaponType === "ranged" ||
          normCal ||
          derivedMagCap > 0 ||
          (this.category || "").toLowerCase().includes("fernkampf") ||
          [
            "schusswaffen",
            "schwere_waffen",
            "schiessen",
            "projektilwaffen",
            "wurfwaffen",
            "spruehwaffen",
            "energiewaffen"
          ].includes(normalizeSkillKey(this.skill))
      );

    // Expose magazine object alias `{ value, max }` alongside `ammoCurrent` / `magazineCapacity`
    this.magazineObj = {
      value: Math.max(0, Number(this.ammoCurrent) || 0),
      max: derivedMagCap
    };

    const actor = this.parent?.parent;
    this.combatSkillInfo = resolveWeaponCombatSkill(actor, this.parent);
    this.attackPool = this.combatSkillInfo.baseAttackPool;
    this.parsedFireModes = parseWeaponFireModes(this.fireModes, this);

    // Dynamically resolve currently loaded ammunition from inventory (Punkt 3)
    const curRounds = Math.max(0, Number(this.ammoCurrent) || 0);
    let resolvedAmmoItem = null;
    if (actor?.items && this.loadedAmmoId) {
      resolvedAmmoItem = actor.items.get(this.loadedAmmoId) || null;
    }

    let resolvedAmmoType = String(this.loadedAmmoType || "").toUpperCase();
    let resolvedAmmoName = this.loadedAmmoName || "";
    let ammoDamageBonus = Number(this.loadedAmmoDamageMod) || 0;
    let bulletDamage = Number(this.damageBonusPerHit) || 0;
    let ignoresMk = [];
    let blockedByMk = [];

    if (resolvedAmmoItem) {
      const itemCode = String(resolvedAmmoItem.system?.ammoType || "").toUpperCase();
      if (itemCode) resolvedAmmoType = itemCode;
      resolvedAmmoName = resolvedAmmoItem.name;
      const def = AMMO_TYPE_DEFINITIONS[resolvedAmmoType] || null;
      ammoDamageBonus = Number(resolvedAmmoItem.system?.damageMod ?? def?.damageBonus ?? 0);
      if (Number(resolvedAmmoItem.system?.bulletDamage) > 0) {
        bulletDamage = Number(resolvedAmmoItem.system.bulletDamage);
      }
      ignoresMk = def?.ignoresMk ? [...def.ignoresMk] : [];
      blockedByMk = def?.blockedByMk ? [...def.blockedByMk] : [];
    } else if (resolvedAmmoType && AMMO_TYPE_DEFINITIONS[resolvedAmmoType]) {
      const def = AMMO_TYPE_DEFINITIONS[resolvedAmmoType];
      if (!resolvedAmmoName) resolvedAmmoName = def.label;
      ammoDamageBonus = Number(this.loadedAmmoDamageMod || def.damageBonus || 0);
      ignoresMk = [...def.ignoresMk];
      blockedByMk = [...def.blockedByMk];
    } else if (curRounds > 0 && this.isRanged) {
      // Weapon has rounds in magazine (e.g. from compendium) without a specific custom ammo item linked yet
      resolvedAmmoType = resolvedAmmoType || "FMJ";
      const def = AMMO_TYPE_DEFINITIONS[resolvedAmmoType] || AMMO_TYPE_DEFINITIONS.FMJ;
      resolvedAmmoName = resolvedAmmoName || def.label;
      ammoDamageBonus = def.damageBonus;
      ignoresMk = [...def.ignoresMk];
      blockedByMk = [...def.blockedByMk];
    }

    if (this.isRanged && curRounds <= 0 && !resolvedAmmoItem) {
      this.isLoaded = false;
      this.loadedAmmoDisplay = "Entladen (0 Schuss)";
      ammoDamageBonus = 0;
    } else {
      this.isLoaded = !this.isRanged || curRounds > 0 || derivedMagCap === 0;
      this.loadedAmmoDisplay = resolvedAmmoName || (resolvedAmmoType ? resolvedAmmoType : "–");
    }

    this.loadedAmmoType = resolvedAmmoType;
    this.loadedAmmoName = resolvedAmmoName;
    this.ammoDamageBonus = this.isRanged ? ammoDamageBonus : 0;
    this.bulletDamage = this.isRanged ? bulletDamage : 0;
    this.ammoIgnoresMk = ignoresMk;
    this.ammoBlockedByMk = blockedByMk;
    this.ammoSummary =
      resolvedAmmoType && AMMO_TYPE_DEFINITIONS[resolvedAmmoType]
        ? AMMO_TYPE_DEFINITIONS[resolvedAmmoType].summary
        : "";

    // Parse base weapon damage & dice
    const rawFormula = String(this.damageFormula || "").trim();
    const diceMatch = rawFormula.match(/(\d+)\s*[dDwW]\s*(\d+)/);
    const flatFromFormulaMatch = rawFormula.match(/([+-]\s*\d+)(?!\s*[dDwW])/);
    const pureNumberMatch = rawFormula.match(/^\s*(\d+)\s*$/);

    const baseDice = diceMatch ? parseInt(diceMatch[1], 10) : 0;
    const baseDieFaces = diceMatch ? parseInt(diceMatch[2], 10) : 6;
    const baseFlat =
      Number(this.damageFlat) > 0
        ? Number(this.damageFlat)
        : flatFromFormulaMatch
        ? parseInt(flatFromFormulaMatch[1].replace(/\s+/g, ""), 10)
        : pureNumberMatch
        ? parseInt(pureNumberMatch[1], 10)
        : 0;

    this.baseWeaponDamage = baseFlat;
    this.baseDamageDice = baseDice;
    this.baseDamageDieFaces = baseDieFaces;

    if (this.isRanged) {
      // Single-shot damage: Grundschaden + (Schaden der Kugel * 1) + Munitions-Modifikator
      const singleShotFlat = baseFlat + this.bulletDamage + this.ammoDamageBonus;
      this.effectiveDamageFlat = singleShotFlat;
      if (baseDice > 0) {
        const signStr = singleShotFlat > 0 ? ` + ${singleShotFlat}` : singleShotFlat < 0 ? ` - ${Math.abs(singleShotFlat)}` : "";
        this.effectiveDamageFormula = `${baseDice}d${baseDieFaces}${signStr}`;
        this.effectiveDamageDisplay = `${baseDice}W${baseDieFaces}${signStr} TP`;
      } else {
        this.effectiveDamageFormula = `${singleShotFlat}`;
        const parts = [`${baseFlat}`];
        if (this.bulletDamage > 0) parts.push(`+${this.bulletDamage}/Kugel`);
        if (this.ammoDamageBonus !== 0) {
          parts.push(`${this.ammoDamageBonus > 0 ? `+${this.ammoDamageBonus}` : this.ammoDamageBonus} (${resolvedAmmoType})`);
        }
        this.effectiveDamageDisplay = `${singleShotFlat} TP (${parts.join(" ")})`;
      }
    } else {
      // Melee weapon: @staerke W6 + baseFlat
      const st = actor ? Math.max(1, getEffectiveActorAttribute(actor, "staerke") || 1) : 1;
      this.effectiveDamageFlat = baseFlat;
      this.effectiveDamageFormula = baseFlat > 0 ? `${st}d6 + ${baseFlat}` : `${st}d6`;
      this.effectiveDamageDisplay = baseFlat > 0 ? `${st}W6 + ${baseFlat} TP` : `${st}W6 TP`;
    }
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
      damageMod: new fields.NumberField({ required: false, integer: true, nullable: true, initial: null }),
      bulletDamage: new fields.NumberField({ required: false, integer: true, nullable: true, initial: null }),
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
      if (nameLower.includes("(ap)") || nameLower.includes("hartkern") || nameLower.includes("panzerbrechend")) this.ammoType = "AP";
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
      const calCandidates = [
        "4,6mm (P1)",
        "5,56mm (P2)",
        "9mm (P3)",
        "11mm (P4)",
        "5,56mm (R1)",
        "7,62mm (R2)",
        "12,5mm (R3)",
        "9mm",
        "11mm",
        "5,56mm",
        "7,62mm",
        "4,6mm",
        "12,5mm",
        "Bolzen",
        "Gra.",
        "Granate",
        "Rak.",
        "Rakete"
      ];
      for (const cand of calCandidates) {
        if (nameLower.includes(cand.toLowerCase())) {
          this.caliber = cand;
          break;
        }
      }
    }
    this.isAmmo = Boolean(this.isAmmo || this.caliber || catLower === "munition" || this.ammoType);
    if (this.isAmmo && (this.damageMod === null || this.damageMod === undefined)) {
      const def = AMMO_TYPE_DEFINITIONS[this.ammoType] || AMMO_TYPE_DEFINITIONS.FMJ;
      this.damageMod = def.damageBonus;
    }
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
