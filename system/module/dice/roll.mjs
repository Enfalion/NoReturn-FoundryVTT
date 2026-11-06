/**
 * NoReturn Dice & Roll Engine for Foundry VTT v14 (v1.1.1).
 * Implements tailored DialogV2 interfaces per check type:
 *  1. Attributsprobe (Attributswert, Situationsmodifikator, Schwellenwert)
 *  2. Fertigkeitsprobe (Fertigkeitswert, Basisattribut, Modifikatoren, Spezialisierungs-Bonus, Schwellenwert)
 *  3. Initiative (Mexican-Standoff-Checkbox, Situationsmodifikator – keine Schwellenwerte!)
 *  4. Waffen- / Angriffsprobe (Waffenreichweite, Zielzonen-Auswahl, Deckung des Ziels, Feuermodus)
 *  5. Widerstandsprobe Krankheit/Gift (Giftstufe, Schadensintervall, Zähigkeits-Modifikator)
 *  6. PSI-Probe (Dynamischer Würfelpool mit Regel- & Berechnungsanzeige, Überanstrengungskosten, Schwellenwert/Zielkorridor)
 *
 * Includes strict cancel/close handling: closing any dialog via "Abbrechen", Escape, or X
 * resolves with `{ cancelled: true }` / `null` and aborts before `Roll.evaluate()` and Chat output.
 */
