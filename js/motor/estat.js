/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/estat.js
 * ROL: La màquina d'estats pura (sense DOM) d'un exemple: seleccionar una
 *      línia, «Comprova», l'escala d'intents, les fases «Per què?» i
 *      «Corregeix-la», «No n'hi ha cap més» i els punts.
 * ARQUITECTURA:
 * - Les funcions reben l'estat S, l'exemple ex (el de js/equacions/generador.js)
 *   i la configuració cfg, i modifiquen S (i el tornen).
 * - Fases: 'busca' → (encert) 'perque' → 'corregeix' → 'busca' (si en queden)
 *   → 'fi'. Amb cfg.anuncia, s'acaba sol quan s'han trobat totes; si no,
 *   l'alumne ha de prémer «No n'hi ha cap més» / «No hi ha cap errada».
 * - Escala (docs/SPEC.md §2, F1/F2/F3): cada línia bona assenyalada s'explica
 *   i queda marcada (revisades); des del segon error s'hi afegeix cap on és
 *   l'errada; a cfg.maxIntents errors s'ensenya l'errada i l'exemple val 0.
 * - Punts: puntsAmbErrors(errors) de js/comu/punts.js (10, 2 menys per error);
 *   0 si s'ha hagut d'ensenyar alguna errada. «Per què?» i «Corregeix-la» no
 *   compten (E5).
 * - Missatges: { tipus: 'encert' | 'noEncert' | 'info', text } (R1: colors
 *   d'encert / no encert, mai vermell ni verd). Text amb $…$ per a les fórmules.
 * DEPENDÈNCIES: js/comu/punts.js.
 * ============================================================================
 */
import { puntsAmbErrors } from '../comu/punts.js';

export const CONFIG_PER_DEFECTE = { anuncia: true, perque: true, corregeix: true, maxIntents: 3 };

export const errades = ex => Object.keys(ex.errades).map(Number).sort((a, b) => a - b);
export const pendents = (S, ex) => errades(ex).filter(k => !S.trobades.includes(k));

export function nouEstat() {
    return { sel: null, trobades: [], ajuda: [], revisades: [], errors: 0, fase: 'busca', actual: null, corregides: {}, fi: false, msg: null };
}

export const punts = S => (S.ajuda.length ? 0 : puntsAmbErrors(S.errors));

/** Es pot assenyalar la línia i? (l'enunciat sí: dona un avís, sense comptar com a error) */
export const seleccionable = (S, ex, i) =>
    !S.fi && S.fase === 'busca' && i >= 0 && i < ex.linies.length && !S.trobades.includes(i) && !S.revisades.includes(i);

export function selecciona(S, ex, i) {
    if (!seleccionable(S, ex, i)) return S;
    S.sel = S.sel === i ? null : i;
    return S;
}

function direccio(S, ex, i) {
    const p = pendents(S, ex),
        amunt = p.some(k => k < i),
        avall = p.some(k => k > i);
    if (amunt && avall) return "N'hi ha una més amunt i una altra més avall.";
    if (amunt) return "L'errada és més amunt.";
    if (avall) return "L'errada és més avall.";
    return '';
}

function ensenya(S, ex, cfg, k, text) {
    S.msg = { tipus: 'noEncert', text: `${text} Mira-ho: l'errada és a la línia ${k + 1}. ${ex.errades[k].expl}` };
    S.ajuda.push(k);
    S.trobades.push(k);
    S.corregides[k] = true;
    return despres(S, ex, cfg);
}

/** «Comprova» amb la línia seleccionada. */
export function comprova(S, ex, cfg = CONFIG_PER_DEFECTE) {
    const i = S.sel;
    if (i === null || S.fase !== 'busca' || S.fi) return S;
    S.sel = null;
    if (i === 0) {
        S.msg = { tipus: 'info', text: "Aquesta és l'equació de l'enunciat: aquí no hi pot haver cap errada." };
        return S;
    }
    if (ex.errades[i]) {
        S.trobades.push(i);
        S.actual = i;
        if (cfg.perque) {
            S.fase = 'perque';
            S.msg = { tipus: 'encert', text: "Sí! L'errada és aquí. Per què és una errada?" };
        } else if (cfg.corregeix) {
            S.fase = 'corregeix';
            S.msg = { tipus: 'encert', text: `Sí! L'errada és aquí. ${ex.errades[i].expl}` };
        } else {
            S.corregides[i] = true;
            S.msg = { tipus: 'encert', text: `Sí! L'errada és aquí. ${ex.errades[i].expl}` };
            return despres(S, ex, cfg);
        }
        return S;
    }
    // una línia bona
    S.errors++;
    const p = pendents(S, ex);
    if (S.errors >= cfg.maxIntents) {
        if (p.length) return ensenya(S, ex, cfg, p[0], 'Tampoc és aquí.');
        S.msg = { tipus: 'noEncert', text: 'Aquest cop totes les línies són correctes: no hi havia cap errada.' };
        S.ajuda.push(-1);
        return acaba(S);
    }
    S.revisades.push(i);
    let t = ex.correctes[i] || 'Aquesta línia és correcta.';
    if (S.errors >= 2 && p.length) t += ' ' + direccio(S, ex, i);
    S.msg = { tipus: 'noEncert', text: 'No és aquí. ' + t };
    return S;
}

export function triaPerque(S, ex, cfg, j) {
    if (S.fase !== 'perque') return S;
    const e = ex.errades[S.actual],
        bona = !!(e.perque[j] && e.perque[j][1]);
    S.msg = { tipus: bona ? 'encert' : 'noEncert', text: (bona ? 'Exacte. ' : 'No ben bé. ') + e.expl };
    if (cfg.corregeix) {
        S.fase = 'corregeix';
        return S;
    }
    S.corregides[S.actual] = true;
    return despres(S, ex, cfg);
}

export function triaCorreccio(S, ex, cfg, j) {
    if (S.fase !== 'corregeix') return S;
    const e = ex.errades[S.actual],
        bona = !!(e.opcions[j] && e.opcions[j][1]);
    S.corregides[S.actual] = true;
    S.msg = bona
        ? { tipus: 'encert', text: 'Molt bé: així havia de quedar.' }
        : { tipus: 'noEncert', text: `No. Havia de quedar així: $${e.bona}$.` };
    return despres(S, ex, cfg);
}

function despres(S, ex, cfg) {
    S.fase = 'busca';
    S.actual = null;
    const p = pendents(S, ex);
    if (!p.length && cfg.anuncia) return acaba(S);
    if (p.length && cfg.anuncia && S.msg) S.msg = { ...S.msg, text: S.msg.text + ' Encara en queda una.' };
    return S;
}

/** «No hi ha cap errada» / «No n'hi ha cap més» (quan no es diu quantes n'hi ha). */
export function capMes(S, ex, cfg = CONFIG_PER_DEFECTE) {
    if (S.fase !== 'busca' || S.fi) return S;
    S.sel = null;
    const p = pendents(S, ex);
    if (!p.length) {
        if (!S.msg || S.msg.tipus !== 'noEncert')
            S.msg = { tipus: 'encert', text: errades(ex).length ? "Molt bé: no n'hi ha cap més." : 'Molt bé: no hi havia cap errada.' };
        return acaba(S);
    }
    S.errors++;
    if (S.errors >= cfg.maxIntents) return ensenya(S, ex, cfg, p[0], "N'hi ha alguna.");
    S.msg = {
        tipus: 'noEncert',
        text: S.trobades.length ? "Encara n'hi ha alguna més. Torna-ho a mirar línia per línia." : "N'hi ha alguna. Torna-ho a mirar línia per línia.",
    };
    return S;
}

function acaba(S) {
    S.fi = true;
    S.fase = 'fi';
    S.sel = null;
    return S;
}
