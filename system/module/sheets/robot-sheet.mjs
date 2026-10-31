import { ROBOT_ZONE_ORDER, ROBOT_MODELS } from "../data/robot-data.mjs";
import { PLAYABLE_SPECIES_PRESETS } from "../data/character-data.mjs";
import { NoReturnRoll } from "../dice/roll.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Hybrid ApplicationV2 Sheet for NoReturn Robotics / Cyborg / Drone Actors.
 * Combines full Character Sheet capabilities (Attributes, Skills, PSI, Conditions, Traits, Inventory)
 * with dedicated Robotics Chassis, Power Supply/Battery, Module Sockets, Energy Drain, and 11-Zone Tuning.
 */
export class NoReturnRobotSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noreturn", "sheet", "actor", "robot-sheet"],
    tag: "form",
    position: {
      width: 1020,
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
      switchTab: NoReturnRobotSheet.#onSwitchTab,
      rollAttribute: NoReturnRobotSheet.#onRollAttribute,
      rollAllOver: NoReturnRobotSheet.#onRollAllOver,
      rollZoneStat: NoReturnRobotSheet.#onRollZoneStat,
      rollSense: NoReturnRobotSheet.#onRollSense,
      rollSkill: NoReturnRobotSheet.#onRollSkill,
      rollWeapon: NoReturnRobotSheet.#onRollWeapon,
      rollDamage: NoReturnRobotSheet.#onRollDamage,
      rollHitZone: NoReturnRobotSheet.#onRollHitZone,
      rollSoak: NoReturnRobotSheet.#onRollSoak,
      rollInitiative: NoReturnRobotSheet.#onRollInitiative,
      rollInfection: NoReturnRobotSheet.#onRollInfection,
      rollCondition: NoReturnRobotSheet.#onRollCondition,
      applySpeciesPreset: NoReturnRobotSheet.#onApplySpeciesPreset,
      createItem: NoReturnRobotSheet.#onCreateItem,
      editItem: NoReturnRobotSheet.#onEditItem,
      deleteItem: NoReturnRobotSheet.#onDeleteItem,
      toggleEquipped: NoReturnRobotSheet.#onToggleEquipped,
      toggleActive: NoReturnRobotSheet.#onToggleActive
    }
  };

  static PARTS = {
    sheet: {
      template: "systems/noreturn/templates/actor/robot-sheet.hbs",
      scrollable: [".sheet-body"]
    }
  };

  #activeTab = "overview";

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
    const weapons = [];
    const armors = [];
    const gear = [];
    const consumables = [];
    const speciesItems = [];
    const mutations = [];
    const traits = [];
    const conditions = [];

    for (const item of actor.items) {
      if (item.type === "robotModule" || item.type === "cyberware") modules.push(item);
      else if (item.type === "skill") skills.push(item);
      else if (item.type === "weapon") weapons.push(item);
      else if (item.type === "armor") armors.push(item);
      else if (item.type === "consumable") consumables.push(item);
      else if (item.type === "species") speciesItems.push(item);
      else if (item.type === "mutation") mutations.push(item);
      else if (item.type === "trait") traits.push(item);
      else if (item.type === "condition") conditions.push(item);
      else gear.push(item);
    }

    skills.sort((a, b) => a.name.localeCompare(b.name));

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
      speciesSummary: system.speciesSummary || PLAYABLE_SPECIES_PRESETS[system.personal?.spezies] || null,
      primaryAttributes,
      secondaryAttributes,
      robotZones,
      robotModels: Object.keys(ROBOT_MODELS),
      modules,
      skills,
      weapons,
      armors,
      gear,
      consumables,
      speciesItems,
      mutations,
      traits,
      conditions,
      enrichedNotes,
      isUnconscious: Boolean(system.isUnconscious),
      isImmobilized: Boolean(system.isImmobilized)
    };
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
      "system.status.infektionsresistenz": preset.baseStats.infektionsresistenz,
      "system.attributes.special.adrenalin.stufe": preset.baseStats.adrenalin,
      "system.attributes.special.adrenalin.pool": preset.baseStats.adrenalin
    });
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

    await NoReturnRoll.promptAndRoll({
      actor,
      title: label,
      attributeDice: pool,
      skillDice: 0,
      allAttributeHazard: alphaBio,
      skipDialog: event.shiftKey
    });
  }

  static async #onRollAllOver(event, target) {
    event.preventDefault();
    const stat = target.dataset.stat;
    const val = Number(this.document.system.allOver?.[stat] ?? 1);
    const label = game.i18n.localize(`NORETURN.Attributes.${stat}`);

    await NoReturnRoll.promptAndRoll({
      actor: this.document,
      title: `All over ${label}`,
      attributeDice: val,
      skillDice: 0,
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

    await NoReturnRoll.promptAndRoll({
      actor: this.document,
      title: `${statName} – ${zoneName}`,
      attributeDice: val,
      skillDice: 0,
      skipDialog: event.shiftKey
    });
  }

  static async #onRollSense(event, target) {
    event.preventDefault();
    const sense = target.dataset.sense;
    const w = this.document.system.wahrnehmung;
    let pool = w.allOverWahrnehmung;
    let title = game.i18n.localize("NORETURN.Senses.AllOverWahrnehmung");

    if (sense === "tastsinn") {
      pool = w.tastsinnAllOver;
      title = game.i18n.localize("NORETURN.Senses.TastsinnAllOver");
    } else if (w[sense]) {
      pool = w[sense].total;
      const capKey = sense.charAt(0).toUpperCase() + sense.slice(1);
      title = game.i18n.localize(`NORETURN.Senses.${capKey}`);
    }

    await NoReturnRoll.promptAndRoll({
      actor: this.document,
      title,
      attributeDice: pool,
      skillDice: 0,
      skipDialog: event.shiftKey
    });
  }

  static async #onRollSkill(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const skill = this.document.items.get(itemId);
    if (!skill) return;

    const attrKey = skill.system.attribute;
    const prim = this.document.system.attributes?.primary?.[attrKey];
    const sec = this.document.system.attributes?.secondary?.[attrKey];
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
    const attrDice = Number(this.document.system.attributes?.primary?.geschick?.overall ?? this.document.system.allOver.geschick) || 1;
    const skillDice = Number(skillItem?.system?.level || 0);
    const bonusDice =
      (Number(weapon.system.attackBonus) || 0) +
      (Number(skillItem?.system?.effectiveMod ?? skillItem?.system?.mod) || 0);

    const checkResult = await NoReturnRoll.promptAndRoll({
      actor: this.document,
      title: `${weapon.name} (${game.i18n.localize("NORETURN.Combat.RollAttack")})`,
      attributeDice: attrDice,
      skillDice,
      bonusDice,
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
    if (weapon) await NoReturnRoll.rollWeaponDamage(this.document, weapon, { goodHits: 0 });
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
    const sk = Number(this.document.system.attributes?.primary?.schnelligkeit?.overall ?? this.document.system.allOver.schnelligkeit) || 1;
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
    const type = target.dataset.type || "robotModule";
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
