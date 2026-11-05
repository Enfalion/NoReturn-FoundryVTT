/**
 * NoReturn RPG System for Foundry VTT v14.
 * Entry point registering DataModels, ApplicationV2 Sheets, Roll Engine, Combat Initiative,
 * System Settings (PSI Hierarchy Overrides), Compendium Folder Initialization, and Chat Hooks.
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
  NoReturnConditionData,
  PSI_FORCE_HIERARCHY,
  resolvePsiHierarchyTier
} from "./data/item-data.mjs";
import { NoReturnCharacterSheet } from "./sheets/character-sheet.mjs";
import { NoReturnRobotSheet } from "./sheets/robot-sheet.mjs";
import { NoReturnItemSheet } from "./sheets/item-sheet.mjs";
import { NoReturnRoll } from "./dice/roll.mjs";

/**
 * Compendium Folder Definitions (Punkt 5)
 */
export const COMPENDIUM_FOLDER_STRUCTURE = {
  "noreturn.items": {
    type: "Item",
    folders: [
      { _id: "NRfldItemsNahkmp", name: "Nahkampfwaffen", sort: 100, color: "#4a2c2a" },
      { _id: "NRfldItemsFernkm", name: "Fernkampfwaffen", sort: 200, color: "#2b3e50" },
      { _id: "NRfldItemsRuestu", name: "Rüstungen & Schutzkleidung", sort: 300, color: "#3b4d3b" },
      { _id: "NRfldItemsDrogen", name: "Drogen & Pharmazeutika", sort: 400, color: "#4a3556" },
      { _id: "NRfldItemsAusrue", name: "Ausrüstung & Werkzeuge", sort: 500, color: "#524632" },
      { _id: "NRfldItemsCyberw", name: "Cyberware & Implantate", sort: 600, color: "#23494d" }
    ]
  },
  "noreturn.skills": {
    type: "Item",
    folders: [
      { _id: "NRfldSkilStandar", name: "Standardfertigkeiten", sort: 100, color: "#2b3e50" },
      { _id: "NRfldSkilStylesk", name: "Styleskills", sort: 200, color: "#3b4d3b" },
      { _id: "NRfldSkilMerkmal", name: "Charaktermerkmale (Vor- & Nachteile)", sort: 300, color: "#524632" },
      { _id: "NRfldSkilKrankTo", name: "Krankheiten & Toxine", sort: 400, color: "#5a2323" }
    ]
  },
  "noreturn.psi": {
    type: "Item",
    folders: [
      // Hierarchiestufe 1
      { _id: "NRfldPsiCryokine", name: "Cryokinese", sort: 100, color: "#1f4e5f" },
      { _id: "NRfldPsiElektrok", name: "Elektrokinese", sort: 200, color: "#1f4e5f" },
      { _id: "NRfldPsiPyrokine", name: "Pyrokinese", sort: 300, color: "#1f4e5f" },
      { _id: "NRfldPsiTelekine", name: "Telekinese", sort: 400, color: "#1f4e5f" },
      // Hierarchiestufe 2
      { _id: "NRfldPsiAnimakin", name: "Animakinese", sort: 500, color: "#2e5a44" },
      { _id: "NRfldPsiMomenkin", name: "Momenkinese", sort: 600, color: "#2e5a44" },
      { _id: "NRfldPsiPhotokin", name: "Photokinese", sort: 700, color: "#2e5a44" },
      { _id: "NRfldPsiPsychoki", name: "Psychokinese", sort: 800, color: "#2e5a44" },
      // Hierarchiestufe 3
      { _id: "NRfldPsiBiokines", name: "Biokinese", sort: 900, color: "#5a3d28" },
      { _id: "NRfldPsiCronokin", name: "Cronokinese", sort: 1000, color: "#5a3d28" },
      { _id: "NRfldPsiMorphoki", name: "Morphokinese", sort: 1100, color: "#5a3d28" },
      { _id: "NRfldPsiTechnoki", name: "Technokinese", sort: 1200, color: "#5a3d28" },
      // Kategorie B
      { _id: "NRfldPsiKatB0000", name: "Kategorie B", sort: 1300, color: "#5a2323" }
    ]
  },
  "noreturn.robotics": {
    type: "Item",
    folders: [
      { _id: "NRfldRobChassis0", name: "Chassis & Rahmen", sort: 100, color: "#3d4852" },
      { _id: "NRfldRobErweiter", name: "Erweiterungsmodule", sort: 200, color: "#23494d" },
      { _id: "NRfldRobSensoren", name: "Sensoren & Prozessoren", sort: 300, color: "#2b3e50" }
    ]
  },
  "noreturn.species": {
    type: "Item",
    folders: [
      { _id: "NRfldSpecSpielba", name: "Spielbare Spezies", sort: 100, color: "#2b3e50" },
      { _id: "NRfldSpecSichtba", name: "Sichtbare Mutationen", sort: 200, color: "#4a2c2a" },
      { _id: "NRfldSpecVerborg", name: "Verborgene Mutationen", sort: 300, color: "#3b4d3b" },
      { _id: "NRfldSpecAbnormi", name: "Abnormitäten (Freaks)", sort: 400, color: "#4a3556" }
    ]
  },
  "noreturn.bestiary": {
    type: "Actor",
    folders: [
      { _id: "NRfldBestMutBest", name: "Mutierte Bestien", sort: 100, color: "#4a2c2a" },
      { _id: "NRfldBestRivalen", name: "Rivalen & Gesetzlose", sort: 200, color: "#524632" },
      { _id: "NRfldBestRoboter", name: "Roboter & Drohnen", sort: 300, color: "#23494d" }
    ]
  }
};

