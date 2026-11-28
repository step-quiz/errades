// GENERAT per eines/frases-editor/exporta.mjs a partir de l'editor de frases del David.
// No l'editis a mà: canvia l'editor (o dades.json) i torna a executar exporta.mjs.
// frases: id → plantilla (llenguatge de plantilles: js/equacions/frases.js).
// situacions: id → { bona, dolentes: [{ id, cond? }], reserva? }. cond: exp | red1 | tra (el pas),
// xPositiva | xNegativa (la x sola), AdiferentB (|A| ≠ |B|). Una frase amb un valor que falta no surt.
export const FRASES = {
 "frases": {
  "F01": "Ha oblidat multiplicar $[c]$ per $[b]$.",
  "F02": "No hauria d'haver multiplicat $[c]$ per [x].",
  "F03": "Per aïllar la incògnita, hauria d'haver fet ${[A]|[B]}$.",
  "F04": "Hauria d'haver escrit $\\oposite{[escrit]}$, en lloc d'escriure $[escrit]$.",
  "F05": "Hi ha un $−$ davant del parèntesi: per tant, el $\\signe{[b]}$ de dins del parèntesi s'ha de transformar en un $\\bold{\\oposite{[b]}}$.",
  "F06": "En aquest cas no es poden treure parèntesis, perquè encara hi ha un $[terme d'abans]$ davant.",
  "F07": "En treure el parèntesi, és incorrecte escriure el \\oposite{[x]}.",
  "F08": "Hauria d'haver sumat en primer lloc el [x] amb [b].",
  "F10": "Hauria d'haver escrit \\bold{$\\oposite{[terme en x]}$}, en lloc d'escriure $[terme en x]$.",
  "F11": "Hauria d'haver deixat el $[b]$ tal qual, sense multiplicar-lo per $[c]$.",
  "F12": "Hauria d'haver aplicat la propietat distributiva, i multiplicat $[c]$ per [x].",
  "F13": "S'ha equivocat en el signe, quan ha fet l'operació amb $[x]$ i $[n]$.",
  "F14": "$[producte]$ \\bold{no dona} $[valor del producte]$.",
  "F16": "L'errada és que [al membre] [costat] hi hauria d'haver \\oposite{$[terme]$}.",
  "F17": "El $\\oposite{[altre terme]}$ és incorrecte tal com està escrit a [l'altre membre].",
  "F18": "El $[terme]$ no interessa canviar-lo de [membre].",
  "F19": "El $[terme]$ havia de passar a [l'altre membre] \\bold{dividint}.",
  "F20": "Tots els termes, també els nombres, s'han de passar [al membre] de l'esquerra.",
  "F22": "[Els termes] han canviat de [membre]: per tant, cadascun d'ells s'escriu amb el signe canviat.",
  "F23": "Caldria haver canviat de signe \\bold{tots} els termes de l'equació, i no només [els termes].",
  "F24": "[Els termes] haurien de passar a [l'altre membre] \\bold{multiplicant}.",
  "F25": "És una errada escriure $[mal]$, hauria de ser $[terme]$.",
  "F26": "S'ha equivocat amb el $\\oposite{[altre terme]}$.",
  "F27": "El nombre que hi ha davant del parèntesi també ha de multiplicar el $[terme]$.",
  "F28": "L'errada és que ha sumat el $[terme]$ amb un terme que no es pot sumar.",
  "F30": "S'ha equivocat sumant dos nombres.",
  "F31": "[Els termes] no han canviat de [membre]: per tant, s'han d'escriure amb el \\bold{mateix signe}.",
  "F32": "Cal canviar de signe \\bold{tots} els termes, també [els termes].",
  "F33": "$[x]$ i $[n]$ \\bold{no són termes semblants}: per tant, no es poden sumar.",
  "F35": "Caldria haver \\bold{multiplicat} $[x]$ per $[n]$.",
  "F36": "El $[terme]$ \\bold{no es pot sumar} amb els termes que contenen $x$.",
  "F37": "Caldria haver \\bold{multiplicat} els termes en $x$, en lloc de sumar-los.",
  "F38": "Els termes [termes en x] no es poden sumar.",
  "F39": "El $[terme]$ s'hauria d'haver \\bold{multiplicat} per $x$.",
  "F40": "Els nombres \\bold{no es poden sumar} amb els termes que contenen $x$.",
  "F41": "Els nombres han canviat de [membre]: per tant, s'han d'escriure amb el \\bold{signe canviat}.",
  "F43": "[Al membre] [costat] \\bold{falta sumar} una $[x sola]$.",
  "F44": "El resultat de $[suma]$ no és correcte, perquè s'ha equivocat en el signe.",
  "F45": "L'errada és que els termes [del membre] [costat] no es poden sumar.",
  "F46": "Hauria d'haver \\bold{sumat} la $x$, en lloc de restar-la.",
  "F47": "Hauria d'haver \\bold{restat} la $x$, en lloc de sumar-la.",
  "F48": "La $[x sola]$ s'ha comptat \\bold{dues vegades}.",
  "F49": "Hauria d'haver operat $[a]$ i \\oposite{$[b]$}, en lloc de $[a]$ i $[b]$.",
  "F50": "$[a]$ i $[b]$ tenen el \\bold{mateix signe}: per tant, s'han de sumar els seus valors.",
  "F51": "$[operació]$ és un \\bold{producte}: per tant, s'ha de multiplicar.",
  "F52": "S'ha equivocat en fer càlculs: $[càlcul]$.",
  "F53": "Per aïllar la incògnita, hauria d'haver fet ${[B]|[A]}$.",
  "F54": "Ha decidit fer una resta, però havia de fer una suma.",
  "F55": "Quan ha fet l'operació, el resultat havia de ser $[resultat canviat de signe]$.",
  "F57": "Ha decidit fer un producte, però havia de fer una suma.",
  "F58": "Ha decidit fer una suma, però havia de fer una resta.",
  "F59": "Ha oblidat \\bold{dividir} entre $[A]$.",
  "F62": "Hauria d'haver \\bold{multiplicat} $[B]$ per $[A]$.",
  "F63": "El coeficient és $[A]$: per tant, s'ha d'escriure ${[B]|[A]}$.",
  "F65": "Hauria d'haver \\bold{restat} $[A sense signe]$ a $[B]$.",
  "F66": "Hauria d'haver aïllat d'aquesta manera: ${[A]|[B]}$.",
  "F67": "És una errada escriure ${[A]|[B]}$, el valor \\bold{correcte} és ${[B]|[A]}$.",
  "F68": "Caldria haver fet una \\bold{resta}: $[B menys A]$.",
  "F69": "Caldria haver fet un \\bold{producte}: $[B per A]$.",
  "F70": "La divisió està ben plantejada, però falta \\bold{simplificar}.",
  "F71": "Ha sumat $[a] + [c]$ abans de multiplicar: el $[c]$ només multiplica el parèntesi.",
  "F72": "El $[a]$ també s'havia de multiplicar per $[parèntesi]$.",
  "F73": "Primer s'havia de sumar $[a] + [c]$ i després multiplicar.",
  "F74": "Ha multiplicat bé, però s'ha equivocat en un signe.",
  "F75": "El $[c]$ s'havia de sumar a cada terme del parèntesi.",
  "F76": "Ha multiplicat $[a] · [B]$, però la $x$ era al denominador: havia de dividir $[a] : [B]$.",
  "F77": "El $[B]$ havia de passar a [l'altre membre] restant.",
  "F78": "Havia de multiplicar el $[a]$ per la $x$.",
  "F79": "Ha calculat malament $[a] · [B]$.",
  "F80": "El $−$ de davant de la fracció no ha canviat el signe del $[b]$.",
  "F81": "No ha multiplicat per $[M]$ els termes que no tenen denominador.",
  "F82": "S'ha equivocat en calcular el mínim comú múltiple dels denominadors.",
  "F83": "Havia de dividir per $[M]$, i no multiplicar.",
  "F85": "El $−$ de davant d'una fracció havia de canviar el signe de tot el numerador.",
  "C01": "$[a]$ i $[b]$ tenen \\bold{signes diferents}: per tant, s'han de restar els seus valors.",
  "Nmwyqnmvt9f": "Hauria d'haver sumat en primer lloc $[terme]$ i $[altre terme]$.",
  "Nmwyqe64223t": "Havia de \\bold{sumar} $[c]$ amb $[b]$.",
  "Nmwyqgdd85dv": "En treure el parèntesi, cal canviar el $[altre membre]$ per un $\\oposite{[altre membre]}$.",
  "Nmwys4une1qq": "Hi ha un error de càlcul en fer l'operació amb $[a]$ i $[b]$.",
  "Nmwys60j92th": "El resultat de $[suma]$ no és correcte, perquè hauria de ser \\oposite{[escrit]}.",
  "Nmwys7pr52dl": "S'ha equivocat en fer aquest càlcul: $[càlcul]$.",
  "Nmwys8z5y74f": "S'ha equivocat, perquè el resultat és $[resultat canviat de signe]$.",
  "Nmwysb6cl63w": "El resultat del seu càlcul hauria de ser $[resultat canviat de signe]$.",
  "Nmwyscz912w1": "Hauria d'haver fet aquesta operació: ${[A]|[B]}$.",
  "Nmwysdlcm2lh": "Hauria d'haver \\bold{restat} $[B]$ - $[A]$.",
  "Nmwysf7cz4k7": "Hauria d'haver \\bold{restat} $[A]$ - $[B]$.",
  "R16SC1": "El $[terme]$ sempre s'ha de multiplicar amb $x$.",
  "R16ST2": "El \\oposite{$[segon terme]$} no és correcte, [al membre] [costat].",
  "R01TNS1": "Hauria d'haver \\bold{restat} $[n]$ a $[x]$.",
  "R08CAL1": "Hi ha una errada en fer aquest càlcul: [altre càlcul].",
  "R44DSIG2": "$[operació]$ fa $\\oposite{[escrit]}$: per tant, s'ha \\bold{equivocat en el signe}."
 },
 "situacions": {
  "DIST": {
   "bona": "F01",
   "dolentes": [
    {
     "id": "F02"
    },
    {
     "id": "Nmwyqe64223t"
    },
    {
     "id": "F04"
    }
   ]
  },
  "DSIG1": {
   "bona": "F05",
   "dolentes": [
    {
     "id": "F06"
    },
    {
     "id": "F07"
    },
    {
     "id": "Nmwyqgdd85dv"
    }
   ],
   "reserva": [
    "F08"
   ]
  },
  "DSIG2": {
   "bona": "R44DSIG2",
   "dolentes": [
    {
     "id": "F10"
    },
    {
     "id": "F11"
    },
    {
     "id": "F08"
    }
   ]
  },
  "DSUMA": {
   "bona": "F12",
   "dolentes": [
    {
     "id": "F01"
    },
    {
     "id": "F04"
    },
    {
     "id": "F14"
    }
   ]
  },
  "ST1": {
   "bona": "F16",
   "dolentes": [
    {
     "id": "F17"
    },
    {
     "id": "F19"
    },
    {
     "id": "Nmwyqnmvt9f"
    }
   ],
   "reserva": [
    "F18",
    "F20"
   ]
  },
  "ST2": {
   "bona": "F22",
   "dolentes": [
    {
     "id": "F23"
    },
    {
     "id": "F24"
    },
    {
     "id": "R16ST2"
    }
   ]
  },
  "SC1": {
   "bona": "F25",
   "dolentes": [
    {
     "id": "R16SC1"
    },
    {
     "id": "F26"
    },
    {
     "id": "F27",
     "cond": "exp"
    },
    {
     "id": "F28",
     "cond": "red1"
    },
    {
     "id": "F30"
    }
   ]
  },
  "SC2": {
   "bona": "F31",
   "dolentes": [
    {
     "id": "F22"
    },
    {
     "id": "F32"
    },
    {
     "id": "F30"
    }
   ]
  },
  "TNS1": {
   "bona": "F33",
   "dolentes": [
    {
     "id": "F35"
    },
    {
     "id": "F13"
    },
    {
     "id": "R01TNS1"
    }
   ]
  },
  "TNS2": {
   "bona": "F36",
   "dolentes": [
    {
     "id": "F37"
    },
    {
     "id": "F38"
    },
    {
     "id": "F39"
    }
   ]
  },
  "TNS3": {
   "bona": "F40",
   "dolentes": [
    {
     "id": "F41"
    },
    {
     "id": "F37"
    },
    {
     "id": "F38"
    }
   ]
  },
  "CU": {
   "bona": "F43",
   "dolentes": [
    {
     "id": "F44"
    },
    {
     "id": "F46",
     "cond": "xPositiva"
    },
    {
     "id": "F47",
     "cond": "xNegativa"
    },
    {
     "id": "F48"
    }
   ]
  },
  "CAL1": {
   "bona": "F44",
   "dolentes": [
    {
     "id": "F49"
    },
    {
     "id": "F45"
    },
    {
     "id": "R08CAL1"
    }
   ],
   "reserva": [
    "F51"
   ]
  },
  "CAL2": {
   "bona": "C01",
   "dolentes": [
    {
     "id": "F44"
    },
    {
     "id": "F50"
    },
    {
     "id": "F45"
    },
    {
     "id": "F51"
    },
    {
     "id": "F52"
    }
   ]
  },
  "CAL3": {
   "bona": "Nmwys4une1qq",
   "dolentes": [
    {
     "id": "Nmwys60j92th"
    },
    {
     "id": "F49"
    },
    {
     "id": "F45"
    },
    {
     "id": "Nmwys7pr52dl"
    }
   ]
  },
  "OI1": {
   "bona": "F53",
   "dolentes": [
    {
     "id": "F54"
    },
    {
     "id": "Nmwys8z5y74f"
    },
    {
     "id": "F03",
     "cond": "AdiferentB"
    }
   ]
  },
  "OI3": {
   "bona": "F53",
   "dolentes": [
    {
     "id": "F57"
    },
    {
     "id": "Nmwysb6cl63w"
    },
    {
     "id": "F03",
     "cond": "AdiferentB"
    }
   ]
  },
  "OI4": {
   "bona": "F53",
   "dolentes": [
    {
     "id": "F58"
    },
    {
     "id": "F55"
    },
    {
     "id": "F03",
     "cond": "AdiferentB"
    }
   ]
  },
  "CO": {
   "bona": "F59",
   "dolentes": [
    {
     "id": "Nmwyscz912w1",
     "cond": "AdiferentB"
    },
    {
     "id": "Nmwysdlcm2lh"
    },
    {
     "id": "Nmwysf7cz4k7"
    }
   ]
  },
  "DS": {
   "bona": "F63",
   "dolentes": [
    {
     "id": "F62"
    },
    {
     "id": "F65"
    },
    {
     "id": "F66",
     "cond": "AdiferentB"
    }
   ]
  },
  "QI": {
   "bona": "F67",
   "dolentes": [
    {
     "id": "F68"
    },
    {
     "id": "F69"
    },
    {
     "id": "F70"
    }
   ]
  },
  "SAP": {
   "bona": "F71",
   "dolentes": [
    {
     "id": "F72"
    },
    {
     "id": "F73"
    },
    {
     "id": "F74"
    },
    {
     "id": "F75"
    }
   ]
  },
  "IX": {
   "bona": "F76",
   "dolentes": [
    {
     "id": "F77"
    },
    {
     "id": "F78"
    },
    {
     "id": "F79"
    }
   ]
  },
  "DEN1": {
   "bona": "F80",
   "dolentes": [
    {
     "id": "F81"
    },
    {
     "id": "F82"
    },
    {
     "id": "F83"
    }
   ]
  },
  "DEN2": {
   "bona": "F81",
   "dolentes": [
    {
     "id": "F85"
    },
    {
     "id": "F82"
    },
    {
     "id": "F83"
    }
   ]
  }
 }
};
