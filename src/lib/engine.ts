import { H, IND, PS } from "@/data/aimm"
import type { Attribute, Indicator, NodeState, Value } from "@/lib/types"

/* ---------- formatage ---------- */
export const f2 = (v: number) => v.toFixed(2).replace(".", ",")
export const fk = (v: number) => String(v).replace(".", ",")
export const fmtH = (v: number) => (v < 1 ? `${Math.round(v * 60)} min` : `${fk(v)} h`)
/** valeur courte de S pour un niveau k : 0,2 0,4 … 1 */
export const sOfK = (k: number) => (k === 5 ? "1" : f2(0.2 * k).replace(/0$/, ""))

/** seuil strict sur S pour un indicateur évalué dans la bande b */
export const thrOf = (b: number) => 0.2 * Math.min(b, 4)
/** niveau k minimal qui franchit le seuil de la bande b */
export const needK = (b: number) => Math.round(thrOf(b) / 0.2) + 1

const pk = (p: number) => (p < 30 ? 1 : p < 50 ? 2 : p < 70 ? 3 : p <= 85 ? 4 : 5)
const EPS = 1e-9

/* ---------- valeurs initiales (état L1) ---------- */
export function initValue(d: Indicator): Value {
  switch (d.t) {
    case "bin": return { x1: "qnon" }
    case "pct": return { a: 0, b: 10 }
    case "inv": return { a: 10, b: 10 }
    case "rate": return { a: d.fn!(6) === 1 ? 6 : 11, b: 1 }
    case "delay": return { v: H.length - 1 }
    default: return { v: 1 }
  }
}

export function initValues(attr: Attribute) {
  const vals: Record<string, Value> = {}
  const ext: Record<string, boolean> = {}
  for (const [id] of attr.inds) {
    vals[id] = initValue(IND[id])
    if (IND[id].ext) ext[id] = true
  }
  return { vals, ext }
}

export function maxValues(attr: Attribute, vals: Record<string, Value>) {
  const out: Record<string, Value> = {}
  for (const [id] of attr.inds) {
    const d = IND[id], v = vals[id]
    switch (d.t) {
      case "bin": out[id] = { x1: "si" }; break
      case "pct": { const b = Math.max(v.b ?? 10, 1); out[id] = { a: b, b }; break }
      case "inv": case "rate": out[id] = { a: 0, b: v.b ?? 1 }; break
      case "delay": out[id] = { v: 0 }; break
      case "q": out[id] = { v: d.kmax ?? 5 }; break
      default: out[id] = { v: 5 }
    }
  }
  return out
}

/* ---------- score d'un indicateur ---------- */
export interface Score {
  S: number
  /** niveau observé 1..5 (état surligné) */
  k: number
  disp: string
  /** k moyen non entier (questionnaire) */
  frac?: boolean
}

export function score(id: string, v: Value): Score {
  const d = IND[id]
  switch (d.t) {
    case "bin": {
      const S = v.x1 === "qnon" ? 0 : 1
      const disp = { si: "trouvé dans le SI", qoui: "déclaré (questionnaire)", qnon: "absent" }[v.x1 ?? "qnon"]
      return { S, k: S ? 2 : 1, disp }
    }
    case "pct": {
      if (d.zero && v.b === 0) return { k: 1, S: 0.2, disp: "aucune revue prévue" }
      const p = Math.min(v.a! / v.b!, 1) * 100, k = pk(p)
      return { k, S: 0.2 * k, disp: `${Math.round(p)} %` }
    }
    case "inv": {
      const p = Math.min(v.a! / v.b!, 1) * 100, k = d.fn!(p)
      return { k, S: 0.2 * k, disp: `${Math.round(p)} % en erreur` }
    }
    case "rate": {
      const r = v.a! / v.b!, k = d.fn!(r)
      return { k, S: 0.2 * k, disp: `${f2(r)} ${d.unit}` }
    }
    case "delay": {
      const h = H[v.v!], k = d.fn!(h)
      return { k, S: 0.2 * k, disp: `médiane ${fmtH(h)}` }
    }
    case "q": {
      const k = v.v!
      return { k: Math.min(5, Math.ceil(k)), S: 0.2 * k, disp: `k moyen = ${fk(k)}`, frac: k % 1 !== 0 }
    }
    case "niv": return { k: v.v!, S: 0.2 * v.v!, disp: d.sc![v.v! - 1] }
    default: return { k: v.v!, S: 0.2 * v.v!, disp: `k = ${v.v} (bornes à définir)` }
  }
}

