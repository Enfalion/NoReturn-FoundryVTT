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
      width: 960,
      height: 860
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
      rollAttribute: NoReturnCharacterSheet.#onRollAttribute,
      rollSkill: NoReturnCharacterSheet.#onRollSkill,
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
      toggleActive: NoReturnCharacterSheet.#onToggleActive
    }
  };

  static PARTS = {
    sheet: {
      template: "systems/noreturn/templates/actor/character-sheet.hbs",
      scrollable: [".sheet-body"]
    }
  };

  #activeTab = "overview";

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const system = actor.system;

    const skills = [];
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
      if (item.type === "skill") skills.push(item);
      else if (item.type === "weapon") weapons.push(item);
      else if (item.type === "armor") armors.push(item);
      else if (item.type === "gear") gear.push(item);
      else if (item.type === "consumable") consumables.push(item);
      else if (item.type === "cyberware" || item.type === "robotModule") augmentations.push(item);
      else if (item.type === "species") speciesItems.push(item);
      else if (item.type === "mutation") mutations.push(item);
      else if (item.type === "trait") traits.push(item);
      else if (item.type === "condition") conditions.push(item);
    }

    skills.sort((a, b) => a.name.localeCompare(b.name));

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

    return {
      ...context,
      actor,
      system,
      activeTab: this.#activeTab,
      speciesOptions: Object.keys(PLAYABLE_SPECIES_PRESETS),
      activeSpeciesItem: speciesItems[0] || null,
      speciesSummary: system.speciesSummary || PLAYABLE_SPECIES_PRESETS[system.personal.spezies] || null,
      primaryAttributes,
      secondaryAttributes,
      hitZones,
      skills,
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
      isImmobilized: Boolean(system.isImmobilized)
    };
  }

  /**
   * Handle dropping an Item onto the Character Sheet.
   * Dynamically applies Species base stats/limits or Mutation organism/psyche costs.
   */
  async _onDropItem(event, data) {
    if (!this.isEditable) return false;
    const item = await Item.implementation.fromDropData(data);
    if (!item) return false;

    // 1. Skill: increment level if already present
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

    // 2. Species: replace existing species item and apply base stats
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
        "system.status.organismus.value": bs.organismus ?? 100,
        "system.status.infektionsresistenz": bs.infektionsresistenz || "2d6",
        "system.attributes.special.adrenalin.stufe": bs.adrenalin ?? 2,
        "system.attributes.special.adrenalin.pool": bs.adrenalin ?? 2
      });
      return created;
    }

    // 3. Mutation / Abnormality: increment level if multi-level or apply Organismus/Psyche cost
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
        const curOrg = Number(this.document.system.status.organismus.value) || 100;
        const curPsy = Number(this.document.system.status.psyche.value) || 80;
        await this.document.update({
          "system.status.organismus.value": Math.min(100, Math.max(0, curOrg - orgCost)),
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
      "system.status.organismus.value": preset.baseStats.organismus,
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

    await NoReturnRoll.promptAndRoll({
      actor,
      title: label,
      attributeDice: pool,
      skillDice: 0,
      allAttributeHazard: alphaBio,
      skipDialog: event.shiftKey
    });
  }

  static async #onRollSkill(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const skill = this.document.items.get(itemId);
    if (!skill) return;

    const attrKey = skill.system.attribute;
    const prim = this.document.system.attributes.primary?.[attrKey];
    const sec = this.document.system.attributes.secondary?.[attrKey];
    const attrDice = prim ? prim.overall : sec ? sec.total : 0;
    const skillDice = Number(skill.system.level) || 0;
    const bonusDice = Number(skill.system.effectiveMod ?? skill.system.mod) || 0;

    await NoReturnRoll.promptAndRoll({
      actor: this.document,
      title: skill.name,
      flavorSubtitle: attrKey ? game.i18n.localize(`NORETURN.Attributes.${attrKey}`) : "Spezial / PSI",
      attributeDice: attrDice,
      skillDice,
      bonusDice,
      allAttributeHazard: Boolean(prim?.alphaBio),
      allSkillHazard: Boolean(skill.system.betaBio),
      skipDialog: event.shiftKey
    });
  }

  static async #onRollWeapon(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const weapon = this.document.items.get(itemId);
    if (!weapon) return;

    const skillKey = weapon.system.skill || "schiessen";
    const skillItem = this.document.items.find(
      (i) =>
        i.type === "skill" &&
        (i.system.skillId === skillKey || i.name.toLowerCase() === skillKey.toLowerCase())
    );

    const attrDice = Number(this.document.system.attributes.primary.geschick.overall) || 1;
    const skillDice = Number(skillItem?.system?.level || 0);
    const bonusDice =
      (Number(weapon.system.attackBonus) || 0) +
      (Number(skillItem?.system?.effectiveMod ?? skillItem?.system?.mod) || 0);

    const checkResult = await NoReturnRoll.promptAndRoll({
      actor: this.document,
      title: `${weapon.name} (${game.i18n.localize("NORETURN.Combat.RollAttack")})`,
      flavorSubtitle: `${weapon.system.fireModes} | RD ${weapon.system.recoilDampening}`,
      attributeDice: attrDice,
      skillDice,
      bonusDice,
      allAttributeHazard: Boolean(this.document.system.attributes.primary.geschick.alphaBio),
      allSkillHazard: Boolean(skillItem?.system?.betaBio),
      skipDialog: event.shiftKey
    });

    if (checkResult && checkResult.isSuccess) {
      await NoReturnRoll.rollWeaponDamage(this.document, weapon, {
        goodHits: checkResult.goodHits
      });
    }
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
    const sk = Number(this.document.system.attributes.primary.schnelligkeit.overall) || 1;
    const reaktionItem = this.document.items.find(
      (i) => i.type === "skill" && (i.system.skillId === "reaktion" || i.name.toLowerCase() === "reaktion")
    );
    const reaktionLevel = Number(reaktionItem?.system?.level || 0);
    const reaktionMod = Number(reaktionItem?.system?.effectiveMod ?? reaktionItem?.system?.mod) || 0;

    await NoReturnRoll.promptAndRoll({
      actor: this.document,
      title: game.i18n.localize("NORETURN.Combat.RollInitiative"),
      attributeDice: sk,
      skillDice: reaktionLevel,
      bonusDice: reaktionMod,
      targetNumber: 10,
      skipDialog: event.shiftKey
    });
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
    await NoReturnRoll.rollConditionResistance(this.document, condition);
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
}
