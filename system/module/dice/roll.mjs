/**
 * NoReturn Dice & Roll Engine for Foundry VTT v14.
 * Implements W6 pools + exploding Hazard-Di (1d6x6), Target Numbers (MW),
 * Fumbles (< 5), Degrees of Success (Überschuss / Gute Treffer), Hit Zone (2d6),
 * Damage Resistance (Konstitution W6 + RW), Initiative with Mexican-Standoff Dialog
 * (pure sum without thresholds), and PSI-App Target-Range checks with automatic
 * RollTable Fehlschlagtabelle 1-3 & Overload triggers.
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

export const PSI_MISHAP_TABLES = {
  1: {
    name: "PSI-Fehlschlagtabelle 1 (Leichte Abweichung)",
    entries: {
      1: "Rückkopplung: Sofortiger Folgewurf auf PSI-Fehlschlagtabelle 2!",
      2: "Schock: Der Charakter wird für 1W6-2 Spielrunden bewegungsunfähig.",
      3: "War ich das?: Ein zufälliges Objekt oder Wesen im Sichtfeld des Wirkers wird als neues Ziel ermittelt.",
      4: "Nebenwirkung: Die Kraft wirkt normal, aber es tritt zusätzlich ein total chaotischer Effekt passend zur eingesetzten Kraft auf.",
      5: "Fremde Welt: Der Wirker erleidet 1W6-2 Spielrunden Halluzinationen und anschließend -2W6 auf alle Aktionen durch Verwirrung.",
      6: "Halbe Kraft: Die App funktioniert wie geplant, allerdings nur mit halber Wirkung."
    }
  },
  2: {
    name: "PSI-Fehlschlagtabelle 2 (Mittlere Abweichung / Rückkopplung)",
    entries: {
      1: "Leichte Schmerzen: Der Wirker erleidet 5 Punkte körperlichen Schaden am Kopf (Trefferzone 12).",
      2: "Schmerzendes Echo: Zweimal erneut auf Fehlschlagtabelle 2 würfeln – beide Ergebnisse kommen zum Tragen!",
      3: "Autsch, das war Nichts: Es passiert nichts; das Licht im Raum flackert unheilvoll.",
      4: "Kein Licht am Ende des Tunnels: Der Charakter wird für 1W6 Spielrunden bewusstlos.",
      5: "Zwei mit einer Klappe: Zwei zufällige andere Objekte oder Wesen im Umkreis des Wirkers werden als Ziele verwendet.",
      6: "Stille: Der Wirker kann für 1W6 Spielrunden keine PSI-Apps derselben PSI-Kraft einsetzen."
    }
  },
  3: {
    name: "PSI-Fehlschlagtabelle 3 (Schwere Abweichung / Katastrophe)",
    entries: {
      1: "Lass es einfach sein...: Alle Wesen in der Nähe (inkl. Wirker) erleiden Horrorhalluzinationen für 2W6 Minuten und verlieren 5 Punkte Psyche.",
      2: "Große Schmerzen: Der Wirker erleidet 15 Punkte körperlichen Direktschaden.",
      3: "Nur ein böser Traum!: Kein Effekt – noch einmal Glück gehabt.",
      4: "Power ohne Kontrolle: Alle Dinge in 10m Umkreis schweben bis auf 3 Meter Höhe und stürzen dann zu Boden.",
      5: "Stille und weißes Licht: Alles (inkl. Wirker) in einem Durchmesser von 1W6 Metern erleidet 200 Punkte Schaden!",
      6: "Der eigene Arsch: Der Wirker wählt unbewusst sich selbst als Ziel der PSI-App."
    }
  },
  overload: {
    name: "PSI-Overload-Tabelle (Kraft sammeln Fehlschlag)",
    entries: {
      1: "Telekinese-Overload: Alle Objekte und Lebewesen im Radius von 1W6m um den Wirker werden umgestoßen. Alle aufgeladenen [KS] verfallen.",
      2: "Elektrokinese-Overload: Die Aura des Wirkers blitzt. Alle Geräte im Umkreis von 2W6m werden mit Energie versorgt. Alle [KS] verfallen.",
      3: "Photokinese-Overload: Die Aura leuchtet explosionsartig auf; im Umkreis von 2W6m werden alle Ziele (inkl. Wirker) für 1 Spielrunde geblendet. Alle [KS] verfallen.",
      4: "Cryokinese-Overload: Die Aura gefriert; der Wirker wird 1 Spielrunde in eine Eishülle eingesperrt (absorbiert 80 TP). Alle [KS] verfallen.",
      5: "Pyrokinese-Overload: Die Aura des Wirkers fängt Feuer (5 TP/KR). Die aufgeladenen [KS] reduzieren sich um 1.",
      6: "Momenkinese-Overload: Dem Wirker werden die Beine mit Wucht weggezogen (Sturz). Alle [KS] verfallen."
    }
  }
};

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
   * Compute an actor's Initiative dice pool from Schnelligkeit + Reaktion (including item bonuses).
   */
  static getInitiativeComponents(actor) {
    if (!actor) {
      return { schnelligkeit: 1, reaktion: 0, woundPenalty: 0, alphaBio: false, betaBio: false, hasBillyTheKid: false };
    }
    const schnelligkeit = Number(
      actor.system?.attributes?.primary?.schnelligkeit?.overall ??
        actor.system?.allOver?.schnelligkeit ??
        1
    );
    const alphaBio = Boolean(actor.system?.attributes?.primary?.schnelligkeit?.alphaBio);
    const reaktionItem = actor.items?.find(
      (i) =>
        i.type === "skill" &&
        (i.system.skillId === "reaktion" || i.name.toLowerCase() === "reaktion")
    );
    const reaktionLevel = Number(reaktionItem?.system?.level || 0);
    const reaktionMod = Number(reaktionItem?.system?.effectiveMod ?? reaktionItem?.system?.mod ?? 0);
    const reaktion = Math.max(0, reaktionLevel + reaktionMod);
    const betaBio = Boolean(reaktionItem?.system?.betaBio);
    const woundPenalty = Number(actor.system?.health?.gesamteMali || 0);
    const hasBillyTheKid = Boolean(
      actor.items?.some(
        (i) =>
          (i.type === "styleskill" || i.type === "skill") &&
          (i.system?.styleSkillId === "style_billy_the_kid" ||
            i.system?.skillId === "style_billy_the_kid" ||
            i.name.toLowerCase().includes("billy the kid"))
      )
    );
    return { schnelligkeit, reaktion, woundPenalty, alphaBio, betaBio, hasBillyTheKid };
  }

  /**
   * Roll Initiative with the mandatory Initiative Configuration Dialog (Mexican Standoff checkbox
   * default false + situational modifier). Pure sum without thresholds or degrees of success!
   */
  static async rollInitiative(actor, { combatant = null, skipDialog = false } = {}) {
    const i18n = (key, fallback) => {
      const val = game?.i18n?.localize(key);
      return val && val !== key ? val : fallback;
    };

    const comp = this.getInitiativeComponents(actor);
    let mexicanStandoff = false;
    let situationalMod = 0;

    if (!skipDialog && foundry?.applications?.api?.DialogV2) {
      const dialogConfig = await foundry.applications.api.DialogV2.wait({
        window: {
          title: `${i18n("NORETURN.Combat.InitiativeDialogTitle", "Initiative konfigurieren")}: ${
            actor?.name ?? ""
          }`
        },
        content: `
          <div class="noreturn-roll-dialog initiative-dialog">
            <div class="form-group">
              <label>${i18n("NORETURN.Combat.BaseInitiativePool", "Basis-Pool (Schnelligkeit + Reaktion)")}</label>
              <input type="text" value="${comp.schnelligkeit} (SK) + ${comp.reaktion} (Reaktion) = ${
          comp.schnelligkeit + comp.reaktion
        }W6" disabled />
            </div>
            <div class="form-group">
              <label>${i18n("NORETURN.Combat.SituationalModifier", "Situativer Modifikator (+/- Würfel)")}</label>
              <input type="number" name="situationalMod" value="0" step="1" />
            </div>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" name="mexicanStandoff" />
                <strong>${i18n("NORETURN.Combat.MexicanStandoff", "Mexican Standoff")}</strong>
                <small style="display:block;opacity:0.85;">${i18n(
                  "NORETURN.Combat.MexicanStandoffHint",
                  "Konkurrierende Reaktionsprobe um die erste Aktion im Duell (GRW S. 58)"
                )}</small>
              </label>
            </div>
          </div>
        `,
        buttons: [
          {
            action: "roll",
            label: i18n("NORETURN.Dice.RollButton", "Würfeln"),
            icon: "fas fa-bolt",
            default: true,
            callback: (event, button) => {
              const form = button.form;
              return {
                mexicanStandoff: Boolean(form.elements.mexicanStandoff?.checked),
                situationalMod: Number(form.elements.situationalMod?.value) || 0
              };
            }
          },
          {
            action: "cancel",
            label: i18n("NORETURN.Dice.CancelButton", "Abbrechen"),
            icon: "fas fa-times",
            callback: () => null
          }
        ],
        rejectClose: false
      });

      if (!dialogConfig) return null;
      mexicanStandoff = dialogConfig.mexicanStandoff;
      situationalMod = dialogConfig.situationalMod;
    }

    // Mexican Standoff rule (GRW p. 58): competing Reaktion check (Schnelligkeit + Reaktion + Hazard-Di);
    // Billy the Kid negates the -2W6 draw-and-shoot penalty in a Standoff (+2W6 effective advantage if drawing).
    const standoffBonus = mexicanStandoff && comp.hasBillyTheKid ? 2 : 0;
    const rawPool =
      comp.schnelligkeit + comp.reaktion + situationalMod + standoffBonus - comp.woundPenalty;
    const totalPool = Math.max(1, rawPool);

    // Hazard-Di calculation: 1 Hazard-Di in Mexican Standoff or standard Initiative (or Alpha/Beta bio)
    let hazardCount = 1;
    if (comp.alphaBio && comp.betaBio) {
      hazardCount = Math.min(totalPool, Math.max(1, comp.schnelligkeit + comp.reaktion));
    } else if (comp.alphaBio) {
      hazardCount = Math.min(totalPool, Math.max(1, comp.schnelligkeit));
    } else if (comp.betaBio) {
      hazardCount = Math.min(totalPool, Math.max(1, comp.reaktion + 1));
    }
    const normalCount = Math.max(0, totalPool - hazardCount);
    const parts = [];
    if (normalCount > 0) parts.push(`${normalCount}d6`);
    if (hazardCount > 0) parts.push(`${hazardCount}d6x6`);
    const formula = parts.join(" + ") || "1d6x6";

    const roll = new Roll(formula);
    await roll.evaluate();

    const modeBadge = mexicanStandoff
      ? `<span class="noreturn-badge lethal"><i class="fas fa-crosshairs"></i> Mexican Standoff</span>`
      : `<span class="noreturn-badge">${i18n("NORETURN.Combat.StandardInitiative", "Standard-Initiative")}</span>`;

    // Pure sum chat card without any threshold (MW) or degree of success
    const content = `
      <div class="noreturn-chat-card initiative-card">
        <header class="card-header">
          <h3><i class="fas fa-bolt"></i> ${i18n("NORETURN.Combat.Initiative", "Initiative")} – ${
      actor?.name ?? ""
    }</h3>
          <span class="card-subtitle">${modeBadge}</span>
        </header>
        <div class="card-meta">
          <span>SK (${comp.schnelligkeit}) + Reaktion (${comp.reaktion})${
      situationalMod !== 0 ? ` + Mod (${situationalMod > 0 ? `+${situationalMod}` : situationalMod})` : ""
    }${comp.woundPenalty > 0 ? ` - Mali (${comp.woundPenalty})` : ""}</span>
          <span>Pool: <strong>${totalPool}W6</strong> (<code>${formula}</code>)</span>
        </div>
        <div class="card-total initiative-total">${roll.total}</div>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: mexicanStandoff
        ? `${i18n("NORETURN.Combat.Initiative", "Initiative")} (Mexican Standoff)`
        : i18n("NORETURN.Combat.Initiative", "Initiative"),
      content,
      rolls: [roll]
    });

    // Update Combat Tracker if combatant provided or actor is in active combat
    const activeCombatant =
      combatant ||
      game?.combat?.combatants?.find((c) => c.actor?.id === actor?.id);
    if (activeCombatant) {
      await activeCombatant.update({ initiative: roll.total });
    }

    return { roll, total: roll.total, mexicanStandoff };
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
   * Roll a PSI-App (GRW pp. 190-209):
   * - Validates the PSI Pyramid (Apps of Stufe 2 or 3 require prerequisite lower-stage Apps of the same PSI force).
   * - Allows converting PSI force dice into Kraftstufen [KS] and widening the target range (+/- 1 per KS).
   * - Checks if the rolled sum lands inside the Target Range [min, max].
   * - On failure or fumble, automatically triggers a roll on the matching PSI-Fehlschlagtabelle (1, 2, or 3)
   *   from packs/psi-tables.db (or built-in table) and posts the mishap to Chat!
   */
  static async rollPsiApp(actor, appItem, { skipDialog = false } = {}) {
    if (!appItem) return null;
    const i18n = (key, fallback) => {
      const val = game?.i18n?.localize(key);
      return val && val !== key ? val : fallback;
    };

    const sys = appItem.system || {};
    const tier = Number(sys.tier || sys.level || 1);

    // 1. Validate PSI Pyramid (Punkt 5.3)
    if (tier >= 2 && sys.pyramidValid === false) {
      ui.notifications?.warn(
        sys.pyramidReason ||
          `PSI-Pyramide nicht erfüllt: Für ${appItem.name} (Stufe ${tier}) fehlen Vorstufen-Apps derselben PSI-Kraft!`
      );
      return null;
    }

    const basePool = Math.max(1, Number(sys.forcePool || sys.forceLevel || 1));
    const baseMin = Number(sys.targetMin || 8);
    const baseMax = Number(sys.targetMax || 12);

    let diceToReduce = 0;
    let gatheredKs = 0;
    let rangeExpandKs = 0;
    let bonusDice = 0;

    if (!skipDialog && foundry?.applications?.api?.DialogV2) {
      const dialogRes = await foundry.applications.api.DialogV2.wait({
        window: { title: `PSI-App wirken: ${appItem.name} (${sys.psiForceLabel || sys.psiForce})` },
        content: `
          <div class="noreturn-roll-dialog psi-dialog">
            <div class="form-group">
              <label>PSI-Kraft Pool (${sys.psiForceLabel || sys.psiForce}, Stufe ${tier})</label>
              <input type="text" value="${basePool}W6 | Zielbereich: ${baseMin}–${baseMax} (Noob: ${
          sys.noobValue || "–"
        }, Master: ${sys.masteryLevel || "n.a."})" disabled />
            </div>
            <div class="form-group">
              <label>Würfelreduktion für Kraftstufen [KS] (max. ${Math.max(0, basePool - 1)})</label>
              <input type="number" name="diceToReduce" value="0" min="0" max="${Math.max(
                0,
                basePool - 1
              )}" step="1" />
            </div>
            <div class="form-group">
              <label>Zuvor gesammelte Kraftstufen [KS]</label>
              <input type="number" name="gatheredKs" value="0" min="0" max="10" step="1" />
            </div>
            <div class="form-group">
              <label>Davon [KS] für Zielbereich-Erweiterung (+/- 1 je KS)</label>
              <input type="number" name="rangeExpandKs" value="0" min="0" max="10" step="1" />
            </div>
            <div class="form-group">
              <label>Situative Bonus-/Maluswürfel</label>
              <input type="number" name="bonusDice" value="0" step="1" />
            </div>
          </div>
        `,
        buttons: [
          {
            action: "roll",
            label: "PSI-App wirken",
            icon: "fas fa-brain",
            default: true,
            callback: (event, button) => {
              const form = button.form;
              return {
                diceToReduce: Math.max(0, Number(form.elements.diceToReduce?.value) || 0),
                gatheredKs: Math.max(0, Number(form.elements.gatheredKs?.value) || 0),
                rangeExpandKs: Math.max(0, Number(form.elements.rangeExpandKs?.value) || 0),
                bonusDice: Number(form.elements.bonusDice?.value) || 0
              };
            }
          },
          {
            action: "cancel",
            label: i18n("NORETURN.Dice.CancelButton", "Abbrechen"),
            icon: "fas fa-times",
            callback: () => null
          }
        ],
        rejectClose: false
      });

      if (!dialogRes) return null;
      diceToReduce = Math.min(Math.max(0, basePool - 1), dialogRes.diceToReduce);
      gatheredKs = dialogRes.gatheredKs;
      rangeExpandKs = Math.min(diceToReduce + gatheredKs, dialogRes.rangeExpandKs);
      bonusDice = dialogRes.bonusDice;
    }

    const totalKs = diceToReduce + gatheredKs;
    const effectKs = Math.max(0, totalKs - rangeExpandKs);
    const effectiveMin = Math.max(1, baseMin - rangeExpandKs);
    const effectiveMax = baseMax + rangeExpandKs;

    const woundPenalty = Number(actor?.system?.health?.gesamteMali || 0);
    const activePool = Math.max(1, basePool - diceToReduce + bonusDice - woundPenalty);
    const normalDice = Math.max(0, activePool - 1);
    const formula = normalDice > 0 ? `${normalDice}d6 + 1d6x6` : "1d6x6";

    let roll = new Roll(formula);
    await roll.evaluate();
    let total = roll.total;
    let masteryRerolled = false;
    let firstAttemptTotal = null;

    // Mastery Reroll (GRW p. 191): if mastered and outside target range, may reroll once (second result is binding)
    const isHitInitial = total >= effectiveMin && total <= effectiveMax && total >= 5;
    if (!isHitInitial && sys.isMastered) {
      firstAttemptTotal = total;
      masteryRerolled = true;
      roll = new Roll(formula);
      await roll.evaluate();
      total = roll.total;
    }

    const isSuccess = total >= effectiveMin && total <= effectiveMax && total >= 5;
    let mishapHtml = "";
    let mishapResult = null;

    if (!isSuccess) {
      // Determine deviation from target range to select Fehlschlagtabelle 1, 2, or 3
      const deviation =
        total < effectiveMin ? effectiveMin - total : total - effectiveMax;
      const tableNum = total < 5 || deviation >= 9 ? 3 : deviation >= 5 ? 2 : 1;
      mishapResult = await this.rollPsiMishapTable(tableNum, actor, { postSeparateMessage: false });
      mishapHtml = `
        <div class="condition-details psi-mishap-box">
          <p><strong><i class="fas fa-skull-crossbones"></i> ${mishapResult.tableName} (1W6 = ${mishapResult.rollTotal}):</strong></p>
          <p>${mishapResult.resultText}</p>
        </div>
      `;
    }

    // Apply exhaustion / Psyche cost if configured on the App
    const psycheCost = Math.max(0, (Number(sys.exhaustionCost) || 0) - effectKs);
    if (isSuccess && psycheCost > 0 && actor?.system?.status?.psyche) {
      const curPsy = Number(actor.system.status.psyche.value) || 0;
      await actor.update({ "system.status.psyche.value": Math.max(0, curPsy - psycheCost) });
    }

    const statusClass = isSuccess ? "success" : "failure";
    const statusLabel = isSuccess
      ? `ZIELBEREICH GETROFFEN (${effectiveMin}–${effectiveMax}) – ERFOLG`
      : `ZIELBEREICH VERFEHLT (${effectiveMin}–${effectiveMax}) – PSIONISCHER PATZER!`;

    const content = `
      <div class="noreturn-chat-card psi-card">
        <header class="card-header">
          <h3><i class="fas fa-brain"></i> ${appItem.name} (Stufe ${tier})</h3>
          <span class="card-subtitle">${sys.psiForceLabel || sys.psiForce} | Pool: ${activePool}W6 | Effekt-[KS]: ${effectKs}</span>
        </header>
        <div class="card-meta">
          <span>Zielbereich: <strong>${effectiveMin}–${effectiveMax}</strong></span>
          <span>Kosten: <strong>${sys.cost || "1 Aktion"}</strong></span>
        </div>
        ${
          masteryRerolled
            ? `<div class="card-meta"><span><em>Meisterschafts-Reroll genutzt (1. Wurf war ${firstAttemptTotal})</em></span></div>`
            : ""
        }
        <div class="card-totals-row">
          <div class="stat-box">
            <span class="stat-label">Ergebnis</span>
            <span class="stat-value">${total}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Zielkorridor</span>
            <span class="stat-value">${effectiveMin}–${effectiveMax}</span>
          </div>
        </div>
        <div class="card-outcome ${statusClass}">
          <strong>${statusLabel}</strong>
        </div>
        ${
          isSuccess
            ? `<div class="condition-details">${sys.description || ""}</div>`
            : mishapHtml
        }
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `PSI-App: ${appItem.name}`,
      content,
      rolls: [roll]
    });

    return { roll, total, isSuccess, effectiveMin, effectiveMax, effectKs, mishapResult };
  }

  /**
   * Roll on one of the PSI Mishap / Overload Rollable Tables (1, 2, 3, or "overload").
   * Uses the Compendium RollTable in packs/psi-tables.db if available in the runtime,
   * and falls back to the embedded GRW table definitions.
   */
  static async rollPsiMishapTable(tableKey = 1, actor = null, { postSeparateMessage = true } = {}) {
    const tableDef = PSI_MISHAP_TABLES[tableKey] || PSI_MISHAP_TABLES[1];
    let rollTotal = 1;
    let resultText = "";
    let roll = null;

    // Try drawing from the compendium RollTable if loaded
    try {
      const pack = game?.packs?.get("noreturn.psi-tables");
      if (pack) {
        const docs = await pack.getDocuments();
        const matchingTable = docs.find(
          (t) =>
            t.flags?.noreturn?.tableKey === String(tableKey) ||
            t.name.includes(`Fehlschlagtabelle ${tableKey}`) ||
            (tableKey === "overload" && t.name.toLowerCase().includes("overload"))
        );
        if (matchingTable) {
          const draw = await matchingTable.roll();
          roll = draw.roll;
          rollTotal = roll.total;
          resultText = draw.results?.[0]?.text || draw.results?.[0]?.description || "";
        }
      }
    } catch (_err) {
      // Fallback to direct 1d6 evaluation
    }

    if (!roll) {
      roll = new Roll("1d6");
      await roll.evaluate();
      rollTotal = roll.total;
    }
    if (!resultText) {
      resultText = tableDef.entries[rollTotal] || tableDef.entries[1];
    }

    if (postSeparateMessage) {
      const content = `
        <div class="noreturn-chat-card condition-card">
          <header class="card-header">
            <h3><i class="fas fa-bolt-lightning"></i> ${tableDef.name}</h3>
            <span class="card-subtitle">Wurf: 1W6 = ${rollTotal}</span>
          </header>
          <div class="condition-details">
            <p>${resultText}</p>
          </div>
        </div>
      `;
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: tableDef.name,
        content,
        rolls: [roll]
      });
    }

    return { tableName: tableDef.name, roll, rollTotal, resultText };
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
