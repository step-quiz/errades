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
 *   queden) → 'fi'. La fase 'terme' (R4) demana el terme equivocat de la línia
 *   (a tots els nivells, amb toc o amb traç, si el traç no l'ha encerclat ja; si la línia només té
 *   un terme possible, com «x = 5/35», s'encercla sol: auditoria P6). Cada
 *   terme bo triat (també el que s'ha encerclat amb la línia) és un intent fallat; a
 *   cfg.maxIntents s'ensenya el terme, l'exemple val 0 i es continua (el David,
 *   26/11/2026). Amb cfg.anuncia, s'acaba sol quan s'han trobat totes; si no,
 *   l'alumne ha de prémer «No n'hi ha cap més» / «No hi ha cap errada».
 * - Escala (docs/SPEC.md §2, F1/F2/F3): cada línia bona assenyalada s'explica
 *   i queda marcada (revisades); des del segon error s'hi afegeix cap on és
 *   l'errada; a cfg.maxIntents errors s'ensenya l'errada i l'exemple val 0.
 * - Punts: puntsAmbErrors(errors) de js/comu/punts.js (10, 2 menys per error), i
 *   1 menys per cada resposta equivocada a «Per què?» o a «Corregeix-la» (també
 *   escrivint): S.fallades (auditoria C5-A, el David, 28/11/2026; abans no
 *   comptaven, E5). Com a mínim 0; 0 si s'ha hagut d'ensenyar alguna errada.
 * - S.respostes[i] = { perque, corregeix }: el que l'alumne ha triat a cada fase
 *   de la línia i (la llibreta ho deixa a la vista, marcat; C6).
 * - Missatges: { tipus: 'encert' | 'noEncert' | 'info', text } i S.msgLinia, la línia
 *   de què parla (la llibreta el posa just a sota d'aquella línia; null = a baix) (R1: colors
 *   d'encert / no encert, mai vermell ni verd). Text amb $…$ per a les fórmules.
 * DEPENDÈNCIES: js/comu/punts.js.
 * ============================================================================
 */
import { puntsAmbErrors } from '../comu/punts.js';
import { escrivible, correcte } from './escriure.js';

export const CONFIG_PER_DEFECTE = { anuncia: true, perque: true, corregeix: true, escriu: false, maxIntents: 3 };

export const errades = ex => Object.keys(ex.errades).map(Number).sort((a, b) => a - b);
export const pendents = (S, ex) => errades(ex).filter(k => !S.trobades.includes(k));
/**
 * Errades compensades: la línia de l'errada i arrossega l'errada k (k < i), i s'ha de comparar
 * amb la línia de sobre tal com està escrita. Torna k, o null si no cal avisar-ne (el David, 26/11/2026).
 */
export const arrossega = (ex, i) => (ex.compensades ? (errades(ex).filter(k => k < i).pop() ?? null) : null);

export function nouEstat() {
    // ltermes / traca: els termes encerclats i el traç (R3), mentre la línia encerclada espera «Comprova»
    return { sel: null, trobades: [], ajuda: [], revisades: [], errors: 0, fallades: 0, respostes: {}, fase: 'busca', actual: null, corregides: {}, termes: {}, intentsEscriu: 0, fi: false, msg: null, msgLinia: null, ltermes: null, traca: null };
}

/** Una resposta equivocada a «Per què?» o a «Corregeix-la» treu aquests punts (auditoria C5-A). */
export const PUNTS_PER_FALLADA = 1;
export const punts = S => (S.ajuda.length ? 0 : Math.max(0, puntsAmbErrors(S.errors) - PUNTS_PER_FALLADA * S.fallades));
/** Els intents que queden per trobar les errades (línies i termes; «Per què?» i «Corregeix-la» no en gasten). */
export const intentsQueden = (S, cfg = CONFIG_PER_DEFECTE) => Math.max(0, cfg.maxIntents - S.errors);

/**
 * Es pot assenyalar la línia i? L'enunciat (línia 0) mai: no hi pot haver cap errada (el David, 25/11/2026).
 * Les errades es troben de dalt a baix: les línies d'abans de l'última trobada ja no (auditoria B4, 28/11/2026).
 */
export const seleccionable = (S, ex, i) =>
    !S.fi && S.fase === 'busca' && i >= 1 && i < ex.linies.length && i > Math.max(0, ...S.trobades) && !S.revisades.includes(i);

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
    S.msg = { tipus: 'info', text: `Has marcat ${n ? `${n === 1 ? 'un terme' : 'dos termes'} en la línia` : 'la línia'} ${i}. Prem «Comprova», o torna a encerclar.` };
    S.msgLinia = i;
    return S;
}

/** Un traç que no s'entén: es desfà la selecció i es demana que es torni a marcar. */
export function llacDubtos(S, motiu) {
    if (S.fi || S.fase !== 'busca') return S;
    S.sel = null;
    S.ltermes = null;
    S.traca = null;
    S.msg = { tipus: 'noEncert', text: `Has de tornar a marcar-ho, perquè ${motiu}` };
    S.msgLinia = null;
    return S;
}

function direccio(S, ex, i) {
    const p = pendents(S, ex),
        amunt = p.some(k => k < i),
        avall = p.some(k => k > i);
    if (amunt && avall) return "Hi ha dues errades: una més amunt i l'altra més avall.";
    if (amunt) return "L'errada és més amunt.";
    if (avall) return "L'errada és més avall.";
    return '';
}

function ensenya(S, ex, cfg, k, text) {
    S.msg = { tipus: 'noEncert', text: `L'errada era a la línia ${k}. ${ex.errades[k].expl}` };
    S.msgLinia = k;
    S.ajuda.push(k);
    S.trobades.push(k);
    S.corregides[k] = true;
    return despres(S, ex, cfg);
}

/** La línia equivocada i només té un terme que es pugui triar (sense comptar «=» ni una x sola), i és l'equivocat. */
export function termeUnic(ex, i) {
    const L = ex.linies[i],
        e = ex.errades[i];
    const candidats = L.map((t, j) => j).filter(j => L[j] !== '=' && L[j] !== 'x');
    return candidats.length === 1 && (e.termes || [e.terme]).includes(candidats[0]);
}

/** «Comprova» amb la línia seleccionada. */
export function comprova(S, ex, cfg = CONFIG_PER_DEFECTE) {
    const i = S.sel;
    if (i === null || i < 1 || S.fase !== 'busca' || S.fi) return S;
    S.sel = null;
    const lt = S.ltermes || [];
    S.ltermes = null;
    S.traca = null;
    // Les errades es localitzen de dalt a baix: si en queda una de pendent més amunt, primer cal trobar aquella.
    // No compta com a intent fallat i la línia es pot tornar a triar (el David, 26/11/2026).
    if (ex.errades[i] && pendents(S, ex).some(k => k < i)) {
        S.msg = { tipus: 'info', text: "Abans d'aquesta línia, has de revisar les anteriors, perquè hi ha una errada més amunt." };
        S.msgLinia = i;
        return S;
    }
    if (ex.errades[i]) {
        S.trobades.push(i);
        S.actual = i;
        S.msgLinia = i;
        S.fase = 'terme';
        // Amb el traç (R3): si ha encerclat el terme equivocat, ja no cal la fase del terme;
        // si n'ha encerclat un de bo, és un intent fallat i ha de tocar el terme equivocat.
        if (lt.length) {
            const bons = ex.errades[i].termes || [ex.errades[i].terme];
            if (lt.some(j => bons.includes(j))) {
                S.termes[i] = true;
                return faseSeguent(S, ex, cfg, 'Molt bé, has localitzat la línia i el terme on hi ha l\'errada.');
            }
            return termeFallat(S, ex, cfg, "Has localitzat la línia correctament, però no el terme. Has de localitzar el terme on hi ha l'errada.");
        }
        // Una línia amb un sol terme possible (a més d'una x sola), com «x = 5/35»: la fase del terme no fa pensar
        // res, i el terme s'encercla sol (auditoria P6, 28/11/2026)
        if (termeUnic(ex, i)) {
            S.termes[i] = true;
            return faseSeguent(S, ex, cfg, 'Molt bé, en aquesta línia hi ha una errada.');
        }
        // la pregunta («Quin terme està malament?») ja és a sota, al mateix bloc (auditoria C2)
        S.msg = { tipus: 'encert', text: 'Molt bé, en aquesta línia hi ha una errada.' };
        return S;
    }
    // una línia bona
    S.errors++;
    const p = pendents(S, ex);
    if (S.errors >= cfg.maxIntents) {
        if (p.length) return ensenya(S, ex, cfg, p[0], 'Tampoc és aquí.');
        S.msg = { tipus: 'noEncert', text: 'En aquest exercici totes les línies eren correctes i no hi havia cap errada.' };
        S.msgLinia = null;
        S.ajuda.push(-1);
        return acaba(S);
    }
    S.revisades.push(i);
    let t = ex.correctes[i] || 'En aquesta línia no hi ha cap errada.';
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
        return faseSeguent(S, ex, cfg, bons.length > 1 ? 'Has trobat un dels termes equivocats. Ja hem encerclat els dos termes equivocats.' : 'Has trobat el terme equivocat.');
    }
    return termeFallat(S, ex, cfg, "No és aquest el terme que busquem: troba el terme on hi ha l'errada.");
}

/**
 * Un terme bo triat a la fase del terme (tocat, o encerclat amb la línia): és un intent fallat.
 * Si s'han acabat els intents, s'ensenya el terme equivocat, l'exemple val 0 i es continua.
 */
function termeFallat(S, ex, cfg, text) {
    const i = S.actual,
        bons = ex.errades[i].termes || [ex.errades[i].terme];
    S.errors++;
    if (S.errors >= cfg.maxIntents) {
        S.termes[i] = true;
        if (!S.ajuda.includes(i)) S.ajuda.push(i);
        if (bons.length > 1) return faseSeguent(S, ex, cfg, `Els termes equivocats són els que ara estan encerclats, ${bons.map(k => `$${ex.linies[i][k]}$`).join(' i ')}.`);
        return faseSeguent(S, ex, cfg, `El terme equivocat és el que ara està encerclat, $${ex.linies[i][bons[0]]}$.`);
    }
    S.msg = { tipus: 'noEncert', text };
    return S;
}

export function triaPerque(S, ex, cfg, j) {
    if (S.fase !== 'perque') return S;
    const e = ex.errades[S.actual],
        bona = !!(e.perque[j] && e.perque[j][1]);
    S.respostes[S.actual] = { ...S.respostes[S.actual], perque: j };
    if (!bona) S.fallades++;
    S.msg = { tipus: bona ? 'encert' : 'noEncert', text: (bona ? 'És cert. ' : 'No és cert. ') + e.expl };
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
        S.msg = { tipus: 'encert', text: 'Molt bé.' };
        return despres(S, ex, cfg);
    }
    S.intentsEscriu++;
    S.fallades++;
    if (S.intentsEscriu >= 2) {
        S.corregides[S.actual] = true;
        S.msg = { tipus: 'noEncert', text: `No. Havia de ser $${bo}$, i la línia quedaria així: $${e.bona}$.` };
        return despres(S, ex, cfg);
    }
    S.msg = { tipus: 'noEncert', text: 'No és així. Torna-ho a provar.' };
    return S;
}