export function scaleLabels(id: string): string[] {
  const d = IND[id]
  if (d.t === "pct") return PS
  if (d.t === "rate") return d.sc!.map((s) => `${s} ${d.unit}`)
  if (d.t === "q" || d.t === "undef") return [1, 2, 3, 4, 5].map((k) => `k = ${k}`)
  return d.sc!
}

/* ---------- évaluation de l'attribut ---------- */
export interface Evaluation {
  S: Record<string, number>
  sc: Record<string, Score>
  /** état de chaque indicateur */
  st: Record<string, NodeState>
  /** état des nœuds de niveau ajoutés après la dernière bande */
  res: Record<number, NodeState>
  lvl: number
  why: string[]
  bands: number[]
  /** dernière bande d'indicateurs */
  fb: number
  /** bande où l'évaluation s'est arrêtée (null si toutes passées) */
  failed: number | null
}

export function ownPass(id: string, b: number, S: number) {
  return IND[id].t === "bin" ? S === 1 : S > thrOf(b) + EPS
}

export function evaluate(attr: Attribute, vals: Record<string, Value>, ext: Record<string, boolean>): Evaluation {
  const S: Record<string, number> = {}, sc: Record<string, Score> = {}
  for (const [id] of attr.inds) { sc[id] = score(id, vals[id]); S[id] = sc[id].S }
  const band: Record<string, number> = Object.fromEntries(attr.inds)
  const bands = [...new Set(attr.inds.map((x) => x[1]))].sort((a, b) => a - b)
  const st: Record<string, NodeState> = {}, why: string[] = []
  let lvl = 1, failed: number | null = null

  const reasons = (id: string) => {
    const d = IND[id], t = thrOf(band[id]), r: string[] = []
    const n = id.slice(1)
    if (!ownPass(id, band[id], S[id]))
      r.push(d.t === "bin" ? `${id} = 0 : aucun contrat` : `S${n} = ${f2(S[id])}, condition S${n} > ${f2(t)} non remplie`)
    for (const [dep, dt] of d.deps)
      if (!(S[dep] > dt + EPS)) r.push(`${id} dépend de S${dep.slice(1)} > ${f2(dt)} (S${dep.slice(1)} = ${f2(S[dep])})`)
    if (d.ext && !ext[id]) r.push(`${id} dépend de ${d.ext.lab}, non rempli`)
    return r
  }

  for (const id in band) st[id] = "off"
  for (const b of bands) {
    let ok = true
    for (const [id] of attr.inds.filter((x) => x[1] === b)) {
      const r = reasons(id)
      st[id] = r.length ? "fail" : "pass"
      if (r.length) { ok = false; why.push(...r) }
    }
    if (ok) lvl = Math.min(5, b + 1)
    else { failed = b; break }
  }

  const fb = bands[bands.length - 1]
  const res: Record<number, NodeState> = {}
  if (fb < 5) {
    for (let L = fb + 1; L <= 5; L++) res[L] = "off"
    if (failed === null) {
      lvl = Math.min(5, fb + 1)
      res[fb + 1] = "pass"
      for (let L = fb + 2; L <= 5; L++) {
        const rule = attr.post.find((p) => p.L === L)
        if (!rule) break
        const m = Math.min(...rule.min.map((i) => S[i]))
        if (m > rule.t + EPS) { lvl = L; res[L] = "pass" }
        else {
          res[L] = "fail"
          why.push(`MIN(${rule.min.map((i) => "S" + i.slice(1)).join(", ")}) = ${f2(m)}, condition > ${f2(rule.t)} non remplie`)
          break
        }
      }
    }
  }
  if (!why.length) why.push("toutes les conditions sont remplies")
  if (vals.X1?.x1 === "qoui") why.push("X1 déclaré, à vérifier")
  return { S, sc, st, res, lvl, why, bands, fb, failed }
}

