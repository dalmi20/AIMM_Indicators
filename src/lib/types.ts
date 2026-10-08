export type IndType = "bin" | "pct" | "inv" | "rate" | "delay" | "q" | "niv" | "undef"

/** Dépendance : [indicateur, seuil strict sur son score S] */
export type Dep = [string, number]

export interface Indicator {
  /** nom court (en-tête de colonne) */
  n: string
  t: IndType
  /** source de mesure */
  src: string
  /** seuil de déclenchement exprimé en mesure brute */
  seuil: string
  deps: Dep[]
  /** dépendance vers un autre attribut */
  ext?: { lab: string }
  /** libellés des deux saisies (pct, inv, rate) */
  la?: string
  lb?: string
  unit?: string
  /** libellés de l'échelle k = 1..5 */
  sc?: string[]
  /** mesure brute -> niveau k (1..5) */
  fn?: (v: number) => number
  /** X5 : 0 revue prévue autorisé (=> k = 1) */
  zero?: boolean
  /** questionnaire plafonné (X20 : options 1 à 4) */
  kmax?: number
}

export interface PostRule {
  L: number
  min: string[]
  t: number
}

export interface Attribute {
  name: string
  /** [id indicateur, bande de niveau évaluée] */
  inds: [string, number][]
  post: PostRule[]
}

export type X1Choice = "si" | "qoui" | "qnon"

export interface Value {
  a?: number
  b?: number
  v?: number
  x1?: X1Choice
}

export type NodeState = "pass" | "fail" | "off"