/**
 * Determine the target folder name for a Compendium document if not already linked.
 */
function resolveCompendiumFolderName(packCollection, doc) {
  const flaggedName = doc.flags?.noreturn?.folderName;
  if (flaggedName) {
    if (flaggedName === "PSI Kategorie B (HMO)") return "Kategorie B";
    if (flaggedName === "Chronokinese") return "Cronokinese";
    return flaggedName;
  }

  const sys = doc.system || {};
  if (packCollection === "noreturn.items") {
    if (doc.type === "weapon") {
      return sys.weaponCategory === "melee" ? "Nahkampfwaffen" : "Fernkampfwaffen";
    }
    if (doc.type === "armor") return "Rüstungen & Schutzkleidung";
    if (doc.type === "consumable") return "Drogen & Pharmazeutika";
    if (doc.type === "cyberware" || doc.type === "robotModule") return "Cyberware & Implantate";
    return "Ausrüstung & Werkzeuge";
  }

  if (packCollection === "noreturn.skills") {
    if (doc.type === "skill") return "Standardfertigkeiten";
    if (doc.type === "styleskill") return "Styleskills";
    if (doc.type === "trait") return "Charaktermerkmale (Vor- & Nachteile)";
    return "Krankheiten & Toxine";
  }

  if (packCollection === "noreturn.psi") {
    if (sys.psiCategory === "B" || String(sys.psiForce || "").includes("Kategorie B")) {
      return "Kategorie B";
    }
    const force = String(sys.psiForce || doc.name || "").replace(/^PSI-Kraft:\s*/i, "").trim();
    if (force === "Chronokinese") return "Cronokinese";
    return force || "Pyrokinese";
  }

  if (packCollection === "noreturn.robotics") {
    const nameL = String(doc.name || "").toLowerCase();
    const catL = String(sys.moduleCategory || "").toLowerCase();
    if (catL.includes("chassis") || nameL.includes("chassis") || nameL.includes("rahmen") || nameL.includes("modell")) {
      return "Chassis & Rahmen";
    }
    if (
      catL.includes("sensor") ||
      catL.includes("prozessor") ||
      nameL.includes("sensor") ||
      nameL.includes("cybersinn") ||
      nameL.includes("optik") ||
      nameL.includes("audio") ||
      nameL.includes("infrarot") ||
      nameL.includes("ultraschall") ||
      nameL.includes("prozessor")
    ) {
      return "Sensoren & Prozessoren";
    }
    return "Erweiterungsmodule";
  }

  if (packCollection === "noreturn.species") {
    if (doc.type === "species") return "Spielbare Spezies";
    if (sys.mutationType === "hidden") return "Verborgene Mutationen";
    if (sys.mutationType === "abnormality") return "Abnormitäten (Freaks)";
    return "Sichtbare Mutationen";
  }

  if (packCollection === "noreturn.bestiary") {
    if (doc.type === "robot") return "Roboter & Drohnen";
    if (doc.type === "creature") return "Mutierte Bestien";
    return "Rivalen & Gesetzlose";
  }

  return null;
}

/**
 * Ensures real Foundry Folder documents exist inside all NoReturn Compendium Packs
 * and links every item/actor document to its respective subfolder.
 */