/* ---------- indication « quoi changer » ---------- */
/** Les segments entre ** ** sont affichés en gras. */
export function hintFor(id: string, b: number, ev: Evaluation, v: Value, ext: Record<string, boolean>): { ok: boolean; text: string } {
  const d = IND[id], need = needK(b), S = ev.S, tips: string[] = []
  if (!ownPass(id, b, S[id])) {
    switch (d.t) {
      case "bin":
        tips.push("Cliquez sur **SI : trouvé** ou **Questionnaire : oui**.")
        break
      case "pct": {
        if (d.zero && v.b === 0) { tips.push(`Indiquez au moins 1 dans **${d.lb}**.`); break }
        const pmin = ({ 2: 30, 3: 50, 4: 70, 5: 85 } as Record<number, number>)[need]
        let a = Math.ceil((pmin * v.b!) / 100 - EPS)
        if (need === 5 && (a * 100) / v.b! <= 85) a++
        tips.push(a <= v.b!
          ? `Montez **${d.la}** à au moins **${a}** sur ${v.b} (${need === 5 ? "> 85" : "≥ " + pmin} %).`
          : `Augmentez **${d.lb}** puis **${d.la}**.`)
        break
      }
      case "inv": {
        let a = -1
        for (let x = v.b!; x >= 0; x--) if (d.fn!((x * 100) / v.b!) >= need) { a = x; break }
        tips.push(`Descendez **${d.la}** à **${a}** ou moins sur ${v.b} (${d.seuil}).`)
        break
      }
      case "rate": {
        let a = -1
        for (let x = 200; x >= 0; x--) if (d.fn!(x / v.b!) >= need) { a = x; break }
        tips.push(a >= 0
          ? `Descendez **${d.la}** à **${a}** ou moins, avec ${d.lb!.toLowerCase()} = ${v.b} (${d.seuil}).`
          : `Augmentez **${d.lb}**.`)
        break
      }
      case "delay": {
        let i = -1
        for (let x = H.length - 1; x >= 0; x--) if (d.fn!(H[x]) >= need) { i = x; break }
        tips.push(`Réduisez le **délai médian** à **${fmtH(H[i])}** ou moins (${d.seuil}).`)
        break
      }
      case "q":
        tips.push(`Montez le **k moyen** à au moins **${fk(Math.min(b, 4) + 0.5)}** (${d.seuil}).`)
        break
      default:
        tips.push(`Montez le **niveau** à au moins **${need}**.`)
    }
  }
  for (const [x, t] of d.deps)
    if (!(S[x] > t + EPS)) tips.push(`Il faut aussi **S${x.slice(1)} > ${f2(t)}** : remontez ${x} (actuellement ${f2(S[x])}).`)
  if (d.ext && !ext[id]) tips.push("Mettez la condition externe sur **Remplie**.")
  if (!tips.length) return { ok: true, text: `✓ Seuil atteint : ${id} déclenche ${b >= 4 ? "L5" : "la suite"}.` }
  return { ok: false, text: "Pour déclencher la suite : " + tips.join(" ") }
}

/* ---------- boutons − / + ---------- */
export function step(id: string, v: Value, field: "a" | "b" | "v", delta: number): Value {
  const d = IND[id], n = { ...v }
  if (d.t === "q") { n.v = Math.max(1, Math.min(d.kmax ?? 5, n.v! + delta * 0.5)); return n }
  if (d.t === "delay") { n.v = Math.max(0, Math.min(H.length - 1, n.v! + delta)); return n }
  if (d.t === "niv" || d.t === "undef") { n.v = Math.max(1, Math.min(5, n.v! + delta)); return n }
  n[field] = (n[field] ?? 0) + delta
  if (d.t === "rate") {
    n.a = Math.max(0, Math.min(200, n.a!)); n.b = Math.max(1, Math.min(60, n.b!)); return n
  }
  n.b = Math.max(d.zero ? 0 : 1, Math.min(200, n.b!))
  n.a = Math.max(0, Math.min(n.b, n.a!))
  return n
}
