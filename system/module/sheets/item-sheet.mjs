import { AMMO_TYPE_DEFINITIONS, isAmmoCompatibleWithWeapon } from "../data/item-data.mjs";
import { NoReturnRoll } from "../dice/roll.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * ApplicationV2 Item Sheet for NoReturn Items (Skills, Weapons, Armor, Gear, Cyberware, RobotModules).
 */
export class NoReturnItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["noreturn", "sheet", "item", "item-sheet"],
    tag: "form",
    position: {
      width: 560,
      height: 540
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
    const enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      system.description || "",
      { async: true, relativeTo: item }
    );

    let compatibleAmmoItems = [];
    if (item.type === "weapon" && item.actor?.items) {
      compatibleAmmoItems = item.actor.items.filter(
        (g) => g.type === "gear" && isAmmoCompatibleWithWeapon(g, system.caliber)
      );
    }

    return {
      ...context,
      item,
      system,
      itemType: item.type,
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