export function triaCorreccio(S, ex, cfg, j) {
    if (S.fase !== 'corregeix') return S;
    const e = ex.errades[S.actual],
        bona = !!(e.opcions[j] && e.opcions[j][1]);
    S.respostes[S.actual] = { ...S.respostes[S.actual], corregeix: j };
    if (!bona) S.fallades++;
    S.corregides[S.actual] = true;
    S.msg = bona
        ? { tipus: 'encert', text: 'Molt bé.' }
        : { tipus: 'noEncert', text: `No. La línia havia de quedar, per exemple, així: $${e.bona}$.` };
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
        // el missatge d'abans només es conserva si diu quina era l'errada ensenyada; si no, «Molt bé…» (auditoria E2)
        if (!S.msg || S.msg.tipus !== 'noEncert' || !S.ajuda.length)
            S.msg = { tipus: 'encert', text: errades(ex).length ? "Molt bé: no n'hi ha cap més." : 'Molt bé: no hi havia cap errada.' };
        return acaba(S);
    }
    S.errors++;
    if (S.errors >= cfg.maxIntents) return ensenya(S, ex, cfg, p[0], "N'hi ha alguna.");
    S.msg = {
        tipus: 'noEncert',
        text: S.trobades.length ? "Encara n'hi ha alguna més. Torna-ho a repassar." : "N'hi ha alguna. Torna-ho a mirar línia per línia.",
    };
    return S;
}

function acaba(S) {
    S.fi = true;
    S.fase = 'fi';
    S.sel = null;
    return S;
}
