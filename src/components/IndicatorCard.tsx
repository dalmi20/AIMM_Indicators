import { ETAT, H, IND } from "@/data/aimm"
import { f2, fk, fmtH, hintFor, needK, ownPass, scaleLabels, sOfK, thrOf } from "@/lib/engine"
import type { Evaluation } from "@/lib/engine"
import type { Attribute, Value, X1Choice } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Affiche un texte où **…** est en gras. */
function Rich({ text }: { text: string }) {
  return <>{text.split("**").map((p, i) => (i % 2 ? <b key={i} className="font-semibold">{p}</b> : p))}</>
}

function Stepper({ label, value, onStep }: { label: string; value: string | number; onStep: (d: number) => void }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <Button variant="outline" size="icon-sm" aria-label={`Diminuer ${label}`} onClick={() => onStep(-1)}>−</Button>
      <span className="min-w-6.5 text-center font-semibold text-foreground">{value}</span>
      <Button variant="outline" size="icon-sm" aria-label={`Augmenter ${label}`} onClick={() => onStep(1)}>+</Button>
    </span>
  )
}

function Segmented<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {options.map(([k, l]) => (
        <Button key={k} size="sm" variant="outline" aria-pressed={value === k} onClick={() => onChange(k)}
          className={cn("h-7 px-2.5 text-xs", value === k && "border-info bg-info-bg text-info hover:bg-info-bg hover:text-info")}>
          {l}
        </Button>
      ))}
    </span>
  )
}

interface Props {
  id: string
  band: number
  attr: Attribute
  ev: Evaluation
  value: Value
  ext: Record<string, boolean>
  onChange: (v: Value) => void
  onStep: (field: "a" | "b" | "v", delta: number) => void
  onExt: (on: boolean) => void
}

