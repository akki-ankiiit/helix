import { useState } from "react";
import { Check, GitBranch, ArrowRight, SlidersHorizontal } from "lucide-react";
import type { Pathway, Project } from "../../domain/models";
import { Badge, Button, Field, Modal, Notice, s } from "../../components/ui";
import { useWorkspace, uid } from "../../stores/workspace";
import { propertyFor } from "../../data/property-library";
import c from "../projects/Project.module.css";
export function Pathways({
  project: p,
  onNext,
}: {
  project: Project;
  onNext: () => void;
}) {
  const state = useWorkspace();
  const [compare, setCompare] = useState<string[]>([]),
    [showCompare, setShowCompare] = useState(false),
    [variant, setVariant] = useState<Pathway | null>(null),
    [priority, setPriority] = useState("Lower cost");
  const job = state.jobs.find(
    (j) => j.projectId === p.id && j.stage === "Pathways",
  );
  function select(pathway: Pathway) {
    state.updateProject(p.id, (x) => ({
      ...x,
      selectedPathway: pathway.id,
      stage: "Trials",
      needsReview: x.trials.length > 0 || x.needsReview,
    }));
    state.notify(
      "Pathway selected. Predictions still require laboratory validation.",
    );
  }
  return (
    <div className={s.stack}>
      <Notice>
        Predictions are illustrative estimates requiring laboratory validation.
        Scores are fixed demo heuristics (0–100), not model confidence or
        scientific certainty.
      </Notice>
      {!p.pathways.length && (
        <>
          <div className={s.empty}>
            <GitBranch size={28} />
            <h3>
              {p.sources.length
                ? "From evidence to experimental directions."
                : "Complete Literature first."}
            </h3>
            <p>
              {p.brief.subcategoryId === "tile-0"
                ? "Compare three fixture approaches for this tile-adhesive brief."
                : "No chemistry pathway fixture is defined for this family. R&D input is required; the demo does not invent a recipe."}
            </p>
            <Button
              variant="primary"
              disabled={
                !p.sources.length ||
                job?.status === "Running" ||
                p.brief.subcategoryId !== "tile-0"
              }
              onClick={() => state.startJob(p.id, "Pathways")}
            >
              {job?.status === "Running"
                ? "Preparing demo pathways…"
                : "Generate demo pathways"}
            </Button>
          </div>
          {job?.status === "Running" && <div className={s.skeleton} />}
        </>
      )}
      {p.pathways.length > 0 && (
        <>
          <div className={s.between}>
            <h3>
              Formulation directions <Badge>{p.pathways.length}</Badge>
            </h3>
            <Button
              disabled={compare.length < 2}
              onClick={() => setShowCompare(true)}
            >
              Compare selected ({compare.length}/3)
            </Button>
          </div>
          <div className={s.grid3}>
            {p.pathways.map((pathway, i) => (
              <article
                className={`${c.pathway} ${p.selectedPathway === pathway.id ? c.selected : ""}`}
                key={pathway.id}
              >
                <div className={s.between}>
                  <Badge tone={i === 0 ? "violet" : "neutral"}>
                    {i === 0 ? "Recommended fixture" : `Direction ${i + 1}`}
                  </Badge>
                  <label className={s.check}>
                    <input
                      type="checkbox"
                      aria-label={`Compare ${pathway.name}`}
                      checked={compare.includes(pathway.id)}
                      disabled={
                        !compare.includes(pathway.id) && compare.length === 3
                      }
                      onChange={() =>
                        setCompare((ids) =>
                          ids.includes(pathway.id)
                            ? ids.filter((id) => id !== pathway.id)
                            : [...ids, pathway.id],
                        )
                      }
                    />
                    Compare
                  </label>
                </div>
                <h3>{pathway.name}</h3>
                <p>{pathway.rationale}</p>
                <ul>
                  {pathway.ranges.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                {["Target match", "Cost", "Availability", "Overall"].map(
                  (label, j) => (
                    <div className={c.scoreRow} key={label}>
                      <span>{label}</span>
                      <b title="Fixed illustrative heuristic, not a validated prediction">
                        {pathway.scores[j]}/100
                      </b>
                    </div>
                  ),
                )}
                <div className={c.price}>
                  ${pathway.cost.toFixed(2)}
                  <small> / kg estimate</small>
                </div>
                <details style={{ marginTop: 15, fontSize: 11 }}>
                  <summary>Evidence, estimates & risks</summary>
                  <p>Equipment: {pathway.equipment}</p>
                  <p>Hazards: {pathway.risk}</p>
                  <p>
                    Citations:{" "}
                    {pathway.citations
                      .map(
                        (id) =>
                          p.sources.find((s) => s.id === id)?.reference ||
                          "Missing source",
                      )
                      .join(", ")}
                  </p>
                  {p.brief.targets.map((t) => (
                    <p key={t.propertyId}>
                      {propertyFor(t.propertyId).name}: estimate{" "}
                      {pathway.predictions[t.propertyId] ?? "Insufficient data"}{" "}
                      {t.unit} / target {t.operator} {t.value}
                    </p>
                  ))}
                  <p>
                    Assumptions: dry blend, fixed application water, controlled
                    laboratory conditions. No aged-performance data. Scores do
                    not include unstructured constraints.
                  </p>
                </details>
                <footer>
                  <Button
                    variant={
                      p.selectedPathway === pathway.id ? "primary" : "default"
                    }
                    small
                    onClick={() => select(pathway)}
                  >
                    {p.selectedPathway === pathway.id ? (
                      <>
                        <Check size={12} />
                        Selected
                      </>
                    ) : (
                      "Select pathway"
                    )}
                  </Button>
                  <Button
                    small
                    variant="ghost"
                    onClick={() => setVariant(pathway)}
                  >
                    <SlidersHorizontal size={12} />
                    Variant
                  </Button>
                </footer>
              </article>
            ))}
          </div>
          {p.selectedPathway && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="primary" onClick={onNext}>
                Plan laboratory trials
                <ArrowRight size={14} />
              </Button>
            </div>
          )}
        </>
      )}
      {showCompare && (
        <Modal
          title="Compare formulation pathways"
          onClose={() => setShowCompare(false)}
        >
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Comparison</th>
                  {p.pathways
                    .filter((x) => compare.includes(x.id))
                    .map((x) => (
                      <th key={x.id}>{x.name}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {[
                  "Estimated USD/kg",
                  "Equipment",
                  "Risks",
                  ...p.brief.targets.map((t) => t.propertyId),
                ].map((key, i) => (
                  <tr key={key}>
                    <td>{i < 3 ? key : propertyFor(key).name}</td>
                    {p.pathways
                      .filter((x) => compare.includes(x.id))
                      .map((x) => (
                        <td
                          key={x.id}
                          style={{ whiteSpace: "normal", minWidth: 150 }}
                        >
                          {i === 0
                            ? x.cost.toFixed(2)
                            : i === 1
                              ? x.equipment
                              : i === 2
                                ? x.risk
                                : `${x.predictions[key] ?? "Insufficient data"} ${propertyFor(key).unit}`}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={s.muted} style={{ fontSize: 12, marginTop: 15 }}>
            All pathways require lab validation. Composition ranges are
            sketches, not complete recipes. Hard constraints are checked on the
            trial matrix.
          </p>
        </Modal>
      )}
      {variant && (
        <Modal
          title="Request a pathway variant"
          onClose={() => setVariant(null)}
        >
          <div className={s.stack}>
            <Notice>
              Creates a new planning version. Numeric predictions remain
              unchanged until new evidence is available.
            </Notice>
            <Field label="Priority to explore">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option>Lower cost</option>
                <option>Local material availability</option>
                <option>Longer working time</option>
              </select>
            </Field>
          </div>
          <div className={s.modalActions}>
            <Button onClick={() => setVariant(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                state.updateProject(p.id, (x) => ({
                  ...x,
                  pathways: [
                    ...x.pathways,
                    {
                      ...variant,
                      id: uid(),
                      name: `${variant.name} · v${variant.version + 1}`,
                      version: variant.version + 1,
                      rationale: `Changed priority: ${priority}. R&D must re-evaluate estimates. ${variant.rationale}`,
                    },
                  ],
                }));
                setVariant(null);
                state.notify(
                  "Variant created with the changed priority highlighted.",
                );
              }}
            >
              Create planning variant
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
