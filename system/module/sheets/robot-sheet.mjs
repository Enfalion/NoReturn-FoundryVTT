import { ROBOT_ZONE_ORDER, ROBOT_MODELS } from "../data/robot-data.mjs";
import { PLAYABLE_SPECIES_PRESETS } from "../data/character-data.mjs";
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
 * Hybrid ApplicationV2 Sheet for NoReturn Robotics / Cyborg / Drone Actors.
 */
export class NoReturnRobotSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noreturn", "sheet", "actor", "robot-sheet"],
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
      editImage: NoReturnRobotSheet.#onEditImage,
      switchTab: NoReturnRobotSheet.#onSwitchTab,
      switchSkillSubtab: NoReturnRobotSheet.#onSwitchSkillSubtab,
      rollAttribute: NoReturnRobotSheet.#onRollAttribute,
      rollAllOver: NoReturnRobotSheet.#onRollAllOver,
      rollZoneStat: NoReturnRobotSheet.#onRollZoneStat,
      rollSense: NoReturnRobotSheet.#onRollSense,
      rollSkill: NoReturnRobotSheet.#onRollSkill,
      rollPsiForce: NoReturnRobotSheet.#onRollPsiForce,
      rollPsiApp: NoReturnRobotSheet.#onRollPsiApp,
      rollPsiMishap: NoReturnRobotSheet.#onRollPsiMishap,
      rollWeapon: NoReturnRobotSheet.#onRollWeapon,
      rollDamage: NoReturnRobotSheet.#onRollDamage,
      rollHitZone: NoReturnRobotSheet.#onRollHitZone,
      rollSoak: NoReturnRobotSheet.#onRollSoak,
      rollInitiative: NoReturnRobotSheet.#onRollInitiative,
      rollInfection: NoReturnRobotSheet.#onRollInfection,
      rollCondition: NoReturnRobotSheet.#onRollCondition,
      applySpeciesPreset: NoReturnRobotSheet.#onApplySpeciesPreset,
      reloadWeapon: NoReturnRobotSheet.#onReloadWeapon,
      loadWeaponAmmo: NoReturnRobotSheet.#onLoadWeaponAmmo,
      unloadWeaponAmmo: NoReturnRobotSheet.#onUnloadWeaponAmmo,
      createItem: NoReturnRobotSheet.#onCreateItem,
      editItem: NoReturnRobotSheet.#onEditItem,
      deleteItem: NoReturnRobotSheet.#onDeleteItem,
      stepItemNumeric: NoReturnRobotSheet.#onStepItemNumeric,
      toggleEquipped: NoReturnRobotSheet.#onToggleEquipped,
      toggleActive: NoReturnRobotSheet.#onToggleActive,
      toggleInstalled: NoReturnRobotSheet.#onToggleInstalled,
      changeArmorZone: NoReturnRobotSheet.#onChangeArmorZone
    }
  };

  static PARTS = {
    sheet: {
      template: "systems/noreturn/templates/actor/robot-sheet.hbs",
      scrollable: [".sheet-body"]
    }
  };

  #activeTab = "overview";
  #activeSkillSubtab = "standard";

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const system = actor.system;

    const robotZones = ROBOT_ZONE_ORDER.map((z) => {
      const zData = system.zones[z.code] || {};
      return {
        code: z.code,
        labelKey: z.labelKey,
        lethal: z.lethal,
        isRobotic: zData.isRobotic ?? true,
        model: zData.model ?? "casual",
        design: zData.design ?? "Casual - Steel",
        upgrades: zData.upgrades ?? {},
        values: zData.values ?? {},
        health: zData.health ?? {}
      };
    });

    const primaryKeys = ["geschick", "staerke", "konstitution", "schnelligkeit", "wissen", "wahrnehmung"];
    const primaryAttributes = primaryKeys.map((key) => ({
      key,
      labelKey: `NORETURN.Attributes.${key}`,
      abbrKey: `NORETURN.Attributes.${key}Abbr`,
      isZoneDerived: ["geschick", "staerke", "konstitution", "schnelligkeit", "wahrnehmung"].includes(key),
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

    const modules = [];
    const skills = [];
    const styleSkills = [];
    const psiForces = [];
    const psiApps = [];
    const weapons = [];
    const armors = [];
    const ammoItems = [];
    const gear = [];
    const consumables = [];
    const speciesItems = [];
    const mutations = [];
    const traits = [];
    const conditions = [];

    for (const item of actor.items) {
      if (item.type === "robotModule" || item.type === "cyberware") {
        modules.push(item);
      } else if (item.type === "skill") {
        if (item.system.category === "psi") psiForces.push(item);
        else if (item.system.category === "style" || item.system.category === "kampfkunst") styleSkills.push(item);
        else skills.push(item);
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
      } else if (item.type === "consumable") {
        consumables.push(item);
      } else if (item.type === "species") {
        speciesItems.push(item);
      } else if (item.type === "mutation") {
        mutations.push(item);
      } else if (item.type === "trait") {
        traits.push(item);
      } else if (item.type === "condition" || item.type === "disease" || item.type === "toxin") {
        conditions.push(item);
      } else if (item.type === "ammo" || (item.type === "gear" && item.system?.isAmmo)) {
        ammoItems.push(item);
      } else {
        gear.push(item);
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
      speciesSummary: system.speciesSummary || PLAYABLE_SPECIES_PRESETS[system.personal?.spezies] || null,
      psiSummary: {
        maxHierarchyTier,
        forcesByTier: { 1: t1Forces, 2: t2Forces, 3: t3Forces },
        ...(system.psiSummary || {})
      },
      primaryAttributes,
      secondaryAttributes,
      robotZones,
      robotModels: Object.keys(ROBOT_MODELS),
      modules,
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
        NoReturnRobotSheet.#onEditImage.call(this, ev, profileImg);
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

  async _onDropItem(event, data) {
    if (!this.isEditable) return false;
    const item = await Item.implementation.fromDropData(data);
    if (!item) return false;

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
        if (curLvl < maxLvl) await existingStyle.update({ "system.level": curLvl + 1 });
        return existingStyle;
      }
    }

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
        "system.status.infektionsresistenz": bs.infektionsresistenz || "2d6",
        "system.attributes.special.adrenalin.stufe": bs.adrenalin ?? 2,
        "system.attributes.special.adrenalin.pool": bs.adrenalin ?? 2
      });
      return created;
    }

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

    if (!preset.psiAllowed && this.#activeTab === "psi") {
      this.#activeTab = "overview";
    }

    await actor.update({
      "system.personal.spezies": preset.name,
      "system.status.psyche.value": preset.baseStats.psyche,
      "system.status.infektionsresistenz": preset.baseStats.infektionsresistenz,
      "system.attributes.special.adrenalin.stufe": preset.baseStats.adrenalin,
      "system.attributes.special.adrenalin.pool": preset.baseStats.adrenalin
    });
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
    const prim = actor.system.attributes.primary?.[attrKey];
    const sec = actor.system.attributes.secondary?.[attrKey];
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

  static async #onRollAllOver(event, target) {
    event.preventDefault();
    const stat = target.dataset.stat;
    const val = Number(this.document.system.allOver?.[stat] ?? 1);
    const label = game.i18n.localize(`NORETURN.Attributes.${stat}`);

    await NoReturnRoll.rollAttributeCheck(this.document, {
      attrKey: stat,
      label: `All over ${label}`,
      attributeDice: val,
      skipDialog: event.shiftKey
    });
  }

  static async #onRollZoneStat(event, target) {
    event.preventDefault();
    const zoneCode = target.dataset.zone;
    const stat = target.dataset.stat;
    const val = Number(this.document.system.zones?.[zoneCode]?.values?.[stat] ?? 1);
    const zoneName = game.i18n.localize(`NORETURN.Health.Zones.${zoneCode}`);
    const statName = game.i18n.localize(`NORETURN.Attributes.${stat}`);

    await NoReturnRoll.rollAttributeCheck(this.document, {
      attrKey: stat,
      label: `${statName} – ${zoneName}`,
      attributeDice: val,
      skipDialog: event.shiftKey
    });
  }

  static async #onRollSense(event, target) {
    event.preventDefault();
    const senseKey = target.dataset.sense;
    const actor = this.document;
    let val = 2;
    let label = "";

    if (senseKey === "allOver") {
      val = Number(actor.system.wahrnehmung?.allOverWahrnehmung ?? 2);
      label = game.i18n.localize("NORETURN.Senses.AllOverWahrnehmung");
    } else if (senseKey === "tastsinn") {
      val = Number(actor.system.wahrnehmung?.tastsinnAllOver ?? 2);
      label = game.i18n.localize("NORETURN.Senses.TastsinnAllOver");
    } else {
      val = Number(actor.system.wahrnehmung?.[senseKey]?.total ?? 2);
      label = game.i18n.localize(`NORETURN.Senses.${senseKey.charAt(0).toUpperCase() + senseKey.slice(1)}`);
    }

    await NoReturnRoll.rollAttributeCheck(actor, {
      attrKey: "wahrnehmung",
      label,
      attributeDice: val,
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
    const type = target.dataset.type || "robotModule";
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
