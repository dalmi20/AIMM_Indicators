import { useMemo } from "react"
import { ETAT, IND, LV } from "@/data/aimm"
import { f2, thrOf } from "@/lib/engine"
import type { Evaluation } from "@/lib/engine"
import type { Attribute, NodeState } from "@/lib/types"

const X0 = 150, W = 490, TOP = 74, RH = 92, NH = 74

interface Pt { cx: number; cy: number; b: number }
interface Arrow { id: string; d: string; group: number; kind: "band" | "res"; b?: number; L?: number }

/** Géométrie du diagramme (ne dépend que de l'attribut). */
function useLayout(attr: Attribute) {
  return useMemo(() => {
    const n = attr.inds.length, colw = W / n, nw = Math.min(96, colw - 14)
    const cy = (b: number) => TOP + (b - 1) * RH + RH / 2
    const nodes: Record<string, Pt> = {}
    attr.inds.forEach(([id, b], i) => { nodes[id] = { cx: X0 + colw * (i + 0.5), cy: cy(b), b } })
    const bands = [...new Set(attr.inds.map((x) => x[1]))].sort((a, b) => a - b)
    const fb = bands[bands.length - 1]
    const lastX = X0 + colw * (n - 0.5)
    const res: Record<number, Pt> = {}
    if (fb < 5) for (let L = fb + 1; L <= 5; L++) res[L] = { cx: lastX, cy: cy(L), b: L }

    const box = (o: Pt) => ({ x: o.cx - nw / 2, y: o.cy - NH / 2, r: o.cx + nw / 2, bt: o.cy + NH / 2 })
    const others = (b: number, a: number, c: number, src: Pt, tgt: Pt) =>
      Object.values(nodes).some((o) => o.b === b && o !== src && o !== tgt && o.cx > Math.min(a, c) && o.cx < Math.max(a, c))
    /** coude vertical puis horizontal, sinon horizontal puis vertical si un nœud gêne */
    const route = (src: Pt, tgt: Pt) => {
      const S = box(src), T = box(tgt)
      if (Math.abs(src.cx - tgt.cx) < 1) return `M${src.cx} ${S.bt} L${tgt.cx} ${T.y - 2}`
      if (!others(tgt.b, src.cx, tgt.cx, src, tgt)) return `M${src.cx} ${S.bt} L${src.cx} ${tgt.cy} L${T.x - 2} ${tgt.cy}`
      if (!others(src.b, src.cx, tgt.cx, src, tgt)) return `M${S.r} ${src.cy} L${tgt.cx} ${src.cy} L${tgt.cx} ${T.y - 2}`
      return `M${src.cx} ${S.bt} L${src.cx} ${tgt.cy} L${T.x - 2} ${tgt.cy}`
    }

    const arrows: Arrow[] = []
    const nodeGroup: Record<string, number> = {}
    const resGroup: Record<number, number> = {}
    let aid = 0, g = 0
    bands.forEach((b, bi) => {
      for (const [id] of attr.inds.filter((x) => x[1] === b)) nodeGroup[id] = g
      if (bi > 0) {
        const pb = bands[bi - 1]
        for (const [sid] of attr.inds.filter((x) => x[1] === pb))
          for (const [tid] of attr.inds.filter((x) => x[1] === b))
            arrows.push({ id: `a${aid++}`, d: route(nodes[sid], nodes[tid]), group: g, kind: "band", b })
      }
      g++
    })
    if (fb < 5) {
      for (let L = fb + 1; L <= 5; L++) {
        const t = res[L]
        if (L === fb + 1) {
          for (const [sid] of attr.inds.filter((x) => x[1] === fb))
            arrows.push({ id: `a${aid++}`, d: route(nodes[sid], t), group: g, kind: "res", L })
        } else {
          arrows.push({ id: `a${aid++}`, d: `M${t.cx} ${res[L - 1].cy + NH / 2} L${t.cx} ${t.cy - NH / 2 - 2}`, group: g, kind: "res", L })
        }
        resGroup[L] = g
        g++
      }
    }
    return { nw, nodes, res, arrows, nodeGroup, resGroup, groups: g, box, bands, fb }
  }, [attr])
}

