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
      height: 520
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

    return {
      ...context,
      item,
      system,
      itemType: item.type,
      enrichedDescription
    };
  }
}