import {
  AMMO_TYPE_DEFINITIONS,
  getEffectiveActorAttribute,
  isAmmoCompatibleWithWeapon,
  parseWeaponFireModes,
  resolveWeaponCombatSkill
} from "../data/item-data.mjs";

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
  static _i18n(key, fallback = "") {
    const val = game?.i18n?.localize(key);
    return val && val !== key ? val : fallback || key;
  }

  /**
   * Build collapsible HTML spoiler ("Gewürfelte Würfel anzeigen") for any Roll instance,
   * visually highlighting the Hazard-Die from normal dice (Punkt 5).
   */
  static buildDiceSpoilerHtml(roll, { markLastDieAsHazardIfNone = false } = {}) {
    if (!roll || !Array.isArray(roll.terms)) return "";
    const normalResults = [];
    const hazardResults = [];

    for (const term of roll.terms) {
      if (term instanceof foundry.dice.terms.Die || (term?.results && term?.faces)) {
        const isHazard =
          Boolean(term.modifiers?.some((m) => String(m).startsWith("x"))) ||
          String(term.options?.flavor || "").toLowerCase().includes("hazard");
        for (const r of term.results || []) {
          if (isHazard) {
            hazardResults.push({
              result: r.result,
              exploded: Boolean(r.exploded)
            });
          } else {
            normalResults.push({
              result: r.result,
              exploded: Boolean(r.exploded)
            });
          }
        }
      }
    }

    if (markLastDieAsHazardIfNone && hazardResults.length === 0 && normalResults.length > 0) {
      const last = normalResults.pop();
      hazardResults.push(last);
    }

    if (normalResults.length === 0 && hazardResults.length === 0) return "";

    const spoilerLabel = this._i18n("NORETURN.Dice.ShowRolledDice", "Gewürfelte Würfel anzeigen");
    const normalLabel = this._i18n("NORETURN.Dice.NormalDice", "Reguläre W6");
    const hazardLabel = this._i18n("NORETURN.Dice.HazardDice", "Hazard-Di (1d6x6)");

    const normalHtml = normalResults.length
      ? `<div class="dice-row">
          <span class="dice-label">${normalLabel}:</span>
          <div class="dice-chips">
            ${normalResults
              .map(
                (r) =>
                  `<span class="die-chip normal-die" title="${normalLabel}">${r.result}</span>`
              )
              .join("")}
          </div>
        </div>`
      : "";

    const hazardHtml = hazardResults.length
      ? `<div class="dice-row hazard-row">
          <span class="dice-label hazard-label"><i class="fas fa-radiation"></i> ${hazardLabel}:</span>
          <div class="dice-chips">
            ${hazardResults
              .map(
                (r) =>
                  `<span class="die-chip hazard-die ${
                    r.exploded ? "exploded" : ""
                  }" title="${hazardLabel}"><i class="fas fa-bolt hazard-chip-icon"></i> ${r.result}</span>`
              )
              .join("")}
          </div>
        </div>`
      : "";

    return `
      <details class="nr-dice-spoiler">
        <summary><i class="fas fa-dice"></i> ${spoilerLabel} (${roll.formula})</summary>
        <div class="dice-breakdown">
          ${normalHtml}
          ${hazardHtml}
        </div>
      </details>
    `;
  }

  /**
   * Live recalculation callback for the PSI-App roll dialog (Punkt 4).
   * Immediately updates the prominent End-Würfelpool, formula breakdown, target corridor, and [KS] display.
   */
  static updatePsiDialogLive(formOrEl) {
    const root =
      formOrEl?.closest?.(".psi-dialog") ||
      formOrEl?.querySelector?.(".psi-dialog") ||
      document.querySelector(".noreturn-roll-dialog.psi-dialog");
    if (!root) return;
    const form = root.closest("form") || formOrEl;
    if (!form) return;

    const basePool = Math.max(1, Number(root.dataset.basePool) || 1);
    const baseMin = Math.max(1, Number(root.dataset.baseMin) || 8);
    const baseMax = Math.max(1, Number(root.dataset.baseMax) || 12);

    const dynInput = form.querySelector('[name="dynamicPool"]');
    const gatheredInput = form.querySelector('[name="gatheredKs"]');
    const corridorInput = form.querySelector('[name="corridorAdjust"]');
    const overexertInput = form.querySelector('[name="overexertionCost"]');
    const minInput = form.querySelector('[name="targetMin"]');
    const maxInput = form.querySelector('[name="targetMax"]');

    const dynamicPool = Math.max(1, Number(dynInput?.value ?? basePool) || 1);
    const gatheredKs = Math.max(0, Number(gatheredInput?.value ?? 0) || 0);
    const corridorAdjust = Number(corridorInput?.value ?? 0) || 0;
    const overexertionCost = Math.max(0, Number(overexertInput?.value ?? 0) || 0);
    const rawMin = Math.max(1, Number(minInput?.value ?? baseMin) || baseMin);
    const rawMax = Math.max(1, Number(maxInput?.value ?? baseMax) || baseMax);

    const endPool = Math.max(1, dynamicPool + gatheredKs - corridorAdjust + overexertionCost);
    const reducedFromMax = Math.max(0, basePool - dynamicPool);
    const totalKs = Math.max(0, reducedFromMax + gatheredKs);
    const effectKs = Math.max(0, totalKs - Math.max(0, corridorAdjust));
    const effectiveMin = Math.max(1, rawMin - corridorAdjust);
    const effectiveMax = Math.max(effectiveMin, rawMax + corridorAdjust);

    const poolValEl = root.querySelector("[data-live-pool]");
    if (poolValEl) poolValEl.textContent = `${endPool}W6`;

    const formulaEl = root.querySelector("[data-live-formula]");
    if (formulaEl) {
      const corrSign = corridorAdjust > 0 ? `-${corridorAdjust}` : corridorAdjust < 0 ? `+${Math.abs(corridorAdjust)}` : "±0";
      formulaEl.textContent = `Dynamischer Pool (${dynamicPool}W6) + Vorab-KS (+${gatheredKs}W6) ${corrSign}W6 (Korridor) + Überanstrengung (+${overexertionCost}W6)`;
    }

    const corridorEl = root.querySelector("[data-live-corridor]");
    if (corridorEl) corridorEl.textContent = `${effectiveMin} – ${effectiveMax}`;

    const ksEl = root.querySelector("[data-live-ks]");
    if (ksEl) ksEl.textContent = `${effectKs} [KS]`;

    const overEl = root.querySelector("[data-live-overexertion]");
    if (overEl) overEl.textContent = `${overexertionCost} Psyche`;
  }

  /**
   * Central wrapper around DialogV2.wait that guarantees cancelling via "Abbrechen",
   * Escape key, or the window close button (X) always resolves with `{ cancelled: true }`.
   */
  static async _waitDialog({
    title,
    content,
    rollLabel = null,
    rollIcon = "fas fa-dice-d6",
    onRender = null,
    parseForm
  }) {
    if (!foundry?.applications?.api?.DialogV2) {
      return { cancelled: false };
    }
    const labelRoll = rollLabel || this._i18n("NORETURN.Dice.RollButton", "Würfeln!");
    const labelCancel = this._i18n("NORETURN.Dice.CancelButton", "Abbrechen");

    try {
      const raw = await foundry.applications.api.DialogV2.wait({
        window: { title },
        content,
        render: (event, dialog) => {
          if (typeof onRender === "function") {
            onRender(event, dialog);
          }
        },
        buttons: [
          {
            action: "roll",
            label: labelRoll,
            icon: rollIcon,
            default: true,
            callback: (_event, button) => {
              const parsed = typeof parseForm === "function" ? parseForm(button.form) : {};
              return { ...parsed, cancelled: false };
            }
          },
          {
            action: "cancel",
            label: labelCancel,
            icon: "fas fa-times",
            callback: () => ({ cancelled: true })
          }
        ],
        close: () => ({ cancelled: true }),
        rejectClose: false
      });

      if (!raw || typeof raw !== "object" || raw.cancelled) {
        return null;
      }
      return raw;
    } catch (_err) {
      return null;
    }
  }

  static _buildDifficultySelectHtml(defaultMw = 10) {
    return DIFFICULTY_PRESETS.map(
      (p) =>
        `<option value="${p.mw}" ${p.mw === Number(defaultMw) ? "selected" : ""}>${this._i18n(
          p.labelKey,
          `${p.key} (MW ${p.mw})`
        )}</option>`
    ).join("");
  }

  /**
   * 1. ATTRIBUTSPROBE (Punkt 1 & 3.1)
   * Dialog enthält: Attributswert, Situationsmodifikator (+/-), Wundmali, Schwellenwert.
   */
  static async rollAttributeCheck(
    actor,
    {
      attrKey = "geschick",
      label = "Attributsprobe",
      attributeDice = null,
      alphaBio = false,
      targetNumber = 10,
      skipDialog = false
    } = {}
  ) {
    const resolvedAttr =
      attributeDice !== null && attributeDice !== undefined
        ? Number(attributeDice)
        : getEffectiveActorAttribute(actor, attrKey);
    const baseAttr = Math.max(1, resolvedAttr || 1);
    let woundPenalty = Math.max(0, Number(actor?.system?.health?.gesamteMali || 0));
    let situationalMod = 0;
    let mw = Number(targetNumber) || 10;

    if (!skipDialog) {
      const dialogResult = await this._waitDialog({
        title: `${this._i18n("NORETURN.Dice.AttributeDialogTitle", "Attributsprobe")}: ${label}`,
        content: `
          <div class="noreturn-roll-dialog attribute-dialog">
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.AttributeValue", "Attributswert")} (${label})</label>
              <input type="number" name="attributeDice" value="${baseAttr}" disabled />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Combat.SituationalModifier", "Situationsmodifikator (+/- W6)")}</label>
              <input type="number" name="situationalMod" value="0" step="1" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Health.GesamteMali", "Wund- / Schmerzmali (-W6)")}</label>
              <input type="number" name="woundPenalty" value="${woundPenalty}" min="0" step="1" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.TargetNumber", "Schwellenwert (MW)")}</label>
              <div class="flexrow">
                <select name="presetMw" onchange="this.form.targetNumber.value = this.value">
                  ${this._buildDifficultySelectHtml(mw)}
                </select>
                <input type="number" name="targetNumber" value="${mw}" min="1" step="1" />
              </div>
            </div>
          </div>
        `,
        parseForm: (form) => ({
          situationalMod: Number(form.elements.situationalMod?.value) || 0,
          woundPenalty: Math.max(0, Number(form.elements.woundPenalty?.value ?? woundPenalty) || 0),
          targetNumber: Math.max(1, Number(form.elements.targetNumber?.value) || 10)
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      situationalMod = dialogResult.situationalMod;
      woundPenalty = dialogResult.woundPenalty;
      mw = dialogResult.targetNumber;
    }

    return this.executeCheck({
      actor,
      title: label,
      flavorSubtitle: `${this._i18n("NORETURN.Dice.AttributeDialogTitle", "Attributsprobe")} (${baseAttr}W6${
        situationalMod !== 0 ? ` ${situationalMod > 0 ? `+${situationalMod}` : situationalMod}W6` : ""
      }${woundPenalty > 0 ? ` -${woundPenalty}W6 Mali` : ""})`,
      attributeDice: baseAttr,
      skillDice: 0,
      bonusDice: situationalMod,
      woundPenalty,
      targetNumber: mw,
      useHazardDie: true,
      allAttributeHazard: Boolean(alphaBio),
      allSkillHazard: false,
      burstMode: false
    });
  }

  /**
   * 2. FERTIGKEITSPROBE (Punkt 1: Off-by-One / Hazard-Di Fix)
   * Gesamt-Würfel = Attributswert (effektiv) + Fertigkeitswert (effektiv) + situative Boni - situative Mali.
   * Der Hazard-Di ersetzt exakt 1 Würfel des Pools (reduziert den Pool NICHT!).
   */
  static async rollSkillCheck(
    actor,
    skillItem,
    { targetNumber = 10, skipDialog = false } = {}
  ) {
    if (!skillItem) return null;
    const attrKey = skillItem.system?.attribute || "";
    const prim = actor?.system?.attributes?.primary?.[attrKey];
    const attributeDice = getEffectiveActorAttribute(actor, attrKey);
    const attrLabel = attrKey
      ? this._i18n(`NORETURN.Attributes.${attrKey}`, attrKey)
      : this._i18n("NORETURN.Dice.NoBaseAttribute", "Kein Basisattribut");
    const skillDice = Number(skillItem.system?.level) || 0;
    const defaultMod = Number(skillItem.system?.effectiveMod ?? skillItem.system?.mod) || 0;
    let woundPenalty = Math.max(0, Number(actor?.system?.health?.gesamteMali || 0));

    let bonusDice = defaultMod;
    let specializationBonus = 0;
    let mw = Number(targetNumber) || 10;
    const baseSkillPool = Math.max(1, attributeDice + skillDice + defaultMod);

    if (!skipDialog) {
      const dialogResult = await this._waitDialog({
        title: `${this._i18n("NORETURN.Dice.SkillDialogTitle", "Fertigkeitsprobe")}: ${skillItem.name}`,
        content: `
          <div class="noreturn-roll-dialog skill-dialog">
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.Pool", "Basis-Würfelpool")}</label>
              <input type="text" value="${attrLabel} (${attributeDice}W6) + ${skillItem.name} (${skillDice}W6)${defaultMod !== 0 ? ` + Mod (${defaultMod}W6)` : ""} = ${baseSkillPool}W6 (inkl. 1 Hazard-Di)" disabled />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.SkillValue", "Fertigkeitswert")} (${skillItem.name})</label>
              <input type="number" name="skillDice" value="${skillDice}" disabled />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.BaseAttribute", "Basisattribut")} (${attrLabel})</label>
              <input type="number" name="attributeDice" value="${attributeDice}" disabled />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.Modifiers", "Situative Modifikatoren (+/- W6)")}</label>
              <input type="number" name="bonusDice" value="${defaultMod}" step="1" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.SpecializationBonus", "Spezialisierungs-Bonus (+W6)")}</label>
              <input type="number" name="specializationBonus" value="0" min="0" max="6" step="1" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Health.GesamteMali", "Wund- / Schmerzmali (-W6)")}</label>
              <input type="number" name="woundPenalty" value="${woundPenalty}" min="0" step="1" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.TargetNumber", "Schwellenwert (MW)")}</label>
              <div class="flexrow">
                <select name="presetMw" onchange="this.form.targetNumber.value = this.value">
                  ${this._buildDifficultySelectHtml(mw)}
                </select>
                <input type="number" name="targetNumber" value="${mw}" min="1" step="1" />
              </div>
            </div>
          </div>
        `,
        parseForm: (form) => ({
          bonusDice: Number(form.elements.bonusDice?.value) || 0,
          specializationBonus: Math.max(0, Number(form.elements.specializationBonus?.value) || 0),
          woundPenalty: Math.max(0, Number(form.elements.woundPenalty?.value ?? woundPenalty) || 0),
          targetNumber: Math.max(1, Number(form.elements.targetNumber?.value) || 10)
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      bonusDice = dialogResult.bonusDice;
      specializationBonus = dialogResult.specializationBonus;
      woundPenalty = dialogResult.woundPenalty;
      mw = dialogResult.targetNumber;
    }

    const totalBonus = bonusDice + specializationBonus;
    const subtitleParts = [`${attrLabel} (${attributeDice}W6) + Stufe (${skillDice}W6)`];
    if (bonusDice !== 0) subtitleParts.push(`Mod (${bonusDice > 0 ? `+${bonusDice}` : bonusDice}W6)`);
    if (specializationBonus > 0) subtitleParts.push(`Spez. (+${specializationBonus}W6)`);
    if (woundPenalty > 0) subtitleParts.push(`Mali (-${woundPenalty}W6)`);

    return this.executeCheck({
      actor,
      title: skillItem.name,
      flavorSubtitle: subtitleParts.join(" | "),
      attributeDice,
      skillDice,
      bonusDice: totalBonus,
      woundPenalty,
      targetNumber: mw,
      useHazardDie: true,
      allAttributeHazard: Boolean(prim?.alphaBio),
      allSkillHazard: Boolean(skillItem.system?.betaBio),
      burstMode: false
    });
  }

  /**
   * Compute an actor's Initiative dice pool from Schnelligkeit + Reaktion (including item bonuses).
   */
  static getInitiativeComponents(actor) {
    if (!actor) {
      return {
        schnelligkeit: 1,
        reaktion: 0,
        woundPenalty: 0,
        alphaBio: false,
        betaBio: false,
        hasBillyTheKid: false
      };
    }
    const schnelligkeit = Math.max(1, getEffectiveActorAttribute(actor, "schnelligkeit") || 1);
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
            i.system?.styleId === "style_billy_the_kid" ||
            i.system?.skillId === "style_billy_the_kid" ||
            i.name.toLowerCase().includes("billy the kid"))
      )
    );
    return { schnelligkeit, reaktion, woundPenalty, alphaBio, betaBio, hasBillyTheKid };
  }

  /**
   * 3. INITIATIVE (Punkt 3.3)
   * Dialog enthält ausschließlich: Mexican-Standoff-Checkbox (default false), Situationsmodifikator (keine Schwellenwerte!).
   */
  static async rollInitiative(actor, { combatant = null, skipDialog = false } = {}) {
    const comp = this.getInitiativeComponents(actor);
    let mexicanStandoff = false;
    let situationalMod = 0;

    if (!skipDialog) {
      const dialogResult = await this._waitDialog({
        title: `${this._i18n("NORETURN.Combat.InitiativeDialogTitle", "Initiative-Konfiguration")}: ${
          actor?.name ?? ""
        }`,
        rollIcon: "fas fa-bolt",
        content: `
          <div class="noreturn-roll-dialog initiative-dialog">
            <div class="form-group">
              <label>${this._i18n(
                "NORETURN.Combat.BaseInitiativePool",
                "Basis-Pool (Schnelligkeit + Reaktion)"
              )}</label>
              <input type="text" value="${comp.schnelligkeit} (SK) + ${comp.reaktion} (Reaktion) = ${
          comp.schnelligkeit + comp.reaktion
        }W6" disabled />
            </div>
            <div class="form-group">
              <label>${this._i18n(
                "NORETURN.Combat.SituationalModifier",
                "Situationsmodifikator (+/- W6)"
              )}</label>
              <input type="number" name="situationalMod" value="0" step="1" />
            </div>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" name="mexicanStandoff" />
                <strong>${this._i18n("NORETURN.Combat.MexicanStandoff", "Mexican Standoff")}</strong>
                <small style="display:block;opacity:0.85;">${this._i18n(
                  "NORETURN.Combat.MexicanStandoffHint",
                  "Konkurrierende Reaktionsprobe um die erste Aktion im Duell (GRW S. 58)"
                )}</small>
              </label>
            </div>
          </div>
        `,
        parseForm: (form) => ({
          mexicanStandoff: Boolean(form.elements.mexicanStandoff?.checked),
          situationalMod: Number(form.elements.situationalMod?.value) || 0
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      mexicanStandoff = dialogResult.mexicanStandoff;
      situationalMod = dialogResult.situationalMod;
    }

    const standoffBonus = mexicanStandoff && comp.hasBillyTheKid ? 2 : 0;
    const rawPool =
      comp.schnelligkeit + comp.reaktion + situationalMod + standoffBonus - comp.woundPenalty;
    const totalPool = Math.max(1, rawPool);

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
      : `<span class="noreturn-badge">${this._i18n(
          "NORETURN.Combat.StandardInitiative",
          "Standard-Initiative"
        )}</span>`;

    const diceSpoilerHtml = this.buildDiceSpoilerHtml(roll);

    const content = `
      <div class="noreturn-chat-card initiative-card">
        <header class="card-header">
          <h3><i class="fas fa-bolt"></i> ${this._i18n("NORETURN.Combat.Initiative", "Initiative")} – ${
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
        ${diceSpoilerHtml}
        <div class="card-total initiative-total">${roll.total}</div>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: mexicanStandoff
        ? `${this._i18n("NORETURN.Combat.Initiative", "Initiative")} (Mexican Standoff)`
        : this._i18n("NORETURN.Combat.Initiative", "Initiative"),
      content,
      rolls: [roll]
    });

    const activeCombatant =
      combatant || game?.combat?.combatants?.find((c) => c.actor?.id === actor?.id);
    if (activeCombatant) {
      await activeCombatant.update({ initiative: roll.total });
    }

    return { roll, total: roll.total, mexicanStandoff };
  }

  /**
   * 3B. ECHTES MUNITIONS-MANAGEMENT (Punkt 3: Laden, Entladen, Durchtauschen & Dynamischer Schaden)
   * Entlädt eine Fernkampfwaffe und transferiert verbleibende Kugeln zurück in das passende Inventar-Item.
   */
  static async unloadWeaponAmmo(actor, weapon, { notify = true } = {}) {
    if (!actor || !weapon) return 0;
    const sys = weapon.system || {};
    const curAmmo = Math.max(0, Number(sys.ammoCurrent) || 0);
    const loadedId = sys.loadedAmmoId || "";
    const loadedType = (sys.loadedAmmoType || "").toUpperCase();
    const loadedName = sys.loadedAmmoName || "";
    const cal = sys.caliber || "";

    if (curAmmo > 0) {
      let targetItem = loadedId ? actor.items?.get(loadedId) : null;
      if (!targetItem) {
        targetItem = actor.items?.find(
          (i) =>
            isAmmoCompatibleWithWeapon(i, cal) &&
            String(i.system?.ammoType || "FMJ").toUpperCase() === (loadedType || "FMJ")
        );
      }
      if (targetItem) {
        const curQty = Math.max(0, Number(targetItem.system?.quantity) || 0);
        await targetItem.update({ "system.quantity": curQty + curAmmo });
      } else if (cal) {
        const def = AMMO_TYPE_DEFINITIONS[loadedType] || AMMO_TYPE_DEFINITIONS.FMJ;
        await actor.createEmbeddedDocuments("Item", [
          {
            name: loadedName || `${cal} (${def.code})`,
            type: "ammo",
            img: "systems/noreturn/assets/icons/ammo.svg",
            system: {
              category: "munition",
              isAmmo: true,
              caliber: cal,
              ammoType: def.code,
              damageMod: Number(sys.loadedAmmoDamageMod ?? def.damageBonus) || 0,
              quantity: curAmmo,
              effects: def.summary
            }
          }
        ]);
      }
    }

    await weapon.update({
      "system.ammoCurrent": 0,
      "system.loadedAmmoId": "",
      "system.loadedAmmoType": "",
      "system.loadedAmmoName": "",
      "system.loadedAmmoDamageMod": 0
    });

    if (notify) {
      ui.notifications?.info(
        curAmmo > 0
          ? `${weapon.name}: ${curAmmo} Schuss (${loadedName || loadedType || "Munition"}) entladen und zurück ins Inventar gelegt.`
          : `${weapon.name}: Magazin entladen (0/${Number(sys.magazineCapacity) || 0}).`
      );
    }
    return curAmmo;
  }

  /**
   * Lädt oder wechselt Munition aus dem Charakterinventar in die Waffe (Punkt 3).
   * Befindet sich noch ein anderer Munitionstyp in der Waffe, wird dieser zuerst ins Inventar zurückgelegt.
   */
  static async loadWeaponAmmo(actor, weapon, { ammoItemId = null, skipDialog = false } = {}) {
    if (!actor || !weapon) return null;
    const sys = weapon.system || {};
    const cal = sys.caliber || "";
    const magCap = Math.max(1, Number(sys.magazineCapacity) || 1);

    const compatibleItems = (actor.items ? Array.from(actor.items) : []).filter(
      (i) => isAmmoCompatibleWithWeapon(i, cal) && (Number(i.system?.quantity) || 0) > 0
    );

    let chosenItem = ammoItemId ? actor.items?.get(ammoItemId) : null;

    if (!chosenItem && !skipDialog) {
      if (compatibleItems.length === 0) {
        ui.notifications?.warn(
          `${weapon.name}: Keine passende Munition für Kaliber "${cal || "Unbekannt"}" mit Menge > 0 im Inventar gefunden!`
        );
        return null;
      }

      const curLoadedInfo =
        (Number(sys.ammoCurrent) || 0) > 0
          ? `${sys.ammoCurrent}/${magCap} (${sys.loadedAmmoName || sys.loadedAmmoType || "Geladen"})`
          : `Leer (0/${magCap})`;

      const optionsHtml = compatibleItems
        .map((item) => {
          const code = String(item.system?.ammoType || "FMJ").toUpperCase();
          const def = AMMO_TYPE_DEFINITIONS[code] || AMMO_TYPE_DEFINITIONS.FMJ;
          const dmgMod =
            item.system?.damageMod !== null &&
            item.system?.damageMod !== undefined &&
            item.system?.damageMod !== ""
              ? Number(item.system.damageMod)
              : def.damageBonus;
          const selected = item.id === sys.loadedAmmoId ? "selected" : "";
          return `<option value="${item.id}" ${selected}>${item.name} [${code}] — ${item.system.quantity} Schuss im Inventar (Schaden ${dmgMod >= 0 ? `+${dmgMod}` : dmgMod}, ${def.effect})</option>`;
        })
        .join("");

      const dialogRes = await this._waitDialog({
        title: `Munition laden / wechseln: ${weapon.name} (${cal})`,
        rollLabel: "Laden / Wechseln",
        rollIcon: "fas fa-rotate",
        content: `
          <div class="noreturn-roll-dialog ammo-load-dialog">
            <div class="form-group">
              <label>Aktuelles Magazin (${weapon.name})</label>
              <input type="text" value="${curLoadedInfo}" disabled />
            </div>
            <div class="form-group">
              <label>Kompatible Munition im Inventar (Kaliber: ${cal})</label>
              <select name="ammoItemId">
                ${optionsHtml}
              </select>
            </div>
            <p style="font-size:0.85em;opacity:0.85;margin-top:6px;">
              <i class="fas fa-circle-info"></i> Falls sich bereits andere Munition im Magazin befindet, werden die restlichen Patronen automatisch ins Inventar zurückgelegt.
            </p>
          </div>
        `,
        parseForm: (form) => ({
          ammoItemId: form.elements.ammoItemId?.value || ""
        })
      });

      if (!dialogRes || dialogRes.cancelled || !dialogRes.ammoItemId) return null;
      chosenItem = actor.items?.get(dialogRes.ammoItemId);
    } else if (!chosenItem && skipDialog) {
      chosenItem =
        (sys.loadedAmmoId && compatibleItems.find((i) => i.id === sys.loadedAmmoId)) ||
        compatibleItems[0] ||
        null;
    }

    if (!chosenItem) {
      ui.notifications?.warn(`${weapon.name}: Keine kompatible Munition im Inventar verfügbar!`);
      return null;
    }

    const curAmmo = Math.max(0, Number(sys.ammoCurrent) || 0);
    const hasLinkedInventoryAmmo = Boolean(sys.loadedAmmoId);
    const isSameAmmo = hasLinkedInventoryAmmo && sys.loadedAmmoId === chosenItem.id;

    // Falls bereits echte Munition eines anderen Typs/Items geladen ist: zuerst entladen und zurück ins Inventar!
    if (curAmmo > 0 && hasLinkedInventoryAmmo && !isSameAmmo) {
      await this.unloadWeaponAmmo(actor, weapon, { notify: false });
    }

    const freshCurAmmo = isSameAmmo ? curAmmo : 0;
    const needed = Math.max(0, magCap - freshCurAmmo);
    const availQty = Math.max(0, Number(chosenItem.system?.quantity) || 0);

    if (needed === 0) {
      ui.notifications?.info(`${weapon.name}: Magazin ist bereits voll (${magCap}/${magCap} ${chosenItem.name}).`);
      return chosenItem;
    }
    if (availQty <= 0) {
      ui.notifications?.warn(`${chosenItem.name}: Keine Patronen mehr im Inventar!`);
      return null;
    }

    const toLoad = Math.min(needed, availQty);
    const newAmmoCurrent = freshCurAmmo + toLoad;
    const code = String(chosenItem.system?.ammoType || "FMJ").toUpperCase();
    const def = AMMO_TYPE_DEFINITIONS[code] || AMMO_TYPE_DEFINITIONS.FMJ;
    const customDmgMod =
      chosenItem.system?.damageMod !== null &&
      chosenItem.system?.damageMod !== undefined &&
      chosenItem.system?.damageMod !== ""
        ? Number(chosenItem.system.damageMod)
        : def.damageBonus;

    await chosenItem.update({ "system.quantity": Math.max(0, availQty - toLoad) });
    await weapon.update({
      "system.ammoCurrent": newAmmoCurrent,
      "system.loadedAmmoId": chosenItem.id,
      "system.loadedAmmoType": def.code,
      "system.loadedAmmoName": chosenItem.name,
      "system.loadedAmmoDamageMod": customDmgMod
    });

    ui.notifications?.info(
      `${weapon.name}: ${toLoad} Schuss ${chosenItem.name} [${def.code}] geladen (Magazin: ${newAmmoCurrent}/${magCap}).`
    );
    return chosenItem;
  }

  /**
   * Live-Rechner für den Waffen-Angriffsdialog (Punkt 4: Feuermodi, Schussanzahl, Rückstoß & Schaden).
   */
  static updateWeaponDialogLive(formOrEl) {
    const root =
      formOrEl?.closest?.(".weapon-dialog") ||
      formOrEl?.querySelector?.(".weapon-dialog") ||
      document.querySelector(".noreturn-roll-dialog.weapon-dialog");
    if (!root) return;
    const form = root.closest("form") || formOrEl;
    if (!form) return;

    const isRanged = root.dataset.isRanged === "true";
    const basePool = Number(root.dataset.basePool) || 1;
    const rd = Number(root.dataset.rd) || 0;
    const baseDamage = Number(root.dataset.baseDamage) || 0;
    const bulletDamage = Number(root.dataset.bulletDamage) || 0;
    const ammoMod = Number(root.dataset.ammoMod) || 0;
    const ammoCurrent = Number(root.dataset.ammoCurrent) || 0;
    const semiBulletsPerTrigger = Math.max(1, Number(root.dataset.semiBulletsPerTrigger) || 1);
    const burstBulletsPerBurst = Math.max(1, Number(root.dataset.burstBulletsPerBurst) || 3);
    const autoBulletsConsumed = Math.max(1, Number(root.dataset.autoBulletsConsumed) || 10);

    const fireMode = form.querySelector('[name="fireMode"]')?.value || "single";
    const rangeMod = Number(form.querySelector('[name="rangeMod"]')?.value) || 0;
    const sitMod = Number(form.querySelector('[name="situationalMod"]')?.value) || 0;
    const woundPenalty = Math.max(0, Number(form.querySelector('[name="woundPenalty"]')?.value) || 0);

    const semiGroup = root.querySelector('[data-mode-group="semi"]');
    const burstGroup = root.querySelector('[data-mode-group="burst"]');
    const autoGroup = root.querySelector('[data-mode-group="auto"]');
    const zoneSelect = form.querySelector('[name="targetZone"]');

    if (semiGroup) semiGroup.style.display = fireMode === "semi" ? "" : "none";
    if (burstGroup) burstGroup.style.display = fireMode === "burst" ? "" : "none";
    if (autoGroup) autoGroup.style.display = fireMode === "auto" ? "" : "none";

    if (zoneSelect) {
      if (fireMode === "auto") {
        zoneSelect.value = "random";
        zoneSelect.disabled = true;
      } else {
        zoneSelect.disabled = false;
      }
    }

    const targetZone = zoneSelect?.value || "random";
    const calledShotPenalty = targetZone === "random" ? 0 : targetZone === "12" ? -4 : -2;

    let recoilPenalty = 0;
    let fireModeBonusDice = 0;
    let ammoConsumed = isRanged ? 1 : 0;
    let damagePreview = "";
    let goodHitStep = 10;

    if (!isRanged) {
      damagePreview = `${root.dataset.meleeDamagePreview || `${baseDamage} TP`}`;
    } else if (fireMode === "semi") {
      const triggerInput = form.querySelector('[name="triggerCount"]');
      const maxTriggersByAmmo = Math.max(1, Math.floor(ammoCurrent / semiBulletsPerTrigger));
      const maxTriggers = Math.min(Number(triggerInput?.max) || 1, maxTriggersByAmmo);
      const triggerCount = Math.min(maxTriggers, Math.max(1, Number(triggerInput?.value) || 1));
      recoilPenalty = Math.max(0, triggerCount - rd);
      ammoConsumed = triggerCount * semiBulletsPerTrigger;
      const totalFlat = baseDamage + bulletDamage * triggerCount + ammoMod;
      damagePreview = `${totalFlat} TP [Grund ${baseDamage} + (${bulletDamage}×${triggerCount}) + Muni ${ammoMod >= 0 ? `+${ammoMod}` : ammoMod}]`;
    } else if (fireMode === "burst") {
      const burstInput = form.querySelector('[name="burstCount"]');
      const burstSubmode = form.querySelector('[name="burstSubmode"]')?.value || "concentrated";
      const maxBurstsByAmmo = Math.max(1, Math.floor(ammoCurrent / burstBulletsPerBurst));
      const maxBursts = Math.min(Number(burstInput?.max) || 1, maxBurstsByAmmo);
      const burstCount = Math.min(maxBursts, Math.max(1, Number(burstInput?.value) || 1));
      recoilPenalty = Math.max(0, burstCount - rd);
      ammoConsumed = burstCount * burstBulletsPerBurst;
      const concBonus = burstSubmode === "concentrated" ? 10 : 0;
      if (burstSubmode === "spread") {
        fireModeBonusDice = 2;
      } else {
        goodHitStep = 5;
      }
      const totalFlat = baseDamage + bulletDamage * burstCount + ammoMod + concBonus;
      damagePreview = `${totalFlat} TP [Grund ${baseDamage} + (${bulletDamage}×${burstCount}) + Muni ${ammoMod >= 0 ? `+${ammoMod}` : ammoMod}${concBonus > 0 ? " + 10 Konz." : ""}] (Gute Treffer je ${goodHitStep} Pkt.)`;
    } else if (fireMode === "auto") {
      const autoSubmode = form.querySelector('[name="autoSubmode"]')?.value || "regular";
      recoilPenalty = 0;
      ammoConsumed = autoBulletsConsumed;
      goodHitStep = 5;
      if (autoSubmode === "regular") {
        fireModeBonusDice = rd;
      } else {
        fireModeBonusDice = -2;
      }
      const totalFlat = baseDamage + 10 + bulletDamage * 2 + ammoMod;
      damagePreview = `3 Zonen × ${totalFlat} TP [Grund ${baseDamage} + 10 + (${bulletDamage}×2) + Muni ${ammoMod >= 0 ? `+${ammoMod}` : ammoMod}] (Gute Treffer je 5 Pkt.)`;
    } else {
      // single or repetier
      recoilPenalty = Math.max(0, 1 - rd);
      ammoConsumed = 1;
      const totalFlat = baseDamage + bulletDamage * 1 + ammoMod;
      damagePreview = `${totalFlat} TP [Grund ${baseDamage} + Kugel ${bulletDamage} + Muni ${ammoMod >= 0 ? `+${ammoMod}` : ammoMod}]`;
    }

    const endPool = Math.max(
      1,
      basePool + rangeMod + calledShotPenalty + fireModeBonusDice + sitMod - recoilPenalty - woundPenalty
    );

    const poolEl = root.querySelector("[data-live-attack-pool]");
    if (poolEl) poolEl.textContent = `${endPool}W6`;

    const recoilEl = root.querySelector("[data-live-recoil]");
    if (recoilEl) recoilEl.textContent = `-${recoilPenalty}W6 (RD ${rd})`;

    const ammoEl = root.querySelector("[data-live-ammo]");
    if (ammoEl) {
      ammoEl.textContent = isRanged ? `${ammoConsumed} Schuss (Magazin: ${ammoCurrent})` : "–";
    }

    const dmgEl = root.querySelector("[data-live-damage]");
    if (dmgEl) dmgEl.textContent = damagePreview;
  }

  /**
   * 4. WAFFEN- / ANGRIFFSPROBE (Punkte 2, 3, 4 & 5)
   * - Verknüpft Waffe automatisch mit der passenden Kampffertigkeit (+ Geschick).
   * - Prüft geladene Munition & Magazinstand (kein FMJ-Hardcoding!).
   * - Unterstützt Einzelschuss/Repetier, Semiautomatik (Abdrücken 1..X), Burst (Konzentriert/Streufeuer, Bursts 1..Y)
   *   und Vollautomatik (Regulär +RD W6 / Sperrfeuer -2W6, 3 Zufallszonen).
   * - Startet den interaktiven Target-Kampfablauf im Chat (Verteidigung -> Zone & MK -> Schadenswiderstand).
   */
  static async rollWeaponAttack(actor, weapon, { skipDialog = false } = {}) {
    if (!weapon) return null;
    const sys = weapon.system || {};
    const isRanged = Boolean(sys.isRanged || sys.weaponType === "ranged");
    const magCap = Number(sys.magazineCapacity) || 0;
    const ammoCur = Number(sys.ammoCurrent) || 0;

    if (isRanged && magCap > 0) {
      if (ammoCur <= 0 || (!sys.loadedAmmoId && !sys.loadedAmmoType)) {
        ui.notifications?.warn(
          `${weapon.name}: Keine Munition geladen (0 / ${magCap})! Bitte zuerst über "Laden / Wechseln" Munition aus dem Inventar laden.`
        );
        return null;
      }
    }

    const combatSkill = resolveWeaponCombatSkill(actor, weapon);
    const attrDice = combatSkill.attrDice;
    const skillDice = combatSkill.skillLevel;
    const weaponAttackBonus = combatSkill.weaponAttackBonus + combatSkill.skillMod;
    const baseAttackPool = Math.max(1, attrDice + skillDice + weaponAttackBonus);
    let woundPenalty = Math.max(0, Number(actor?.system?.health?.gesamteMali || 0));

    const rd = Math.max(0, Number(sys.recoilDampening) || 0);
    const baseDamage = Number(sys.baseWeaponDamage ?? sys.damageFlat) || 0;
    const bulletDamage = Number(sys.bulletDamage ?? sys.damageBonusPerHit) || 0;
    const loadedAmmo = sys.loadedAmmo || AMMO_TYPE_DEFINITIONS[sys.loadedAmmoType] || AMMO_TYPE_DEFINITIONS.FMJ;
    const ammoMod = isRanged ? Number(loadedAmmo.damageBonus) || 0 : 0;
    const meleeDmgAttrKey =
      sys.meleeDamageAttrKey ||
      (/KO\s*\+/i.test(String(sys.damageFormula || "")) ? "konstitution" : "staerke");
    const staerke = Math.max(1, getEffectiveActorAttribute(actor, meleeDmgAttrKey) || 1);
    const meleeDamagePreview = `${staerke}W6 (inkl. HD)${baseDamage > 0 ? ` + ${baseDamage}` : ""} TP`;

    const parsedModes = isRanged
      ? parseWeaponFireModes(sys.fireModes, sys)
      : {
          single: { supported: true, key: "single", label: "Nahkampfangriff" },
          repetier: { supported: false },
          semi: { supported: false, bulletsPerTrigger: 1, maxTriggers: 1 },
          burst: { supported: false, bulletsPerBurst: 3, maxBursts: 1 },
          auto: { supported: false, listedDamage: 0, bulletsConsumed: 10 },
          availableModes: [{ supported: true, key: "single", label: "Nahkampfangriff" }],
          supportedList: [{ supported: true, key: "single", label: "Nahkampfangriff" }]
        };

    const modeArray = parsedModes.availableModes?.length
      ? parsedModes.availableModes
      : parsedModes.supportedList?.length
      ? parsedModes.supportedList
      : [{ supported: true, key: "single", label: "Einzelschuss (1 Kugel)" }];
    const supportedModes = modeArray;

    // Target detection (Punkt 5 Schritt 1)
    const targetToken = game?.user?.targets?.first?.() || null;
    const targetActor = targetToken?.actor || null;

    let rangeMod = 0;
    let targetZone = "random";
    let coverMod = 0;
    let fireMode = supportedModes[0].key;
    let triggerCount = 1;
    let burstCount = 1;
    let burstSubmode = "concentrated";
    let autoSubmode = "regular";
    let situationalMod = 0;
    let targetDefense = 10;

    const maxSemiTriggers = parsedModes.semi?.supported
      ? Math.max(
          1,
          Math.min(
            parsedModes.semi.maxTriggers || 1,
            magCap > 0 ? Math.floor(ammoCur / (parsedModes.semi.bulletsPerTrigger || 1)) : parsedModes.semi.maxTriggers
          )
        )
      : 1;

    const maxBurstCount = parsedModes.burst?.supported
      ? Math.max(
          1,
          Math.min(
            parsedModes.burst.maxBursts || 1,
            magCap > 0 ? Math.floor(ammoCur / (parsedModes.burst.bulletsPerBurst || 3)) : parsedModes.burst.maxBursts
          )
        )
      : 1;

    if (!skipDialog) {
      const modeOptionsHtml = supportedModes
        .map((m) => `<option value="${m.key}">${m.label}</option>`)
        .join("");

      const targetBannerHtml = targetActor
        ? `<div class="nr-target-banner" style="padding:6px 10px;margin-bottom:8px;background:rgba(40,90,65,0.35);border-left:3px solid #4caf50;border-radius:4px;font-size:0.9em;">
             <i class="fas fa-bullseye"></i> <strong>Anvisiertes Ziel:</strong> ${targetToken.name || targetActor.name}
           </div>`
        : `<div class="nr-target-banner" style="padding:6px 10px;margin-bottom:8px;background:rgba(90,70,30,0.3);border-left:3px solid #d4882a;border-radius:4px;font-size:0.86em;">
             <i class="fas fa-info-circle"></i> Kein Token anvisiert (Tipp: Ziel-Token mit <code>T</code> markieren für den automatischen Verteidigungs- &amp; Schadens-Flow).
           </div>`;

      const dialogResult = await this._waitDialog({
        title: `${this._i18n("NORETURN.Combat.RollAttack", "Waffen- / Angriffsprobe")}: ${weapon.name}`,
        rollIcon: "fas fa-crosshairs",
        onRender: (_event, dialog) => {
          const el = dialog?.element || document.querySelector(".noreturn-roll-dialog.weapon-dialog");
          if (!el) return;
          el.querySelectorAll("input, select").forEach((inp) => {
            inp.addEventListener("input", () => NoReturnRoll.updateWeaponDialogLive(inp));
            inp.addEventListener("change", () => NoReturnRoll.updateWeaponDialogLive(inp));
          });
          NoReturnRoll.updateWeaponDialogLive(el);
        },
        content: `
          <div class="noreturn-roll-dialog weapon-dialog"
               data-is-ranged="${isRanged}"
               data-base-pool="${baseAttackPool}"
               data-rd="${rd}"
               data-base-damage="${baseDamage}"
               data-bullet-damage="${bulletDamage}"
               data-ammo-mod="${ammoMod}"
               data-ammo-current="${ammoCur}"
               data-semi-bullets-per-trigger="${parsedModes.semi?.bulletsPerTrigger || 1}"
               data-burst-bullets-per-burst="${parsedModes.burst?.bulletsPerBurst || 3}"
               data-auto-bullets-consumed="${parsedModes.auto?.bulletsConsumed || 10}"
               data-melee-damage-preview="${meleeDamagePreview}">
            ${targetBannerHtml}
            <div class="nr-psi-live-pool-banner" style="margin-bottom:8px;">
              <div class="nr-psi-live-pool-title">${combatSkill.canonicalLabel} (${skillDice}W6) + Geschick (${attrDice}W6)${weaponAttackBonus !== 0 ? ` + Waffenbonus (${weaponAttackBonus}W6)` : ""}</div>
              <div class="nr-psi-live-pool-value" data-live-attack-pool>${baseAttackPool}W6</div>
              <div class="nr-psi-live-pool-metrics">
                <span>Rückstoß-Malus: <strong data-live-recoil>0W6</strong></span>
                <span>Verbrauch: <strong data-live-ammo>${isRanged ? `1 Schuss (${ammoCur}/${magCap})` : "–"}</strong></span>
              </div>
              <div style="font-size:0.84em;margin-top:4px;">Schaden: <strong data-live-damage>–</strong></div>
            </div>

            ${
              isRanged
                ? `<div class="form-group">
                     <label>${this._i18n("NORETURN.Combat.FireModes", "Feuermodus")} (${sys.fireModes || "Einzel"})</label>
                     <select name="fireMode" onchange="window.NoReturnRoll?.updateWeaponDialogLive?.(this)">
                       ${modeOptionsHtml}
                     </select>
                   </div>
                   <div class="nr-firemode-subbox" data-mode-group="semi" style="display:none;">
                     <div class="form-group">
                       <label>Anzahl Schüsse (1 bis ${maxSemiTriggers})</label>
                       <input type="number" name="triggerCount" value="1" min="1" max="${maxSemiTriggers}" step="1" oninput="window.NoReturnRoll?.updateWeaponDialogLive?.(this)" onchange="window.NoReturnRoll?.updateWeaponDialogLive?.(this)" />
                     </div>
                   </div>
                   <div class="nr-firemode-subbox" data-mode-group="burst" style="display:none;">
                     <div class="form-group">
                       <label>Anzahl Bursts (1 bis ${maxBurstCount})</label>
                       <input type="number" name="burstCount" value="1" min="1" max="${maxBurstCount}" step="1" oninput="window.NoReturnRoll?.updateWeaponDialogLive?.(this)" onchange="window.NoReturnRoll?.updateWeaponDialogLive?.(this)" />
                     </div>
                     <div class="form-group">
                       <label>Burst-Art (GRW S. 60)</label>
                       <select name="burstSubmode" onchange="window.NoReturnRoll?.updateWeaponDialogLive?.(this)">
                         <option value="concentrated">Konzentriertes Feuer (+10 Schaden, Gute Treffer ab 5)</option>
                         <option value="spread">Streufeuer (+2W6 Angriff)</option>
                       </select>
                     </div>
                   </div>
                   <div class="nr-firemode-subbox" data-mode-group="auto" style="display:none;">
                     <div class="form-group">
                       <label>Vollautomatik-Modus (Verbrauch: ${parsedModes.auto?.bulletsConsumed || 15} Kugeln, 3 Zufallszonen)</label>
                       <select name="autoSubmode" onchange="window.NoReturnRoll?.updateWeaponDialogLive?.(this)">
                         <option value="regular">Regulärer Vollautomatik-Angriff (+${rd}W6 Bonus)</option>
                         <option value="suppressive">Sperrfeuer (-2W6 Kampfnachteil)</option>
                       </select>
                     </div>
                   </div>`
                : ""
            }

            <div class="form-group">
              <label>${this._i18n("NORETURN.Combat.Range", "Waffenreichweite")} (${sys.range || "Standard"})</label>
              <select name="rangeMod">
                <option value="0">Optimale / Kurze Distanz (±0 W6)</option>
                <option value="-1">Mittlere Distanz (-1 W6)</option>
                <option value="-2">Weite Distanz (-2 W6)</option>
                <option value="-4">Extreme Distanz (-4 W6)</option>
              </select>
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Combat.TargetZoneSelect", "Zielzonen-Auswahl")}</label>
              <select name="targetZone">
                <option value="random">Zufällige Trefferzone (2W6 – kein Malus)</option>
                <option value="12">(12) Kopf – Gezielt (-4 W6)</option>
                <option value="8">(8) l. Brust – Gezielt (-2 W6)</option>
                <option value="7">(7) Bauch – Gezielt (-2 W6)</option>
                <option value="6">(6) r. Brust – Gezielt (-2 W6)</option>
                <option value="2">(2) Becken – Gezielt (-2 W6)</option>
                <option value="9">(9) l. Arm – Gezielt (-2 W6)</option>
                <option value="5">(5) r. Arm – Gezielt (-2 W6)</option>
                <option value="10">(10) l. Oberschenkel – Gezielt (-2 W6)</option>
                <option value="4">(4) r. Oberschenkel – Gezielt (-2 W6)</option>
                <option value="11">(11) l. Unterschenkel – Gezielt (-2 W6)</option>
                <option value="3">(3) r. Unterschenkel – Gezielt (-2 W6)</option>
              </select>
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Combat.TargetCover", "Deckung des Ziels")}</label>
              <select name="coverMod">
                <option value="0">Keine Deckung (+0 MW)</option>
                <option value="2">Leichte Deckung (+2 MW)</option>
                <option value="4">Halbe Deckung (+4 MW)</option>
                <option value="6">Dreiviertel-Deckung (+6 MW)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Situationsmodifikator (+/- W6)</label>
              <input type="number" name="situationalMod" value="0" step="1" />
            </div>
            <div class="form-group">
              <label>Wund- / Schmerzmali (-W6)</label>
              <input type="number" name="woundPenalty" value="${woundPenalty}" min="0" step="1" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.TargetNumber", "Basis-Verteidigung / MW (falls ohne aktiven Verteidigungswurf)")}</label>
              <input type="number" name="targetDefense" value="10" min="1" step="1" />
            </div>
          </div>
        `,
        parseForm: (form) => ({
          fireMode: form.elements.fireMode?.value || supportedModes[0].key,
          triggerCount: Math.max(1, Number(form.elements.triggerCount?.value) || 1),
          burstCount: Math.max(1, Number(form.elements.burstCount?.value) || 1),
          burstSubmode: form.elements.burstSubmode?.value || "concentrated",
          autoSubmode: form.elements.autoSubmode?.value || "regular",
          rangeMod: Number(form.elements.rangeMod?.value) || 0,
          targetZone: form.elements.targetZone?.value || "random",
          coverMod: Number(form.elements.coverMod?.value) || 0,
          situationalMod: Number(form.elements.situationalMod?.value) || 0,
          woundPenalty: Math.max(0, Number(form.elements.woundPenalty?.value ?? woundPenalty) || 0),
          targetDefense: Math.max(1, Number(form.elements.targetDefense?.value) || 10)
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      fireMode = dialogResult.fireMode;
      triggerCount = dialogResult.triggerCount;
      burstCount = dialogResult.burstCount;
      burstSubmode = dialogResult.burstSubmode;
      autoSubmode = dialogResult.autoSubmode;
      rangeMod = dialogResult.rangeMod;
      targetZone = fireMode === "auto" ? "random" : dialogResult.targetZone;
      coverMod = dialogResult.coverMod;
      situationalMod = dialogResult.situationalMod;
      woundPenalty = dialogResult.woundPenalty;
      targetDefense = dialogResult.targetDefense;
    }

    // Berechne Munitionsverbrauch, Rückstoß, Angriffsbonus und Basisschaden gemäß Punkt 4 (GRW S. 60-61)
    let shotsConsumed = 0;
    let recoilPenalty = 0;
    let fireModeBonusDice = 0;
    let goodHitStep = 10;
    let flatShotDamage = baseDamage;
    let zoneRollsCount = 1;
    let modeDisplayLabel = "Einzelschuss";

    if (isRanged) {
      if (fireMode === "semi") {
        const bpt = parsedModes.semi?.bulletsPerTrigger || 1;
        triggerCount = Math.min(maxSemiTriggers, Math.max(1, triggerCount));
        shotsConsumed = triggerCount * bpt;
        recoilPenalty = Math.max(0, triggerCount - rd);
        flatShotDamage = baseDamage + bulletDamage * triggerCount + ammoMod;
        modeDisplayLabel = `Semi (${triggerCount}× Abzug, ${shotsConsumed} Schuss)`;
      } else if (fireMode === "burst") {
        const bpb = parsedModes.burst?.bulletsPerBurst || 3;
        burstCount = Math.min(maxBurstCount, Math.max(1, burstCount));
        shotsConsumed = burstCount * bpb;
        recoilPenalty = Math.max(0, burstCount - rd);
        const isConc = burstSubmode === "concentrated";
        if (!isConc) {
          fireModeBonusDice = 2;
        } else {
          goodHitStep = 5;
        }
        flatShotDamage = baseDamage + bulletDamage * burstCount + ammoMod + (isConc ? 10 : 0);
        modeDisplayLabel = `Burst (${burstCount}× Salve, ${isConc ? "Konzentriert +10 TP" : "Streufeuer +2W6"})`;
      } else if (fireMode === "auto") {
        shotsConsumed = parsedModes.auto?.bulletsConsumed || 10;
        if (magCap > 0 && ammoCur < shotsConsumed) {
          ui.notifications?.warn(
            `${weapon.name}: Nicht genug Munition im Magazin für Vollautomatik (${ammoCur}/${shotsConsumed} benötigt)!`
          );
          return null;
        }
        recoilPenalty = 0;
        goodHitStep = 5;
        zoneRollsCount = 3;
        targetZone = "random";
        fireModeBonusDice = autoSubmode === "regular" ? rd : -2;
        flatShotDamage = baseDamage + 10 + bulletDamage * 2 + ammoMod;
        modeDisplayLabel = `Vollautomatik (${autoSubmode === "regular" ? `Regulär +${rd}W6` : "Sperrfeuer -2W6"}, 3 Zonen)`;
      } else {
        // single or repetier
        shotsConsumed = 1;
        recoilPenalty = Math.max(0, 1 - rd);
        flatShotDamage = baseDamage + bulletDamage * 1 + ammoMod;
        modeDisplayLabel = fireMode === "repetier" ? "Repetier (1 Schuss)" : "Einzelschuss (1 Schuss)";
      }
    } else {
      modeDisplayLabel = "Nahkampf";
    }

    if (isRanged && magCap > 0 && shotsConsumed > ammoCur) {
      ui.notifications?.warn(
        `${weapon.name}: Nicht genug Kugeln im Magazin (${ammoCur} vorhanden, ${shotsConsumed} benötigt)!`
      );
      return null;
    }

    const remainingAmmoAfterShot = isRanged && magCap > 0 ? Math.max(0, ammoCur - shotsConsumed) : ammoCur;
    if (isRanged && magCap > 0 && shotsConsumed > 0) {
      await weapon.update({ "system.ammoCurrent": remainingAmmoAfterShot });
    }

    const calledShotPenalty = targetZone === "random" ? 0 : targetZone === "12" ? -4 : -2;
    const effectiveTargetMw = Math.max(1, targetDefense + coverMod);
    const totalBonusDice =
      weaponAttackBonus + rangeMod + calledShotPenalty + fireModeBonusDice + situationalMod - recoilPenalty;

    const rawPool = attrDice + skillDice + totalBonusDice - woundPenalty;
    const totalPool = Math.max(1, rawPool);

    const allAttributeHazard = Boolean(actor?.system?.attributes?.primary?.geschick?.alphaBio);
    const allSkillHazard = Boolean(combatSkill.skillItem?.system?.betaBio);
    let hazardCount = 1;
    if (allAttributeHazard && allSkillHazard) {
      hazardCount = Math.min(totalPool, Math.max(1, attrDice + skillDice));
    } else if (allAttributeHazard) {
      hazardCount = Math.min(totalPool, Math.max(1, attrDice));
    } else if (allSkillHazard) {
      hazardCount = Math.min(totalPool, Math.max(1, skillDice + (attrDice > 0 ? 1 : 0)));
    }
    const normalCount = Math.max(0, totalPool - hazardCount);
    const formulaParts = [];
    if (normalCount > 0) formulaParts.push(`${normalCount}d6`);
    if (hazardCount > 0) formulaParts.push(`${hazardCount}d6x6`);
    const formula = formulaParts.join(" + ") || "1d6x6";

    const roll = new Roll(formula);
    await roll.evaluate();
    const total = roll.total;
    const isFumble = total < 5;
    const isSuccess = !isFumble && total >= effectiveTargetMw;
    const margin = total - effectiveTargetMw;
    const goodHits = isSuccess && margin >= goodHitStep ? Math.floor(margin / goodHitStep) : 0;

    const zoneText =
      targetZone === "random"
        ? zoneRollsCount === 3
          ? "3 Zufallszonen (je 2W6)"
          : "Zufallszone (2W6)"
        : `Gezielt: ${this._i18n(`NORETURN.Health.Zones.${targetZone}`, `Zone ${targetZone}`)}`;

    const ammoLabel = isRanged
      ? `${loadedAmmo.customName || loadedAmmo.label} [${loadedAmmo.code}] (${remainingAmmoAfterShot}/${magCap})`
      : "Nahkampf";

    const diceSpoilerHtml = this.buildDiceSpoilerHtml(roll);

    const attackFlow = {
      attackerActorId: actor?.id || "",
      attackerTokenId: actor?.token?.id || "",
      attackerName: actor?.name || "Angreifer",
      targetActorId: targetActor?.id || "",
      targetTokenId: targetToken?.id || "",
      targetSceneId: targetToken?.scene?.id || canvas?.scene?.id || "",
      targetName: targetToken?.name || targetActor?.name || "Ziel",
      weaponId: weapon.id,
      weaponName: weapon.name,
      isRanged,
      caliber: sys.caliber || "",
      skillLabel: combatSkill.canonicalLabel,
      fireMode,
      burstSubmode,
      autoSubmode,
      modeDisplayLabel,
      shotsConsumed,
      recoilPenalty,
      calledZone: targetZone !== "random" ? targetZone : null,
      zoneRollsCount,
      coverMod,
      goodHitStep,
      baseDamage,
      bulletDamage,
      ammoMod,
      flatShotDamage,
      staerke,
      loadedAmmo: {
        code: loadedAmmo.code || "FMJ",
        label: loadedAmmo.customName || loadedAmmo.label || "FMJ",
        damageBonus: ammoMod,
        ignoresMk: loadedAmmo.ignoresMk || [],
        blockedByMk: loadedAmmo.blockedByMk || []
      },
      attackTotal: total,
      effectiveTargetMw,
      isFumble
    };

    const content = `
      <div class="noreturn-chat-card check-card attack-flow-card ${
        isFumble ? "fumble" : "success"
      }">
        <header class="card-header">
          <h3><i class="fas fa-crosshairs"></i> ${weapon.name} – Angriff (${combatSkill.canonicalLabel})</h3>
          <div class="card-subtitle">${modeDisplayLabel} | ${zoneText}${
      coverMod > 0 ? ` | Deckung +${coverMod}` : ""
    }</div>
        </header>
        <div class="card-meta">
          <span>Pool: <strong>${totalPool}W6</strong> (GE ${attrDice} + ${
      combatSkill.canonicalLabel
    } ${skillDice}${recoilPenalty > 0 ? ` - Rückstoß ${recoilPenalty}` : ""})</span>
          <span>Munition: <strong>${ammoLabel}</strong></span>
        </div>
        ${
          targetActor
            ? `<div class="card-meta"><span><i class="fas fa-bullseye"></i> Ziel: <strong>${attackFlow.targetName}</strong></span></div>`
            : ""
        }
        ${diceSpoilerHtml}
        <div class="card-outcome">
          <div class="outcome-numbers">
            <div class="outcome-box">
              <span class="lbl">Angriffswert</span>
              <span class="val total-val">${total}</span>
            </div>
            <div class="outcome-box">
              <span class="lbl">Basis-Schaden</span>
              <span class="val">${isRanged ? `${flatShotDamage} TP` : meleeDamagePreview}</span>
            </div>
          </div>
          ${
            isFumble
              ? `<div class="outcome-banner"><span class="banner-fumble"><i class="fas fa-skull-crossbones"></i> PATZER (Wurf &lt; 5)!</span></div>`
              : `<div class="card-actions" style="display:flex;flex-direction:column;gap:6px;margin-top:8px;">
                   <button type="button" class="noreturn-chat-btn" data-action="roll-target-defense">
                     <i class="fas fa-shield-halved"></i> Verteidigung würfeln (Ausweichen / Parade / Reaktion)
                   </button>
                   <button type="button" class="noreturn-chat-btn secondary" data-action="roll-direct-damage">
                     <i class="fas fa-burst"></i> Direkt Zone &amp; Schaden auswerten (gegen MW ${effectiveTargetMw})
                   </button>
                 </div>`
          }
        </div>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${weapon.name} – Angriffsprobe`,
      content,
      rolls: [roll],
      flags: {
        noreturn: {
          attackFlow
        }
      }
    });

    return { roll, total, isSuccess, isFumble, margin, goodHits, attackFlow };
  }

  /**
   * 5. WIDERSTANDSPROBE (KRANKHEIT / GIFT) (Punkt 3.5 & Punkt 5)
   * Dialog enthält ausschließlich: Giftstufe (Intensität), Schadensintervall, Zähigkeits-Modifikator.
   */
  static async rollConditionResistance(actor, conditionItem, { skipDialog = false } = {}) {
    if (!conditionItem) return null;
    const sys = conditionItem.system || {};
    let intensity = Math.max(1, Number(sys.intensity) || 5);
    let testInterval = sys.testInterval || "Alle 24 Stunden";
    let toughnessMod = 0;

    if (!skipDialog) {
      const dialogResult = await this._waitDialog({
        title: `${this._i18n("NORETURN.Conditions.ResistanceRoll", "Widerstandsprobe")}: ${
          conditionItem.name
        }`,
        rollIcon: "fas fa-biohazard",
        content: `
          <div class="noreturn-roll-dialog condition-dialog">
            <div class="form-group">
              <label>${this._i18n("NORETURN.Conditions.Intensity", "Giftstufe / Intensität (MW)")}</label>
              <input type="number" name="intensity" value="${intensity}" min="1" step="1" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Conditions.Interval", "Schadensintervall")}</label>
              <input type="text" name="testInterval" value="${testInterval}" />
            </div>
            <div class="form-group">
              <label>${this._i18n(
                "NORETURN.Conditions.ToughnessModifier",
                "Zähigkeits-Modifikator (+/- W6)"
              )}</label>
              <input type="number" name="toughnessMod" value="0" step="1" />
            </div>
          </div>
        `,
        parseForm: (form) => ({
          intensity: Math.max(1, Number(form.elements.intensity?.value) || intensity),
          testInterval: form.elements.testInterval?.value || testInterval,
          toughnessMod: Number(form.elements.toughnessMod?.value) || 0
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      intensity = dialogResult.intensity;
      testInterval = dialogResult.testInterval;
      toughnessMod = dialogResult.toughnessMod;
    }

    let rawFormula = String(sys.resistanceFormula || "@status.infektionsresistenz").trim();
    if (rawFormula === "@status.infektionsresistenz" || !rawFormula) {
      rawFormula = actor?.system?.status?.infektionsresistenz || "2d6";
    } else if (actor?.system?.attributes?.primary?.[rawFormula]) {
      const pool = Math.max(1, Number(actor.system.attributes.primary[rawFormula].overall) || 1);
      rawFormula = pool > 1 ? `${pool - 1}d6 + 1d6x6` : "1d6x6";
    } else if (rawFormula.toLowerCase() === "willenskraft") {
      const wi = Number(actor?.system?.attributes?.primary?.wissen?.overall || 1);
      const wkItem = actor?.items?.find(
        (i) =>
          i.type === "skill" &&
          (i.system.skillId === "willenskraft" || i.name.toLowerCase() === "willenskraft")
      );
      const pool = Math.max(1, wi + (Number(wkItem?.system?.level) || 0));
      rawFormula = pool > 1 ? `${pool - 1}d6 + 1d6x6` : "1d6x6";
    }

    let normalizedFormula = rawFormula.replace(/(\d+)W(\d+)/gi, "$1d$2").replace(/p\./gi, "");
    if (toughnessMod > 0) {
      normalizedFormula = `${normalizedFormula} + ${toughnessMod}d6`;
    } else if (toughnessMod < 0) {
      normalizedFormula = `${normalizedFormula} - ${Math.abs(toughnessMod)}d6`;
    }

    const roll = new Roll(normalizedFormula);
    await roll.evaluate();

    const total = roll.total;
    const isSuccess = total >= intensity;
    const statusLabel = isSuccess
      ? this._i18n("NORETURN.Conditions.Resisted", "WIDERSTANDEN (Erfolg)")
      : this._i18n("NORETURN.Conditions.Infected", "INFIZIERT / SYMPTOMSCHUB (Fehlschlag)");
    const statusClass = isSuccess ? "success" : "failure";
    const diceSpoilerHtml = this.buildDiceSpoilerHtml(roll, { markLastDieAsHazardIfNone: true });

    const content = `
      <div class="noreturn-chat-card condition-card">
        <header class="card-header">
          <h3><i class="fas fa-biohazard"></i> ${conditionItem.name}</h3>
          <span class="card-subtitle">${this._i18n(
            "NORETURN.Conditions.ResistanceRoll",
            "Widerstandsprobe"
          )} (${normalizedFormula})</span>
        </header>
        <div class="card-meta">
          <span>${this._i18n("NORETURN.Conditions.Incubation", "Inkubation")}: <strong>${
      sys.incubationTime || "–"
    }</strong></span>
          <span>${this._i18n("NORETURN.Conditions.Interval", "Intervall")}: <strong>${
      testInterval || "–"
    }</strong></span>
        </div>
        ${diceSpoilerHtml}
        <div class="card-totals-row">
          <div class="stat-box">
            <span class="stat-label">${this._i18n("NORETURN.Dice.ResultTotal", "Ergebnis")}</span>
            <span class="stat-value">${total}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">${this._i18n(
              "NORETURN.Conditions.Intensity",
              "Giftstufe / Intensität"
            )}</span>
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
      flavor: `${conditionItem.name} – ${this._i18n(
        "NORETURN.Conditions.ResistanceRoll",
        "Widerstandsprobe"
      )}`,
      content,
      rolls: [roll]
    });

    return { roll, total, intensity, isSuccess };
  }

  /**
   * 5B. ALLGEMEINE INFEKTIONSRESISTENZ-PROBE (mit Würfel-Spoiler & Hazard-Die-Hervorhebung)
   */
  static async rollInfectionResistance(actor) {
    const rawFormula = actor?.system?.status?.infektionsresistenz || "2d6";
    const formula = rawFormula.replace(/(\d+)W(\d+)/gi, "$1d$2").replace(/p\./gi, "");
    const roll = new Roll(formula);
    await roll.evaluate();
    const diceSpoilerHtml = this.buildDiceSpoilerHtml(roll, { markLastDieAsHazardIfNone: true });

    const content = `
      <div class="noreturn-chat-card condition-card">
        <header class="card-header">
          <h3><i class="fas fa-biohazard"></i> ${this._i18n(
            "NORETURN.Status.Infektionsresistenz",
            "Infektionsresistenz"
          )}</h3>
          <span class="card-subtitle">Formel: <code>${rawFormula}</code></span>
        </header>
        ${diceSpoilerHtml}
        <div class="card-total">${roll.total}</div>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${this._i18n("NORETURN.Status.Infektionsresistenz", "Infektionsresistenz")} (${rawFormula})`,
      content,
      rolls: [roll]
    });

    return roll;
  }

  /**
   * 6A. ALLGEMEINE PSI-KRAFT-PROBE (Punkt 3.6 & Punkt 4.1)
   * Dialog enthält ausschließlich: Anzeige der Regeln für den dynamischen Würfelpool,
   * Würfelreduktion / [KS], Überanstrengungskosten, Schwellenwert.
   */
  static async rollPsiForce(actor, forceItem, { skipDialog = false } = {}) {
    if (!forceItem) return null;
    const sys = forceItem.system || {};
    const forceLevel = Math.max(1, Number(sys.level) || 1);
    const forceMod = Number(sys.mod) || 0;
    const basePool = Math.max(1, forceLevel + forceMod);
    const woundPenalty = Number(actor?.system?.health?.gesamteMali || 0);

    let diceToReduce = 0;
    let overexertionCost = 0;
    let targetNumber = 10;

    if (!skipDialog) {
      const dialogResult = await this._waitDialog({
        title: `PSI-Kraft-Probe: ${forceItem.name} (Kategorie ${sys.category || "A"}, Stufe ${
          sys.hierarchyTier || 1
        })`,
        rollIcon: "fas fa-brain",
        content: `
          <div class="noreturn-roll-dialog psi-dialog">
            <div class="nr-psi-pool-rules">
              <strong><i class="fas fa-circle-info"></i> Dynamischer PSI-Würfelpool (GRW S. 190):</strong>
              <p>Basis-Pool = PSI-Kraft-Stufe (${forceLevel}W6) + Mod. (${forceMod}W6) = <strong>${basePool}W6</strong> (davon 1 Hazard-Di).</p>
              <p>Jeder freiwillig reduzierte Würfel aus dem Pool erzeugt <strong>+1 Kraftstufe [KS]</strong> zur Effektsteigerung oder Zielkorridor-Anpassung.</p>
            </div>
            <div class="form-group">
              <label>Würfelreduktion für Kraftstufen [KS] (0 bis ${Math.max(0, basePool - 1)})</label>
              <input type="number" name="diceToReduce" value="0" min="0" max="${Math.max(
                0,
                basePool - 1
              )}" step="1" />
            </div>
            <div class="form-group">
              <label>Überanstrengungskosten (Psyche-Abzug)</label>
              <input type="number" name="overexertionCost" value="0" min="0" step="1" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.TargetNumber", "Schwellenwert (MW)")}</label>
              <input type="number" name="targetNumber" value="10" min="1" step="1" />
            </div>
          </div>
        `,
        parseForm: (form) => ({
          diceToReduce: Math.min(
            Math.max(0, basePool - 1),
            Math.max(0, Number(form.elements.diceToReduce?.value) || 0)
          ),
          overexertionCost: Math.max(0, Number(form.elements.overexertionCost?.value) || 0),
          targetNumber: Math.max(1, Number(form.elements.targetNumber?.value) || 10)
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      diceToReduce = dialogResult.diceToReduce;
      overexertionCost = dialogResult.overexertionCost;
      targetNumber = dialogResult.targetNumber;
    }

    if (overexertionCost > 0 && actor?.system?.status?.psyche) {
      const curPsy = Number(actor.system.status.psyche.value) || 0;
      await actor.update({ "system.status.psyche.value": Math.max(0, curPsy - overexertionCost) });
    }

    const activePool = Math.max(1, basePool - diceToReduce - woundPenalty);
    const poolBreakdown = `Dynamischer Pool: ${basePool}W6 (Basis) - ${diceToReduce}W6 (in [KS]) - ${woundPenalty}W6 (Mali) = ${activePool}W6 | Generierte [KS]: ${diceToReduce} | Überanstrengung: ${overexertionCost} Psyche`;

    return this.executeCheck({
      actor,
      title: forceItem.name,
      flavorSubtitle: poolBreakdown,
      attributeDice: activePool,
      skillDice: 0,
      bonusDice: 0,
      woundPenalty: 0,
      targetNumber,
      useHazardDie: true
    });
  }

  /**
   * 6B. PSI-APP-PROBE (Punkt 4 & Punkt 5)
   * Live-Pool-Rechner im Dialog:
   *  - Aktueller Würfelpool optisch groß & prominent hervorgehoben
   *  - Numerische Spinner-Inputs für:
   *      1. Dynamischer Pool
   *      2. Vorab gesammelte Kraftstufe
   *      3. Zielkorridor-Änderung / Anpassung
   *      4. Überanstrengungskosten
   *  - Echtzeit-Neuberechnung des End-Würfelpools bei jeder Änderung
   *  - Bestehende Chat-Ausgabe + aufklappbarer Würfel-Spoiler mit Hazard-Die-Hervorhebung
   */
  static async rollPsiApp(actor, appItem, { skipDialog = false } = {}) {
    if (!appItem) return null;
    const sys = appItem.system || {};
    const tier = Number(sys.tier || sys.level || 1);

    if (sys.pyramidValid === false) {
      ui.notifications?.warn(
        sys.pyramidReason ||
          `PSI-Pyramide nicht erfüllt: Für ${appItem.name} (App-Stufe ${tier}) fehlen Voraussetzungen!`
      );
      if (tier >= 2) return null;
    }

    const basePool = Math.max(1, Number(sys.forcePool || sys.forceLevel || 1));
    const baseMin = Number(sys.targetMin || 8);
    const baseMax = Number(sys.targetMax || 12);
    const defaultExhaustion = Math.max(0, Number(sys.exhaustionCost) || 0);
    const woundPenalty = Number(actor?.system?.health?.gesamteMali || 0);
    const initialDynamicPool = Math.max(1, basePool - woundPenalty);
    const initialEndPool = Math.max(1, initialDynamicPool + defaultExhaustion);

    let dynamicPool = initialDynamicPool;
    let gatheredKs = 0;
    let corridorAdjust = 0;
    let overexertionCost = defaultExhaustion;
    let customTargetMin = baseMin;
    let customTargetMax = baseMax;

    if (!skipDialog) {
      const dialogResult = await this._waitDialog({
        title: `PSI-App wirken: ${appItem.name} (${sys.psiForceLabel || sys.psiForce}, Kat. ${
          sys.category || "A"
        }, App-Stufe ${tier})`,
        rollLabel: "PSI-App wirken",
        rollIcon: "fas fa-brain",
        onRender: (_event, dialog) => {
          const el = dialog?.element || document.querySelector(".noreturn-roll-dialog.psi-dialog");
          if (!el) return;
          const inputs = el.querySelectorAll(".nr-live-psi-input");
          inputs.forEach((inp) => {
            inp.addEventListener("input", () => NoReturnRoll.updatePsiDialogLive(inp));
            inp.addEventListener("change", () => NoReturnRoll.updatePsiDialogLive(inp));
          });
          NoReturnRoll.updatePsiDialogLive(el);
        },
        content: `
          <div class="noreturn-roll-dialog psi-dialog" data-base-pool="${initialDynamicPool}" data-base-min="${baseMin}" data-base-max="${baseMax}">
            <div class="nr-psi-live-pool-banner">
              <div class="nr-psi-live-pool-title">AKTUELLER END-WÜRFELPOOL</div>
              <div class="nr-psi-live-pool-value" data-live-pool>${initialEndPool}W6</div>
              <div class="nr-psi-live-pool-formula" data-live-formula>
                Dynamischer Pool (${initialDynamicPool}W6) + Vorab-KS (+0W6) ±0W6 (Korridor) + Überanstrengung (+${defaultExhaustion}W6)
              </div>
              <div class="nr-psi-live-pool-metrics">
                <span>Effektiver Zielkorridor: <strong data-live-corridor>${baseMin} – ${baseMax}</strong></span>
                <span>Effekt-[KS]: <strong data-live-ks>0 [KS]</strong></span>
                <span>Überanstrengung: <strong data-live-overexertion>${defaultExhaustion} Psyche</strong></span>
              </div>
            </div>

            <div class="nr-psi-pool-rules">
              <strong><i class="fas fa-circle-info"></i> Dynamischer PSI-Würfelpool (GRW S. 190):</strong>
              <p><strong>Basis-Pool (${sys.psiForceLabel || sys.psiForce}):</strong> ${basePool}W6${
          woundPenalty > 0 ? ` | <strong>Wundmali:</strong> -${woundPenalty}W6` : ""
        }</p>
            </div>

            <div class="form-group">
              <label>${this._i18n("NORETURN.PSI.DynamicPoolCounter", "Dynamischer Pool")} (Basis: ${initialDynamicPool}W6)</label>
              <input type="number" name="dynamicPool" class="nr-live-psi-input" value="${initialDynamicPool}" min="1" max="30" step="1" oninput="window.NoReturnRoll?.updatePsiDialogLive?.(this)" onchange="window.NoReturnRoll?.updatePsiDialogLive?.(this)" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.PSI.GatheredKsCounter", "Vorab gesammelte Kraftstufe")}</label>
              <input type="number" name="gatheredKs" class="nr-live-psi-input" value="0" min="0" max="20" step="1" oninput="window.NoReturnRoll?.updatePsiDialogLive?.(this)" onchange="window.NoReturnRoll?.updatePsiDialogLive?.(this)" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.PSI.CorridorAdjustCounter", "Zielkorridor-Änderung / Anpassung")}</label>
              <input type="number" name="corridorAdjust" class="nr-live-psi-input" value="0" min="-10" max="20" step="1" oninput="window.NoReturnRoll?.updatePsiDialogLive?.(this)" onchange="window.NoReturnRoll?.updatePsiDialogLive?.(this)" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.PSI.OverexertionCounter", "Überanstrengungskosten")}</label>
              <input type="number" name="overexertionCost" class="nr-live-psi-input" value="${defaultExhaustion}" min="0" max="50" step="1" oninput="window.NoReturnRoll?.updatePsiDialogLive?.(this)" onchange="window.NoReturnRoll?.updatePsiDialogLive?.(this)" />
            </div>
            <div class="form-group">
              <label>Schwellenwert / Basis-Zielkorridor (Min – Max)</label>
              <div class="flexrow">
                <input type="number" name="targetMin" class="nr-live-psi-input" value="${baseMin}" min="1" step="1" oninput="window.NoReturnRoll?.updatePsiDialogLive?.(this)" onchange="window.NoReturnRoll?.updatePsiDialogLive?.(this)" />
                <input type="number" name="targetMax" class="nr-live-psi-input" value="${baseMax}" min="1" step="1" oninput="window.NoReturnRoll?.updatePsiDialogLive?.(this)" onchange="window.NoReturnRoll?.updatePsiDialogLive?.(this)" />
              </div>
            </div>
          </div>
        `,
        parseForm: (form) => ({
          dynamicPool: Math.max(1, Number(form.elements.dynamicPool?.value) || initialDynamicPool),
          gatheredKs: Math.max(0, Number(form.elements.gatheredKs?.value) || 0),
          corridorAdjust: Number(form.elements.corridorAdjust?.value) || 0,
          overexertionCost: Math.max(0, Number(form.elements.overexertionCost?.value) || 0),
          targetMin: Math.max(1, Number(form.elements.targetMin?.value) || baseMin),
          targetMax: Math.max(1, Number(form.elements.targetMax?.value) || baseMax)
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      dynamicPool = dialogResult.dynamicPool;
      gatheredKs = dialogResult.gatheredKs;
      corridorAdjust = dialogResult.corridorAdjust;
      overexertionCost = dialogResult.overexertionCost;
      customTargetMin = dialogResult.targetMin;
      customTargetMax = dialogResult.targetMax;
    }

    const diceToReduce = Math.max(0, initialDynamicPool - dynamicPool);
    const totalKs = Math.max(0, diceToReduce + gatheredKs);
    const rangeExpandKs = corridorAdjust;
    const effectKs = Math.max(0, totalKs - Math.max(0, rangeExpandKs));
    const effectiveMin = Math.max(1, customTargetMin - rangeExpandKs);
    const effectiveMax = Math.max(effectiveMin, customTargetMax + rangeExpandKs);

    const activePool = Math.max(1, dynamicPool + gatheredKs - corridorAdjust + overexertionCost);
    const normalDice = Math.max(0, activePool - 1);
    const formula = normalDice > 0 ? `${normalDice}d6 + 1d6x6` : "1d6x6";

    let roll = new Roll(formula);
    await roll.evaluate();
    let total = roll.total;
    let masteryRerolled = false;
    let firstAttemptTotal = null;

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
      const deviation = total < effectiveMin ? effectiveMin - total : total - effectiveMax;
      const tableNum = total < 5 || deviation >= 9 ? 3 : deviation >= 5 ? 2 : 1;
      mishapResult = await this.rollPsiMishapTable(tableNum, actor, { postSeparateMessage: false });
      mishapHtml = `
        <div class="condition-details psi-mishap-box">
          <p><strong><i class="fas fa-skull-crossbones"></i> ${mishapResult.tableName} (1W6 = ${mishapResult.rollTotal}):</strong></p>
          <p>${mishapResult.resultText}</p>
        </div>
      `;
    }

    const psycheCost = Math.max(0, overexertionCost);
    if (psycheCost > 0 && actor?.system?.status?.psyche) {
      const curPsy = Number(actor.system.status.psyche.value) || 0;
      await actor.update({ "system.status.psyche.value": Math.max(0, curPsy - psycheCost) });
    }

    const statusClass = isSuccess ? "success" : "failure";
    const statusLabel = isSuccess
      ? `ZIELBEREICH GETROFFEN (${effectiveMin}–${effectiveMax}) – ERFOLG`
      : `ZIELBEREICH VERFEHLT (${effectiveMin}–${effectiveMax}) – PSIONISCHER PATZER!`;
    const diceSpoilerHtml = this.buildDiceSpoilerHtml(roll);

    const content = `
      <div class="noreturn-chat-card psi-card">
        <header class="card-header">
          <h3><i class="fas fa-brain"></i> ${appItem.name} (App-Stufe ${tier})</h3>
          <span class="card-subtitle">${sys.psiForceLabel || sys.psiForce} (Kategorie ${
      sys.category || "A"
    })</span>
        </header>
        <div class="psi-app-details">
          <strong>Dynamischer Würfelpool:</strong> ${dynamicPool}W6 (Dynamisch) + ${gatheredKs}W6 (Vorab-KS) - ${corridorAdjust}W6 (Zielkorridor-Anpassung) + ${overexertionCost}W6 (Überanstrengung) = <strong>${activePool}W6</strong> (<code>${formula}</code>)<br/>
          <strong>Kraftstufen [KS]:</strong> ${totalKs} Gesamt (${diceToReduce} aus Pool + ${gatheredKs} gesammelt) → ${rangeExpandKs} für Zielkorridor-Änderung / Anpassung (±${rangeExpandKs}), <strong>${effectKs} [KS] für App-Effekt</strong><br/>
          <strong>Überanstrengungskosten:</strong> ${psycheCost} Psyche | <strong>Aktionskosten:</strong> ${
      totalKs > 0 ? "2 Aktionen (mit [KS])" : sys.cost || "1 Aktion"
    }
        </div>
        ${
          masteryRerolled
            ? `<div class="card-meta"><span><em>Meisterschafts-Reroll genutzt (1. Wurf war ${firstAttemptTotal})</em></span></div>`
            : ""
        }
        ${diceSpoilerHtml}
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
        ${isSuccess ? `<div class="condition-details">${sys.description || ""}</div>` : mishapHtml}
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
   * Generic fallback wrapper (`promptAndRoll`) with strict cancel check.
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
    if (skillDice === 0 && !burstMode) {
      return this.rollAttributeCheck(actor, {
        label: title,
        attributeDice: attributeDice + bonusDice,
        alphaBio: allAttributeHazard,
        targetNumber,
        skipDialog
      });
    }

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

    if (!skipDialog) {
      const dialogResult = await this._waitDialog({
        title: `${this._i18n("NORETURN.Dice.RollDialogTitle", "NoReturn Würfelprobe")}: ${title}`,
        content: `
          <div class="noreturn-roll-dialog">
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.Pool", "Basis-Würfelpool (W6)")}</label>
              <input type="number" name="basePoolDisplay" value="${
                config.attributeDice + config.skillDice
              }" disabled />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.BonusDice", "Modifikatoren (+/- W6)")}</label>
              <input type="number" name="bonusDice" value="${config.bonusDice}" step="1" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.TargetNumber", "Schwellenwert (MW)")}</label>
              <input type="number" name="targetNumber" value="${config.targetNumber}" min="1" step="1" />
            </div>
          </div>
        `,
        parseForm: (form) => ({
          bonusDice: Number(form.elements.bonusDice?.value) || 0,
          targetNumber: Math.max(1, Number(form.elements.targetNumber?.value) || 10)
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      config = { ...config, ...dialogResult };
    }

    return this.executeCheck({
      actor,
      title,
      flavorSubtitle,
      ...config
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
   * Roll on one of the PSI Mishap / Overload Rollable Tables (1, 2, 3, or "overload").
   */
  static async rollPsiMishapTable(tableKey = 1, actor = null, { postSeparateMessage = true } = {}) {
    const tableDef = PSI_MISHAP_TABLES[tableKey] || PSI_MISHAP_TABLES[1];
    let rollTotal = 1;
    let resultText = "";
    let roll = null;

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
        <div class="noreturn-chat-card condition-card mishap-card">
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
   * Roll 2d6 to determine the NoReturn Hit Zone (Trefferzone 2-12) with collapsible dice spoiler (Punkt 5).
   */
  static async rollHitZone(actor = null) {
    const roll = new Roll("2d6");
    await roll.evaluate();
    const zoneCode = String(roll.total);
    const lethalZones = new Set(["12", "8", "7", "6", "2"]);
    const isLethal = lethalZones.has(zoneCode);
    const zoneLabel = this._i18n(`NORETURN.Health.Zones.${zoneCode}`, `Zone ${zoneCode}`);
    const lethalTag = isLethal
      ? `<span class="noreturn-badge lethal">${this._i18n("NORETURN.Health.Lethal", "Tödlich")}</span>`
      : "";
    const diceSpoilerHtml = this.buildDiceSpoilerHtml(roll);

    const content = `
      <div class="noreturn-chat-card hitzone-card">
        <header class="card-header">
          <h3><i class="fas fa-crosshairs"></i> ${this._i18n(
            "NORETURN.Health.RollHitZone",
            "Trefferzone (2W6)"
          )}</h3>
        </header>
        <div class="card-result">
          <div class="hitzone-number">${zoneCode}</div>
          <div class="hitzone-name">${zoneLabel} ${lethalTag}</div>
        </div>
        ${diceSpoilerHtml}
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
   * Hilfsfunktion: Löst Ziel-Token und Ziel-Actor aus einer gespeicherten Attack-/Damage-Flow-Flag-Struktur auf.
   */
  static _resolveFlowTarget(flow = {}) {
    let token = null;
    let actor = null;
    if (flow.targetTokenId && canvas?.tokens) {
      token = canvas.tokens.get(flow.targetTokenId) || null;
      actor = token?.actor || null;
    }
    if (!actor && flow.targetActorId && game?.actors) {
      actor = game.actors.get(flow.targetActorId) || null;
    }
    if (!actor) {
      const controlled = canvas?.tokens?.controlled?.[0] || game?.user?.targets?.first?.() || null;
      if (controlled?.actor) {
        token = controlled;
        actor = controlled.actor;
      } else if (game?.user?.character) {
        actor = game.user.character;
      }
    }
    return { token, actor };
  }

  /**
   * Liest Rüstungswert (RW) und Materialkategorie (MK) einer Trefferzone des Ziels aus.
   */
  static _getActorZoneArmor(actor, zoneCode = "7") {
    if (!actor) return { rw: 0, mk: "A" };
    if (actor.type === "robot") {
      const rw = Number(actor.system?.zones?.[zoneCode]?.values?.panzerung ?? 0);
      const mk = actor.system?.zones?.[zoneCode]?.values?.materialCategory ?? "B";
      return { rw, mk };
    }
    const z = actor.system?.health?.zones?.[zoneCode] || {};
    const rw = Number(z.equippedArmor ?? z.armor ?? 0);
    const mk = z.materialCategory || "A";
    return { rw, mk };
  }

  /**
   * Punkt 5 – Schritt 2: Verteidigungswurf des Ziels & automatische Trefferauswertung.
   */
  static async rollTargetDefense(message) {
    const attackFlow = message?.flags?.noreturn?.attackFlow;
    if (!attackFlow) return null;

    const { token, actor: defender } = this._resolveFlowTarget(attackFlow);
    if (!defender) {
      ui.notifications?.warn(
        "Kein Ziel-Charakter gefunden! Bitte Ziel-Token auswählen oder anvisieren."
      );
      return null;
    }

    const sk = Math.max(1, getEffectiveActorAttribute(defender, "schnelligkeit") || 1);
    const ge = Math.max(1, getEffectiveActorAttribute(defender, "geschick") || 1);
    const woundPenalty = Math.max(0, Number(defender.system?.health?.gesamteMali || 0));

    const findSkillLvl = (id, namePart) => {
      const it = defender.items?.find(
        (i) =>
          i.type === "skill" &&
          (i.system?.skillId === id || i.name?.toLowerCase().includes(namePart))
      );
      if (!it) return 0;
      return Math.max(0, (Number(it.system?.level) || 0) + (Number(it.system?.effectiveMod ?? it.system?.mod) || 0));
    };

    const dodgeLvl = findSkillLvl("ausweichen", "ausweichen");
    const meleeLvl = findSkillLvl("nahkampf", "nahkampf");
    const weaponCombatLvl = findSkillLvl("waffenkampf", "waffenkampf");
    const reaktionLvl = findSkillLvl("reaktion", "reaktion");

    const dodgePool = Math.max(1, sk + dodgeLvl);
    const parryMeleePool = Math.max(1, ge + meleeLvl);
    const parryWeaponPool = Math.max(1, ge + weaponCombatLvl);
    const reaktionPool = Math.max(1, sk + reaktionLvl);

    const dialogRes = await this._waitDialog({
      title: `Verteidigung würfeln: ${token?.name || defender.name} gegen ${attackFlow.weaponName}`,
      rollLabel: "Verteidigung würfeln",
      rollIcon: "fas fa-shield-halved",
      content: `
        <div class="noreturn-roll-dialog defense-dialog">
          <div class="form-group">
            <label>Gegnerischer Angriffswert (${attackFlow.attackerName} – ${attackFlow.weaponName})</label>
            <input type="text" value="Angriff: ${attackFlow.attackTotal}${attackFlow.coverMod > 0 ? ` (Deckungsbonus für Verteidiger: +${attackFlow.coverMod})` : ""}" disabled />
          </div>
          <div class="form-group">
            <label>Verteidigungsart wählen</label>
            <select name="defenseType">
              <option value="dodge">Ausweichen: SK (${sk}) + Ausweichen (${dodgeLvl}) = ${dodgePool}W6</option>
              ${
                !attackFlow.isRanged
                  ? `<option value="parryMelee">Parade (Nahkampf): GE (${ge}) + Nahkampf (${meleeLvl}) = ${parryMeleePool}W6</option>
                     <option value="parryWeapon">Parade (Waffenkampf): GE (${ge}) + Waffenkampf (${weaponCombatLvl}) = ${parryWeaponPool}W6</option>`
                  : ""
              }
              <option value="reaktion">Reaktion: SK (${sk}) + Reaktion (${reaktionLvl}) = ${reaktionPool}W6</option>
            </select>
          </div>
          <div class="form-group">
            <label>Situationsmodifikator (+/- W6)</label>
            <input type="number" name="situationalMod" value="0" step="1" />
          </div>
          <div class="form-group">
            <label>Wund- / Schmerzmali (-W6)</label>
            <input type="number" name="woundPenalty" value="${woundPenalty}" min="0" step="1" />
          </div>
        </div>
      `,
      parseForm: (form) => ({
        defenseType: form.elements.defenseType?.value || "dodge",
        situationalMod: Number(form.elements.situationalMod?.value) || 0,
        woundPenalty: Math.max(0, Number(form.elements.woundPenalty?.value ?? woundPenalty) || 0)
      })
    });

    if (!dialogRes || dialogRes.cancelled) return null;

    let baseDefPool = dodgePool;
    let defLabel = `Ausweichen (${dodgePool}W6)`;
    if (dialogRes.defenseType === "parryMelee") {
      baseDefPool = parryMeleePool;
      defLabel = `Parade Nahkampf (${parryMeleePool}W6)`;
    } else if (dialogRes.defenseType === "parryWeapon") {
      baseDefPool = parryWeaponPool;
      defLabel = `Parade Waffenkampf (${parryWeaponPool}W6)`;
    } else if (dialogRes.defenseType === "reaktion") {
      baseDefPool = reaktionPool;
      defLabel = `Reaktion (${reaktionPool}W6)`;
    }

    const totalPool = Math.max(
      1,
      baseDefPool + dialogRes.situationalMod - dialogRes.woundPenalty
    );
    const normalDice = Math.max(0, totalPool - 1);
    const formula = normalDice > 0 ? `${normalDice}d6 + 1d6x6` : "1d6x6";

    const defRoll = new Roll(formula);
    await defRoll.evaluate();
    const coverMod = Number(attackFlow.coverMod) || 0;
    const defenseTotal = defRoll.total + coverMod;
    const attackTotal = Number(attackFlow.attackTotal) || 0;
    const isHit = attackTotal >= defenseTotal;
    const margin = attackTotal - defenseTotal;
    const step = Number(attackFlow.goodHitStep) || 10;
    const goodHits = isHit && margin >= step ? Math.floor(margin / step) : 0;

    const diceSpoilerHtml = this.buildDiceSpoilerHtml(defRoll);

    const content = `
      <div class="noreturn-chat-card check-card ${isHit ? "failure" : "success"}">
        <header class="card-header">
          <h3><i class="fas fa-shield-halved"></i> Verteidigung – ${token?.name || defender.name}</h3>
          <div class="card-subtitle">${defLabel}${coverMod > 0 ? ` + Deckung (+${coverMod})` : ""} gegen ${attackFlow.weaponName}</div>
        </header>
        ${diceSpoilerHtml}
        <div class="card-outcome">
          <div class="outcome-numbers">
            <div class="outcome-box">
              <span class="lbl">Angriffswert</span>
              <span class="val">${attackTotal}</span>
            </div>
            <div class="outcome-box">
              <span class="lbl">Verteidigung</span>
              <span class="val total-val">${defenseTotal}</span>
            </div>
            <div class="outcome-box">
              <span class="lbl">Differenz</span>
              <span class="val">${margin >= 0 ? `+${margin}` : margin}</span>
            </div>
            ${
              goodHits > 0
                ? `<div class="outcome-box good-hits-box">
                     <span class="lbl">Gute Treffer (je ${step})</span>
                     <span class="val">+${goodHits}W6</span>
                   </div>`
                : ""
            }
          </div>
          <div class="outcome-banner">
            ${
              isHit
                ? `<span class="banner-failure"><i class="fas fa-crosshairs"></i> TREFFER! (Angriff ${attackTotal} ≥ Verteidigung ${defenseTotal}${
                    goodHits > 0 ? `, +${goodHits}W6 Gute Treffer` : ""
                  })</span>`
                : `<span class="banner-success"><i class="fas fa-shield-halved"></i> VERFEHLT! (${
                    token?.name || defender.name
                  } weicht dem Angriff erfolgreich aus!)</span>`
            }
          </div>
        </div>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: defender, token }),
      flavor: `Verteidigung gegen ${attackFlow.weaponName}`,
      content,
      rolls: [defRoll]
    });

    if (isHit) {
      const updatedFlow = {
        ...attackFlow,
        targetActorId: defender.id,
        targetTokenId: token?.id || attackFlow.targetTokenId || "",
        targetName: token?.name || defender.name
      };
      await this.resolveHitAndDamage(updatedFlow, {
        margin,
        goodHits,
        defenseTotal
      });
    }

    return { defRoll, defenseTotal, isHit, margin, goodHits };
  }

  /**
   * Punkt 5 – Schritt 3: Trefferzonen-Ermittlung (2W6 bzw. 3×2W6 bei Vollautomatik),
   * Rüstungs-/MK-Penetrationsprüfung & Schadensberechnung (inkl. Gute Treffer & Munitions-Modifikator).
   */
  static async resolveHitAndDamage(
    attackFlow,
    { margin = 0, goodHits = 0, defenseTotal = null } = {}
  ) {
    if (!attackFlow) return null;
    const attacker = game?.actors?.get(attackFlow.attackerActorId) || null;
    const { token: targetToken, actor: targetActor } = this._resolveFlowTarget(attackFlow);

    const isRanged = Boolean(attackFlow.isRanged);
    const zoneRollsCount = Math.max(1, Number(attackFlow.zoneRollsCount) || 1);
    const ammoInfo = attackFlow.loadedAmmo || {
      code: "FMJ",
      label: "Vollmantel (FMJ)",
      damageBonus: 0,
      ignoresMk: [],
      blockedByMk: []
    };

    const hits = [];
    const allRolls = [];
    const lethalZones = new Set(["12", "8", "7", "6", "2"]);

    for (let i = 0; i < zoneRollsCount; i++) {
      let zoneCode = attackFlow.calledZone;
      let zoneRoll = null;
      if (!zoneCode) {
        zoneRoll = new Roll("2d6");
        await zoneRoll.evaluate();
        allRolls.push(zoneRoll);
        zoneCode = String(zoneRoll.total);
      }
      const zoneLabel = this._i18n(`NORETURN.Health.Zones.${zoneCode}`, `Zone ${zoneCode}`);
      const isLethal = lethalZones.has(zoneCode);
      const { rw, mk } = this._getActorZoneArmor(targetActor, zoneCode);

      const isBlockedByMk = isRanged && rw > 0 && (ammoInfo.blockedByMk || []).includes(mk);
      const isArmorIgnored = isRanged && rw > 0 && (ammoInfo.ignoresMk || []).includes(mk);
      const effectiveRw = isArmorIgnored ? 0 : rw;

      let damageFormula = "";
      let damageTotal = 0;
      let damageRoll = null;

      if (!isBlockedByMk) {
        if (!isRanged) {
          const st = Math.max(1, Number(attackFlow.staerke) || 1);
          const diceCount = Math.max(1, st + goodHits);
          const normalDice = Math.max(0, diceCount - 1);
          const diceExpr = normalDice > 0 ? `${normalDice}d6 + 1d6x6` : `1d6x6`;
          const flat = Number(attackFlow.baseDamage) || 0;
          damageFormula = flat > 0 ? `${diceExpr} + ${flat}` : diceExpr;
        } else {
          const flat = Number(attackFlow.flatShotDamage) || 0;
          damageFormula = goodHits > 0 ? `${flat} + ${goodHits}d6` : `${flat}`;
        }
        damageRoll = new Roll(damageFormula);
        await damageRoll.evaluate();
        allRolls.push(damageRoll);
        damageTotal = damageRoll.total;
      }

      hits.push({
        hitIndex: i,
        zoneCode,
        zoneLabel,
        isLethal,
        zoneRollFormula: zoneRoll ? `2W6 = ${zoneCode}` : "Gezielt",
        rw,
        mk,
        effectiveRw,
        isBlockedByMk,
        isArmorIgnored,
        damageFormula,
        damageTotal,
        damageSpoilerHtml: damageRoll ? this.buildDiceSpoilerHtml(damageRoll) : ""
      });
    }

    const hitsHtml = hits
      .map((h) => {
        const lethalBadge = h.isLethal
          ? `<span class="noreturn-badge lethal">${this._i18n("NORETURN.Health.Lethal", "Tödlich")}</span>`
          : "";
        if (h.isBlockedByMk) {
          return `
            <div class="nr-hit-block" style="padding:8px;margin-top:6px;background:rgba(35,65,45,0.4);border-left:3px solid #4caf50;border-radius:4px;">
              <div><strong>Trefferzone (${h.zoneRollFormula}):</strong> ${h.zoneLabel} ${lethalBadge} | <strong>Rüstung:</strong> RW ${h.rw} (MK:${h.mk})</div>
              <div class="card-outcome success" style="margin-top:6px;">
                <strong><i class="fas fa-shield-virus"></i> Abgeprallt! Die Munition (${ammoInfo.label}) durchdringt die Materialkategorie (MK:${h.mk}) der Panzerung an dieser Zone nicht (0 Schaden).</strong>
              </div>
            </div>
          `;
        }

        const penNote = h.isArmorIgnored
          ? `<div style="color:#ff9800;font-size:0.85em;margin-top:2px;"><i class="fas fa-burst"></i> ${ammoInfo.label} durchschlägt / ignoriert MK:${h.mk} komplett (Effektiver RW = 0 statt ${h.rw})!</div>`
          : `<div style="font-size:0.85em;opacity:0.85;margin-top:2px;">Panzerung an Zone: RW ${h.effectiveRw} (MK:${h.mk})</div>`;

        return `
          <div class="nr-hit-block" style="padding:8px;margin-top:6px;background:rgba(50,25,25,0.4);border-left:3px solid #e53935;border-radius:4px;">
            <div><strong>Trefferzone (${h.zoneRollFormula}):</strong> ${h.zoneLabel} ${lethalBadge}</div>
            ${penNote}
            <div style="margin-top:4px;"><strong>Gesamtschaden:</strong> <span style="font-size:1.2em;color:#ff6b6b;font-weight:700;">${h.damageTotal} TP</span> (<code>${h.damageFormula}</code>)</div>
            ${h.damageSpoilerHtml}
            <div class="card-actions" style="margin-top:6px;">
              <button type="button" class="noreturn-chat-btn" data-action="roll-target-soak" data-hit-index="${h.hitIndex}">
                <i class="fas fa-shield-halved"></i> Schadenswiderstand würfeln (KO + Rüstung) – ${h.zoneLabel}
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    const damageFlow = {
      ...attackFlow,
      targetActorId: targetActor?.id || attackFlow.targetActorId || "",
      targetTokenId: targetToken?.id || attackFlow.targetTokenId || "",
      targetName: targetToken?.name || targetActor?.name || attackFlow.targetName || "Ziel",
      margin,
      goodHits,
      defenseTotal,
      hits: hits.map((h) => ({
        hitIndex: h.hitIndex,
        zoneCode: h.zoneCode,
        zoneLabel: h.zoneLabel,
        isLethal: h.isLethal,
        rw: h.rw,
        mk: h.mk,
        effectiveRw: h.effectiveRw,
        isBlockedByMk: h.isBlockedByMk,
        isArmorIgnored: h.isArmorIgnored,
        damageFormula: h.damageFormula,
        damageTotal: h.damageTotal
      }))
    };

    const content = `
      <div class="noreturn-chat-card damage-card">
        <header class="card-header">
          <h3><i class="fas fa-burst"></i> ${attackFlow.weaponName} – Treffer &amp; Schaden</h3>
          <div class="card-subtitle">${attackFlow.modeDisplayLabel} | Ziel: ${damageFlow.targetName}</div>
        </header>
        <div class="card-meta">
          <span>Munition: <strong>${ammoInfo.label}</strong></span>
          <span>Gute Treffer: <strong>+${goodHits}W6</strong> (Überschuss: ${margin >= 0 ? `+${margin}` : margin})</span>
        </div>
        ${hitsHtml}
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: attacker }),
      flavor: `${attackFlow.weaponName} – Trefferauswertung`,
      content,
      rolls: allRolls,
      flags: {
        noreturn: {
          damageFlow
        }
      }
    });

    return damageFlow;
  }

  /**
   * Punkt 5 – Schritt 4A: Schadenswiderstand (Soak) des Ziels aus dem Chat würfeln:
   * Konstitution (W6 inkl. 1 Hazard-Di, niemals Maluswürfel!) + effektiver Rüstungswert (RW) der getroffenen Zone.
   */
  static async rollTargetSoak(message, hitIndex = 0) {
    const damageFlow = message?.flags?.noreturn?.damageFlow;
    if (!damageFlow) return null;
    const hit = damageFlow.hits?.[Number(hitIndex)] || damageFlow.hits?.[0];
    if (!hit || hit.isBlockedByMk) return null;

    const { token, actor: defender } = this._resolveFlowTarget(damageFlow);
    if (!defender) {
      ui.notifications?.warn(
        "Kein Ziel-Charakter für den Schadenswiderstand gefunden! Bitte Token auswählen."
      );
      return null;
    }

    const ko = Math.max(1, getEffectiveActorAttribute(defender, "konstitution") || 1);
    const { rw, mk } = this._getActorZoneArmor(defender, hit.zoneCode);
    const ammoInfo = damageFlow.loadedAmmo || { code: "FMJ", label: "FMJ", ignoresMk: [], blockedByMk: [] };
    const isArmorIgnored = damageFlow.isRanged && rw > 0 && (ammoInfo.ignoresMk || []).includes(mk);
    const effectiveRw = isArmorIgnored ? 0 : rw;

    // GRW S. 71: Konstitution in W6 (inkl. 1 Hazard-Di, niemals Maluswürfel!) + effektiver RW
    const normalKo = Math.max(0, ko - 1);
    const dicePart = normalKo > 0 ? `${normalKo}d6 + 1d6x6` : "1d6x6";
    const formula = effectiveRw > 0 ? `${dicePart} + ${effectiveRw}` : dicePart;

    const soakRoll = new Roll(formula);
    await soakRoll.evaluate();
    const soakTotal = soakRoll.total;
    const incomingDamage = Number(hit.damageTotal) || 0;
    const netDamage = Math.max(0, incomingDamage - soakTotal);
    const diceSpoilerHtml = this.buildDiceSpoilerHtml(soakRoll);

    const soakFlow = {
      targetActorId: defender.id,
      targetTokenId: token?.id || damageFlow.targetTokenId || "",
      targetName: token?.name || defender.name,
      zoneCode: hit.zoneCode,
      zoneLabel: hit.zoneLabel,
      incomingDamage,
      soakTotal,
      netDamage
    };

    const content = `
      <div class="noreturn-chat-card soak-card ${netDamage === 0 ? "success" : "failure"}">
        <header class="card-header">
          <h3><i class="fas fa-shield-halved"></i> Schadenswiderstand – ${soakFlow.targetName} (${hit.zoneLabel})</h3>
          <span class="card-subtitle">KO (${ko}W6, ohne Wundmali) + Effektiver RW (${effectiveRw}, MK:${mk})</span>
        </header>
        ${diceSpoilerHtml}
        <div class="card-totals-row">
          <div class="stat-box">
            <span class="stat-label">Gesamtschaden</span>
            <span class="stat-value">${incomingDamage} TP</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Widerstand (Soak)</span>
            <span class="stat-value">${soakTotal} TP</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Erlittener Schaden</span>
            <span class="stat-value">${netDamage} TP</span>
          </div>
        </div>
        <div class="card-outcome ${netDamage === 0 ? "success" : "failure"}">
          ${
            netDamage === 0
              ? `<strong><i class="fas fa-check-circle"></i> Vollständig absorbiert! (Widerstand ${soakTotal} ≥ Schaden ${incomingDamage} → 0 TP)</strong>`
              : `<strong><i class="fas fa-droplet"></i> ${soakFlow.targetName} erleidet ${netDamage} TP Schaden an Zone ${hit.zoneLabel}!</strong>`
          }
        </div>
        ${
          netDamage > 0
            ? `<div class="card-actions" style="margin-top:8px;">
                 <button type="button" class="noreturn-chat-btn danger" data-action="apply-zone-damage">
                   <i class="fas fa-heart-crack"></i> ${netDamage} TP Schaden auf ${hit.zoneLabel} anwenden
                 </button>
               </div>`
            : ""
        }
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: defender, token }),
      flavor: `Schadenswiderstand (${hit.zoneLabel})`,
      content,
      rolls: [soakRoll],
      flags: {
        noreturn: {
          soakFlow
        }
      }
    });

    return { soakRoll, soakTotal, incomingDamage, netDamage };
  }

  /**
   * Punkt 5 – Schritt 4B: Erlittenen Restschaden aus dem Chat direkt in die getroffene Trefferzone
   * des Ziels eintragen und Wundstufen / Schmerztoleranz aktualisieren.
   */
  static async applyZoneDamage(message) {
    const soakFlow = message?.flags?.noreturn?.soakFlow;
    if (!soakFlow) return null;
    if (soakFlow.applied) {
      ui.notifications?.info("Dieser Schaden wurde bereits auf die Trefferzone angewendet.");
      return null;
    }

    const { token, actor: defender } = this._resolveFlowTarget(soakFlow);
    if (!defender) {
      ui.notifications?.warn("Ziel-Charakter konnte nicht aufgelöst werden!");
      return null;
    }

    const zoneCode = String(soakFlow.zoneCode || "7");
    const netDamage = Math.max(0, Number(soakFlow.netDamage) || 0);
    if (netDamage <= 0) return null;

    if (defender.type === "robot") {
      const curDmg = Number(defender.system?.zones?.[zoneCode]?.health?.damage) || 0;
      const maxHp = Number(defender.system?.zones?.[zoneCode]?.health?.max) || 30;
      const nextDmg = Math.min(maxHp, curDmg + netDamage);
      await defender.update({
        [`system.zones.${zoneCode}.health.damage`]: nextDmg
      });
    } else {
      const curDmg = Number(defender.system?.health?.zones?.[zoneCode]?.damage) || 0;
      const maxHp =
        Number(defender.system?.health?.zones?.[zoneCode]?.max) ||
        Number(defender.system?.health?.maxHpTier) ||
        30;
      const nextDmg = Math.min(maxHp, curDmg + netDamage);
      await defender.update({
        [`system.health.zones.${zoneCode}.damage`]: nextDmg
      });
    }

    try {
      await message.setFlag("noreturn", "soakFlow", { ...soakFlow, applied: true });
    } catch (_e) {
      // Non-owner fallback
    }

    const newMali = Number(defender.system?.health?.gesamteMali) || 0;
    ui.notifications?.info(
      `${token?.name || defender.name}: +${netDamage} TP Schaden auf ${soakFlow.zoneLabel} angewendet (Gesamte Wundmali: -${newMali}W6).`
    );
    return true;
  }

  /**
   * Roll Weapon Damage (Melee ST W6 + flat, or Ranged formula + loaded ammunition bonus + Good Hits) (Punkt 3, 4 & 5).
   */
  static async rollWeaponDamage(actor, weapon, { goodHits = 0, calledZone = null } = {}) {
    const sys = weapon.system || {};
    const isRanged = Boolean(sys.isRanged || sys.weaponType === "ranged");
    const isMelee = !isRanged && sys.weaponType === "melee";
    const meleeDmgAttrKey =
      sys.meleeDamageAttrKey ||
      (/KO\s*\+/i.test(String(sys.damageFormula || "")) ? "konstitution" : "staerke");
    const staerke = Math.max(1, getEffectiveActorAttribute(actor, meleeDmgAttrKey) || 1);
    const loadedAmmo =
      sys.loadedAmmo || AMMO_TYPE_DEFINITIONS[(sys.loadedAmmoType || "FMJ").toUpperCase()] || AMMO_TYPE_DEFINITIONS.FMJ;
    const ammoDmgBonus = isRanged ? Number(loadedAmmo.damageBonus) || 0 : 0;
    const baseFlat = Number(sys.baseWeaponDamage ?? sys.damageFlat) || 0;
    const bulletDmg = Number(sys.bulletDamage ?? sys.damageBonusPerHit) || 0;
    const effectiveFlat = Number(sys.effectiveDamageFlat ?? baseFlat + bulletDmg + ammoDmgBonus);

    let formula = "";
    if (isMelee) {
      const diceCount = Math.max(1, staerke + goodHits);
      const normalDice = Math.max(0, diceCount - 1);
      const diceExpr = normalDice > 0 ? `${normalDice}d6 + 1d6x6` : `1d6x6`;
      formula = baseFlat > 0 ? `${diceExpr} + ${baseFlat}` : diceExpr;
    } else {
      const baseFormula = String(sys.effectiveDamageFormula || sys.damageFormula || "").trim();
      if (baseFormula.includes("d") || baseFormula.includes("W") || baseFormula.includes("w")) {
        const normalized = baseFormula.replace(/(\d+)\s*[wW]\s*(\d+)/g, "$1d$2").replace(/p\./gi, "");
        formula = goodHits > 0 ? `${normalized} + ${goodHits}d6` : normalized;
      } else {
        formula = goodHits > 0 ? `${effectiveFlat} + ${goodHits}d6` : `${effectiveFlat}`;
      }
    }

    const roll = new Roll(formula);
    await roll.evaluate();
    const diceSpoilerHtml = this.buildDiceSpoilerHtml(roll);

    const zoneInfo = calledZone
      ? `<div class="card-meta"><span>Gezielte Trefferzone: <strong>${this._i18n(
          `NORETURN.Health.Zones.${calledZone}`,
          `Zone ${calledZone}`
        )}</strong></span></div>`
      : "";

    const ammoInfoHtml = isRanged
      ? `<div class="card-meta ammo-meta">
          <span><i class="fas fa-bullets"></i> Munition: <strong>${
            sys.loadedAmmoName || loadedAmmo.customName || loadedAmmo.label
          }</strong></span>
          <span>${loadedAmmo.summary}</span>
        </div>`
      : "";

    const content = `
      <div class="noreturn-chat-card damage-card">
        <header class="card-header">
          <h3><i class="fas fa-burst"></i> ${weapon.name} – ${this._i18n(
      "NORETURN.Combat.Damage",
      "Schaden"
    )}</h3>
        </header>
        <div class="card-meta">
          <span>${this._i18n("NORETURN.Combat.Caliber", "Kaliber")}: <strong>${
      sys.caliber || "–"
    }</strong></span>
          <span>Formel: <code>${formula}</code></span>
        </div>
        ${ammoInfoHtml}
        ${zoneInfo}
        ${diceSpoilerHtml}
        <div class="card-total damage-total">${roll.total} TP</div>
        <div class="card-actions">
          <button type="button" class="noreturn-chat-btn" data-action="roll-hitzone">
            <i class="fas fa-crosshairs"></i> ${this._i18n(
              "NORETURN.Health.RollHitZone",
              "Trefferzone auswürfeln (2W6)"
            )}
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
   * Roll Damage Resistance / Soak (Schadenswiderstand = Konstitution W6 + effektiver Rüstungswert RW)
   * with integrated Armor Penetration query (Punkt 5 & Punkt 6).
   */
  static async rollSoak(actor, zoneCode = "7", { skipDialog = false } = {}) {
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

    const zoneLabel = this._i18n(`NORETURN.Health.Zones.${zoneCode}`, `Zone ${zoneCode}`);
    let ammoType = "FMJ";
    let incomingDamage = 0;

    if (!skipDialog) {
      const dialogResult = await this._waitDialog({
        title: `${this._i18n("NORETURN.Health.RollSoak", "Schadenswiderstand & Panzerungs-Abfrage")}: ${zoneLabel}`,
        rollIcon: "fas fa-shield-halved",
        content: `
          <div class="noreturn-roll-dialog soak-dialog">
            <div class="form-group">
              <label>${this._i18n("NORETURN.Health.Zone", "Getroffene Trefferzone")}</label>
              <input type="text" value="${zoneLabel} — KO: ${ko}W6 | Rüstung: RW ${rw} (MK:${mk})" disabled />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Combat.AmmoPenetrationQuery", "Verwendete Munition / Schadensart (Panzerungs-Abfrage)")}</label>
              <select name="ammoType">
                <option value="FMJ">Vollmantel (FMJ) / Standard — Normale Rüstungswirkung (MK:A–C)</option>
                <option value="AP">Hartkern (AP) — Durchschlägt / ignoriert MK:A komplett (RW = 0 bei MK:A)</option>
                <option value="HS">Hohlspitz (HS) — +10 TP gegen MK:A, prallt ab an MK:B & MK:C (0 Schaden!)</option>
                <option value="AF">Anti-Fahrzeug (AF) — +10 TP, durchschlägt / ignoriert MK:A & MK:B komplett</option>
              </select>
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Health.MaterialCategory", "Getroffene Materialkategorie (MK)")}</label>
              <select name="mkOverride">
                <option value="NONE" ${rw <= 0 ? "selected" : ""}>Ungepanzert (RW 0)</option>
                <option value="A" ${rw > 0 && mk === "A" ? "selected" : ""}>MK: A (Weichballistik / Leder / Kevlar)</option>
                <option value="B" ${rw > 0 && mk === "B" ? "selected" : ""}>MK: B (Hartballistik / Keramik / Robotik)</option>
                <option value="C" ${rw > 0 && mk === "C" ? "selected" : ""}>MK: C (Schwere Fahrzeug- / Militärpanzerung)</option>
              </select>
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Combat.IncomingDamageOptional", "Eingehender Roh-Schaden in TP (optional, 0 = nur Soak würfeln)")}</label>
              <input type="number" name="incomingDamage" value="0" min="0" step="1" />
            </div>
          </div>
        `,
        parseForm: (form) => ({
          ammoType: form.elements.ammoType?.value || "FMJ",
          mkOverride: form.elements.mkOverride?.value || (rw > 0 ? mk : "NONE"),
          incomingDamage: Math.max(0, Number(form.elements.incomingDamage?.value) || 0)
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      ammoType = dialogResult.ammoType;
      if (dialogResult.mkOverride === "NONE") {
        rw = 0;
      } else {
        mk = dialogResult.mkOverride;
      }
      incomingDamage = dialogResult.incomingDamage;
    }

    const ammoDef = AMMO_TYPE_DEFINITIONS[ammoType] || AMMO_TYPE_DEFINITIONS.FMJ;
    const isBlockedByArmor = rw > 0 && ammoDef.blockedByMk.includes(mk);
    const isArmorIgnored = rw > 0 && ammoDef.ignoresMk.includes(mk);
    const effectiveRw = isArmorIgnored ? 0 : rw;

    const normalKo = Math.max(0, ko - 1);
    const dicePart = normalKo > 0 ? `${normalKo}d6 + 1d6x6` : `1d6x6`;
    const formula = effectiveRw > 0 ? `${dicePart} + ${effectiveRw}` : dicePart;

    const roll = new Roll(formula);
    await roll.evaluate();
    const diceSpoilerHtml = this.buildDiceSpoilerHtml(roll);

    let penetrationBanner = "";
    let cardStatusClass = "success";
    if (isBlockedByArmor) {
      penetrationBanner = `
        <div class="card-outcome success">
          <strong><i class="fas fa-shield-virus"></i> NICHT DURCHDRUNGEN! (${ammoDef.label} prallt an MK:${mk} ab → 0 Schaden!)</strong>
        </div>
      `;
    } else if (isArmorIgnored) {
      cardStatusClass = "failure";
      penetrationBanner = `
        <div class="card-outcome failure">
          <strong><i class="fas fa-burst"></i> PANZERUNG DURCHSCHLAGEN! (${ammoDef.label} ignoriert MK:${mk} → Effektiver RW = 0 statt ${rw})</strong>
        </div>
      `;
    } else if (rw > 0) {
      penetrationBanner = `
        <div class="card-outcome">
          <strong><i class="fas fa-shield-halved"></i> Panzerung wirksam (MK:${mk}, RW ${effectiveRw}) gegen ${ammoDef.label}</strong>
        </div>
      `;
    } else {
      penetrationBanner = `
        <div class="card-outcome">
          <strong>Ungepanzerte Trefferzone (RW 0) gegen ${ammoDef.label}</strong>
        </div>
      `;
    }

    const remainingDamage = isBlockedByArmor
      ? 0
      : incomingDamage > 0
      ? Math.max(0, incomingDamage - roll.total)
      : null;

    const remainingHtml =
      incomingDamage > 0
        ? `<div class="card-totals-row">
            <div class="stat-box">
              <span class="stat-label">Roh-Schaden</span>
              <span class="stat-value">${incomingDamage} TP</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Soak Gesamt</span>
              <span class="stat-value">${isBlockedByArmor ? "Blockiert" : `${roll.total} TP`}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Restschaden</span>
              <span class="stat-value">${remainingDamage} TP</span>
            </div>
          </div>`
        : "";

    const content = `
      <div class="noreturn-chat-card soak-card ${cardStatusClass}">
        <header class="card-header">
          <h3><i class="fas fa-shield-halved"></i> ${this._i18n(
            "NORETURN.Health.RollSoak",
            "Schadenswiderstand"
          )} – ${zoneLabel}</h3>
          <span class="card-subtitle">Munition: ${ammoDef.label} | Rüstung: RW ${rw} (MK:${mk})</span>
        </header>
        <div class="card-meta">
          <span>KO (${ko}W6) + Effektiver RW (${effectiveRw})</span>
          <span>Formel: <code>${formula}</code></span>
        </div>
        ${penetrationBanner}
        ${diceSpoilerHtml}
        ${remainingHtml}
        <div class="card-total soak-total">${
          isBlockedByArmor ? "0 Schaden (Abgeprallt)" : `${roll.total} TP absorbiert`
        }</div>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content,
      rolls: [roll]
    });

    return roll;
  }
}

if (typeof globalThis !== "undefined") {
  globalThis.NoReturnRoll = NoReturnRoll;
}
