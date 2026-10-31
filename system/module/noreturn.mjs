/**
 * NoReturn RPG System for Foundry VTT v14.
 * Entry point registering DataModels, ApplicationV2 Sheets, Roll Engine, and Chat Hooks.
 */
import { NoReturnCharacterData } from "./data/character-data.mjs";
import { NoReturnRobotData } from "./data/robot-data.mjs";
import {
  NoReturnSkillData,
  NoReturnWeaponData,
  NoReturnArmorData,
  NoReturnGearData,
  NoReturnCyberwareData,
  NoReturnRobotModuleData
} from "./data/item-data.mjs";
import { NoReturnCharacterSheet } from "./sheets/character-sheet.mjs";
import { NoReturnRobotSheet } from "./sheets/robot-sheet.mjs";
import { NoReturnItemSheet } from "./sheets/item-sheet.mjs";
import { NoReturnRoll } from "./dice/roll.mjs";

Hooks.once("init", () => {
  console.log("NoReturn | Initializing NoReturn RPG System (Foundry VTT v14)");

  // Expose API on game.noreturn
  game.noreturn = {
    NoReturnRoll,
    NoReturnCharacterData,
    NoReturnRobotData
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
    weapon: NoReturnWeaponData,
    armor: NoReturnArmorData,
    gear: NoReturnGearData,
    cyberware: NoReturnCyberwareData,
    robotModule: NoReturnRobotModuleData
  };

  // Configure Combat Initiative (Mexican Standoff = Schnelligkeit + Reaktion in W6)
  CONFIG.Combat.initiative = {
    formula: "(@attributes.primary.schnelligkeit.overall)d6 + 1d6x6",
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
    types: ["skill", "weapon", "armor", "gear", "cyberware", "robotModule"],
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
