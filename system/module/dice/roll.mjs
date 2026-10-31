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
   * Central wrapper around DialogV2.wait that guarantees cancelling via "Abbrechen",
   * Escape key, or the window close button (X) always resolves with `{ cancelled: true }`.
   */
  static async _waitDialog({
    title,
    content,
    rollLabel = null,
    rollIcon = "fas fa-dice-d6",
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
   * 1. ATTRIBUTSPROBE (Punkt 3.1)
   * Dialog enthält ausschließlich: Attributswert, Situationsmodifikator (+/-), Schwellenwert.
   */
  static async rollAttributeCheck(
    actor,
    {
      attrKey = "geschick",
      label = "Attributsprobe",
      attributeDice = 1,
      alphaBio = false,
      targetNumber = 10,
      skipDialog = false
    } = {}
  ) {
    const baseAttr = Math.max(1, Number(attributeDice) || 1);
    const woundPenalty = Number(actor?.system?.health?.gesamteMali || 0);
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
          targetNumber: Math.max(1, Number(form.elements.targetNumber?.value) || 10)
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      situationalMod = dialogResult.situationalMod;
      mw = dialogResult.targetNumber;
    }

    return this.executeCheck({
      actor,
      title: label,
      flavorSubtitle: `${this._i18n("NORETURN.Dice.AttributeDialogTitle", "Attributsprobe")} (${baseAttr}W6${
        situationalMod !== 0 ? ` ${situationalMod > 0 ? `+${situationalMod}` : situationalMod}W6` : ""
      })`,
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
   * 2. FERTIGKEITSPROBE (Punkt 3.2)
   * Dialog enthält ausschließlich: Fertigkeitswert, Basisattribut, Modifikatoren, Spezialisierungs-Bonus, Schwellenwert.
   */
  static async rollSkillCheck(
    actor,
    skillItem,
    { targetNumber = 10, skipDialog = false } = {}
  ) {
    if (!skillItem) return null;
    const attrKey = skillItem.system?.attribute || "";
    const prim = actor?.system?.attributes?.primary?.[attrKey];
    const sec = actor?.system?.attributes?.secondary?.[attrKey];
    const attributeDice = prim ? Number(prim.overall) || 0 : sec ? Number(sec.total) || 0 : 0;
    const attrLabel = attrKey
      ? this._i18n(`NORETURN.Attributes.${attrKey}`, attrKey)
      : this._i18n("NORETURN.Dice.NoBaseAttribute", "Kein Basisattribut");
    const skillDice = Number(skillItem.system?.level) || 0;
    const defaultMod = Number(skillItem.system?.effectiveMod ?? skillItem.system?.mod) || 0;
    const woundPenalty = Number(actor?.system?.health?.gesamteMali || 0);

    let bonusDice = defaultMod;
    let specializationBonus = 0;
    let mw = Number(targetNumber) || 10;

    if (!skipDialog) {
      const dialogResult = await this._waitDialog({
        title: `${this._i18n("NORETURN.Dice.SkillDialogTitle", "Fertigkeitsprobe")}: ${skillItem.name}`,
        content: `
          <div class="noreturn-roll-dialog skill-dialog">
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.SkillValue", "Fertigkeitswert")} (${skillItem.name})</label>
              <input type="number" name="skillDice" value="${skillDice}" disabled />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.BaseAttribute", "Basisattribut")} (${attrLabel})</label>
              <input type="number" name="attributeDice" value="${attributeDice}" disabled />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.Modifiers", "Modifikatoren (+/- W6)")}</label>
              <input type="number" name="bonusDice" value="${defaultMod}" step="1" />
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.SpecializationBonus", "Spezialisierungs-Bonus (+W6)")}</label>
              <input type="number" name="specializationBonus" value="0" min="0" max="6" step="1" />
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
          targetNumber: Math.max(1, Number(form.elements.targetNumber?.value) || 10)
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      bonusDice = dialogResult.bonusDice;
      specializationBonus = dialogResult.specializationBonus;
      mw = dialogResult.targetNumber;
    }

    const totalBonus = bonusDice + specializationBonus;
    const subtitleParts = [`${attrLabel} (${attributeDice}W6) + Stufe (${skillDice}W6)`];
    if (specializationBonus > 0) subtitleParts.push(`Spez. (+${specializationBonus}W6)`);

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
   * 4. WAFFEN- / ANGRIFFSPROBE (Punkt 3.4)
   * Dialog enthält ausschließlich: Waffenreichweite, Zielzonen-Auswahl, Deckung des Ziels, Feuermodus
   * (sowie Verteidigung/MW des Ziels).
   */
  static async rollWeaponAttack(actor, weapon, { skipDialog = false } = {}) {
    if (!weapon) return null;
    const sys = weapon.system || {};
    const skillKey = sys.skill || "schiessen";
    const skillItem = actor?.items?.find(
      (i) =>
        i.type === "skill" &&
        (i.system.skillId === skillKey || i.name.toLowerCase() === skillKey.toLowerCase())
    );

    const attrDice = Number(actor?.system?.attributes?.primary?.geschick?.overall) || 1;
    const skillDice = Number(skillItem?.system?.level || 0);
    const weaponAttackBonus =
      (Number(sys.attackBonus) || 0) +
      (Number(skillItem?.system?.effectiveMod ?? skillItem?.system?.mod) || 0);
    const woundPenalty = Number(actor?.system?.health?.gesamteMali || 0);

    let rangeMod = 0;
    let targetZone = "random";
    let coverMod = 0;
    let fireMode = "single";
    let targetDefense = 10;

    if (!skipDialog) {
      const dialogResult = await this._waitDialog({
        title: `${this._i18n("NORETURN.Combat.RollAttack", "Waffen- / Angriffsprobe")}: ${weapon.name}`,
        rollIcon: "fas fa-crosshairs",
        content: `
          <div class="noreturn-roll-dialog weapon-dialog">
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
              <label>${this._i18n("NORETURN.Combat.FireModes", "Feuermodus")} (${sys.fireModes || "Einzel"})</label>
              <select name="fireMode">
                <option value="single">Einzelschuss / Einzelhieb (±0 W6)</option>
                <option value="semi">Halbautomatik / Doppelschuss (+1 W6)</option>
                <option value="burst">Salve (+2 W6, Überschuss je 5 Punkte)</option>
                <option value="auto">Vollautomatik / Sperrfeuer (+3 W6, Überschuss je 5 Punkte)</option>
              </select>
            </div>
            <div class="form-group">
              <label>${this._i18n("NORETURN.Dice.TargetNumber", "Basis-Verteidigung / MW des Ziels")}</label>
              <input type="number" name="targetDefense" value="10" min="1" step="1" />
            </div>
          </div>
        `,
        parseForm: (form) => ({
          rangeMod: Number(form.elements.rangeMod?.value) || 0,
          targetZone: form.elements.targetZone?.value || "random",
          coverMod: Number(form.elements.coverMod?.value) || 0,
          fireMode: form.elements.fireMode?.value || "single",
          targetDefense: Math.max(1, Number(form.elements.targetDefense?.value) || 10)
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      rangeMod = dialogResult.rangeMod;
      targetZone = dialogResult.targetZone;
      coverMod = dialogResult.coverMod;
      fireMode = dialogResult.fireMode;
      targetDefense = dialogResult.targetDefense;
    }

    const calledShotPenalty = targetZone === "random" ? 0 : targetZone === "12" ? -4 : -2;
    const fireModeBonus =
      fireMode === "auto" ? 3 : fireMode === "burst" ? 2 : fireMode === "semi" ? 1 : 0;
    const isBurstOrAuto = fireMode === "burst" || fireMode === "auto";
    const effectiveTargetMw = Math.max(1, targetDefense + coverMod);
    const totalBonusDice = weaponAttackBonus + rangeMod + calledShotPenalty + fireModeBonus;

    const zoneText =
      targetZone === "random"
        ? "Zufallszone (2W6)"
        : `Gezielt: ${this._i18n(`NORETURN.Health.Zones.${targetZone}`, `Zone ${targetZone}`)}`;

    const checkResult = await this.executeCheck({
      actor,
      title: `${weapon.name} (${this._i18n("NORETURN.Combat.RollAttack", "Angriff")})`,
      flavorSubtitle: `${zoneText} | Feuermodus: ${fireMode.toUpperCase()} | Deckung: +${coverMod} MW`,
      attributeDice: attrDice,
      skillDice,
      bonusDice: totalBonusDice,
      woundPenalty,
      targetNumber: effectiveTargetMw,
      useHazardDie: true,
      allAttributeHazard: Boolean(actor?.system?.attributes?.primary?.geschick?.alphaBio),
      allSkillHazard: Boolean(skillItem?.system?.betaBio),
      burstMode: isBurstOrAuto
    });

    if (checkResult && checkResult.isSuccess) {
      await this.rollWeaponDamage(actor, weapon, {
        goodHits: checkResult.goodHits,
        calledZone: targetZone !== "random" ? targetZone : null
      });
    }

    return checkResult;
  }

  /**
   * 5. WIDERSTANDSPROBE (KRANKHEIT / GIFT) (Punkt 3.5)
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
   * 6B. PSI-APP-PROBE (Punkt 3.6 & Punkt 4.1)
   * Dialog & Chat zeigen die konkreten Regeln und Berechnungen des dynamischen Würfelpools,
   * Überanstrengungskosten und den Schwellenwert/Zielkorridor an.
   */
  static async rollPsiApp(actor, appItem, { skipDialog = false } = {}) {
    if (!appItem) return null;
    const sys = appItem.system || {};
    const tier = Number(sys.tier || sys.level || 1);

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
    const defaultExhaustion = Math.max(0, Number(sys.exhaustionCost) || 0);
    const woundPenalty = Number(actor?.system?.health?.gesamteMali || 0);

    let diceToReduce = 0;
    let gatheredKs = 0;
    let rangeExpandKs = 0;
    let overexertionCost = defaultExhaustion;
    let customTargetMin = baseMin;
    let customTargetMax = baseMax;

    if (!skipDialog) {
      const dialogResult = await this._waitDialog({
        title: `PSI-App wirken: ${appItem.name} (${sys.psiForceLabel || sys.psiForce}, Kat. ${
          sys.category || "A"
        })`,
        rollLabel: "PSI-App wirken",
        rollIcon: "fas fa-brain",
        content: `
          <div class="noreturn-roll-dialog psi-dialog">
            <div class="nr-psi-pool-rules">
              <strong><i class="fas fa-circle-info"></i> Dynamischer PSI-Würfelpool (GRW S. 190):</strong>
              <p><strong>Basis-Pool (${sys.psiForceLabel || sys.psiForce}):</strong> ${basePool}W6 (inkl. 1 Hazard-Di) | <strong>Wundmali:</strong> -${woundPenalty}W6</p>
              <p>• <strong>Würfelreduktion:</strong> Jeder freiwillig reduzierte Würfel (max. ${Math.max(
                0,
                basePool - 1
              )}) erzeugt <strong>+1 [KS]</strong>.<br/>
                 • <strong>Kraft sammeln:</strong> Vorab gesammelte [KS] stehen zusätzlich bereit.<br/>
                 • <strong>Einsatz von [KS]:</strong> Verbreitert den Zielkorridor um <strong>±1 je [KS]</strong> oder verstärkt den App-Effekt (erhöht Zeitaufwand auf 2 Aktionen).</p>
            </div>
            <div class="form-group">
              <label>Dynamischer Pool: Würfelreduktion für [KS] (0 bis ${Math.max(0, basePool - 1)})</label>
              <input type="number" name="diceToReduce" value="0" min="0" max="${Math.max(
                0,
                basePool - 1
              )}" step="1" />
            </div>
            <div class="form-group">
              <label>Vorab gesammelte Kraftstufen [KS]</label>
              <input type="number" name="gatheredKs" value="0" min="0" max="10" step="1" />
            </div>
            <div class="form-group">
              <label>Davon [KS] für Zielkorridor-Erweiterung (±1 je [KS])</label>
              <input type="number" name="rangeExpandKs" value="0" min="0" max="10" step="1" />
            </div>
            <div class="form-group">
              <label>Überanstrengungskosten (Psyche-Punkte)</label>
              <input type="number" name="overexertionCost" value="${defaultExhaustion}" min="0" step="1" />
            </div>
            <div class="form-group">
              <label>Schwellenwert / Zielkorridor (Min – Max)</label>
              <div class="flexrow">
                <input type="number" name="targetMin" value="${baseMin}" min="1" step="1" />
                <input type="number" name="targetMax" value="${baseMax}" min="1" step="1" />
              </div>
            </div>
          </div>
        `,
        parseForm: (form) => ({
          diceToReduce: Math.min(
            Math.max(0, basePool - 1),
            Math.max(0, Number(form.elements.diceToReduce?.value) || 0)
          ),
          gatheredKs: Math.max(0, Number(form.elements.gatheredKs?.value) || 0),
          rangeExpandKs: Math.max(0, Number(form.elements.rangeExpandKs?.value) || 0),
          overexertionCost: Math.max(0, Number(form.elements.overexertionCost?.value) || 0),
          targetMin: Math.max(1, Number(form.elements.targetMin?.value) || baseMin),
          targetMax: Math.max(1, Number(form.elements.targetMax?.value) || baseMax)
        })
      });

      if (!dialogResult || dialogResult.cancelled) return null;
      diceToReduce = dialogResult.diceToReduce;
      gatheredKs = dialogResult.gatheredKs;
      overexertionCost = dialogResult.overexertionCost;
      customTargetMin = dialogResult.targetMin;
      customTargetMax = dialogResult.targetMax;
      rangeExpandKs = Math.min(diceToReduce + gatheredKs, dialogResult.rangeExpandKs);
    }

    const totalKs = diceToReduce + gatheredKs;
    const effectKs = Math.max(0, totalKs - rangeExpandKs);
    const effectiveMin = Math.max(1, customTargetMin - rangeExpandKs);
    const effectiveMax = customTargetMax + rangeExpandKs;

    const activePool = Math.max(1, basePool - diceToReduce - woundPenalty);
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

    const content = `
      <div class="noreturn-chat-card psi-card">
        <header class="card-header">
          <h3><i class="fas fa-brain"></i> ${appItem.name} (Stufe ${tier})</h3>
          <span class="card-subtitle">${sys.psiForceLabel || sys.psiForce} (Kategorie ${
      sys.category || "A"
    }, Hierarchiestufe ${sys.forceHierarchyTier || 1})</span>
        </header>
        <div class="psi-app-details">
          <strong>Dynamischer Würfelpool:</strong> ${basePool}W6 (Basis) - ${diceToReduce}W6 (Reduktion) - ${woundPenalty}W6 (Mali) = <strong>${activePool}W6</strong> (<code>${formula}</code>)<br/>
          <strong>Kraftstufen [KS]:</strong> ${totalKs} Gesamt (${diceToReduce} aus Pool + ${gatheredKs} gesammelt) → ${rangeExpandKs} [KS] für Zielkorridor (±${rangeExpandKs}), <strong>${effectKs} [KS] für App-Effekt</strong><br/>
          <strong>Überanstrengungskosten:</strong> ${psycheCost} Psyche | <strong>Aktionskosten:</strong> ${
      totalKs > 0 ? "2 Aktionen (mit [KS])" : sys.cost || "1 Aktion"
    }
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
   * Roll 2d6 to determine the NoReturn Hit Zone (Trefferzone 2-12).
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
  static async rollWeaponDamage(actor, weapon, { goodHits = 0, calledZone = null } = {}) {
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

    const zoneInfo = calledZone
      ? `<div class="card-meta"><span>Gezielte Trefferzone: <strong>${this._i18n(
          `NORETURN.Health.Zones.${calledZone}`,
          `Zone ${calledZone}`
        )}</strong></span></div>`
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
        ${zoneInfo}
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

    const zoneLabel = this._i18n(`NORETURN.Health.Zones.${zoneCode}`, `Zone ${zoneCode}`);
    const content = `
      <div class="noreturn-chat-card soak-card">
        <header class="card-header">
          <h3><i class="fas fa-shield-halved"></i> ${this._i18n(
            "NORETURN.Health.RollSoak",
            "Schadenswiderstand"
          )}</h3>
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
}
