/**
 * NoReturn Dice & Roll Engine for Foundry VTT v14.
 * Implements W6 pools + exploding Hazard-Di (1d6x6), Target Numbers (MW),
 * Fumbles (< 5), Degrees of Success (Überschuss / Gute Treffer), Hit Zone (2d6),
 * and Damage Resistance (Konstitution W6 + RW).
 */
export const DIFFICULTY_PRESETS = [
  { key: "Routine", mw: 5, labelKey: "NORETURN.Dice.Difficulty.Routine" },
  { key: "Normal", mw: 10, labelKey: "NORETURN.Dice.Difficulty.Normal" },
  { key: "Anspruchsvoll", mw: 15, labelKey: "NORETURN.Dice.Difficulty.Anspruchsvoll" },
  { key: "Schwer", mw: 20, labelKey: "NORETURN.Dice.Difficulty.Schwer" },
  { key: "SehrSchwer", mw: 25, labelKey: "NORETURN.Dice.Difficulty.SehrSchwer" },
  { key: "Episch", mw: 30, labelKey: "NORETURN.Dice.Difficulty.Episch" },
  { key: "Legendaer", mw: 40, labelKey: "NORETURN.Dice.Difficulty.Legendaer" }
];

export class NoReturnRoll {
  /**
   * Open an interactive roll dialog (unless skipDialog is true) and execute a NoReturn W6 check.
   */
  static async promptAndRoll({
    actor = null,
    title = "NoReturn Probe",
    attributeDice = 1,
    skillDice = 0,
    bonusDice = 0,
    woundPenalty = null,
    targetNumber = 10,
    useHazardDie = true,
    allAttributeHazard = false,
    allSkillHazard = false,
    burstMode = false,
    skipDialog = false,
    flavorSubtitle = ""
  } = {}) {
    const defaultWoundPenalty =
      woundPenalty !== null ? Number(woundPenalty) : Number(actor?.system?.health?.gesamteMali || 0);

    let config = {
      attributeDice: Math.max(0, Number(attributeDice) || 0),
      skillDice: Math.max(0, Number(skillDice) || 0),
      bonusDice: Number(bonusDice) || 0,
      adrenalinDice: 0,
      combatDisadvantages: 0,
      woundPenalty: Math.max(0, defaultWoundPenalty),
      targetNumber: Number(targetNumber) || 10,
      useHazardDie: Boolean(useHazardDie),
      allAttributeHazard: Boolean(allAttributeHazard),
      allSkillHazard: Boolean(allSkillHazard),
      burstMode: Boolean(burstMode)
    };

    if (!skipDialog && foundry?.applications?.api?.DialogV2) {
      const dialogResult = await this._showRollDialog(title, config, actor);
      if (!dialogResult) return null;
      config = { ...config, ...dialogResult };
    }

    // Deduct spent Adrenaline from actor if used
    if (config.adrenalinDice > 0 && actor) {
      const currentPool =
        actor.system?.attributes?.special?.adrenalin?.pool ??
        actor.system?.secondary?.adrenalin?.pool ??
        0;
      const newPool = Math.max(0, currentPool - config.adrenalinDice);
      if (actor.type === "robot") {
        await actor.update({ "system.secondary.adrenalin.pool": newPool });
      } else {
        await actor.update({ "system.attributes.special.adrenalin.pool": newPool });
      }
    }

    return this.executeCheck({
      actor,
      title,
      flavorSubtitle,
      ...config
    });
  }

