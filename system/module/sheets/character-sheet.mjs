import { HIT_ZONES, PLAYABLE_SPECIES_PRESETS } from "../data/character-data.mjs";
import {
  AMMO_TYPE_DEFINITIONS,
  HIT_ZONE_SHORT_LABELS,
  formatArmorZonesLabel,
  isAmmoCompatibleWithWeapon
} from "../data/item-data.mjs";
import { NoReturnRoll } from "../dice/roll.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const SELECTABLE_ARMOR_ZONE_OPTIONS = [12, 8, 7, 6, 2, 9, 5, 10, 4, 11, 3].map((z) => ({
  num: z,
  code: String(z),
  label: HIT_ZONE_SHORT_LABELS[String(z)] || `Zone ${z}`
}));

/**
 * ApplicationV2 Sheet for NoReturn Standard Characters, NPCs, and Creatures.
 */
export class NoReturnCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noreturn", "sheet", "actor", "character-sheet"],
    tag: "form",
    position: {
      width: 1254,
      height: 880
    },
    window: {
      resizable: true
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions: {
      editImage: NoReturnCharacterSheet.#onEditImage,
      switchTab: NoReturnCharacterSheet.#onSwitchTab,
      switchSkillSubtab: NoReturnCharacterSheet.#onSwitchSkillSubtab,
      rollAttribute: NoReturnCharacterSheet.#onRollAttribute,
      rollSkill: NoReturnCharacterSheet.#onRollSkill,
      rollPsiForce: NoReturnCharacterSheet.#onRollPsiForce,
      rollPsiApp: NoReturnCharacterSheet.#onRollPsiApp,
      rollPsiMishap: NoReturnCharacterSheet.#onRollPsiMishap,
      rollWeapon: NoReturnCharacterSheet.#onRollWeapon,
      rollDamage: NoReturnCharacterSheet.#onRollDamage,
      rollHitZone: NoReturnCharacterSheet.#onRollHitZone,
      rollSoak: NoReturnCharacterSheet.#onRollSoak,
      rollInitiative: NoReturnCharacterSheet.#onRollInitiative,
      rollInfection: NoReturnCharacterSheet.#onRollInfection,
      rollCondition: NoReturnCharacterSheet.#onRollCondition,
      applySpeciesPreset: NoReturnCharacterSheet.#onApplySpeciesPreset,
      reloadWeapon: NoReturnCharacterSheet.#onReloadWeapon,
      loadWeaponAmmo: NoReturnCharacterSheet.#onLoadWeaponAmmo,
      unloadWeaponAmmo: NoReturnCharacterSheet.#onUnloadWeaponAmmo,
      createItem: NoReturnCharacterSheet.#onCreateItem,
      editItem: NoReturnCharacterSheet.#onEditItem,
      deleteItem: NoReturnCharacterSheet.#onDeleteItem,
      stepItemNumeric: NoReturnCharacterSheet.#onStepItemNumeric,
      toggleEquipped: NoReturnCharacterSheet.#onToggleEquipped,
      toggleActive: NoReturnCharacterSheet.#onToggleActive,
      toggleInstalled: NoReturnCharacterSheet.#onToggleInstalled,
      changeArmorZone: NoReturnCharacterSheet.#onChangeArmorZone
    }
  };

  static PARTS = {
    sheet: {
      template: "systems/noreturn/templates/actor/character-sheet.hbs",
      scrollable: [".sheet-body"]
    }
  };

  #activeTab = "overview";
  #activeSkillSubtab = "standard";

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const system = actor.system;

    const skills = [];
    const styleSkills = [];
    const psiForces = [];
    const psiApps = [];
    const weapons = [];
    const armors = [];
    const ammoItems = [];
    const gear = [];
    const consumables = [];
    const augmentations = [];
    const speciesItems = [];
    const mutations = [];
    const traits = [];
    const conditions = [];

    for (const item of actor.items) {
      if (item.type === "skill") {
        if (item.system.category === "psi") {
          psiForces.push(item);
        } else if (item.system.category === "style" || item.system.category === "kampfkunst") {
          styleSkills.push(item);
        } else {
          skills.push(item);
        }
      } else if (item.type === "styleskill") {
        styleSkills.push(item);
      } else if (item.type === "psiForce") {
        psiForces.push(item);
      } else if (item.type === "psiApp") {
        psiApps.push(item);
      } else if (item.type === "weapon") {
        weapons.push(item);
      } else if (item.type === "armor") {
        armors.push(item);
      } else if (item.type === "ammo" || (item.type === "gear" && item.system?.isAmmo)) {
        ammoItems.push(item);
      } else if (item.type === "gear") {
        gear.push(item);
      } else if (item.type === "consumable") {
        consumables.push(item);
      } else if (item.type === "cyberware" || item.type === "robotModule") {
        augmentations.push(item);
      } else if (item.type === "species") {
        speciesItems.push(item);
      } else if (item.type === "mutation") {
        mutations.push(item);
      } else if (item.type === "trait") {
        traits.push(item);
      } else if (item.type === "condition" || item.type === "disease" || item.type === "toxin") {
        conditions.push(item);
      }
    }

    skills.sort((a, b) => a.name.localeCompare(b.name));
    styleSkills.sort((a, b) => a.name.localeCompare(b.name));
    psiForces.sort((a, b) => {
      const hDiff = (Number(a.system.hierarchyTier) || 1) - (Number(b.system.hierarchyTier) || 1);
      if (hDiff !== 0) return hDiff;
      return a.name.localeCompare(b.name);
    });
    psiApps.sort((a, b) => {
      const fhDiff =
        (Number(a.system.forceHierarchyTier) || 1) - (Number(b.system.forceHierarchyTier) || 1);
      if (fhDiff !== 0) return fhDiff;
      const fCmp = (a.system.psiForceLabel || a.system.psiForce || "").localeCompare(
        b.system.psiForceLabel || b.system.psiForce || ""
      );
      if (fCmp !== 0) return fCmp;
      const tDiff = (Number(a.system.tier) || 1) - (Number(b.system.tier) || 1);
      if (tDiff !== 0) return tDiff;
      return a.name.localeCompare(b.name);
    });

    const hitZones = HIT_ZONES.map((z) => {
      const zData = system.health.zones[z.code] || {};
      const baseArmor = zData.armor ?? 0;
      const eqArmor = zData.equippedArmor ?? baseArmor;
      return {
        code: z.code,
        labelKey: z.labelKey,
        lethal: z.lethal,
        damage: zData.damage ?? 0,
        max: zData.max ?? system.health.maxHpTier,
        armor: baseArmor,
        equippedArmor: eqArmor,
        armorBreakdown: zData.armorBreakdown || `Basis: ${baseArmor} = ${eqArmor} RW`,
        materialCategory: zData.materialCategory ?? "A",
        penalty: zData.penalty ?? 0
      };
    });

    const primaryKeys = ["geschick", "staerke", "konstitution", "schnelligkeit", "wissen", "wahrnehmung"];
    const primaryAttributes = primaryKeys.map((key) => ({
      key,
      labelKey: `NORETURN.Attributes.${key}`,
      abbrKey: `NORETURN.Attributes.${key}Abbr`,
      ...system.attributes.primary[key]
    }));

    const secondaryKeys = ["charisma", "logik", "fahrzeuge", "schmerztoleranz"];
    const secondaryAttributes = secondaryKeys.map((key) => ({
      key,
      labelKey: `NORETURN.Attributes.${key}`,
      abbrKey: `NORETURN.Attributes.${key}Abbr`,
      rollable: key !== "schmerztoleranz",
      ...system.attributes.secondary[key]
    }));

    const enrichedNotes = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      system.notes || "",
      { async: true, relativeTo: actor }
    );

    const t1Forces = psiForces.filter((f) => (Number(f.system.hierarchyTier) || 1) === 1).length;
    const t2Forces = psiForces.filter((f) => (Number(f.system.hierarchyTier) || 1) === 2).length;
    const t3Forces = psiForces.filter((f) => (Number(f.system.hierarchyTier) || 1) === 3).length;
    const maxHierarchyTier = t1Forces >= 2 && t2Forces >= 2 ? 3 : t1Forces >= 2 ? 2 : 1;

    const selectedSpecies = String(
      system.personal?.spezies || system.species || speciesItems[0]?.name || "Mensch"
    ).trim();
    const nonPsiSpecies = ["adivasi", "evo", "mutant"];
    const isNonPsiSpecies = nonPsiSpecies.includes(selectedSpecies.toLowerCase());
    const presetPsiAllowed = PLAYABLE_SPECIES_PRESETS[selectedSpecies]?.psiAllowed;
    const isPsiCapable =
      !isNonPsiSpecies &&
      presetPsiAllowed !== false &&
      Boolean(system.isPsiAllowed !== false);
    const isPsiAllowed = isPsiCapable;
    if (!isPsiCapable && this.#activeTab === "psi") {
      this.#activeTab = "overview";
    }

    const ammoGearItems = ammoItems;
    for (const w of weapons) {
      w.compatibleAmmoItems = ammoGearItems.filter((g) =>
        isAmmoCompatibleWithWeapon(g, w.system?.caliber)
      );
    }

    return {
      ...context,
      actor,
      system,
      activeTab: this.#activeTab,
      activeSkillSubtab: this.#activeSkillSubtab,
      isPsiAllowed,
      isPsiCapable,
      ammoTypes: Object.values(AMMO_TYPE_DEFINITIONS),
      speciesOptions: Object.keys(PLAYABLE_SPECIES_PRESETS),
      activeSpeciesItem: speciesItems[0] || null,
      speciesSummary: system.speciesSummary || PLAYABLE_SPECIES_PRESETS[system.personal.spezies] || null,
      psiSummary: {
        maxHierarchyTier,
        forcesByTier: { 1: t1Forces, 2: t2Forces, 3: t3Forces },
        ...(system.psiSummary || {})
      },
      primaryAttributes,
      secondaryAttributes,
      hitZones,
      skills,
      styleSkills,
      psiForces,
      psiApps,
      weapons,
      armors,
      selectableArmorZones: SELECTABLE_ARMOR_ZONE_OPTIONS,
      ammoItems,
      gear,
      consumables,
      augmentations,
      speciesItems,
      mutations,
      traits,
      conditions,
      enrichedNotes,
      isUnconscious: Boolean(system.isUnconscious),
      isImmobilized: Boolean(system.isImmobilized),
      isOrganismCritical: Boolean(system.isOrganismCritical)
    };
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const root = this.element;
    if (!root) return;

    const profileImg = root.querySelector(".profile-img[data-edit]");
    if (profileImg && !profileImg.dataset.action) {
      profileImg.addEventListener("click", (ev) => {
        NoReturnCharacterSheet.#onEditImage.call(this, ev, profileImg);
      });
    }

    const speciesSelect = root.querySelector('select[name="system.personal.spezies"]');
    if (speciesSelect) {
      const checkPsiTabVisibility = (val) => {
        const isBlocked = ["adivasi", "evo", "mutant"].includes(String(val || "").trim().toLowerCase());
        const psiTab = root.querySelector('[data-tab="psi"]');
        if (psiTab) {
          psiTab.style.display = isBlocked ? "none" : "";
        }
      };
      checkPsiTabVisibility(speciesSelect.value);
      speciesSelect.addEventListener("change", async (ev) => {
        ev.stopPropagation();
        checkPsiTabVisibility(ev.currentTarget.value);
        await this._applySpeciesSelection(ev.currentTarget.value);
      });
    }

    const ammoSelects = root.querySelectorAll(".nr-weapon-ammo-select");
    ammoSelects.forEach((sel) => {
      sel.addEventListener("change", async (ev) => {
        ev.stopPropagation();
        const weaponId = sel.dataset.weaponId || sel.closest("[data-item-id]")?.dataset.itemId;
        const weapon = this.document.items.get(weaponId);
        if (!weapon) return;
        const val = String(sel.value || "").trim();
        if (!val || val === "unload") {
          await NoReturnRoll.unloadWeaponAmmo(this.document, weapon);
          return;
        }
        if (val.toLowerCase().startsWith("type:")) {
          const code = val.slice(5).toUpperCase();
          const def = AMMO_TYPE_DEFINITIONS[code] || AMMO_TYPE_DEFINITIONS.FMJ;
          const curAmmo = Number(weapon.system?.ammoCurrent) || 0;
          if (curAmmo > 0 && weapon.system?.loadedAmmoId) {
            await NoReturnRoll.unloadWeaponAmmo(this.document, weapon, { notify: false });
          }
          await weapon.update({
            "system.loadedAmmoId": "",
            "system.loadedAmmoType": def.code,
            "system.loadedAmmoName": def.label,
            "system.loadedAmmoDamageMod": def.damageBonus
          });
        } else {
          const itemId = val.toLowerCase().startsWith("item:") ? val.slice(5) : val;
          await NoReturnRoll.loadWeaponAmmo(this.document, weapon, {
            ammoItemId: itemId,
            skipDialog: true
          });
        }
      });
    });

    // Inline numeric inputs for Skills & Styleskills (Punkt 5)
    const inlineInputs = root.querySelectorAll(".nr-inline-item-input");
    inlineInputs.forEach((inp) => {
      inp.addEventListener("change", async (ev) => {
        ev.stopPropagation();
        const itemId = inp.dataset.itemId || inp.closest("[data-item-id]")?.dataset.itemId;
        const field = inp.dataset.field;
        const item = this.document.items.get(itemId);
        if (!item || !field) return;
        let val = Number(inp.value);
        if (Number.isNaN(val)) val = 0;
        if (field === "system.level") {
          if (item.type === "styleskill") {
            const maxL = Number(item.system?.maxLevel) || 3;
            val = Math.min(maxL, Math.max(1, Math.round(val)));
          } else {
            val = Math.max(0, Math.round(val));
          }
        } else {
          val = Math.round(val);
        }
        await item.update({ [field]: val });
      });
    });

    // Single-zone dropdown for selectable-zone armors like Partielle Panzerungsglieder (Punkt 2)
    const armorZoneSelects = root.querySelectorAll(".nr-armor-single-zone-select");
    armorZoneSelects.forEach((sel) => {
      sel.addEventListener("change", async (ev) => {
        ev.stopPropagation();
        const itemId = sel.dataset.itemId || sel.closest("[data-item-id]")?.dataset.itemId;
        if (!itemId) return;
        const armor = this.document.items.get(itemId);
        if (!armor) return;
        const zNum = Number(sel.value) || 6;
        await armor.update({
          "system.selectedZone": zNum,
          "system.coveredZones": [zNum],
          "system.zones": [zNum],
          "system.zonesLabel": `Zone ${zNum}`
        });
      });
    });
  }

  /**
   * Handle dropping an Item onto the Character Sheet.
   * Ensures PSI-Apps and PSI-Forces can always be dropped onto the sheet without validation errors.
   */
  async _onDropItem(event, data) {
    if (!this.isEditable) return false;
    const item = await Item.implementation.fromDropData(data);
    if (!item) return false;

    // 1. Standard Skill: increment level if already present
    if (item.type === "skill") {
      const existing = this.document.items.find(
        (i) =>
          i.type === "skill" &&
          ((item.system.skillId && i.system.skillId === item.system.skillId) || i.name === item.name)
      );
      if (existing) {
        await existing.update({ "system.level": (Number(existing.system.level) || 0) + 1 });
        return existing;
      }
    }

    // 2. StyleSkill: increment level if multi-tier
    if (item.type === "styleskill") {
      const existingStyle = this.document.items.find(
        (i) =>
          i.type === "styleskill" &&
          ((item.system.styleSkillId && i.system.styleSkillId === item.system.styleSkillId) ||
            i.name === item.name)
      );
      if (existingStyle) {
        const curLvl = Number(existingStyle.system.level) || 1;
        const maxLvl = Number(existingStyle.system.maxLevel) || 3;
        if (curLvl < maxLvl) {
          await existingStyle.update({ "system.level": curLvl + 1 });
        }
        return existingStyle;
      }
    }

    // 3. PSI-Kraft (psiForce): increment level if already present
    if (item.type === "psiForce") {
      const existingForce = this.document.items.find(
        (i) =>
          i.type === "psiForce" &&
          ((item.system.forceId && i.system.forceId === item.system.forceId) || i.name === item.name)
      );
      if (existingForce) {
        await existingForce.update({ "system.level": (Number(existingForce.system.level) || 1) + 1 });
        return existingForce;
      }
    }

    // 4. PSI-App (psiApp): avoid exact duplicate, sanitize defensiveMode, and drop cleanly
    if (item.type === "psiApp") {
      const existingApp = this.document.items.find(
        (i) =>
          i.type === "psiApp" &&
          ((item.system.appId && i.system.appId === item.system.appId) || i.name === item.name)
      );
      if (existingApp) return existingApp;

      const rawObj = item.toObject();
      rawObj.system = rawObj.system || {};
      if (rawObj.system.defensiveMode === undefined || rawObj.system.defensiveMode === null) {
        rawObj.system.defensiveMode = "";
      }
      return this.document.createEmbeddedDocuments("Item", [rawObj]);
    }

    // 5. Species: replace existing species item and apply base stats
    if (item.type === "species") {
      const existingSpeciesIds = this.document.items
        .filter((i) => i.type === "species")
        .map((i) => i.id);
      if (existingSpeciesIds.length > 0) {
        await this.document.deleteEmbeddedDocuments("Item", existingSpeciesIds);
      }
      const created = await this.document.createEmbeddedDocuments("Item", [item.toObject()]);
      const bs = item.system.baseStats || {};
      await this.document.update({
        "system.personal.spezies": item.name,
        "system.status.psyche.value": bs.psyche ?? 80,
        "system.status.organismus.max": bs.organismus ?? 100,
        "system.status.infektionsresistenz": bs.infektionsresistenz || "2d6",
        "system.attributes.special.adrenalin.stufe": bs.adrenalin ?? 2,
        "system.attributes.special.adrenalin.pool": bs.adrenalin ?? 2
      });
      return created;
    }

    // 6. Mutation / Abnormality
    if (item.type === "mutation") {
      const existingMut = this.document.items.find(
        (i) =>
          i.type === "mutation" &&
          ((item.system.mutationId && i.system.mutationId === item.system.mutationId) || i.name === item.name)
      );
      if (existingMut && (Number(existingMut.system.level) || 1) < (Number(existingMut.system.maxLevel) || 1)) {
        await existingMut.update({ "system.level": (Number(existingMut.system.level) || 1) + 1 });
        return existingMut;
      }
      const orgCost = Number(item.system.organismusCost) || 0;
      const psyCost = Number(item.system.psycheCost) || 0;
      if (orgCost !== 0 || psyCost !== 0) {
        const curDmg = Number(this.document.system.status.organismus.damage) || 0;
        const curPsy = Number(this.document.system.status.psyche.value) || 80;
        await this.document.update({
          "system.status.organismus.damage": Math.max(0, curDmg + orgCost),
          "system.status.psyche.value": Math.min(100, Math.max(0, curPsy - psyCost))
        });
      }
    }

    // 7. Gear / Ammunition / Consumable stacking when dropped from Compendium or sidebar
    if (
      (item.type === "ammo" || item.type === "gear" || item.type === "consumable") &&
      item.parent?.id !== this.document.id
    ) {
      const isDroppedAmmo = item.type === "ammo" || Boolean(item.system?.isAmmo);
      const existingGear = this.document.items.find(
        (i) =>
          (isDroppedAmmo
            ? i.type === "ammo" || (i.type === "gear" && Boolean(i.system?.isAmmo))
            : i.type === item.type) &&
          i.name === item.name &&
          String(i.system?.caliber || "") === String(item.system?.caliber || "") &&
          String(i.system?.ammoType || "") === String(item.system?.ammoType || "")
      );
      if (existingGear) {
        const addQty = Math.max(1, Number(item.system?.quantity) || 1);
        const curQty = Math.max(0, Number(existingGear.system?.quantity) || 0);
        await existingGear.update({ "system.quantity": curQty + addQty });
        return existingGear;
      }
    }

    return super._onDropItem
      ? super._onDropItem(event, data)
      : this.document.createEmbeddedDocuments("Item", [item.toObject()]);
  }

  static async #onEditImage(event, target) {
    event.preventDefault();
    if (!this.isEditable) return;
    const attr = target?.dataset?.edit || "img";
    const current = foundry.utils.getProperty(this.document, attr);
    const FP =
      foundry?.applications?.apps?.FilePicker?.implementation ||
      foundry?.applications?.apps?.FilePicker ||
      globalThis.FilePicker;
    if (!FP) return;
    const fp = new FP({
      type: "image",
      current,
      callback: async (path) => {
        await this.document.update({ [attr]: path });
      }
    });
    return fp.browse();
  }

  static #onSwitchTab(event, target) {
    event.preventDefault();
    const tab = target.dataset.tab;
    if (tab) {
      this.#activeTab = tab;
      this.render();
    }
  }

  static #onSwitchSkillSubtab(event, target) {
    event.preventDefault();
    const subtab = target.dataset.subtab;
    if (subtab) {
      this.#activeSkillSubtab = subtab;
      this.render();
    }
  }

  async _applySpeciesSelection(speciesKey) {
    const actor = this.document;
    const preset = PLAYABLE_SPECIES_PRESETS[speciesKey];
    if (!preset) return;

    const existingSpeciesIds = actor.items.filter((i) => i.type === "species").map((i) => i.id);
    if (existingSpeciesIds.length > 0) {
      await actor.deleteEmbeddedDocuments("Item", existingSpeciesIds);
    }

    await actor.createEmbeddedDocuments("Item", [
      {
        name: preset.name,
        type: "species",
        system: {
          speciesId: preset.speciesId,
          subspecies: preset.subspecies,
          costGp: preset.costGp,
          legality: preset.legality,
          psiAllowed: preset.psiAllowed,
          freePsiCount: preset.freePsiCount,
          baseStats: preset.baseStats,
          attributeModifiers: preset.attributeModifiers,
          attributeLimits: preset.attributeLimits,
          skillModifiers: preset.skillModifiers,
          specialRules: preset.specialRules
        }
      }
    ]);

    const updateData = {
      "system.personal.spezies": preset.name,
      "system.status.psyche.value": preset.baseStats.psyche,
      "system.status.organismus.max": preset.baseStats.organismus,
      "system.status.infektionsresistenz": preset.baseStats.infektionsresistenz,
      "system.attributes.special.adrenalin.stufe": preset.baseStats.adrenalin,
      "system.attributes.special.adrenalin.pool": preset.baseStats.adrenalin
    };

    const primMax = Number(preset.attributeLimits?.primaryMax) || 4;
    const secMax = Number(preset.attributeLimits?.secondaryMax) || 4;
    for (const [k, attr] of Object.entries(actor.system.attributes.primary || {})) {
      const limit = preset.name === "Evo" && k !== "konstitution" ? 4 : primMax;
      if ((Number(attr.base) || 1) > limit) {
        updateData[`system.attributes.primary.${k}.base`] = limit;
      }
    }
    for (const [k, attr] of Object.entries(actor.system.attributes.secondary || {})) {
      if ((Number(attr.base) || 0) > secMax) {
        updateData[`system.attributes.secondary.${k}.base`] = secMax;
      }
    }

    if (!preset.psiAllowed && this.#activeTab === "psi") {
      this.#activeTab = "overview";
    }

    await actor.update(updateData);
  }

  static async #onApplySpeciesPreset(event) {
    event.preventDefault();
    const speciesKey = this.document.system.personal.spezies || "Mensch";
    await this._applySpeciesSelection(speciesKey);
  }

  static async #onReloadWeapon(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const weapon = this.document.items.get(itemId);
    if (!weapon) return;
    await NoReturnRoll.loadWeaponAmmo(this.document, weapon, {
      skipDialog: Boolean(event.shiftKey)
    });
  }

  static async #onLoadWeaponAmmo(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const weapon = this.document.items.get(itemId);
    if (!weapon) return;
    await NoReturnRoll.loadWeaponAmmo(this.document, weapon, {
      skipDialog: Boolean(event.shiftKey)
    });
  }

  static async #onUnloadWeaponAmmo(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const weapon = this.document.items.get(itemId);
    if (!weapon) return;
    await NoReturnRoll.unloadWeaponAmmo(this.document, weapon);
  }

  static async #onRollAttribute(event, target) {
    event.preventDefault();
    const attrKey = target.dataset.attribute;
    const actor = this.document;
    const prim = actor.system.attributes.primary[attrKey];
    const sec = actor.system.attributes.secondary[attrKey];
    const pool = prim ? prim.overall : sec ? sec.total : 1;
    const alphaBio = Boolean(prim?.alphaBio);
    const label = game.i18n.localize(`NORETURN.Attributes.${attrKey}`);

    await NoReturnRoll.rollAttributeCheck(actor, {
      attrKey,
      label,
      attributeDice: pool,
      alphaBio,
      skipDialog: event.shiftKey
    });
  }

  static async #onRollSkill(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const skill = this.document.items.get(itemId);
    if (!skill) return;

    await NoReturnRoll.rollSkillCheck(this.document, skill, {
      skipDialog: event.shiftKey
    });
  }

  static async #onRollPsiForce(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const force = this.document.items.get(itemId);
    if (!force) return;

    await NoReturnRoll.rollPsiForce(this.document, force, {
      skipDialog: event.shiftKey
    });
  }

  static async #onRollPsiApp(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const appItem = this.document.items.get(itemId);
    if (!appItem) return;
    await NoReturnRoll.rollPsiApp(this.document, appItem, { skipDialog: event.shiftKey });
  }

  static async #onRollPsiMishap(event, target) {
    event.preventDefault();
    const tableKey = target.dataset.tier || target.dataset.table || "1";
    await NoReturnRoll.rollPsiMishapTable(tableKey, this.document, { postSeparateMessage: true });
  }

  static async #onRollWeapon(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const weapon = this.document.items.get(itemId);
    if (!weapon) return;

    await NoReturnRoll.rollWeaponAttack(this.document, weapon, {
      skipDialog: event.shiftKey
    });
  }

  static async #onRollDamage(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const weapon = this.document.items.get(itemId);
    if (!weapon) return;
    await NoReturnRoll.rollWeaponDamage(this.document, weapon, { goodHits: 0 });
  }

  static async #onRollHitZone(event) {
    event.preventDefault();
    await NoReturnRoll.rollHitZone(this.document);
  }

  static async #onRollSoak(event, target) {
    event.preventDefault();
    const zoneCode = target.dataset.zone || "7";
    await NoReturnRoll.rollSoak(this.document, zoneCode, { skipDialog: event.shiftKey });
  }

  static async #onRollInitiative(event) {
    event.preventDefault();
    await NoReturnRoll.rollInitiative(this.document, { skipDialog: event.shiftKey });
  }

  static async #onRollInfection(event) {
    event.preventDefault();
    await NoReturnRoll.rollInfectionResistance(this.document);
  }

  static async #onRollCondition(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const condition = this.document.items.get(itemId);
    if (!condition) return;
    await NoReturnRoll.rollConditionResistance(this.document, condition, {
      skipDialog: event.shiftKey
    });
  }

  static async #onCreateItem(event, target) {
    event.preventDefault();
    const type = target.dataset.type || "gear";
    const defaultName = `${game.i18n.localize(`TYPES.Item.${type}`)}`;

    if (type === "weapon") {
      const dialogRes = await NoReturnRoll._waitDialog({
        title: game.i18n.localize("NORETURN.Combat.CreateWeaponDialogTitle") || "Neue Waffe anlegen",
        rollLabel: "Waffe anlegen",
        rollIcon: "fas fa-plus",
        content: `
          <div class="noreturn-roll-dialog">
            <div class="form-group">
              <label>Waffenname</label>
              <input type="text" name="weaponName" value="Neue Waffe" />
            </div>
            <div class="form-group">
              <label>Waffenart / Kategorie (GRW S. 64–65, 73 & 235–241)</label>
              <select name="weaponPreset">
                <option value="ranged">Fernkampfwaffe (Schießen / Schwere Waffen / Wurfwaffen)</option>
                <option value="kurzdistanz">Kurzdistanzwaffe (KW) – Fertigkeit: Nahkampf (ohne Parade)</option>
                <option value="distanzwaffe">Distanzwaffe (DW) – Fertigkeit: Waffenkampf (mit Parade)</option>
                <option value="natural">Natürliche Waffe / Biowaffe – Fertigkeit: Nahkampf</option>
              </select>
            </div>
          </div>
        `,
        parseForm: (form) => ({
          weaponName: String(form.elements.weaponName?.value || "").trim(),
          weaponPreset: String(form.elements.weaponPreset?.value || "ranged")
        })
      });

      if (!dialogRes || dialogRes.cancelled) return;
      const preset = dialogRes.weaponPreset;
      let wData = {
        name: dialogRes.weaponName || "Neue Fernkampfwaffe",
        type: "weapon",
        img: "systems/noreturn/assets/icons/weapon.svg",
        system: {
          weaponType: "ranged",
          category: "faustfeuerwaffe",
          skill: "schiessen",
          caliber: "9mm (P3)",
          magazine: "15(m)",
          magazineCapacity: 15,
          ammoCurrent: 0,
          damageFormula: "20",
          damageFlat: 20,
          damageBonusPerHit: 4,
          recoilDampening: 2,
          fireModes: "Semi 1(5x)",
          range: "Pistole",
          useStrengthDamage: false,
          parryAllowed: false,
          equipped: true
        }
      };

      if (preset === "kurzdistanz") {
        wData = {
          name:
            dialogRes.weaponName && dialogRes.weaponName !== "Neue Waffe"
              ? dialogRes.weaponName
              : "Neue Kurzdistanzwaffe (KW)",
          type: "weapon",
          img: "systems/noreturn/assets/icons/melee.svg",
          system: {
            weaponType: "melee",
            category: "kurzdistanz",
            skill: "nahkampf",
            caliber: "–",
            magazine: "–",
            magazineCapacity: 0,
            ammoCurrent: 0,
            damageFormula: "ST+15p.",
            damageFlat: 15,
            damageBonusPerHit: 0,
            recoilDampening: 0,
            fireModes: "Nahkampf",
            range: "Kurzdistanzwaffe (KW)",
            useStrengthDamage: true,
            parryAllowed: false,
            equipped: true
          }
        };
      } else if (preset === "distanzwaffe") {
        wData = {
          name:
            dialogRes.weaponName && dialogRes.weaponName !== "Neue Waffe"
              ? dialogRes.weaponName
              : "Neue Distanzwaffe (DW)",
          type: "weapon",
          img: "systems/noreturn/assets/icons/melee.svg",
          system: {
            weaponType: "melee",
            category: "distanzwaffe",
            skill: "waffenkampf",
            caliber: "–",
            magazine: "–",
            magazineCapacity: 0,
            ammoCurrent: 0,
            damageFormula: "ST+25p.",
            damageFlat: 25,
            damageBonusPerHit: 0,
            recoilDampening: 0,
            fireModes: "Nahkampf",
            range: "Distanzwaffe (DW)",
            useStrengthDamage: true,
            parryAllowed: true,
            equipped: true
          }
        };
      } else if (preset === "natural") {
        wData = {
          name:
            dialogRes.weaponName && dialogRes.weaponName !== "Neue Waffe"
              ? dialogRes.weaponName
              : "Natürliche Waffe (z. B. Beißen / Krallen)",
          type: "weapon",
          img: "systems/noreturn/assets/icons/melee.svg",
          system: {
            weaponType: "melee",
            category: "natural",
            skill: "nahkampf",
            caliber: "–",
            magazine: "–",
            magazineCapacity: 0,
            ammoCurrent: 0,
            damageFormula: "ST+20p.",
            damageFlat: 20,
            damageBonusPerHit: 0,
            recoilDampening: 0,
            fireModes: "Nahkampf",
            range: "Natürliche Waffe",
            useStrengthDamage: true,
            parryAllowed: false,
            equipped: true
          }
        };
      }

      const created = await this.document.createEmbeddedDocuments("Item", [wData]);
      created?.[0]?.sheet?.render(true);
      return;
    }

    const itemData = { name: defaultName, type };
    if (type === "ammo") {
      itemData.img = "systems/noreturn/assets/icons/ammo.svg";
      itemData.system = {
        category: "munition",
        isAmmo: true,
        ammoType: "FMJ",
        quantity: 10
      };
    }
    await this.document.createEmbeddedDocuments("Item", [itemData]);
  }

  static async #onStepItemNumeric(event, target) {
    event.preventDefault();
    event.stopPropagation();
    const itemId = target.dataset.itemId || target.closest("[data-item-id]")?.dataset.itemId;
    const field = target.dataset.field || "system.level";
    const step = Number(target.dataset.step) || 1;
    const item = this.document.items.get(itemId);
    if (!item) return;

    const currentVal = Number(foundry.utils.getProperty(item, field)) || 0;
    let nextVal = currentVal + step;
    if (field === "system.level") {
      if (item.type === "styleskill") {
        const maxL = Number(item.system?.maxLevel) || 3;
        nextVal = Math.min(maxL, Math.max(1, nextVal));
      } else {
        nextVal = Math.max(0, nextVal);
      }
    }
    await item.update({ [field]: nextVal });
  }

  static #onEditItem(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.document.items.get(itemId);
    item?.sheet?.render(true);
  }

  static async #onDeleteItem(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (item) await item.delete();
  }

  static async #onToggleEquipped(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (item && "equipped" in item.system) {
      await item.update({ "system.equipped": !item.system.equipped });
    }
  }

  static async #onToggleActive(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (item && "active" in item.system) {
      await item.update({ "system.active": !item.system.active });
    }
  }

  static async #onToggleInstalled(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (item && "installed" in item.system) {
      await item.update({ "system.installed": !item.system.installed });
    }
  }

  static async #onChangeArmorZone(event, target) {
    event.stopPropagation();
    const itemId = target.dataset.itemId || target.closest("[data-item-id]")?.dataset.itemId;
    if (!itemId) return;
    const armor = this.document.items.get(itemId);
    if (!armor) return;
    const zNum = Number(target.value) || 6;
    await armor.update({
      "system.selectedZone": zNum,
      "system.coveredZones": [zNum],
      "system.zones": [zNum],
      "system.zonesLabel": `Zone ${zNum}`
    });
  }
}
