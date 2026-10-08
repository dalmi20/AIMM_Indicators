import type { Attribute, Indicator } from "@/lib/types"

export const PS = ["< 30 %", "30–50 %", "50–70 %", "70–85 %", "> 85 %"]

/** Valeurs de délai proposées (heures) */
export const H = [0.1, 0.25, 0.5, 1, 2, 4, 8, 12, 18, 24, 48, 72, 120, 168, 240]


const P = (n: string, src: string, la: string, lb: string, seuil: string, deps: Indicator["deps"], x: Partial<Indicator> = {}): Indicator =>
  ({ n, t: "pct", src, la, lb, seuil, deps, ...x })
const Q = (n: string, src: string, seuil: string, deps: Indicator["deps"], x: Partial<Indicator> = {}): Indicator =>
  ({ n, t: "q", src, seuil, deps, kmax: 5, ...x })
const R = (n: string, src: string, la: string, lb: string, unit: string, sc: string[], fn: (v: number) => number, seuil: string, deps: Indicator["deps"]): Indicator =>
  ({ n, t: "rate", src, la, lb, unit, sc, fn, seuil, deps })
const D = (n: string, src: string, sc: string[], fn: (v: number) => number, seuil: string, deps: Indicator["deps"]): Indicator =>
  ({ n, t: "delay", src, sc, fn, seuil, deps })
const N = (n: string, src: string, sc: string[], seuil: string, deps: Indicator["deps"]): Indicator =>
  ({ n, t: "niv", src, sc, seuil, deps })
const U = (n: string, src: string, deps: Indicator["deps"]): Indicator =>
  ({ n, t: "undef", src, seuil: "à définir", deps })