  /**
   * Render ApplicationV2 DialogV2 for configuring a NoReturn check.
   */
  static async _showRollDialog(title, defaults, actor) {
    const i18n = (key) => game?.i18n?.localize(key) ?? key;
    const maxAdrenalin = Math.min(
      5,
      Number(
        actor?.system?.attributes?.special?.adrenalin?.pool ??
          actor?.system?.secondary?.adrenalin?.pool ??
          5
      )
    );

    const presetOptions = DIFFICULTY_PRESETS.map(
      (p) =>
        `<option value="${p.mw}" ${p.mw === defaults.targetNumber ? "selected" : ""}>${i18n(
          p.labelKey
        )}</option>`
    ).join("");

    const content = `
      <div class="noreturn-roll-dialog">
        <div class="form-group">
          <label>${i18n("NORETURN.Dice.Pool")}</label>
          <input type="number" name="basePoolDisplay" value="${
            defaults.attributeDice + defaults.skillDice
          }" disabled />
        </div>
        <div class="form-group">
          <label>${i18n("NORETURN.Dice.BonusDice")}</label>
          <input type="number" name="bonusDice" value="${defaults.bonusDice}" step="1" />
        </div>
        <div class="form-group">
          <label>${i18n("NORETURN.Dice.AdrenalinDice")} (Max: ${maxAdrenalin})</label>
          <input type="number" name="adrenalinDice" value="0" min="0" max="${maxAdrenalin}" step="1" />
        </div>
        <div class="form-group">
          <label>${i18n("NORETURN.Dice.CombatDisadvantages")}</label>
          <input type="number" name="combatDisadvantages" value="${
            defaults.combatDisadvantages
          }" min="0" step="1" />
        </div>
        <div class="form-group">
          <label>${i18n("NORETURN.Dice.WoundPenalty")}</label>
          <input type="number" name="woundPenalty" value="${defaults.woundPenalty}" min="0" step="1" />
        </div>
        <div class="form-group">
          <label>${i18n("NORETURN.Dice.TargetNumber")}</label>
          <div class="flexrow">
            <select name="presetMw" onchange="this.form.targetNumber.value = this.value">
              ${presetOptions}
            </select>
            <input type="number" name="targetNumber" value="${defaults.targetNumber}" min="1" step="1" />
          </div>
        </div>
        <hr/>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" name="useHazardDie" ${defaults.useHazardDie ? "checked" : ""} />
            ${i18n("NORETURN.Dice.UseHazardDie")}
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" name="allAttributeHazard" ${
              defaults.allAttributeHazard ? "checked" : ""
            } />
            ${i18n("NORETURN.Dice.AllAttributeHazard")}
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" name="allSkillHazard" ${defaults.allSkillHazard ? "checked" : ""} />
            ${i18n("NORETURN.Dice.AllSkillHazard")}
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" name="burstMode" ${defaults.burstMode ? "checked" : ""} />
            ${i18n("NORETURN.Dice.BurstMode")}
          </label>
        </div>
      </div>
    `;

    return foundry.applications.api.DialogV2.wait({
      window: { title: `${i18n("NORETURN.Dice.RollDialogTitle")}: ${title}` },
      content,
      buttons: [
        {
          action: "roll",
          label: i18n("NORETURN.Dice.RollButton"),
          icon: "fas fa-dice-d6",
          default: true,
          callback: (event, button) => {
            const form = button.form;
            return {
              bonusDice: Number(form.elements.bonusDice.value) || 0,
              adrenalinDice: Math.min(5, Math.max(0, Number(form.elements.adrenalinDice.value) || 0)),
              combatDisadvantages: Math.max(0, Number(form.elements.combatDisadvantages.value) || 0),
              woundPenalty: Math.max(0, Number(form.elements.woundPenalty.value) || 0),
              targetNumber: Math.max(1, Number(form.elements.targetNumber.value) || 10),
              useHazardDie: Boolean(form.elements.useHazardDie.checked),
              allAttributeHazard: Boolean(form.elements.allAttributeHazard.checked),
              allSkillHazard: Boolean(form.elements.allSkillHazard.checked),
              burstMode: Boolean(form.elements.burstMode.checked)
            };
          }
        },
        {
          action: "cancel",
          label: i18n("NORETURN.Dice.CancelButton"),
          icon: "fas fa-times",
          callback: () => null
        }
      ],
      rejectClose: false
    });
  }

