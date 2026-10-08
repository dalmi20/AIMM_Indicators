import { ATTRS } from "@/data/aimm"
import { cn } from "@/lib/utils"

export function AttributePicker({ value, onChange }: { value: number | null; onChange: (i: number) => void }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Attributs">
      {ATTRS.map((a, i) => (
        <button
          key={a.name}
          type="button"
          aria-pressed={value === i}
          onClick={() => onChange(i)}
          className={cn(
            "cursor-pointer rounded-lg border border-input bg-card px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
            value === i && "border-info bg-info-bg text-info",
          )}
        >
          {a.name}
          <small className={cn("block text-xs text-muted-foreground", value === i && "text-info")}>
            {a.inds.map((x) => x[0]).join(", ")}
          </small>
        </button>
      ))}
    </div>
  )
}