export const IND: Record<string, Indicator> = {
  X1: { n: "Contrat", t: "bin", src: "Recherche dans le SI, sinon questionnaire", seuil: "X1 = 1", deps: [] },
  X2: P("Couverture", "Analyse sémantique du contrat", "Activités couvertes", "Total activités", "≥ 50 %", []),
  X3: P("Engagements", "Fichier NCR", "Engagements respectés", "Total engagements", "≥ 70 %", [["X2", 0.4]]),
  X4: R("Incompréh.", "Analyse des emails", "Fils signalés", "Mois observés", "/ mois", ["> 10", "> 5 à 10", "3 à 5", "1 à < 3", "< 1"],
    (v) => (v > 10 ? 1 : v > 5 ? 2 : v >= 3 ? 3 : v >= 1 ? 4 : 5), "< 3/mois", [["X2", 0.4]]),
  X5: P("Revue", "Historique des versions du contrat", "Revues réalisées", "Revues prévues", "> 85 %", [["X3", 0.6], ["X4", 0.6]], { zero: true }),
  X6: Q("Veille", "Questionnaire", "k > 1", []),
  X8: N("Outils veille", "Vérification dans le SI", ["aucun outil", "outils individuels", "peu utilisés", "utilisés par les deux", "plateforme intégrée"], "niveau ≥ 3", [["X6", 0.2]]),
  X7: Q("Co-décision", "Questionnaire", "k > 3", [["X8", 0.4], ["X6", 0.4]]),
  X9: U("Désaccords", "Bons de commande, dossiers d’affaires", []),
  X10: Q("Revue budgets", "Questionnaire", "k > 2", [["X9", 0.2]], { ext: { lab: "X1 = 1 (Contrat de partenariat)" } }),
  X11: Q("Valeurs", "Questionnaire", "k > 1", []),
  X12: Q("Actions cult.", "Questionnaire", "k > 2", []),
  X13: Q("Conflits", "Questionnaire", "k > 3", [["X12", 0.4]]),
  X14: Q("Compétences", "Questionnaire", "k > 1", []),
  X15: Q("Formations", "Questionnaire", "k > 2", [["X14", 0.2]]),
  X17: P("Délais", "Fichier de suivi d’affaire", "Actions dans les délais", "Actions clôturées", "≥ 30 %", []),
  X16: Q("Participation", "Questionnaire", "k > 2", [["X17", 0.2]]),
  X18: Q("Stabilité", "Questionnaire", "k > 3", [["X16", 0.4]]),
  X19: Q("Satisfaction", "Questionnaire", "k > 4", [["X18", 0.6], ["X17", 0.6]]),
  X21: P("Rôles formal.", "Questionnaire et SI", "Rôles formalisés", "Total rôles", "≥ 30 %", []),
  X20: Q("Qui fait quoi", "Questionnaire (options 1 à 4)", "k > 2", [["X21", 0.2]], { kmax: 4 }),
  X22: R("Zones grises", "Analyse des emails", "Fils flous ou en double", "Années observées", "/ an", ["> 10", "> 5 à 10", "> 2 à 5", "> 0 à 2", "0"],
    (v) => (v > 10 ? 1 : v > 5 ? 2 : v > 2 ? 3 : v > 0 ? 4 : 5), "≤ 2/an", [["X20", 0.4], ["X21", 0.4]]),
  X23: U("MAJ resp.", "Historique des organigrammes", [["X22", 0.6], ["X21", 0.6]]),
  X24: Q("Référentiel", "Questionnaire et SI", "k > 1", []),
  X25: P("Points coord.", "Analyse du référentiel partagé", "Points identifiés", "Points de référence", "≥ 50 %", [["X24", 0.2]]),
  X26: Q("Entrées/sorties", "Référentiel, sinon questionnaire", "k > 3", [["X25", 0.4]]),
  X27: U("Délai MAJ", "Historique du référentiel", [["X26", 0.6], ["X24", 0.6]]),
  X28: P("Planning", "Fichier de suivi d’affaire", "Activités selon planning", "Activités planifiées", "≥ 30 %", []),
  X29: R("Désynchro.", "Suivi d’affaire et emails", "Désynchronisations", "Mois observés", "/ mois", ["> 10", "> 4 à 10", "> 1 à 4", "> 0 à 1", "0"],
    (v) => (v > 10 ? 1 : v > 4 ? 2 : v > 1 ? 3 : v > 0 ? 4 : 5), "≤ 4/mois", [["X28", 0.2]]),
  X30: { ...R("Itérations", "Suivi d’affaire et emails", "Allers-retours", "Tâches finalisées", "/ tâche", ["> 5", "> 3 à 5", "> 2 à 3", "1 à 2", "< 1"],
    (v) => (v > 5 ? 1 : v > 3 ? 2 : v > 2 ? 3 : v >= 1 ? 4 : 5), "≤ 2 itér.", [["X29", 0.4]]), ext: { lab: "S26 > 0,40 (Définition des processus)" } },
  X32: Q("KPI définis", "Questionnaire et mesure", "k > 1", []),
  X33: P("KPI suivis", "Fichiers trouvés et entretiens", "KPI mesurés", "KPI définis", "≥ 50 %", [["X32", 0.2]]),
  X34: P("Revues", "Comptes rendus de revues", "Revues réalisées", "Revues prévues", "≥ 70 %", [["X33", 0.4]]),
  X35: Q("Anticipation", "Questionnaire", "k > 4", [["X34", 0.6], ["X33", 0.6]]),
  X36: P("Visibilité", "Emails, NCR et questionnaire", "Activités sans relance", "Total activités", "≥ 30 %", []),
  X37: Q("Décisions", "Questionnaire", "k > 2", [["X36", 0.2]]),
  X38: Q("Traçabilité", "Questionnaire", "k > 3", [["X37", 0.4]]),
  X39: P("Incidents conj.", "Procédures dans le SI", "Incidents gérés conjointement", "Incidents concernés", "≥ 30 %", []),
  X40: D("Réaction", "Suivi d’affaires et emails", ["> 24 h", "12–24 h", "4–12 h", "1–4 h", "< 1 h"],
    (v) => (v > 24 ? 1 : v > 12 ? 2 : v > 4 ? 3 : v >= 1 ? 4 : 5), "≤ 12 h", [["X39", 0.2]]),
  X42: Q("Amélioration", "Questionnaire", "k > 3", [["X40", 0.4], ["X39", 0.4]]),
  X41: Q("Anticip. risques", "Questionnaire", "k > 4", [["X42", 0.6]], { ext: { lab: "S35 > 0,60 (Pilotage des processus)" } }),
  X45: Q("Formats", "Questionnaire", "k > 1", []),
  X43: P("Complétude", "NCR et emails", "Échanges complets", "Total échanges", "≥ 50 %", [["X45", 0.2]]),
  X46: {
    n: "Erreurs", t: "inv", src: "Emails et suivi d’affaires", la: "Échanges en erreur", lb: "Total échanges",
    sc: ["> 50 %", "30–50 %", "15–30 %", "5–15 %", "< 5 %"], fn: (p) => (p > 50 ? 1 : p > 30 ? 2 : p > 15 ? 3 : p >= 5 ? 4 : 5),
    seuil: "≤ 15 %", deps: [["X43", 0.4], ["X45", 0.4]],
  },
  X44: D("Propagation", "Analyse des emails", ["> 72 h", "24–72 h", "4–24 h", "15 min–4 h", "< 15 min"],
    (v) => (v > 72 ? 1 : v > 24 ? 2 : v > 4 ? 3 : v >= 0.25 ? 4 : 5), "< 15 min", [["X46", 0.6]]),
  X48: N("Source comm.", "Vérification dans le SI", ["sources multiples", "disparates", "plusieurs principales", "une principale", "source unique partagée"], "niveau ≥ 2", []),
  X49: P("Unicité", "Dossiers et référentiels", "Enregistrements uniques", "Enregistrements évalués", "≥ 50 %", [["X48", 0.2]]),
  X47: Q("Mode d’accès", "Questionnaire", "k > 3", [["X49", 0.4], ["X48", 0.4]]),
  X50: D("Diffusion", "Emails et dates de modification", ["> 168 h", "72–168 h", "24–72 h", "1–24 h", "< 1 h"],
    (v) => (v > 168 ? 1 : v > 72 ? 2 : v > 24 ? 3 : v >= 1 ? 4 : 5), "< 1 h", [["X47", 0.6]]),
  X51: Q("Formalisation", "Questionnaire", "k > 1", []),
  X52: N("Espaces KM", "Vérification dans le SI", ["aucun", "stockage local", "fichiers partagés peu utilisés", "GED ou wiki utilisé", "plateforme KMS"], "niveau ≥ 3", [["X51", 0.2]]),
  X53: P("Contribution", "Contributions dans le SI", "Connaissances mises à jour", "Total connaissances", "≥ 70 %", [["X52", 0.4]]),
  X54: Q("Réutilisation", "Questionnaire", "k > 4", [["X53", 0.6], ["X51", 0.6]]),
}

