import {
  AMMO_TYPE_DEFINITIONS,
  HIT_ZONE_SHORT_LABELS,
  formatArmorZonesLabel,
  isAmmoCompatibleWithWeapon,
  stripHtmlTags
} from "../data/item-data.mjs";
import { NoReturnRoll } from "../dice/roll.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

const ARMOR_ZONE_ORDER = [12, 8, 7, 6, 2, 9, 5, 10, 4, 11, 3];

/**
 * ApplicationV2 Item Sheet for NoReturn Items (Skills, Weapons, Armor, Gear, Cyberware, RobotModules).
 */
export class NoReturnItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noreturn", "sheet", "item", "item-sheet"],
    tag: "form",
    position: {
      width: 580,
      height: 580
    },
    window: {
      resizable: true
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions: {
      editImage: NoReturnItemSheet.#onEditImage
    }
  };

  static PARTS = {
    sheet: {
      template: "systems/noreturn/templates/item/item-sheet.hbs",
      scrollable: [".sheet-body"]
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    const system = item.system;
    const descriptionText = stripHtmlTags(system.description || "");
    const enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      system.description || "",
      { async: true, relativeTo: item }
    );

    let compatibleAmmoItems = [];
    let weaponModeGroup = "ranged";
    if (item.type === "weapon") {
      if (item.actor?.items) {
        compatibleAmmoItems = item.actor.items.filter(
          (g) => (g.type === "ammo" || g.type === "gear") && isAmmoCompatibleWithWeapon(g, system.caliber)
        );
      }
      if (!system.isRanged) {
        const cat = String(system.category || "").toLowerCase();
        if (cat.includes("natural") || cat.includes("natürlich") || cat.includes("biowaffe")) {
          weaponModeGroup = "natural";
        } else if (cat.includes("distanz") || cat === "dw" || system.skill === "waffenkampf") {
          weaponModeGroup = "distanzwaffe";
        } else {
          weaponModeGroup = "kurzdistanz";
        }
      }
    }

    let armorZoneOptions = [];
    if (item.type === "armor") {
      const covered = Array.isArray(system.coveredZones) ? system.coveredZones : [];
      armorZoneOptions = ARMOR_ZONE_ORDER.map((z) => ({
        num: z,
        code: String(z),
        label: HIT_ZONE_SHORT_LABELS[String(z)] || `Zone ${z}`,
        checked: covered.includes(z)
      }));
    }

    return {
      ...context,
      item,
      system,
      itemType: item.type,
      descriptionText,
      weaponModeGroup,
      armorZoneOptions,
      ammoTypes: Object.values(AMMO_TYPE_DEFINITIONS),
      compatibleAmmoItems,
      enrichedDescription
    };
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const root = this.element;
    if (!root) return;

    const profileImg = root.querySelector(".profile-img[data-edit]");
    if (profileImg && !profileImg.dataset.action) {
      profileImg.addEventListener("click", (ev) => {
        NoReturnItemSheet.#onEditImage.call(this, ev, profileImg);
      });
    }

    // Armor Zone Checkboxes (Punkt 2: Zonen 2 bis 12 direkt anklickbar)
    const zoneCheckboxes = root.querySelectorAll(".nr-armor-zone-checkbox");
    if (zoneCheckboxes.length > 0) {
      zoneCheckboxes.forEach((cb) => {
        cb.addEventListener("change", async (ev) => {
          ev.stopPropagation();
          const selected = [];
          root.querySelectorAll(".nr-armor-zone-checkbox:checked").forEach((el) => {
            const zNum = Number(el.value);
            if (Number.isInteger(zNum) && zNum >= 2 && zNum <= 12) {
              selected.push(zNum);
            }
          });
          selected.sort((a, b) => a - b);
          const isSelectable = Boolean(this.document.system?.isSelectableZone);
          const newLabel = formatArmorZonesLabel(selected, isSelectable);
          await this.document.update({
            "system.coveredZones": selected,
            "system.zones": selected,
            "system.zonesLabel": newLabel
          });
        });
      });
    }

    // Weapon Category / Mode Switcher (Punkt 3: Fernkampfwaffe / KW / DW / Natürliche Waffe)
    const weaponModeSelect = root.querySelector(".nr-weapon-mode-select");
    if (weaponModeSelect) {
      weaponModeSelect.addEventListener("change", async (ev) => {
        ev.stopPropagation();
        const mode = String(weaponModeSelect.value || "ranged");
        const flat = Number(this.document.system?.damageFlat) || 15;
        if (mode === "ranged") {
          await this.document.update({
            "system.weaponType": "ranged",
            "system.category": "faustfeuerwaffe",
            "system.skill": "schiessen",
            "system.useStrengthDamage": false,
            "system.parryAllowed": false,
            "system.range": this.document.system?.range === "Nahkampf" ? "Pistole" : this.document.system?.range || "Pistole"
          });
        } else if (mode === "kurzdistanz") {
          await this.document.update({
            "system.weaponType": "melee",
            "system.category": "kurzdistanz",
            "system.skill": "nahkampf",
            "system.useStrengthDamage": true,
            "system.parryAllowed": false,
            "system.caliber": "–",
            "system.magazine": "–",
            "system.magazineCapacity": 0,
            "system.ammoCurrent": 0,
            "system.recoilDampening": 0,
            "system.fireModes": "Nahkampf",
            "system.range": "Kurzdistanzwaffe (KW)",
            "system.damageFormula": `ST+${flat}p.`
          });
        } else if (mode === "distanzwaffe") {
          await this.document.update({
            "system.weaponType": "melee",
            "system.category": "distanzwaffe",
            "system.skill": "waffenkampf",
            "system.useStrengthDamage": true,
            "system.parryAllowed": true,
            "system.caliber": "–",
            "system.magazine": "–",
            "system.magazineCapacity": 0,
            "system.ammoCurrent": 0,
            "system.recoilDampening": 0,
            "system.fireModes": "Nahkampf",
            "system.range": "Distanzwaffe (DW)",
            "system.damageFormula": `ST+${flat}p.`
          });
        } else if (mode === "natural") {
          await this.document.update({
            "system.weaponType": "melee",
            "system.category": "natural",
            "system.skill": "nahkampf",
            "system.useStrengthDamage": true,
            "system.parryAllowed": false,
            "system.caliber": "–",
            "system.magazine": "–",
            "system.magazineCapacity": 0,
            "system.ammoCurrent": 0,
            "system.recoilDampening": 0,
            "system.fireModes": "Nahkampf",
            "system.range": "Natürliche Waffe",
            "system.damageFormula": `ST+${flat}p.`
          });
        }
      });
    }

    const ammoSelect = root.querySelector(".nr-item-weapon-ammo-select");
    if (ammoSelect) {
      ammoSelect.addEventListener("change", async (ev) => {
        ev.stopPropagation();
        const val = String(ammoSelect.value || "").trim();
        if (!val || val === "unload") {
          if (this.document.actor) {
            await NoReturnRoll.unloadWeaponAmmo(this.document.actor, this.document);
          } else {
            await this.document.update({
              "system.ammoCurrent": 0,
              "system.loadedAmmoId": "",
              "system.loadedAmmoType": "",
              "system.loadedAmmoName": "",
              "system.loadedAmmoDamageMod": 0
            });
          }
          return;
        }
        if (val.toLowerCase().startsWith("type:")) {
          const code = val.slice(5).toUpperCase();
          const def = AMMO_TYPE_DEFINITIONS[code] || AMMO_TYPE_DEFINITIONS.FMJ;
          await this.document.update({
            "system.loadedAmmoId": "",
            "system.loadedAmmoType": def.code,
            "system.loadedAmmoName": def.label,
            "system.loadedAmmoDamageMod": def.damageBonus
          });
        } else if (this.document.actor) {
          const itemId = val.toLowerCase().startsWith("item:") ? val.slice(5) : val;
          await NoReturnRoll.loadWeaponAmmo(this.document.actor, this.document, {
            ammoItemId: itemId,
            skipDialog: true
          });
        }
      });
    }
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
}
