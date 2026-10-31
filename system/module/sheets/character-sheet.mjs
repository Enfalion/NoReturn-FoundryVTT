import { HIT_ZONES, PLAYABLE_SPECIES_PRESETS } from "../data/character-data.mjs";
import { NoReturnRoll } from "../dice/roll.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * ApplicationV2 Sheet for NoReturn Standard Characters, NPCs, and Creatures.
 */
export class NoReturnCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noreturn", "sheet", "actor", "character-sheet"],
    tag: "form",
    position: {
      width: 980,
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
      createItem: NoReturnCharacterSheet.#onCreateItem,
      editItem: NoReturnCharacterSheet.#onEditItem,
      deleteItem: NoReturnCharacterSheet.#onDeleteItem,
      toggleEquipped: NoReturnCharacterSheet.#onToggleEquipped,
      toggleActive: NoReturnCharacterSheet.#onToggleActive,
      toggleInstalled: NoReturnCharacterSheet.#onToggleInstalled
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
      return {
        code: z.code,
        labelKey: z.labelKey,
        lethal: z.lethal,
        damage: zData.damage ?? 0,
        max: zData.max ?? system.health.maxHpTier,
        armor: zData.armor ?? 0,
        equippedArmor: zData.equippedArmor ?? zData.armor ?? 0,
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

    return {
      ...context,
      actor,
      system,
      activeTab: this.#activeTab,
      activeSkillSubtab: this.#activeSkillSubtab,
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

    return super._onDropItem
      ? super._onDropItem(event, data)
      : this.document.createEmbeddedDocuments("Item", [item.toObject()]);
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

  static async #onApplySpeciesPreset(event) {
    event.preventDefault();
    const actor = this.document;
    const speciesKey = actor.system.personal.spezies || "Mensch";
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

    await actor.update({
      "system.status.psyche.value": preset.baseStats.psyche,
      "system.status.organismus.max": preset.baseStats.organismus,
      "system.status.infektionsresistenz": preset.baseStats.infektionsresistenz,
      "system.attributes.special.adrenalin.stufe": preset.baseStats.adrenalin,
      "system.attributes.special.adrenalin.pool": preset.baseStats.adrenalin
    });
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
    await NoReturnRoll.rollSoak(this.document, zoneCode);
  }

  static async #onRollInitiative(event) {
    event.preventDefault();
    await NoReturnRoll.rollInitiative(this.document, { skipDialog: event.shiftKey });
  }

  static async #onRollInfection(event) {
    event.preventDefault();
    const rawFormula = this.document.system.status.infektionsresistenz || "2d6";
    const formula = rawFormula.replace(/(\d+)W(\d+)/gi, "$1d$2").replace(/p\./gi, "");
    const roll = new Roll(formula);
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      flavor: `${game.i18n.localize("NORETURN.Status.Infektionsresistenz")} (${rawFormula})`
    });
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
    const name = `${game.i18n.localize(`TYPES.Item.${type}`)}`;
    await this.document.createEmbeddedDocuments("Item", [{ name, type }]);
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
}