export const ATTRS: Attribute[] = [
  { name: "Contrat de partenariat", inds: [["X1", 1], ["X2", 2], ["X3", 3], ["X4", 3], ["X5", 4]], post: [] },
  { name: "Marché / technologie", inds: [["X6", 1], ["X8", 2], ["X7", 3]], post: [{ L: 5, min: ["X6", "X8", "X7"], t: 0.8 }] },
  { name: "Coûts / finances", inds: [["X9", 1], ["X10", 2]], post: [{ L: 4, min: ["X9", "X10"], t: 0.6 }, { L: 5, min: ["X9", "X10"], t: 0.8 }] },
  { name: "Culture et valeurs", inds: [["X11", 1], ["X12", 2], ["X13", 3]], post: [{ L: 5, min: ["X11", "X12", "X13"], t: 0.8 }] },
  { name: "Compétences", inds: [["X14", 1], ["X15", 2]], post: [{ L: 4, min: ["X14", "X15"], t: 0.6 }, { L: 5, min: ["X14", "X15"], t: 0.8 }] },
  { name: "Engagement", inds: [["X17", 1], ["X16", 2], ["X18", 3], ["X19", 4]], post: [] },
  { name: "Rôles et responsabilités", inds: [["X21", 1], ["X20", 2], ["X22", 3], ["X23", 4]], post: [] },
  { name: "Définition des processus", inds: [["X24", 1], ["X25", 2], ["X26", 3], ["X27", 4]], post: [] },
  { name: "Exécution des processus", inds: [["X28", 1], ["X29", 2], ["X30", 3]], post: [{ L: 5, min: ["X28", "X29", "X30"], t: 0.8 }] },
  { name: "Pilotage des processus", inds: [["X32", 1], ["X33", 2], ["X34", 3], ["X35", 5]], post: [] },
  { name: "Transparence des processus", inds: [["X36", 1], ["X37", 2], ["X38", 3]], post: [{ L: 5, min: ["X36", "X37", "X38"], t: 0.8 }] },
  { name: "Incidents et risques", inds: [["X39", 1], ["X40", 2], ["X42", 3], ["X41", 5]], post: [] },
  { name: "Données de processus", inds: [["X45", 1], ["X43", 2], ["X46", 3], ["X44", 4]], post: [] },
  { name: "Données produit", inds: [["X48", 1], ["X49", 2], ["X47", 3], ["X50", 4]], post: [] },
  { name: "Gestion des connaissances", inds: [["X51", 1], ["X52", 2], ["X53", 3], ["X54", 5]], post: [] },
]

