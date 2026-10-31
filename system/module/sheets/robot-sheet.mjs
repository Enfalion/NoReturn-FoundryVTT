import { ROBOT_ZONE_ORDER, ROBOT_MODELS } from "../data/robot-data.mjs";
import { PLAYABLE_SPECIES_PRESETS } from "../data/character-data.mjs";
import { NoReturnRoll } from "../dice/roll.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Hybrid ApplicationV2 Sheet for NoReturn Robotics / Cyborg / Drone Actors.
 * Combines full Character Sheet capabilities (Attributes, Skills, StyleSkills, PSI, Conditions, Traits, Inventory)
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
      createItem: NoReturnRobotSheet.#onCreateItem,
      editItem: NoReturnRobotSheet.#onEditItem,
      deleteItem: NoReturnRobotSheet.#onDeleteItem,
      toggleEquipped: NoReturnRobotSheet.#onToggleEquipped,
      toggleActive: NoReturnRobotSheet.#onToggleActive,
      toggleInstalled: NoReturnRobotSheet.#onToggleInstalled
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
      } else {
        gear.push(item);
      }
    }

    skills.sort((a, b) => a.name.localeCompare(b.name));
    styleSkills.sort((a, b) => a.name.localeCompare(b.name));
    psiForces.sort((a, b) => a.name.localeCompare(b.name));
    psiApps.sort((a, b) => {
      const fCmp = (a.system.psiForceLabel || "").localeCompare(b.system.psiForceLabel || "");
      if (fCmp !== 0) return fCmp;
      return (Number(a.system.tier) || 1) - (Number(b.system.tier) || 1);
    });

    const enrichedNotes = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      system.notes || "",
      { async: true, relativeTo: actor }
    );

    return {
      ...context,
      actor,
      system,
      activeTab: this.#activeTab,
      activeSkillSubtab: this.#activeSkillSubtab,
      speciesOptions: Object.keys(PLAYABLE_SPECIES_PRESETS),
      activeSpeciesItem: speciesItems[0] || null,
      speciesSummary: system.speciesSummary || PLAYABLE_SPECIES_PRESETS[system.personal?.spezies] || null,
      psiSummary: system.psiSummary || { t1Forces: 0, t2Forces: 0, t3Forces: 0, forceHierarchyValid: true },
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
        const maxLvl = Number(existingStyle.system.maxLevel) || 1;
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

      const forceKey = (item.system.psiForce || "").toLowerCase().replace(/^psi_/, "");
      const appTier = Number(item.system.tier || item.system.level || 1);
      const hasForce = this.document.items.some((i) => {
        if (i.type === "psiForce") return (i.system.forceId || "").toLowerCase().replace(/^psi_/, "") === forceKey;
        if (i.type === "skill" && i.system.category === "psi") {
          return (i.system.skillId || "").toLowerCase().replace(/^psi_/, "") === forceKey;
        }
        return false;
      });
      if (!hasForce && forceKey !== "kategorie_b") {
        ui.notifications?.warn(
          `PSI-Pyramide: Die zugehörige PSI-Kraft „${
            item.system.psiForceLabel || item.system.psiForce
          }“ muss zuerst erlernt werden!`
        );
        return false;
      }
      if (appTier >= 2) {
        const sameForceApps = this.document.items.filter(
          (i) =>
            i.type === "psiApp" &&
            (i.system.psiForce || "").toLowerCase().replace(/^psi_/, "") === forceKey
        );
        const t1Count = sameForceApps.filter((a) => (Number(a.system.tier || a.system.level) || 1) === 1).length;
        const t2Count = sameForceApps.filter((a) => (Number(a.system.tier || a.system.level) || 1) === 2).length;
        const t3Count = sameForceApps.filter((a) => (Number(a.system.tier || a.system.level) || 1) === 3).length;
        if (appTier === 2 && t2Count + 1 > t1Count) {
          ui.notifications?.warn(
            `PSI-Pyramide (${item.system.psiForceLabel}): Für ${
              t2Count + 1
            } App(s) der Stufe 2 müssen mindestens ${t2Count + 1} App(s) der Stufe 1 gelernt sein!`
          );
          return false;
        }
        if (appTier === 3 && (t3Count + 1 > t2Count || t3Count + 1 > t1Count)) {
          ui.notifications?.warn(
            `PSI-Pyramide (${item.system.psiForceLabel}): Für ${
              t3Count + 1
            } App(s) der Stufe 3 müssen mindestens je ${
              t3Count + 1
            } App(s) der Stufen 1 und 2 gelernt sein!`
          );
          return false;
        }
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
    const senseKey = target.dataset.sense;
    const actor = this.document;
    let val = 2;
    let label = "";

    if (senseKey === "allOver") {
      val = Number(actor.system.wahrnehmung?.allOverWahrnehmung ?? 2);
      label = game.i18n.localize("NORETURN.Robot.AllOverWahrnehmung");
    } else if (senseKey === "tastsinn") {
      val = Number(actor.system.wahrnehmung?.tastsinnAllOver ?? 2);
      label = game.i18n.localize("NORETURN.Robot.Senses.tastsinn");
    } else {
      val = Number(actor.system.wahrnehmung?.[senseKey]?.total ?? 2);
      label = game.i18n.localize(`NORETURN.Robot.Senses.${senseKey}`);
    }

    await NoReturnRoll.promptAndRoll({
      actor,
      title: label,
      attributeDice: val,
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
    const prim = this.document.system.attributes.primary?.[attrKey];
    const sec = this.document.system.attributes.secondary?.[attrKey];
    const attrDice = prim ? prim.overall : sec ? sec.total : 0;
    const skillDice = Number(skill.system.level) || 0;
    const bonusDice = Number(skill.system.effectiveMod ?? skill.system.mod) || 0;

    await NoReturnRoll.promptAndRoll({
      actor: this.document,
      title: skill.name,
      flavorSubtitle: attrKey ? game.i18n.localize(`NORETURN.Attributes.${attrKey}`) : "Styleskill / Spezial",
      attributeDice: attrDice,
      skillDice,
      bonusDice,
      allAttributeHazard: Boolean(prim?.alphaBio),
      allSkillHazard: Boolean(skill.system.betaBio),
      skipDialog: event.shiftKey
    });
  }

  static async #onRollPsiForce(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const force = this.document.items.get(itemId);
    if (!force) return;

    const skillDice = Number(force.system.level) || 1;
    const bonusDice = Number(force.system.mod) || 0;

    await NoReturnRoll.promptAndRoll({
      actor: this.document,
      title: force.name,
      flavorSubtitle: `PSI-Kraft (Hierarchiestufe ${force.system.hierarchyTier || 1})`,
      attributeDice: 0,
      skillDice,
      bonusDice,
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
    const tableKey = target.dataset.table || "1";
    await NoReturnRoll.rollPsiMishapTable(tableKey, this.document, { postSeparateMessage: true });
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

  static async #onToggleInstalled(event, target) {
    event.preventDefault();
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (item && "installed" in item.system) {
      await item.update({ "system.installed": !item.system.installed });
    }
  }
}
