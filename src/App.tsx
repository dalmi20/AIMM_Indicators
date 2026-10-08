import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ATTRS, LV } from "@/data/aimm"
import { evaluate, f2, initValues, maxValues, step as stepValue } from "@/lib/engine"
import type { Value } from "@/lib/types"
import { AttributePicker } from "@/components/AttributePicker"
import { IndicatorCard } from "@/components/IndicatorCard"
import { ColorLegend, NodeLegend } from "@/components/Legend"
import { SequenceDiagram, groupCount } from "@/components/SequenceDiagram"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const STEP_MS = 420

export default function App() {
  const [ai, setAi] = useState<number | null>(null)
  const [vals, setVals] = useState<Record<string, Value>>({})
  const [ext, setExt] = useState<Record<string, boolean>>({})
  /** nombre de groupes révélés dans le diagramme (Infinity = tout) */
  const [step, setStep] = useState(Infinity)
  const timer = useRef<number | undefined>(undefined)

  const attr = ai === null ? null : ATTRS[ai]
  const ev = useMemo(() => (attr && Object.keys(vals).length ? evaluate(attr, vals, ext) : null), [attr, vals, ext])

  const play = useCallback((total: number) => {
    window.clearInterval(timer.current)
    setStep(0)
    let s = 0
    timer.current = window.setInterval(() => {
      s++
      setStep(s)
      if (s > total) { window.clearInterval(timer.current); setStep(Infinity) }
    }, STEP_MS)
  }, [])
  useEffect(() => () => window.clearInterval(timer.current), [])

  const choose = (i: number) => {
    const init = initValues(ATTRS[i])
    setAi(i); setVals(init.vals); setExt(init.ext)
    play(groupCount(ATTRS[i]))
  }
  const instant = () => { window.clearInterval(timer.current); setStep(Infinity) }

  return (
    <div className="mx-auto max-w-[1760px] px-5 pt-7 pb-12">
      <h1 className="mb-1 text-[26px] font-semibold tracking-tight">Simulateur AIMM</h1>
      <p className="mb-5.5 max-w-[70ch] text-muted-foreground">
        Choisissez un attribut pour afficher l'enchaînement de ses indicateurs. Modifiez les mesures pour voir quels
        indicateurs se déclenchent et quel niveau de maturité est atteint.
      </p>

      <AttributePicker value={ai} onChange={choose} />

      {!attr || !ev ? (
        <div className="rounded-xl border border-dashed border-input px-5 py-10 text-center text-muted-foreground">
          Aucun attribut sélectionné. Choisissez-en un ci-dessus pour afficher son diagramme de séquence.
        </div>
      ) : (
        <div className="grid items-start gap-5 min-[1100px]:grid-cols-[minmax(560px,700px)_minmax(0,1fr)]">
          <Card className="gap-0 p-4.5 min-[1100px]:[@media(min-height:900px)]:sticky min-[1100px]:[@media(min-height:900px)]:top-3">
            <h2 className="mb-1.5 text-xl font-semibold">{attr.name}</h2>
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
              <span className="text-[22px] font-semibold text-pass">L{ev.lvl} {LV[ev.lvl][0]}</span>
              <span className="text-sm text-muted-foreground">{ev.why.join(" · ")}</span>
            </div>
            <p className="mb-3 text-[13px] text-muted-foreground">
              Modifiez les mesures avec les boutons − et + dans les cartes. Chaque carte indique quoi changer pour
              déclencher l'indicateur suivant, et le diagramme se met à jour à chaque clic.
            </p>
            <NodeLegend />
            <ColorLegend />
            <SequenceDiagram attr={attr} ev={ev} step={step} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => play(groupCount(attr))}>Rejouer le déclenchement</Button>
              <Button variant="outline" size="sm" onClick={() => {
                setVals(maxValues(attr, vals)); setExt(Object.fromEntries(Object.keys(ext).map((k) => [k, true]))); play(groupCount(attr))
              }}>Tout au maximum</Button>
              <Button variant="outline" size="sm" onClick={() => choose(ai!)}>Revenir à l'état initial</Button>
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground">
              {ev.fb < 5
                ? [`Après la dernière bande d'indicateurs (L${ev.fb}) : L${ev.fb + 1} atteint automatiquement.`,
                   ...attr.post.map((p) => `L${p.L} si MIN(${p.min.map((i) => "S" + i.slice(1)).join(", ")}) > ${f2(p.t)}.`)].join(" ")
                : `L5 est évalué directement par ${attr.inds.find((x) => x[1] === 5)![0]}, après L4 atteint.`}
            </p>
          </Card>

          <section className="columns-[330px] gap-3" aria-label="Mesures des indicateurs">
            {attr.inds.map(([id, b]) => (
              <IndicatorCard
                key={id}
                id={id}
                band={b}
                attr={attr}
                ev={ev}
                value={vals[id]}
                ext={ext}
                onChange={(v) => { setVals({ ...vals, [id]: v }); play(groupCount(attr)) }}
                onStep={(f, dl) => { setVals({ ...vals, [id]: stepValue(id, vals[id], f, dl) }); instant() }}
                onExt={(on) => { setExt({ ...ext, [id]: on }); play(groupCount(attr)) }}
              />
            ))}
          </section>
        </div>
      )}
    </div>
  )
}