/** Définition et 5 états (L1 → L5) issus de la feuille Etat_indicateur. X1 est binaire : 2 états. */
export const ETAT: Record<string, { d: string; s: string[] }> = {
  "X1": {
    "d": "Existence d’un contrat formalisé",
    "s": [
      "Aucun contrat ou accord formalisé.",
      "Un contrat ou un accord écrit existe (trouvé dans le SI ou déclaré par questionnaire)."
    ]
  },
  "X2": {
    "d": "% activités couvertes par les accords",
    "s": [
      "Très peu ou aucune activité couverte.",
      "Une partie limitée des activités est couverte.",
      "La majorité des activités collaboratives est couverte.",
      "Presque toutes les activités sont couvertes et suivies.",
      "Toutes les activités pertinentes sont couvertes et la couverture est ajustée lorsque le périmètre évolue."
    ]
  },
  "X3": {
    "d": "% engagements respectés",
    "s": [
      "Engagements rarement suivis ou respectés.",
      "Respect partiel et irrégulier.",
      "La majorité des engagements est respectée.",
      "Respect élevé et suivi systématiquement.",
      "Respect durable avec détection précoce et adaptation en cas de risque de non-respect."
    ]
  },
  "X4": {
    "d": "Incidents liés à des incompréhensions / mois",
    "s": [
      "Incidents fréquents, non suivis et traités au cas par cas.",
      "Incidents encore réguliers mais identifiés.",
      "Incidents réduits grâce à des mécanismes communs de clarification.",
      "Incidents rares, analysés et suivis.",
      "Incidents anticipés ou évités grâce à des mécanismes adaptatifs."
    ]
  },
  "X5": {
    "d": "Existence & fréquence de revue / mise à jour",
    "s": [
      "Aucune revue formalisée.",
      "Revue seulement lorsqu’un problème apparaît.",
      "Revue planifiée et réalisée avec les partenaires.",
      "Revues régulières avec suivi des changements.",
      "Révision proactive déclenchée aussi par les évolutions du contexte."
    ]
  },
  "X6": {
    "d": "Fréquence de veille partagée",
    "s": [
      "Aucune veille partagée.",
      "Veille ponctuelle et non structurée.",
      "Veille partagée régulièrement.",
      "Veille structurée, suivie et intégrée aux décisions.",
      "Veille continue avec anticipation des évolutions et adaptation rapide."
    ]
  },
  "X7": {
    "d": "% décisions marché / technologie avec participation du partenaire",
    "s": [
      "Décisions prises séparément.",
      "Consultation ponctuelle du partenaire.",
      "Participation du partenaire à une part significative des décisions.",
      "Participation systématique aux décisions importantes.",
      "Co-décision proactive et adaptation conjointe aux évolutions du marché/technologie."
    ]
  },
  "X8": {
    "d": "Existence d’outils partagés de veille",
    "s": [
      "Aucun outil partagé.",
      "Outil ou espace existant mais usage occasionnel.",
      "Outil partagé utilisé par les deux partenaires.",
      "Outil partagé, alimenté et suivi régulièrement.",
      "Outil intégré aux processus de décision avec veille dynamique/alertes."
    ]
  },
  "X9": {
    "d": "Nb désaccords financiers / an",
    "s": [
      "Désaccords fréquents, non suivis.",
      "Désaccords identifiés mais traités au cas par cas.",
      "Désaccords moins fréquents grâce à des règles communes.",
      "Désaccords rares et analysés systématiquement.",
      "Désaccords anticipés/prévenus grâce à des mécanismes communs."
    ]
  },
  "X10": {
    "d": "Fréquence de revue conjointe budgets / coûts",
    "s": [
      "Aucune revue conjointe.",
      "Revues ponctuelles, surtout en cas de problème.",
      "Revues conjointes planifiées.",
      "Revues régulières avec indicateurs et suivi des écarts.",
      "Revues dynamiques avec prévisions et ajustements anticipés."
    ]
  },
  "X11": {
    "d": "% collaborateurs déclarant les valeurs claires / partagées",
    "s": [
      "Valeurs communes peu ou pas identifiées.",
      "Valeurs connues par une partie des collaborateurs.",
      "Valeurs comprises et partagées par une majorité.",
      "Valeurs largement partagées et intégrées aux pratiques.",
      "Valeurs continuellement renforcées et adaptées à la collaboration."
    ]
  },
  "X12": {
    "d": "Nb actions de promotion d’une culture commune / an",
    "s": [
      "Aucune action.",
      "Actions rares et ponctuelles.",
      "Actions conjointes organisées régulièrement.",
      "Programme structuré et suivi d’actions communes.",
      "Actions adaptées en continu selon les besoins et retours des équipes."
    ]
  },
  "X13": {
    "d": "Taux de conflits culturels signalés",
    "s": [
      "Conflits fréquents et réactifs.",
      "Conflits identifiés mais peu analysés.",
      "Conflits mieux gérés par des règles/pratiques communes.",
      "Conflits rares, suivis et utilisés pour améliorer la collaboration.",
      "Risques culturels anticipés et actions préventives adaptées."
    ]
  },
  "X14": {
    "d": "% savoir-faire nécessaires à la collaboration identifiés / cartographiés",
    "s": [
      "Non identifiés.",
      "Partiellement identifiés.",
      "Identifiés.",
      "Identifiés et cartographiés.",
      "Cartographiés et mis à jour régulièrement."
    ]
  },
  "X15": {
    "d": "Nb formations conjointes / an",
    "s": [
      "Aucune formation.",
      "1 fois/an.",
      "2 à 3 fois/an.",
      "4 à 6 fois/an.",
      "Plus de 6 fois/an et intégrées aux projets."
    ]
  },
  "X16": {
    "d": "Taux de participation aux réunions / ateliers",
    "s": [
      "Participation faible et irrégulière.",
      "Participation partielle.",
      "Participation régulière des acteurs concernés.",
      "Participation élevée et stable.",
      "Participation proactive, adaptée aux besoins de la collaboration."
    ]
  },
  "X17": {
    "d": "% actions conjointes réalisées dans les délais",
    "s": [
      "Actions rarement réalisées dans les délais.",
      "Respect des délais partiel.",
      "Majorité des actions dans les délais.",
      "Très forte maîtrise des délais avec suivi.",
      "Délais anticipés et ajustements proactifs en cas de risque."
    ]
  },
  "X18": {
    "d": "Stabilité des équipes dédiées / turnover",
    "s": [
      "Équipes très instables ou ponctuelles.",
      "Équipe identifiable mais changements fréquents.",
      "Équipe relativement stable.",
      "Équipe stable avec gestion des remplacements et continuité.",
      "Équipe adaptable sans perte de continuité ni de connaissance."
    ]
  },
  "X19": {
    "d": "Satisfaction des partenaires sur l’implication",
    "s": [
      "Insatisfaction forte.",
      "Satisfaction faible ou irrégulière.",
      "Satisfaction correcte.",
      "Satisfaction élevée et stable.",
      "Satisfaction très élevée avec amélioration continue de l’implication."
    ]
  },
  "X20": {
    "d": "% collaborateurs sachant « qui fait quoi » chez le partenaire",
    "s": [
      "Rôles largement inconnus.",
      "Connaissance partielle.",
      "Rôles globalement connus.",
      "Rôles clairement connus et compris.",
      "Rôles connus, actualisés et adaptés rapidement aux changements."
    ]
  },
  "X21": {
    "d": "% rôles formalisés (RACI / organigramme)",
    "s": [
      "Rôles non formalisés.",
      "Quelques rôles formalisés.",
      "Majorité des rôles formalisés et partagés.",
      "Rôles formalisés, suivis et mis à jour.",
      "Rôles dynamiquement adaptés aux évolutions organisationnelles."
    ]
  },
  "X22": {
    "d": "Nb chevauchements / zones grises / an",
    "s": [
      "Zones grises fréquentes.",
      "Zones grises identifiées mais récurrentes.",
      "Zones grises réduites grâce à la clarification des rôles.",
      "Zones grises rares et analysées.",
      "Chevauchements anticipés et corrigés avant impact."
    ]
  },
  "X23": {
    "d": "Mise à jour formelle des responsabilités",
    "s": [
      "Aucune mise à jour formelle.",
      "Mise à jour tardive ou uniquement après problème.",
      "Mises à jour réalisées lors des changements importants.",
      "Mises à jour rapides, versionnées et suivies.",
      "Mises à jour proactives et synchronisées avec les évolutions organisationnelles."
    ]
  },
  "X24": {
    "d": "Existence d’un référentiel partagé des processus",
    "s": [
      "Aucun référentiel partagé.",
      "Référentiels locaux ou partage partiel.",
      "Référentiel commun accessible aux partenaires.",
      "Référentiel commun maintenu et versionné.",
      "Référentiel dynamique, connecté aux changements et à l’exécution."
    ]
  },
  "X25": {
    "d": "% points de coordination / activités clés identifiées",
    "s": [
      "Points de coordination non identifiés.",
      "Identification partielle.",
      "Majorité des points clés identifiée.",
      "Couverture quasi complète, vérifiée et maintenue.",
      "Identification adaptée automatiquement aux changements de processus."
    ]
  },
  "X26": {
    "d": "% points de coordination avec entrées / sorties définies",
    "s": [
      "Entrées/sorties non définies.",
      "Définition partielle et informelle.",
      "Définition claire pour la majorité des points.",
      "Définition complète, standardisée et suivie.",
      "Définition adaptative mise à jour avec les changements de processus."
    ]
  },
  "X27": {
    "d": "Délai de mise à jour après changement",
    "s": [
      "Mise à jour absente ou très tardive.",
      "Mise à jour tardive et réactive.",
      "Mise à jour dans un délai acceptable.",
      "Mise à jour rapide et systématiquement tracée.",
      "Mise à jour quasi immédiate ou déclenchée automatiquement."
    ]
  },
  "X28": {
    "d": "% activités exécutées selon le planning convenu",
    "s": [
      "Faible respect du planning.",
      "Respect partiel et irrégulier.",
      "Majorité des activités exécutées comme prévu.",
      "Respect élevé avec suivi des écarts.",
      "Planning anticipé et ajusté dynamiquement en cas de risque."
    ]
  },
  "X29": {
    "d": "Fréquence des désynchronisations par période",
    "s": [
      "Désynchronisations fréquentes et non maîtrisées.",
      "Désynchronisations identifiées mais encore régulières.",
      "Désynchronisations réduites grâce à la coordination.",
      "Désynchronisations rares et analysées.",
      "Désynchronisations anticipées/prévenues automatiquement."
    ]
  },
  "X30": {
    "d": "Nb d’itérations nécessaires à la finalisation d’une tâche interentreprises",
    "s": [
      "Nombre élevé d’itérations, non maîtrisé.",
      "Plusieurs itérations avec résolution lente.",
      "Nombre d’itérations maîtrisé.",
      "Peu d’itérations grâce à des règles et informations stables.",
      "Itérations minimisées grâce à l’anticipation et à l’adaptation."
    ]
  },
  "X32": {
    "d": "Nombre de KPI communs définis",
    "s": [
      "Aucun KPI commun.",
      "Quelques KPI communs définis.",
      "Ensemble cohérent de KPI communs.",
      "KPI communs suivis et utilisés dans le pilotage.",
      "KPI adaptés dynamiquement aux objectifs et risques."
    ]
  },
  "X33": {
    "d": "% KPI suivis",
    "s": [
      "KPI non suivis.",
      "Suivi partiel ou irrégulier.",
      "Majorité des KPI suivis régulièrement.",
      "KPI suivis systématiquement avec analyse des écarts.",
      "Suivi temps réel/prédictif avec adaptation des actions."
    ]
  },
  "X34": {
    "d": "Fréquence / taux de revues conjointes",
    "s": [
      "Aucune revue.",
      "Revues ponctuelles et réactives.",
      "Revues conjointes planifiées.",
      "Revues régulières basées sur KPI et actions.",
      "Revues dynamiques déclenchées aussi par signaux/alertes."
    ]
  },
  "X35": {
    "d": "Capacité d’anticipation",
    "s": [
      "Gestion uniquement réactive.",
      "Quelques anticipations ponctuelles.",
      "Anticipation intégrée à certaines décisions.",
      "Anticipation structurée basée sur données et tendances.",
      "Anticipation continue/prédictive avec adaptation proactive."
    ]
  },
  "X36": {
    "d": "Taux de visibilité partagée",
    "s": [
      "Très faible visibilité entre partenaires.",
      "Visibilité partielle, sur demande.",
      "Informations clés généralement accessibles aux deux partenaires.",
      "Visibilité élevée, structurée et traçable.",
      "Visibilité dynamique et adaptée selon besoins/risques."
    ]
  },
  "X37": {
    "d": "Couverture des décisions clés",
    "s": [
      "Décisions clés peu ou pas partagées.",
      "Partage partiel et irrégulier.",
      "Majorité des décisions clés partagée.",
      "Partage systématique, traçable et exploité.",
      "Diffusion adaptative et contextualisée selon les acteurs concernés."
    ]
  },
  "X38": {
    "d": "Profondeur de traçabilité / historique",
    "s": [
      "Aucune traçabilité ou traces dispersées.",
      "Historique partiel.",
      "Historique structuré pour les éléments principaux.",
      "Traçabilité complète et auditée.",
      "Traçabilité temps réel, intégrée et exploitable pour l’anticipation."
    ]
  },
  "X39": {
    "d": "% incidents gérés conjointement selon procédure",
    "s": [
      "Pas de procédure commune ou incidents gérés séparément.",
      "Procédure partielle / usage occasionnel.",
      "Majorité des incidents gérée conjointement selon procédure.",
      "Gestion conjointe systématique et suivie.",
      "Gestion préventive/adaptative basée sur les tendances des incidents."
    ]
  },
  "X40": {
    "d": "Temps de réaction aux incidents",
    "s": [
      "Temps non maîtrisé ou très long.",
      "Réaction tardive et variable.",
      "Réaction dans un délai acceptable.",
      "Réaction rapide, suivie et standardisée.",
      "Réaction proactive/automatisée avant propagation de l’impact."
    ]
  },
  "X41": {
    "d": "Taux d’anticipation des risques",
    "s": [
      "Risques principalement identifiés après occurrence.",
      "Quelques risques identifiés à l’avance.",
      "Majorité des risques importants identifiée avant occurrence.",
      "Risques suivis avec actions préventives structurées.",
      "Détection prédictive et adaptation continue des actions."
    ]
  },
  "X42": {
    "d": "Taux d’amélioration post-incident",
    "s": [
      "Aucun retour d’expérience structuré.",
      "Actions ponctuelles après certains incidents.",
      "Améliorations mises en œuvre après la majorité des incidents importants.",
      "Améliorations suivies et vérifiées systématiquement.",
      "Apprentissage continu réinjecté automatiquement dans prévention et processus."
    ]
  },
  "X43": {
    "d": "Taux de complétude des données de processus",
    "s": [
      "Données souvent incomplètes.",
      "Complétude partielle et contrôles irréguliers.",
      "Données généralement complètes.",
      "Complétude élevée, contrôlée automatiquement.",
      "Complétude surveillée en continu avec correction/prévention automatique."
    ]
  },
  "X44": {
    "d": "Délai de propagation",
    "s": [
      "Propagation lente, manuelle ou non maîtrisée.",
      "Propagation variable et souvent tardive.",
      "Propagation dans un délai acceptable.",
      "Propagation rapide, mesurée et stable.",
      "Propagation quasi temps réel/adaptative."
    ]
  },
  "X45": {
    "d": "Formats d’échange convenus",
    "s": [
      "Aucun format commun.",
      "Formats définis partiellement ou au cas par cas.",
      "Formats communs convenus pour les échanges principaux.",
      "Formats standardisés, appliqués et contrôlés.",
      "Formats gérés dynamiquement via interfaces/standards évolutifs."
    ]
  },
  "X46": {
    "d": "Fréquence des erreurs / incohérences dans les données échangées",
    "s": [
      "Erreurs fréquentes et détectées manuellement.",
      "Erreurs encore régulières avec contrôles partiels.",
      "Erreurs réduites grâce à des règles communes.",
      "Erreurs rares, surveillées automatiquement.",
      "Erreurs anticipées/prévenues par contrôles adaptatifs."
    ]
  },
  "X47": {
    "d": "Mode d’accès aux données produit",
    "s": [
      "Accès manuel ou dépendant d’une personne.",
      "Échange de fichiers ponctuel.",
      "Accès structuré à un espace partagé.",
      "Accès intégré entre systèmes.",
      "Accès temps réel/API avec synchronisation dynamique."
    ]
  },
  "X48": {
    "d": "Existence d’une source commune / espace de stockage",
    "s": [
      "Aucune source commune.",
      "Source commune existe mais accès/usage limité.",
      "Source commune accessible aux deux partenaires.",
      "Source commune gouvernée, versionnée et activement utilisée.",
      "Source commune intégrée et synchronisée dynamiquement."
    ]
  },
  "X49": {
    "d": "Taux d’unicité",
    "s": [
      "Nombreux doublons / versions contradictoires.",
      "Doublons encore fréquents.",
      "Majorité des données uniques et cohérentes.",
      "Unicité élevée avec contrôles automatiques.",
      "Unicité assurée dynamiquement par gouvernance/MDM."
    ]
  },
  "X50": {
    "d": "Délai de diffusion des modifications",
    "s": [
      "Diffusion lente, manuelle ou irrégulière.",
      "Diffusion partielle avec retards fréquents.",
      "Modifications diffusées dans un délai acceptable.",
      "Diffusion rapide et systématiquement tracée.",
      "Diffusion quasi temps réel et synchronisée automatiquement."
    ]
  },
  "X51": {
    "d": "Niveau de formalisation et de structuration des connaissances",
    "s": [
      "Connaissances principalement tacites et dispersées.",
      "Certaines connaissances documentées mais peu structurées.",
      "Connaissances importantes documentées et structurées.",
      "Connaissances organisées, gouvernées et régulièrement mises à jour.",
      "Connaissances structurées, contextualisées et adaptées dynamiquement."
    ]
  },
  "X52": {
    "d": "Existence d’espaces de stockage partagés des connaissances",
    "s": [
      "Aucun espace partagé.",
      "Espace existant mais peu accessible/utilisé.",
      "Espace partagé utilisé par les deux partenaires.",
      "Espace structuré, gouverné et actif.",
      "Espace intégré aux processus avec accès/contextualisation dynamique."
    ]
  },
  "X53": {
    "d": "Taux de mise à jour et de contribution aux connaissances",
    "s": [
      "Contributions rares ou absentes.",
      "Contributions ponctuelles.",
      "Contributions régulières des partenaires.",
      "Contributions suivies avec mise à jour structurée.",
      "Contribution continue, proactive et déclenchée par les évolutions/besoins."
    ]
  },
  "X54": {
    "d": "Réutilisation des connaissances et intégration aux activités quotidiennes",
    "s": [
      "Réutilisation inexistante ou dépendante d’individus.",
      "Réutilisation ponctuelle.",
      "Réutilisation régulière dans certaines activités.",
      "Réutilisation intégrée aux processus et décisions.",
      "Réutilisation systématique et adaptative, soutenant apprentissage et anticipation."
    ]
  }
}

export const LV: Record<number, [string, string]> = {
  1: ["Ad Hoc", "0 – 0,20"],
  2: ["Performed", "0,20 – 0,40"],
  3: ["Interoperable", "0,40 – 0,60"],
  4: ["Sustainable", "0,60 – 0,80"],
  5: ["Adaptive", "0,80 – 1"],
}
