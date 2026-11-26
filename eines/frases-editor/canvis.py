import json
D=json.load(open('dades.json',encoding='utf-8'))
S={s['id']:s for s in D['situacions']}
david={
'F01':"Ha \\bold{oblidat} multiplicar $[c]$ per $[b]$.",
'F02':"\\bold{No hauria} d'haver multiplicat $[c]$ per [x].",
'F03':"S'ha de \\bold{sumar} $[c]$, i en canvi ho ha multiplicat.",
'F04':"Hauria d'haver escrit $\\bold{\\oposite{[escrit]}}$, en lloc d'escriure $[escrit]$.",
'F05':"Hi ha un $−$ davant del parèntesi: per tant, el $\\signe{[b]}$ de dins del parèntesi s'ha de \\bold{transformar} en un $\\oposite{[b]}$.",
'F06':"En aquest cas \\bold{no es poden treure} parèntesis, perquè encara hi ha un $[terme d'abans]$ davant.",
'F07':"El signe $−$ de davant del parèntesi \\bold{no pot fer} que obtinguem un -[x].",
'F08':"Havia de canviar \\bold{també} el signe de l'altre membre de l'equació, i passar de $[altre membre]$ a $\\oposite{[altre membre]}$.",
'F52':"S'ha equivocat en calcular: $\\bold{[càlcul]}$.",
}
claude={
'F10':"Hauria d'haver escrit $\\bold{\\oposite{[terme en x]}}$, en lloc d'escriure $[terme en x]$.",
'F11':"El $[c]$ \\bold{només multiplica} [x]: el $[b]$ es queda igual.",
'F12':"Per multiplicar $[c]$ per [x], ha \\bold{sumat} $[c sense signe] + [m]$.",
'F14':"$[producte]$ \\bold{no fa} $[valor del producte]$.",
'F16':"El $[terme]$ ha \\bold{canviat de membre}: per tant, s'ha de transformar en un $\\oposite{[terme]}$.",
'F17':"El $[altre terme]$ \\bold{no havia de canviar} de signe en passar a l'altre membre.",
'F18':"El $[terme]$ \\bold{no s'havia de moure} del seu membre.",
'F19':"El $[terme]$ havia de passar a l'altre membre \\bold{dividint}.",
'F20':"\\bold{Tots} els termes, també els nombres, s'han de passar al membre de l'esquerra.",
'F21':"Primer s'han de \\bold{sumar} els termes de cada membre, i després s'han de passar a l'altre.",
'F22':"[Els termes] han \\bold{canviat de membre}: per tant, havien de canviar de signe.",
'F23':"Els termes que \\bold{es queden} al seu membre també han de canviar de signe.",
'F24':"Els termes havien de passar a l'altre membre \\bold{dividint}.",
'F25':"El $[terme]$ \\bold{no canvia de membre}: per tant, no ha de canviar de signe.",
'F26':"\\bold{Tots} els termes canvien de signe en aquest pas, també el $[terme]$.",
'F27':"El nombre de davant del parèntesi \\bold{també multiplica} el $[terme]$.",
'F28':"Ha sumat el $[terme]$ amb un terme que \\bold{no és semblant}.",
'F29':"El $[terme]$ \\bold{també havia de passar} a l'altre membre.",
'F30':"S'ha equivocat \\bold{sumant} dos nombres d'aquesta línia.",
'F31':"[Els termes] \\bold{no canvien de membre}: per tant, no han de canviar de signe.",
'F32':"\\bold{Tots} els termes canvien de signe en aquest pas, també [els termes].",
'F33':"$[x]$ i $[n]$ \\bold{no són termes semblants}: no es poden sumar.",
'F35':"$[x]$ i $[n]$ s'havien de \\bold{multiplicar}.",
'F36':"El $[terme]$ \\bold{no té} $x$: no es pot sumar amb els termes en $x$.",
'F37':"Els termes en $x$ s'havien de \\bold{multiplicar}, i no sumar.",
'F38':"Els termes en $x$ \\bold{no es poden sumar}, perquè no són l'un al costat de l'altre.",
'F39':"El $[terme]$ s'havia de \\bold{multiplicar} per la $x$.",
'F40':"Els nombres \\bold{no tenen} $x$: no es poden sumar amb els termes en $x$.",
'F41':"Els nombres han \\bold{canviat de membre}: per tant, havien de canviar de signe.",
'F42':"Cada nombre s'havia de \\bold{multiplicar} per la $x$.",
'F43':"La $[x sola]$ \\bold{vol dir} $[1x]$: per tant, també s'ha de comptar.",
'F44':"$[operació]$ fa $\\oposite{[escrit]}$: s'ha \\bold{equivocat en el signe}.",
'F45':"Ha sumat termes que \\bold{no són semblants}.",
'F46':"Ha \\bold{restat} la $x$ en lloc de sumar-la.",
'F47':"Ha \\bold{sumat} la $x$ en lloc de restar-la.",
'F48':"Ha comptat la $[x sola]$ \\bold{dues vegades}.",
'F49':"$[a]$ i $[b]$ tenen \\bold{signes diferents}: per tant, els seus valors s'han de restar, no sumar.",
'F50':"$[a]$ i $[b]$ tenen \\bold{el mateix signe}: per tant, els seus valors s'han de sumar, no restar.",
'F51':"$[operació]$ és un \\bold{producte}: s'havia de multiplicar.",
'F53':"Ha decidit fer $\\bold{[operació]}$, però hauria d'haver fet ${[B]|[A]}$.",
'F54':"Ha decidit fer una \\bold{resta}, però havia de fer una suma.",
'F55':"Havia de fer $[operació]$, però el resultat és $\\bold{[resultat canviat de signe]}$.",
'F56':"El resultat és $\\bold{[A i B enganxats]}$.",
'F57':"Ha decidit fer un \\bold{producte}, però havia de fer una suma.",
'F58':"Ha decidit fer una \\bold{suma}, però havia de fer una resta.",
'F59':"Ha \\bold{oblidat dividir} entre $[A]$.",
'F62':"Havia de \\bold{multiplicar} $[B]$ per $[A]$.",
'F63':"El coeficient és $[A]$: per tant, s'ha de dividir entre $[A]$, \\bold{amb el signe}.",
'F65':"Havia de \\bold{restar} $[A]$ als dos membres.",
'F66':"Havia de dividir \\bold{al revés}: ${[A]|[B]}$.",
'F67':"Ha decidit fer ${[A]|[B]}$, però hauria d'haver fet $\\bold{{[B]|[A]}}$.",
'F68':"Havia de fer una \\bold{resta}: $[B menys A]$.",
'F69':"Havia de fer un \\bold{producte}: $[B per A]$.",
'F70':"La divisió està \\bold{ben plantejada}, però s'havia de simplificar abans.",
}
U={s['id']:{'bona':s['bona'],'dolentes':s['dolentes'],'comentari':''} for s in D['situacions']}
U['DIST']['comentari']="has de crear una macro \\oposite per poder fer que la frase digui directament \"+1\" com a oposat del -1\nhas de crear una macro \\bold per a fer negreta i així destacar on hi ha realment l'error (encara que sigui un distractor, és clar!)"
U['DIST']['dolentes']=[{'id':'F02'},{'id':'F03'},{'id':'F04'}]
U['DSIG1']['dolentes']=[{'id':'F06','cond':"només si hi ha un terme davant del parèntesi"},{'id':'F07'},{'id':'F08'}]
U['DSIG2']['bona']='F44'; U['DSIG2']['dolentes']=[{'id':'F10'},{'id':'F11'},{'id':'F08'}]
U['DSUMA']['dolentes']=[{'id':'F01'},{'id':'F04'},{'id':'F14'},{'id':'F03'}]
U['TNS1']['dolentes']=[{'id':'F16'},{'id':'F52'},{'id':'F35'}]
U['CO']['dolentes']=[{'id':'F66'},{'id':'F65'},{'id':'F62'}]
U['DS']['dolentes']=[{'id':'F62'},{'id':'F65'},{'id':'F66'}]
for c in ['CAL1','CAL2','CAL3']:
    U[c]['dolentes']=[({**d,'cond':'una per cada altra suma de la línia'} if d['id']=='F52' else d) for d in U[c]['dolentes']]
orig={s['id']:json.dumps({'bona':s['bona'],'dolentes':s['dolentes'],'comentari':''},ensure_ascii=False) for s in D['situacions']}
canviades=[k for k in U if json.dumps(U[k],ensure_ascii=False)!=orig[k]]
json.dump({'david':david,'claude':claude,'U':U,'canviades':canviades},open('canvis.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(canviades, len(david)+len(claude))