  /**
   * Build the Foundry Roll formula, evaluate the roll, and render the NoReturn chat card.
   */
  static async executeCheck({
    actor = null,
    title = "NoReturn Probe",
    flavorSubtitle = "",
    attributeDice = 1,
    skillDice = 0,
    bonusDice = 0,
    adrenalinDice = 0,
    combatDisadvantages = 0,
    woundPenalty = 0,
    targetNumber = 10,
    useHazardDie = true,
    allAttributeHazard = false,
    allSkillHazard = false,
    burstMode = false
  } = {}) {
    const rawPool =
      attributeDice +
      skillDice +
      bonusDice +
      Math.min(5, adrenalinDice) -
      combatDisadvantages * 2 -
      woundPenalty;

    const totalPool = Math.max(1, rawPool);

    // Determine how many dice in the pool are exploding Hazard-Di (1d6x6)
    let hazardCount = 0;
    if (useHazardDie) {
      if (allAttributeHazard && allSkillHazard) {
        hazardCount = Math.min(totalPool, Math.max(1, attributeDice + skillDice));
      } else if (allAttributeHazard) {
        hazardCount = Math.min(totalPool, Math.max(1, attributeDice));
      } else if (allSkillHazard) {
        hazardCount = Math.min(totalPool, Math.max(1, skillDice + (attributeDice > 0 ? 1 : 0)));
      } else {
        hazardCount = 1;
      }
    }

    const normalCount = Math.max(0, totalPool - hazardCount);
    const formulaParts = [];
    if (normalCount > 0) formulaParts.push(`${normalCount}d6`);
    if (hazardCount > 0) formulaParts.push(`${hazardCount}d6x6`);
    const formula = formulaParts.join(" + ") || "1d6";

    const roll = new Roll(formula);
    await roll.evaluate();

    // Extract die results for display
    const normalResults = [];
    const hazardResults = [];
    let explosionCount = 0;

    roll.terms.forEach((term) => {
      if (term instanceof foundry.dice.terms.Die) {
        const isHazard = term.modifiers?.includes("x6");
        for (const r of term.results) {
          if (isHazard) {
            hazardResults.push({
              result: r.result,
              exploded: Boolean(r.exploded)
            });
            if (r.exploded) explosionCount++;
          } else {
            normalResults.push({
              result: r.result
            });
          }
        }
      }
    });

    const total = roll.total;
    const isFumble = total < 5;
    const isSuccess = !isFumble && total >= targetNumber;
    const margin = total - targetNumber;
    const stepDivisor = burstMode ? 5 : 10;
    const goodHits = isSuccess && margin >= stepDivisor ? Math.floor(margin / stepDivisor) : 0;

    const templateData = {
      title,
      flavorSubtitle,
      formula,
      totalPool,
      rawPool,
      normalCount,
      hazardCount,
      normalResults,
      hazardResults,
      explosionCount,
      total,
      targetNumber,
      margin,
      isSuccess,
      isFumble,
      goodHits,
      burstMode,
      adrenalinDice,
      combatDisadvantages,
      woundPenalty
    };

    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/noreturn/templates/chat/roll-card.hbs",
      templateData
    );

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: title,
      content,
      rolls: [roll]
    });

    return { roll, total, isSuccess, isFumble, margin, goodHits };
  }

  /**
   * Roll 2d6 to determine the NoReturn Hit Zone (Trefferzone 2-12).
   */
  static async rollHitZone(actor = null) {
    const roll = new Roll("2d6");
    await roll.evaluate();
    const zoneCode = String(roll.total);
    const lethalZones = new Set(["12", "8", "7", "6", "2"]);
    const isLethal = lethalZones.has(zoneCode);
    const zoneLabel = game?.i18n?.localize(`NORETURN.Health.Zones.${zoneCode}`) ?? `Zone ${zoneCode}`;
    const lethalTag = isLethal
      ? `<span class="noreturn-badge lethal">${game?.i18n?.localize("NORETURN.Health.Lethal") ?? "Tödlich"}</span>`
      : "";

    const content = `
      <div class="noreturn-chat-card hitzone-card">
        <header class="card-header">
          <h3><i class="fas fa-crosshairs"></i> ${
            game?.i18n?.localize("NORETURN.Health.RollHitZone") ?? "Trefferzone (2W6)"
          }</h3>
        </header>
        <div class="card-result">
          <div class="hitzone-number">${zoneCode}</div>
          <div class="hitzone-name">${zoneLabel} ${lethalTag}</div>
        </div>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content,
      rolls: [roll]
    });

    return { roll, zoneCode, zoneLabel, isLethal };
  }

  /**
   * Roll Weapon Damage (Melee ST W6 + flat, or Ranged flat + Good Hits).
   */
  static async rollWeaponDamage(actor, weapon, { goodHits = 0 } = {}) {
    const sys = weapon.system;
    const isMelee = sys.weaponType === "melee";
    const staerke = Number(actor?.system?.attributes?.primary?.staerke?.overall ?? 1);
    const flatDmg = Number(sys.damageFlat) || 0;

    let formula = "";
    if (isMelee) {
      const diceCount = Math.max(1, staerke + goodHits);
      formula = flatDmg > 0 ? `${diceCount}d6 + ${flatDmg}` : `${diceCount}d6`;
    } else if (String(sys.damageFormula).includes("d")) {
      formula = goodHits > 0 ? `${sys.damageFormula} + ${goodHits}d6` : String(sys.damageFormula);
    } else {
      formula = goodHits > 0 ? `${flatDmg} + ${goodHits}d6` : `${flatDmg}`;
    }

    const roll = new Roll(formula);
    await roll.evaluate();

    const content = `
      <div class="noreturn-chat-card damage-card">
        <header class="card-header">
          <h3><i class="fas fa-burst"></i> ${weapon.name} – ${
            game?.i18n?.localize("NORETURN.Combat.Damage") ?? "Schaden"
          }</h3>
        </header>
        <div class="card-meta">
          <span>${game?.i18n?.localize("NORETURN.Combat.Caliber") ?? "Kaliber"}: <strong>${
            sys.caliber || "–"
          }</strong></span>
          <span>Formel: <code>${formula}</code></span>
        </div>
        <div class="card-total damage-total">${roll.total} TP</div>
        <div class="card-actions">
          <button type="button" class="noreturn-chat-btn" data-action="roll-hitzone">
            <i class="fas fa-crosshairs"></i> ${
              game?.i18n?.localize("NORETURN.Health.RollHitZone") ?? "Trefferzone auswürfeln (2W6)"
            }
          </button>
        </div>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content,
      rolls: [roll]
    });

    return roll;
  }

  /**
   * Roll Damage Resistance (Schadenswiderstand = Konstitution W6 + Rüstungswert RW).
   */
  static async rollSoak(actor, zoneCode = "7") {
    const ko = Number(actor?.system?.attributes?.primary?.konstitution?.overall ?? 1);
    let rw = 0;
    let mk = "A";
    if (actor?.type === "robot") {
      rw = Number(actor.system?.zones?.[zoneCode]?.values?.panzerung ?? 0);
      mk = actor.system?.zones?.[zoneCode]?.values?.materialCategory ?? "B";
    } else {
      const z = actor?.system?.health?.zones?.[zoneCode];
      rw = Number(z?.equippedArmor ?? z?.armor ?? 0);
      mk = z?.materialCategory ?? "A";
    }

    const normalKo = Math.max(0, ko - 1);
    const dicePart = normalKo > 0 ? `${normalKo}d6 + 1d6x6` : `1d6x6`;
    const formula = rw > 0 ? `${dicePart} + ${rw}` : dicePart;

    const roll = new Roll(formula);
    await roll.evaluate();

    const zoneLabel = game?.i18n?.localize(`NORETURN.Health.Zones.${zoneCode}`) ?? `Zone ${zoneCode}`;
    const content = `
      <div class="noreturn-chat-card soak-card">
        <header class="card-header">
          <h3><i class="fas fa-shield-halved"></i> ${
            game?.i18n?.localize("NORETURN.Health.RollSoak") ?? "Schadenswiderstand"
          }</h3>
        </header>
        <div class="card-meta">
          <span>${zoneLabel}</span>
          <span>KO (${ko}W6) + RW (${rw}, MK:${mk})</span>
        </div>
        <div class="card-total soak-total">${roll.total} TP absorbiert</div>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content,
      rolls: [roll]
    });

    return roll;
  }

  /**
   * Roll Disease / Toxin Resistance Check (Infektionsresistenz / Widerstandsprobe vs. Intensität)
   * with automatic success/failure evaluation and symptom stage output in Chat.
   */
  static async rollConditionResistance(actor, conditionItem) {
    if (!conditionItem) return null;
    const sys = conditionItem.system || {};
    const intensity = Math.max(1, Number(sys.intensity) || 5);
    let rawFormula = String(sys.resistanceFormula || "@status.infektionsresistenz").trim();

    if (rawFormula === "@status.infektionsresistenz" || !rawFormula) {
      rawFormula = actor?.system?.status?.infektionsresistenz || "2d6";
    } else if (actor?.system?.attributes?.primary?.[rawFormula]) {
      const pool = Math.max(1, Number(actor.system.attributes.primary[rawFormula].overall) || 1);
      rawFormula = pool > 1 ? `${pool - 1}d6 + 1d6x6` : "1d6x6";
    } else if (rawFormula.toLowerCase() === "willenskraft") {
      const wi = Number(actor?.system?.attributes?.primary?.wissen?.overall || 1);
      const wkItem = actor?.items?.find(
        (i) => i.type === "skill" && (i.system.skillId === "willenskraft" || i.name.toLowerCase() === "willenskraft")
      );
      const pool = Math.max(1, wi + (Number(wkItem?.system?.level) || 0));
      rawFormula = pool > 1 ? `${pool - 1}d6 + 1d6x6` : "1d6x6";
    }

    // Normalize German dice notation (e.g. "2W6+3" -> "2d6+3")
    const normalizedFormula = rawFormula.replace(/(\d+)W(\d+)/gi, "$1d$2").replace(/p\./gi, "");

    const roll = new Roll(normalizedFormula);
    await roll.evaluate();

    const total = roll.total;
    const isSuccess = total >= intensity;
    const statusLabel = isSuccess
      ? game?.i18n?.localize("NORETURN.Conditions.Resisted") ?? "WIDERSTANDEN (Erfolg)"
      : game?.i18n?.localize("NORETURN.Conditions.Infected") ?? "INFIZIERT / SYMPTOMSCHUB (Fehlschlag)";
    const statusClass = isSuccess ? "success" : "failure";

    const content = `
      <div class="noreturn-chat-card condition-card">
        <header class="card-header">
          <h3><i class="fas fa-biohazard"></i> ${conditionItem.name}</h3>
          <span class="card-subtitle">${
            game?.i18n?.localize("NORETURN.Conditions.ResistanceRoll") ?? "Widerstandsprobe"
          } (${normalizedFormula})</span>
        </header>
        <div class="card-meta">
          <span>${game?.i18n?.localize("NORETURN.Conditions.Incubation") ?? "Inkubation"}: <strong>${
            sys.incubationTime || "–"
          }</strong></span>
          <span>${game?.i18n?.localize("NORETURN.Conditions.Interval") ?? "Intervall"}: <strong>${
            sys.testInterval || "–"
          }</strong></span>
        </div>
        <div class="card-totals-row">
          <div class="stat-box">
            <span class="stat-label">${game?.i18n?.localize("NORETURN.Dice.ResultTotal") ?? "Ergebnis"}</span>
            <span class="stat-value">${total}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">${game?.i18n?.localize("NORETURN.Conditions.Intensity") ?? "Intensität (MW)"}</span>
            <span class="stat-value">${intensity}</span>
          </div>
        </div>
        <div class="card-outcome ${statusClass}">
          <strong>${statusLabel}</strong>
        </div>
        ${
          !isSuccess
            ? `<div class="condition-details">
                ${sys.symptomStages ? `<p><strong>Verlauf / Stadien:</strong> ${sys.symptomStages}</p>` : ""}
                ${sys.damagePerStage ? `<p><strong>Schaden:</strong> ${sys.damagePerStage}</p>` : ""}
                ${sys.penaltiesPerStage ? `<p><strong>Mali:</strong> ${sys.penaltiesPerStage}</p>` : ""}
                ${sys.antidote ? `<p><strong>Gegenmittel:</strong> ${sys.antidote}</p>` : ""}
              </div>`
            : ""
        }
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${conditionItem.name} – ${
        game?.i18n?.localize("NORETURN.Conditions.ResistanceRoll") ?? "Widerstandsprobe"
      }`,
      content,
      rolls: [roll]
    });

    return { roll, total, intensity, isSuccess };
  }
}