const nodeStyle = (st: NodeState, isRes = false) => {
  if (st === "off") return { fill: "var(--off-bg)", stroke: "var(--off)", title: "var(--off)", text: "var(--off)" }
  if (isRes && st === "pass") return { fill: "var(--pass-bg)", stroke: "var(--pass)", title: "var(--pass)", text: "var(--pass)" }
  return { fill: "var(--info-bg)", stroke: "var(--info)", title: "var(--info)", text: "var(--foreground)" }
}

export function SequenceDiagram({ attr, ev, step }: { attr: Attribute; ev: Evaluation; step: number }) {
  const L = useLayout(attr)
  const bottom = TOP + 5 * RH
  const shown = (g: number) => g < step

  const arrowLive = (a: Arrow) => {
    if (!shown(a.group)) return false
    if (a.kind === "band") {
      const bi = ev.bands.indexOf(a.b!), prev = ev.bands[bi - 1]
      return ev.failed === null || ev.bands.indexOf(ev.failed) > ev.bands.indexOf(prev)
    }
    return a.L === ev.fb + 1 ? ev.failed === null : ev.res[a.L!] !== "off"
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 680 ${bottom + 10}`} className="block h-auto w-full min-w-[560px]" role="img"
        aria-label={`Diagramme de séquence de l'attribut ${attr.name}`}>
        <defs>
          <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* bandes de niveaux */}
        {[1, 2, 3, 4, 5].map((b) => {
          const y = TOP + (b - 1) * RH
          const on = step > L.groups && ev.lvl === b
          return (
            <g key={b}>
              <rect x={40} y={y} width={600} height={RH} style={{ fill: on ? "var(--lane)" : "transparent", transition: "fill .4s" }} />
              <line x1={40} y1={y} x2={640} y2={y} style={{ stroke: "var(--border)" }} />
              <text x={46} y={y + 22} style={{ fill: "var(--foreground)", fontSize: 13, fontWeight: 600 }}>L{b}</text>
              <text x={46} y={y + 40} style={{ fill: "var(--muted-foreground)", fontSize: 12 }}>{LV[b][0]}</text>
              <text x={46} y={y + 56} style={{ fill: "var(--muted-foreground)", fontSize: 12 }}>{LV[b][1]}</text>
            </g>
          )
        })}
        <line x1={40} y1={bottom} x2={640} y2={bottom} style={{ stroke: "var(--border)" }} />

        {/* lignes de vie et en-têtes */}
        {attr.inds.map(([id]) => {
          const o = L.nodes[id]
          return (
            <g key={id}>
              <line x1={o.cx} y1={62} x2={o.cx} y2={bottom} style={{ stroke: "var(--input)", strokeDasharray: "3 4" }} />
              <rect x={o.cx - L.nw / 2} y={14} width={L.nw} height={48} rx={7} style={{ fill: "var(--card)", stroke: "var(--input)" }} />
              <text x={o.cx} y={34} textAnchor="middle" style={{ fill: "var(--foreground)", fontSize: 13, fontWeight: 600 }}>{id}</text>
              <text x={o.cx} y={52} textAnchor="middle" style={{ fill: "var(--muted-foreground)", fontSize: 11 }}>{IND[id].n}</text>
            </g>
          )
        })}

        {/* flèches */}
        {L.arrows.map((a) => {
          const live = arrowLive(a)
          return (
            <path key={a.id} d={a.d} fill="none" markerEnd="url(#ah)"
              style={{ stroke: live ? "var(--pass)" : "var(--off)", strokeWidth: live ? 2 : 1.2, opacity: live ? 1 : 0.45, transition: "all .3s" }} />
          )
        })}

        {/* nœuds indicateurs */}
        {attr.inds.map(([id, b]) => {
          const o = L.nodes[id], B = L.box(o)
          const st: NodeState = shown(L.nodeGroup[id]) ? ev.st[id] : "off"
          const c = nodeStyle(st)
          const value = st === "off" ? "non évalué" : IND[id].t === "bin" ? `X1 = ${ev.S[id]}` : `S = ${f2(ev.S[id])}`
          return (
            <g key={id}>
              <title>{`${id} · ${ETAT[id].d}. Seuil de déclenchement : ${IND[id].seuil} (S > ${f2(thrOf(b))})`}</title>
              <rect x={B.x} y={B.y} width={L.nw} height={NH} rx={8} style={{ fill: c.fill, stroke: c.stroke, strokeWidth: st === "off" ? 1 : 1.5, transition: "all .3s" }} />
              <text x={o.cx} y={o.cy - 21} textAnchor="middle" style={{ fill: c.title, fontSize: 13, fontWeight: 600 }}>{id}</text>
              <text x={o.cx} y={o.cy - 5} textAnchor="middle" style={{ fill: c.text, fontSize: 12 }}>{value}</text>
              <text x={o.cx} y={o.cy + 9} textAnchor="middle" style={{ fill: c.text, fontSize: 11 }}>seuil {IND[id].seuil}</text>
              {st !== "off" && (
                <>
                  <line x1={B.x + 6} y1={o.cy + 16} x2={B.r - 6} y2={o.cy + 16}
                    style={{ stroke: st === "pass" ? "var(--pass)" : "var(--fail)", strokeWidth: 1.2, strokeDasharray: "3 3" }} />
                  <text x={o.cx} y={o.cy + 30} textAnchor="middle" style={{ fill: st === "pass" ? "var(--pass)" : "var(--fail)", fontSize: 11, fontWeight: 600 }}>
                    {st === "pass" ? "✓ déclenche" : "✗ bloque"}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* nœuds de niveau (après la dernière bande) */}
        {Object.entries(L.res).map(([k, o]) => {
          const lv = Number(k), B = L.box(o), rule = attr.post.find((p) => p.L === lv)
          const st: NodeState = shown(L.resGroup[lv]) ? ev.res[lv] : "off"
          const c = nodeStyle(st, true)
          return (
            <g key={k}>
              <rect x={B.x} y={B.y} width={L.nw} height={NH} rx={8} style={{ fill: c.fill, stroke: c.stroke, strokeWidth: st === "off" ? 1 : 1.5, transition: "all .3s" }} />
              <text x={o.cx} y={o.cy - 21} textAnchor="middle" style={{ fill: c.title, fontSize: 13, fontWeight: 600 }}>L{lv}</text>
              <text x={o.cx} y={o.cy - 5} textAnchor="middle" style={{ fill: c.text, fontSize: 12 }}>{rule ? `MIN > ${f2(rule.t)}` : "automatique"}</text>
              {st !== "off" && (
                <>
                  <line x1={B.x + 6} y1={o.cy + 8} x2={B.r - 6} y2={o.cy + 8}
                    style={{ stroke: st === "pass" ? "var(--pass)" : "var(--fail)", strokeWidth: 1.2, strokeDasharray: "3 3" }} />
                  <text x={o.cx} y={o.cy + 24} textAnchor="middle" style={{ fill: st === "pass" ? "var(--pass)" : "var(--fail)", fontSize: 11, fontWeight: 600 }}>
                    {st === "pass" ? "✓ atteint" : "✗ non atteint"}
                  </text>
                </>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Nombre d'étapes d'animation pour un attribut (bandes + niveaux ajoutés). */
export function groupCount(attr: Attribute) {
  const bands = [...new Set(attr.inds.map((x) => x[1]))].sort((a, b) => a - b)
  const fb = bands[bands.length - 1]
  return bands.length + (fb < 5 ? 5 - fb : 0)
}
