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
 * - Fases: 'busca' → (encert) ['terme'] → 'perque' → 'corregeix' → 'busca' (si en
 *   queden) → 'fi'. La fase 'terme' (R4, nivells 4 i 5: cfg.terme) demana el terme
 *   equivocat de la línia; no treu punts, i al segon intent fallit l'ensenya. Amb cfg.anuncia, s'acaba sol quan s'han trobat totes; si no,
 *   l'alumne ha de prémer «No n'hi ha cap més» / «No hi ha cap errada».
 * - Escala (docs/SPEC.md §2, F1/F2/F3): cada línia bona assenyalada s'explica
 *   i queda marcada (revisades); des del segon error s'hi afegeix cap on és
 *   l'errada; a cfg.maxIntents errors s'ensenya l'errada i l'exemple val 0.
 * - Punts: puntsAmbErrors(errors) de js/comu/punts.js (10, 2 menys per error);
 *   0 si s'ha hagut d'ensenyar alguna errada. «Per què?» i «Corregeix-la» no
 *   compten (E5).
 * - Missatges: { tipus: 'encert' | 'noEncert' | 'info', text } i S.msgLinia, la línia
 *   de què parla (la llibreta el posa just a sota d'aquella línia; null = a baix) (R1: colors
 *   d'encert / no encert, mai vermell ni verd). Text amb $…$ per a les fórmules.
 * DEPENDÈNCIES: js/comu/punts.js.
 * ============================================================================
 */
import { puntsAmbErrors } from '../comu/punts.js';
import { escrivible, correcte } from './escriure.js';

export const CONFIG_PER_DEFECTE = { anuncia: true, perque: true, corregeix: true, terme: false, escriu: false, maxIntents: 3 };

export const errades = ex => Object.keys(ex.errades).map(Number).sort((a, b) => a - b);
export const pendents = (S, ex) => errades(ex).filter(k => !S.trobades.includes(k));

export function nouEstat() {
    // ltermes / traca: els termes encerclats i el traç (R3), mentre la línia encerclada espera «Comprova»
    return { sel: null, trobades: [], ajuda: [], revisades: [], errors: 0, fase: 'busca', actual: null, corregides: {}, termes: {}, intentsTerme: 0, intentsEscriu: 0, fi: false, msg: null, msgLinia: null, ltermes: null, traca: null };
}

export const punts = S => (S.ajuda.length ? 0 : puntsAmbErrors(S.errors));

/** Es pot assenyalar la línia i? L'enunciat (línia 0) mai: no hi pot haver cap errada (el David, 25/11/2026). */
export const seleccionable = (S, ex, i) =>
    !S.fi && S.fase === 'busca' && i >= 1 && i < ex.linies.length && !S.trobades.includes(i) && !S.revisades.includes(i);

export function selecciona(S, ex, i) {
    if (!seleccionable(S, ex, i)) return S;
    S.sel = S.sel === i ? null : i;
    S.msg = null; // en triar una altra línia, el missatge d'abans ja no hi pinta res (el David, 25/11/2026)
    S.msgLinia = null;
    S.ltermes = null;
    S.traca = null;
    return S;
}

/**
 * Encerclar amb el dit (R3): el traç ha marcat la línia i (i, a dins, els termes de la llista, 0–2).
 * La línia queda triada, com si l'hagués tocat, i s'espera «Comprova». traca: els punts, per tornar-los a dibuixar.
 */
export function marcaLlac(S, ex, i, termes = [], traca = null) {
    if (!seleccionable(S, ex, i)) return S;
    S.sel = i;
    S.ltermes = termes.slice(0, 2);
    S.traca = traca;
    const n = S.ltermes.length;
    S.msg = { tipus: 'info', text: `Has marcat la línia ${i}${n ? `, i a dins ${n === 1 ? 'un terme' : 'dos termes'}` : ''}. Prem «Comprova», o torna a encerclar.` };
    S.msgLinia = i;
    return S;
}

/** Un traç que no s'entén: es desfà la selecció i es demana que es torni a marcar. */
export function llacDubtos(S, motiu) {
    if (S.fi || S.fase !== 'busca') return S;
    S.sel = null;
    S.ltermes = null;
    S.traca = null;
    S.msg = { tipus: 'noEncert', text: `Torna a marcar-ho, si us plau: ${motiu}` };
    S.msgLinia = null;
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
    S.msg = { tipus: 'noEncert', text: `${text} Mira-ho: l'errada és a la línia ${k}. ${ex.errades[k].expl}` };
    S.msgLinia = k;
    S.ajuda.push(k);
    S.trobades.push(k);
    S.corregides[k] = true;
    return despres(S, ex, cfg);
}

/** «Comprova» amb la línia seleccionada. */
export function comprova(S, ex, cfg = CONFIG_PER_DEFECTE) {
    const i = S.sel;
    if (i === null || i < 1 || S.fase !== 'busca' || S.fi) return S;
    S.sel = null;
    const lt = S.ltermes || [];
    S.ltermes = null;
    S.traca = null;
    if (ex.errades[i]) {
        S.trobades.push(i);
        S.actual = i;
        S.msgLinia = i;
        // Amb el traç (R3): si ha encerclat el terme equivocat, ja no cal la fase del terme
        if (lt.length) {
            const bons = ex.errades[i].termes || [ex.errades[i].terme];
            if (lt.some(j => bons.includes(j))) {
                S.termes[i] = true;
                return faseSeguent(S, ex, cfg, "Sí! L'errada és aquí. I has encerclat just el terme equivocat.");
            }
            if (!cfg.terme) return faseSeguent(S, ex, cfg, "Sí! L'errada és aquí, encara que el terme equivocat no és el que has encerclat.");
            S.fase = 'terme';
            S.intentsTerme = 0;
            S.msg = { tipus: 'encert', text: "Sí! L'errada és en aquesta línia, encara que el terme equivocat no és el que has encerclat. Compara-la amb la de sobre." };
            return S;
        }
        if (cfg.terme) {
            S.fase = 'terme';
            S.intentsTerme = 0;
            S.msg = { tipus: 'encert', text: "Sí! L'errada és en aquesta línia. Compara-la amb la de sobre." };
            return S;
        }
        return faseSeguent(S, ex, cfg, "Sí! L'errada és aquí.");
    }
    // una línia bona
    S.errors++;
    const p = pendents(S, ex);
    if (S.errors >= cfg.maxIntents) {
        if (p.length) return ensenya(S, ex, cfg, p[0], 'Tampoc és aquí.');
        S.msg = { tipus: 'noEncert', text: 'Aquest cop totes les línies són correctes: no hi havia cap errada.' };
        S.msgLinia = null;
        S.ajuda.push(-1);
        return acaba(S);
    }
    S.revisades.push(i);
    let t = ex.correctes[i] || "En aquesta línia no s'ha comès cap errada.";
    if (S.errors >= 2 && p.length) t += '\n' + direccio(S, ex, i);
    S.msg = { tipus: 'noEncert', text: t };
    S.msgLinia = i;
    return S;
}

/** Després de trobar la línia (i el terme): «Per què?», «Corregeix-la» o, sense fases, s'acaba. */
function faseSeguent(S, ex, cfg, text) {
    const i = S.actual;
    if (cfg.perque) {
        S.fase = 'perque';
        S.msg = { tipus: 'encert', text };
        return S;
    }
    S.msg = { tipus: 'encert', text: `${text} ${ex.errades[i].expl}` };
    if (cfg.corregeix) {
        S.fase = 'corregeix';
        S.intentsEscriu = 0;
        return S;
    }
    S.corregides[i] = true;
    return despres(S, ex, cfg);
}

/** Fase del terme: j és la posició del terme tocat dins de la línia. */
export function triaTerme(S, ex, cfg, j) {
    if (S.fase !== 'terme') return S;
    const i = S.actual,
        bo = ex.errades[i].terme,
        bons = ex.errades[i].termes || [bo];
    if (bons.includes(j)) {
        S.termes[i] = true;
        return faseSeguent(S, ex, cfg, bons.length > 1 ? 'Exacte: aquest és un dels termes equivocats. Hi ha un altre terme equivocat a la mateixa línia, i ara tots dos estan encerclats.' : 'Exacte: aquest és el terme equivocat.');
    }
    S.intentsTerme++;
    if (S.intentsTerme >= 2) {
        S.termes[i] = true;
        if (bons.length > 1) return faseSeguent(S, ex, cfg, `No: els termes equivocats són els que ara estan encerclats, ${bons.map(k => `$${ex.linies[i][k]}$`).join(' i ')}.`);
        return faseSeguent(S, ex, cfg, `No: el terme equivocat és el que ara està encerclat, $${ex.linies[i][bo]}$.`);
    }
    S.msg = { tipus: 'noEncert', text: 'Aquest terme està bé. Compara la línia amb la de sobre i busca el que ha canviat malament.' };
    return S;
}

export function triaPerque(S, ex, cfg, j) {
    if (S.fase !== 'perque') return S;
    const e = ex.errades[S.actual],
        bona = !!(e.perque[j] && e.perque[j][1]);
    S.msg = { tipus: bona ? 'encert' : 'noEncert', text: (bona ? 'Exacte. ' : 'No ben bé. ') + e.expl };
    if (cfg.corregeix) {
        S.fase = 'corregeix';
        S.intentsEscriu = 0;
        return S;
    }
    S.corregides[S.actual] = true;
    return despres(S, ex, cfg);
}

/** A «Corregeix-la», l'alumne escriu el terme encerclat (cfg.escriu) si l'errada és d'un sol terme. */
export const escriuAra = (S, ex, cfg) => S.fase === 'corregeix' && !!cfg.escriu && escrivible(ex.errades[S.actual], ex.linies[S.actual]);

export function escriuCorreccio(S, ex, cfg, text) {
    if (!escriuAra(S, ex, cfg)) return S;
    const e = ex.errades[S.actual],
        bo = e.fitxesBona[e.terme];
    if (correcte(text, bo)) {
        S.corregides[S.actual] = true;
        S.msg = { tipus: 'encert', text: 'Molt bé: així havia de quedar.' };
        return despres(S, ex, cfg);
    }
    S.intentsEscriu++;
    if (S.intentsEscriu >= 2) {
        S.corregides[S.actual] = true;
        S.msg = { tipus: 'noEncert', text: `No. Havia de ser $${bo}$, i la línia quedava així: $${e.bona}$.` };
        return despres(S, ex, cfg);
    }
    S.msg = { tipus: 'noEncert', text: 'No és així. Torna-ho a provar.' };
    return S;
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
    S.msgLinia = null;
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
