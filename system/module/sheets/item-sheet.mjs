import { AMMO_TYPE_DEFINITIONS, isAmmoCompatibleWithWeapon } from "../data/item-data.mjs";

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
    const ammoSelect = root.querySelector(".nr-item-weapon-ammo-select");
    if (ammoSelect) {
      ammoSelect.addEventListener("change", async (ev) => {
        ev.stopPropagation();
        const val = ammoSelect.value || "TYPE:FMJ";
        if (val.startsWith("TYPE:")) {
          const code = val.replace("TYPE:", "");
          const def = AMMO_TYPE_DEFINITIONS[code] || AMMO_TYPE_DEFINITIONS.FMJ;
          await this.document.update({
            "system.loadedAmmoId": "",
            "system.loadedAmmoType": def.code,
            "system.loadedAmmoName": def.label
          });
        } else if (this.document.actor) {
          const ammoItem = this.document.actor.items.get(val);
          if (ammoItem) {
            const code = (ammoItem.system?.ammoType || "FMJ").toUpperCase();
            await this.document.update({
              "system.loadedAmmoId": ammoItem.id,
              "system.loadedAmmoType": code,
              "system.loadedAmmoName": ammoItem.name
            });
          }
        }
      });
    }
  }
}
