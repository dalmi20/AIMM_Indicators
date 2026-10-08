/** Lecture d'un nœud + code couleur. */
export function NodeLegend() {
  const rows: [string, string, string][] = [
    ["X2", "indicateur", ""],
    ["S = 0,80", "valeur observée", " (score de l'indicateur)"],
    ["seuil ≥ 50 %", "seuil de déclenchement", " : valeur à atteindre pour déclencher l'indicateur suivant"],
    ["✓ déclenche", "résultat", " : déclenche la suite, ou ✗ bloque l'évaluation ici"],
  ]
  return (
    <div className="mb-3.5 grid grid-cols-[max-content_1fr] items-center gap-x-3 text-xs" aria-label="Lecture d'un nœud">
      {rows.map(([k, b, rest], i) => (
        <div key={k} className="contents">
          <span
            className={[
              "min-w-[118px] border-x-[1.5px] border-info bg-info-bg px-3.5 py-px text-center",
              i === 0 && "rounded-t-lg border-t-[1.5px] pt-1 font-semibold text-info",
              i === 2 && "font-semibold",
              i === 3 && "rounded-b-lg border-b-[1.5px] border-t border-t-pass border-dashed pb-1 font-semibold text-pass",
            ].filter(Boolean).join(" ")}
          >
            {k}
          </span>
          <span className="text-muted-foreground">
            ← <b className="font-semibold text-foreground">{b}</b>{rest}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ColorLegend() {
  const mini = "inline-block rounded-[5px] border-[1.5px] px-2 py-px text-[11px] font-semibold"
  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-x-4.5 gap-y-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground" aria-label="Code couleur">
      <span className="inline-flex items-center gap-2"><span className={`${mini} border-info bg-info-bg text-info`}>X2</span>évalué</span>
      <span className="inline-flex items-center gap-2"><span className={`${mini} border-off bg-off-bg text-off`}>X3</span>non évalué</span>
      <span className="inline-flex items-center gap-2"><span className="text-[11px] font-semibold text-pass">✓ déclenche</span>condition remplie</span>
      <span className="inline-flex items-center gap-2"><span className="text-[11px] font-semibold text-fail">✗ bloque</span>condition non remplie</span>
      <span className="inline-flex items-center gap-2">
        <svg width="28" height="10" aria-hidden="true"><path d="M1 5H24M19 1L25 5L19 9" fill="none" stroke="var(--pass)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        déclenchement réalisé
      </span>
      <span className="inline-flex items-center gap-2"><span className={`${mini} border-pass bg-pass-bg text-pass`}>L4</span>niveau atteint</span>
      <span className="inline-flex items-center gap-2"><span className="inline-block h-3.5 w-6.5 rounded-[3px] border bg-lane" />niveau final</span>
    </div>
  )
}