async function ensureCompendiumFolders() {
  if (!game.user?.isGM) return;

  for (const [packCollection, cfg] of Object.entries(COMPENDIUM_FOLDER_STRUCTURE)) {
    const pack = game.packs?.get(packCollection);
    if (!pack) continue;

    try {
      const existingFolders = pack.folders ? Array.from(pack.folders) : [];
      const foldersByName = new Map(existingFolders.map((f) => [f.name, f]));
      const foldersById = new Map(existingFolders.map((f) => [f.id, f]));

      const foldersToCreate = [];
      for (const fDef of cfg.folders) {
        if (!foldersById.has(fDef._id) && !foldersByName.has(fDef.name)) {
          foldersToCreate.push({
            _id: fDef._id,
            name: fDef.name,
            type: cfg.type,
            sorting: "a",
            sort: fDef.sort,
            color: fDef.color || "#2b3e50",
            folder: null
          });
        }
      }

      const docs = await pack.getDocuments();
      const needFolderCreation = foldersToCreate.length > 0;

      // Check if any documents need folder assignment
      let needDocUpdates = false;
      for (const doc of docs) {
        const currentFolderId = typeof doc.folder === "string" ? doc.folder : doc.folder?.id;
        if (!currentFolderId || !foldersById.has(currentFolderId)) {
          needDocUpdates = true;
          break;
        }
      }

      if (!needFolderCreation && !needDocUpdates) continue;

      const wasLocked = pack.locked;
      if (wasLocked) {
        await pack.configure({ locked: false });
      }

      try {
        if (foldersToCreate.length > 0) {
          await Folder.createDocuments(foldersToCreate, {
            pack: pack.collection,
            keepId: true
          });
        }

        // Refresh folder lookup after creation
        const updatedFolders = pack.folders ? Array.from(pack.folders) : [];
        const finalByName = new Map(updatedFolders.map((f) => [f.name, f]));
        const finalById = new Map(updatedFolders.map((f) => [f.id, f]));

        const docUpdates = [];
        for (const doc of docs) {
          const currentFolderId = typeof doc.folder === "string" ? doc.folder : doc.folder?.id;
          const targetName = resolveCompendiumFolderName(packCollection, doc);
          const targetFolder =
            (targetName && finalByName.get(targetName)) ||
            (doc.flags?.noreturn?.folderId && finalById.get(doc.flags.noreturn.folderId));

          if (targetFolder && currentFolderId !== targetFolder.id) {
            docUpdates.push({
              _id: doc.id,
              folder: targetFolder.id
            });
          }
        }

        if (docUpdates.length > 0) {
          await pack.documentClass.updateDocuments(docUpdates, {
            pack: pack.collection
          });
        }
      } finally {
        if (wasLocked) {
          await pack.configure({ locked: true });
        }
      }
    } catch (err) {
      console.warn(`NoReturn | Could not initialize folders for compendium ${packCollection}:`, err);
    }
  }
}

Hooks.once("init", () => {
  console.log("NoReturn | Initializing NoReturn RPG System v1.1.3 (Foundry VTT v14)");

  // Register System Settings: GM Override for PSI Force Hierarchy Tiers (Punkt 4.3)
  game.settings.register("noreturn", "psiHierarchyOverrides", {
    name: "NORETURN.Settings.PsiHierarchyOverridesName",
    hint: "NORETURN.Settings.PsiHierarchyOverridesHint",
    scope: "world",
    config: true,
    type: String,
    default: "",
    onChange: () => {
      for (const actor of game.actors ?? []) {
        actor.prepareData();
        if (actor.sheet?.rendered) actor.sheet.render();
      }
    }
  });

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
    PLAYABLE_SPECIES_PRESETS,
    PSI_FORCE_HIERARCHY,
    resolvePsiHierarchyTier,
    ensureCompendiumFolders
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

// Ensure Compendium Folders exist when the World is ready
Hooks.once("ready", async () => {
  await ensureCompendiumFolders();
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

  html.querySelectorAll("[data-action='roll-target-defense']").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      await NoReturnRoll.rollTargetDefense(message);
    });
  });

  html.querySelectorAll("[data-action='roll-direct-damage']").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      const attackFlow = message?.flags?.noreturn?.attackFlow;
      if (!attackFlow) return;
      const mw = Number(attackFlow.effectiveTargetMw) || 10;
      const attackTotal = Number(attackFlow.attackTotal) || 0;
      if (attackTotal < mw) {
        ui.notifications?.info(
          `Angriff (${attackTotal}) verfehlt den Ziel-MW (${mw})!`
        );
        return;
      }
      const margin = attackTotal - mw;
      const step = Number(attackFlow.goodHitStep) || 10;
      const goodHits = margin >= step ? Math.floor(margin / step) : 0;
      await NoReturnRoll.resolveHitAndDamage(attackFlow, {
        margin,
        goodHits,
        defenseTotal: mw
      });
    });
  });

  html.querySelectorAll("[data-action='roll-target-soak']").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      const hitIndex = Number(btn.dataset.hitIndex) || 0;
      await NoReturnRoll.rollTargetSoak(message, hitIndex);
    });
  });

  html.querySelectorAll("[data-action='apply-zone-damage']").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      await NoReturnRoll.applyZoneDamage(message);
    });
  });
});
