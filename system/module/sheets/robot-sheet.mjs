import { ROBOT_ZONE_ORDER, ROBOT_MODELS } from "../data/robot-data.mjs";
import { NoReturnRoll } from "../dice/roll.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * ApplicationV2 Sheet for the NoReturn Robotics / Cyborg Sheet (1st_Edition_NoReturn-Robotikbogen.pdf).
 */
export class NoReturnRobotSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noreturn", "sheet", "actor", "robot-sheet"],
    tag: "form",
    position: {
      width: 980,
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
      switchTab: NoReturnRobotSheet.#onSwitchTab,
      rollAllOver: NoReturnRobotSheet.#onRollAllOver,
      rollZoneStat: NoReturnRobotSheet.#onRollZoneStat,
      rollSense: NoReturnRobotSheet.#onRollSense,
      rollSkill: NoReturnRobotSheet.#onRollSkill,
      rollWeapon: NoReturnRobotSheet.#onRollWeapon,
      rollDamage: NoReturnRobotSheet.#onRollDamage,
      rollHitZone: NoReturnRobotSheet.#onRollHitZone,
      rollSoak: NoReturnRobotSheet.#onRollSoak,
      createItem: NoReturnRobotSheet.#onCreateItem,
      editItem: NoReturnRobotSheet.#onEditItem,
      deleteItem: NoReturnRobotSheet.#onDeleteItem
    }
  };

  static PARTS = {
    sheet: {
      template: "systems/noreturn/templates/actor/robot-sheet.hbs",
      scrollable: [".sheet-body"]
    }
  };

  #activeTab = "zones";

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

    const modules = [];
    const skills = [];
    const weapons = [];
    const gear = [];

    for (const item of actor.items) {
      if (item.type === "robotModule" || item.type === "cyberware") modules.push(item);
      else if (item.type === "skill") skills.push(item);
      else if (item.type === "weapon") weapons.push(item);
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
      robotZones,
      robotModels: Object.keys(ROBOT_MODELS),
      modules,
      skills,
      weapons,
      gear,
      enrichedNotes
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
    const bonusDice = Number(skill.system.mod) || 0;

    await NoReturnRoll.promptAndRoll({
      actor: this.document,
      title: skill.name,
      attributeDice: attrDice,
      skillDice,
      bonusDice,
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
    const attrDice = Number(this.document.system.allOver.geschick) || 1;
    const skillDice = Number(skillItem?.system?.level || 0);
    const bonusDice = Number(weapon.system.attackBonus) || 0;

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
}