export function IndicatorCard({ id, band, attr, ev, value: v, ext, onChange, onStep, onExt }: Props) {
  const d = IND[id], sc = ev.sc[id], n = id.slice(1)
  const locked = ev.st[id] === "off"
  const own = ownPass(id, band, sc.S)

  if (locked) {
    const pb = ev.bands[ev.bands.indexOf(band) - 1]
    const prev = attr.inds.filter((x) => x[1] === pb).map((x) => x[0])
    const many = prev.length > 1
    return (
      <div className="mb-3 break-inside-avoid rounded-xl border border-dashed p-3.5 text-[13px] text-muted-foreground">
        <div className="flex flex-wrap items-baseline gap-x-2.5">
          <b className="text-sm font-semibold text-off">{id} · {d.n}</b>
          <span>{d.src}</span>
        </div>
        <p className="mt-1 text-xs">
          Pas encore déclenché. {id} s'affichera quand {prev.join(" et ")} {many ? "auront" : "aura"} passé {many ? "leurs seuils" : "son seuil"} de déclenchement.
        </p>
      </div>
    )
  }

  const hint = hintFor(id, band, ev, v, ext)
  const cond = d.t === "bin"
    ? "Passe si X1 = 1"
    : `Passe si S${n} > ${f2(thrOf(band))} (${d.seuil})` + d.deps.map(([x, t]) => ` et S${x.slice(1)} > ${f2(t)}`).join("") + (d.ext ? ` et ${d.ext.lab}` : "")

  /* ---- états (L5 en haut) ---- */
  const states: React.ReactNode[] = []
  const rowCls = "grid grid-cols-[124px_1fr] gap-2 rounded-md border px-2 py-1 text-xs leading-snug max-[480px]:grid-cols-1"
  const actCls = "border-[1.5px] border-info bg-info-bg font-medium text-foreground"
  const tag = (extra = "") => <span className="ml-1.5 text-[11px] font-semibold text-info">état observé{extra}</span>
  const thr = (label: string) => (
    <div key="thr" className="my-0.5 flex items-center gap-2 text-[11px] text-foreground before:h-0 before:flex-1 before:border-t-[1.5px] before:border-dashed before:border-foreground/50 after:h-0 after:flex-1 after:border-t-[1.5px] after:border-dashed after:border-foreground/50">
      seuil de déclenchement : {label}
    </div>
  )
  if (d.t === "bin") {
    states.push(
      <div key="1" className={cn(rowCls, own && actCls)}>
        <span className={cn("font-semibold", own && "text-info")}>X1 = 1 · L2 →</span>
        <span>{ETAT[id].s[1]}{own && tag()}</span>
      </div>,
      thr("X1 = 1"),
      <div key="0" className={cn(rowCls, !own && actCls)}>
        <span className={cn("font-semibold", !own && "text-info")}>X1 = 0 · L1</span>
        <span>{ETAT[id].s[0]}{!own && tag()}</span>
      </div>,
    )
  } else {
    const need = needK(band), lab = scaleLabels(id), kmax = d.kmax ?? 5
    for (let k = 5; k >= 1; k--) {
      const na = k > kmax, act = !na && sc.k === k
      states.push(
        <div key={k} className={cn(rowCls, na && "opacity-50", act && actCls)}>
          <span className={cn("font-semibold", act && "text-info")}>{sOfK(k)} · L{k} · {na ? "non atteignable" : lab[k - 1]}</span>
          <span>
            {ETAT[id].s[k - 1]}
            {act && tag(sc.frac ? ` (k moyen = ${fk(v.v!)}, entre L${k - 1} et L${k})` : "")}
          </span>
        </div>,
      )
      if (k === need) states.push(thr(`S${n} > ${f2(thrOf(band))} (${d.seuil})`))
    }
  }

  /* ---- saisies ---- */
  let inputs: React.ReactNode
  if (d.t === "bin")
    inputs = (
      <Segmented<X1Choice> value={v.x1!} onChange={(x1) => onChange({ x1 })}
        options={[["si", "SI : trouvé (1)"], ["qoui", "Questionnaire : oui (1)"], ["qnon", "Questionnaire : non (0)"]]} />
    )
  else if (d.t === "pct" || d.t === "inv" || d.t === "rate")
    inputs = (<>
      <Stepper label={d.la!} value={v.a!} onStep={(x) => onStep("a", x)} />
      <Stepper label={d.lb!} value={v.b!} onStep={(x) => onStep("b", x)} />
    </>)
  else if (d.t === "delay") inputs = <Stepper label="Délai médian" value={fmtH(H[v.v!])} onStep={(x) => onStep("v", x)} />
  else if (d.t === "q") inputs = <Stepper label="k moyen" value={fk(v.v!)} onStep={(x) => onStep("v", x)} />
  else inputs = <Stepper label={d.t === "niv" ? "Niveau observé" : "Niveau k"} value={v.v!} onStep={(x) => onStep("v", x)} />

  const nxt = band >= 4 ? "L5" : "la suite"
  return (
    <div className="animate-reveal mb-3 flex break-inside-avoid flex-col gap-1.5 rounded-xl border bg-card p-3.5 text-[13px] text-muted-foreground">
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <b className="text-sm font-semibold text-foreground">{id} · {d.n}</b>
        <span>{d.src}</span>
        <span className="basis-full font-medium text-foreground">
          {d.t === "bin" ? `${sc.disp} → X1 = ${sc.S}` : `${sc.disp} → S${n} = ${f2(sc.S)}`}{" "}
          <Badge variant={own ? "pass" : "fail"}>{own ? `déclenche ${nxt}` : `ne déclenche pas ${nxt}`}</Badge>
        </span>
      </div>
      <div className="text-foreground">Définition : {ETAT[id].d}</div>
      <div>{cond}</div>
      <div className={cn("rounded-r-md border-l-[3px] px-2.5 py-1.5 text-[12.5px]",
        hint.ok ? "border-pass bg-pass-bg text-pass" : "border-info bg-info-bg text-foreground")}>
        <Rich text={hint.text} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">{inputs}</div>
      {d.ext && (
        <div className="flex flex-wrap items-center gap-2">
          Condition externe : {d.ext.lab}
          <Segmented<"1" | "0"> value={ext[id] ? "1" : "0"} onChange={(x) => onExt(x === "1")}
            options={[["1", "Remplie"], ["0", "Non remplie"]]} />
        </div>
      )}
      <div className="flex flex-col gap-0.5">{states}</div>
    </div>
  )
}
