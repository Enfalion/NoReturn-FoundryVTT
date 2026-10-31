import { HIT_ZONES } from "../data/character-data.mjs";
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
      width: 920,
      height: 820
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
      createItem: NoReturnCharacterSheet.#onCreateItem,
      editItem: NoReturnCharacterSheet.#onEditItem,
      deleteItem: NoReturnCharacterSheet.#onDeleteItem,
      toggleEquipped: NoReturnCharacterSheet.#onToggleEquipped
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
    const augmentations = [];

    for (const item of actor.items) {
      if (item.type === "skill") skills.push(item);
      else if (item.type === "weapon") weapons.push(item);
      else if (item.type === "armor") armors.push(item);
      else if (item.type === "gear") gear.push(item);
      else if (item.type === "cyberware" || item.type === "robotModule") augmentations.push(item);
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
      primaryAttributes,
      secondaryAttributes,
      hitZones,
      skills,
      weapons,
      armors,
      gear,
      augmentations,
      enrichedNotes,
      isUnconscious: Boolean(system.isUnconscious),
      isImmobilized: Boolean(system.isImmobilized)
    };
  }

  /**
   * Handle dropping an Item onto the Character Sheet.
   */
  async _onDropItem(event, data) {
    if (!this.isEditable) return false;
    const item = await Item.implementation.fromDropData(data);
    if (!item) return false;

    // Prevent duplicate skill items with the same skillId/name; increment level instead
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

    return super._onDropItem ? super._onDropItem(event, data) : this.document.createEmbeddedDocuments("Item", [item.toObject()]);
  }

  static #onSwitchTab(event, target) {
    event.preventDefault();
    const tab = target.dataset.tab;
    if (tab) {
      this.#activeTab = tab;
      this.render();
    }
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
    const bonusDice = Number(skill.system.mod) || 0;

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
    const bonusDice = (Number(weapon.system.attackBonus) || 0) + (Number(skillItem?.system?.mod) || 0);

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

    await NoReturnRoll.promptAndRoll({
      actor: this.document,
      title: game.i18n.localize("NORETURN.Combat.RollInitiative"),
      attributeDice: sk,
      skillDice: reaktionLevel,
      targetNumber: 10,
      skipDialog: event.shiftKey
    });
  }

  static async #onRollInfection(event) {
    event.preventDefault();
    const formula = this.document.system.status.infektionsresistenz || "1d6";
    const roll = new Roll(formula);
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      flavor: `${game.i18n.localize("NORETURN.Status.Infektionsresistenz")} (${formula})`
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
}
