/**
 * NoReturn RPG System for Foundry VTT v14.
 * Entry point registering DataModels, ApplicationV2 Sheets, Roll Engine, Combat Initiative, and Chat Hooks.
 */
import { NoReturnCharacterData, PLAYABLE_SPECIES_PRESETS } from "./data/character-data.mjs";
import { NoReturnRobotData } from "./data/robot-data.mjs";
import {
  NoReturnSkillData,
  NoReturnStyleSkillData,
  NoReturnPsiForceData,
  NoReturnPsiAppData,
  NoReturnWeaponData,
  NoReturnArmorData,
  NoReturnGearData,
  NoReturnConsumableData,
  NoReturnCyberwareData,
  NoReturnRobotModuleData,
  NoReturnSpeciesData,
  NoReturnMutationData,
  NoReturnTraitData,
  NoReturnConditionData
} from "./data/item-data.mjs";
import { NoReturnCharacterSheet } from "./sheets/character-sheet.mjs";
import { NoReturnRobotSheet } from "./sheets/robot-sheet.mjs";
import { NoReturnItemSheet } from "./sheets/item-sheet.mjs";
import { NoReturnRoll } from "./dice/roll.mjs";

Hooks.once("init", () => {
  console.log("NoReturn | Initializing NoReturn RPG System v1.1.0 (Foundry VTT v14)");

  // Custom Combat Document Class: binds Reaktion + Schnelligkeit into Tracker Initiative rolls
  // and opens the Initiative Configuration Dialog (Mexican Standoff checkbox default false + modifier)
  if (typeof Combat !== "undefined") {
    class NoReturnCombat extends Combat {
      async rollInitiative(ids, options = {}) {
        const combatantIds = typeof ids === "string" ? [ids] : Array.from(ids);
        for (const cId of combatantIds) {
          const combatant = this.combatants.get(cId);
          if (!combatant) continue;
          await NoReturnRoll.rollInitiative(combatant.actor, {
            combatant,
            skipDialog: Boolean(options?.skipDialog)
          });
        }
        return this;
      }
    }
    CONFIG.Combat.documentClass = NoReturnCombat;
  }

  // Expose API on game.noreturn
  game.noreturn = {
    NoReturnRoll,
    NoReturnCharacterData,
    NoReturnRobotData,
    PLAYABLE_SPECIES_PRESETS
  };

  // Register Actor TypeDataModels
  CONFIG.Actor.dataModels = {
    character: NoReturnCharacterData,
    npc: NoReturnCharacterData,
    creature: NoReturnCharacterData,
    robot: NoReturnRobotData
  };

  // Register Item TypeDataModels
  CONFIG.Item.dataModels = {
    skill: NoReturnSkillData,
    styleskill: NoReturnStyleSkillData,
    psiForce: NoReturnPsiForceData,
    psiApp: NoReturnPsiAppData,
    weapon: NoReturnWeaponData,
    armor: NoReturnArmorData,
    gear: NoReturnGearData,
    consumable: NoReturnConsumableData,
    cyberware: NoReturnCyberwareData,
    robotModule: NoReturnRobotModuleData,
    species: NoReturnSpeciesData,
    mutation: NoReturnMutationData,
    trait: NoReturnTraitData,
    condition: NoReturnConditionData,
    disease: NoReturnConditionData,
    toxin: NoReturnConditionData
  };

  // Configure Combat Initiative (Schnelligkeit + Reaktion in W6, pure sum without thresholds)
  CONFIG.Combat.initiative = {
    formula: "(@attributes.primary.schnelligkeit.overall)d6x6",
    decimals: 0
  };

  // Register ApplicationV2 Sheets
  const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;

  DocumentSheetConfig.registerSheet(Actor, "noreturn", NoReturnCharacterSheet, {
    types: ["character", "npc", "creature"],
    makeDefault: true,
    label: "NORETURN.Sheet.CharacterTitle"
  });

  DocumentSheetConfig.registerSheet(Actor, "noreturn", NoReturnRobotSheet, {
    types: ["robot"],
    makeDefault: true,
    label: "NORETURN.Sheet.RobotTitle"
  });

  DocumentSheetConfig.registerSheet(Item, "noreturn", NoReturnItemSheet, {
    types: [
      "skill",
      "styleskill",
      "psiForce",
      "psiApp",
      "weapon",
      "armor",
      "gear",
      "consumable",
      "cyberware",
      "robotModule",
      "species",
      "mutation",
      "trait",
      "condition",
      "disease",
      "toxin"
    ],
    makeDefault: true,
    label: "NORETURN.Sheet.ItemTitle"
  });
});

// Wire interactive buttons in Chat Cards (Foundry VTT v14 renderChatMessageHTML)
Hooks.on("renderChatMessageHTML", (message, html) => {
  html.querySelectorAll("[data-action='roll-hitzone']").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      const actor = ChatMessage.getSpeakerActor(message.speaker);
      await NoReturnRoll.rollHitZone(actor);
    });
  });
});
