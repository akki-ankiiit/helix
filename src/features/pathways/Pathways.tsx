import { useState } from "react";
import { Check, GitBranch, SlidersHorizontal } from "lucide-react";
import type { Pathway, Project } from "../../domain/models";
import {
  BarList,
  Badge,
  Button,
  DataTag,
  Empty,
  Field,
  Figure,
  Modal,
  Reason,
  s,
} from "../../components/ui";
import { useWorkspace, uid } from "../../stores/workspace";
import { propertyFor } from "../../data/property-library";
import { formatINR } from "../../lib/format";
import c from "../projects/Project.module.css";

const scoreLabels = ["Target match", "Cost", "Availability", "Overall"];

export function Pathways({ project: p }: { project: Project }) {
  const state = useWorkspace();
  const [compare, setCompare] = useState<string[]>([]),
    [showCompare, setShowCompare] = useState(false),
    [variant, setVariant] = useState<Pathway | null>(null),
    [priority, setPriority] = useState("Lower cost");
  const job = state.jobs.find(
    (j) => j.projectId === p.id && j.stage === "Pathways",
  );
  const running = job?.status === "Running" || job?.status === "Queued";
  const hasFixture = p.brief.subcategoryId === "tile-0";
  const canEdit = ["Chemist", "Admin"].includes(state.user?.role || "");
  function select(pathway: Pathway) {
    state.updateProject(p.id, (x) => ({
      ...x,
      selectedPathway: pathway.id,
      stage: "Trials",
      needsReview: x.trials.length > 0 || x.needsReview,
      activity: [
        {
          id: uid(),
          text: `Pathway selected: ${pathway.name}`,
          date: new Date().toISOString(),
        },
        ...x.activity,
      ],
    }));
    state.notify(`“${pathway.name}” selected. Next, plan a trial.`, {
      to: `/projects/${p.id}?stage=Trials`,
      label: "Go to Trial plan",
    });
  }
  if (!p.pathways.length)
    return (
      <div className={s.stack}>
        <Empty
          title={
            running
              ? "Finding pathways…"
              : !p.sources.length
                ? "Collect sources first"
                : hasFixture
                  ? "Ready to suggest pathways"
                  : "No pathway data for this product family"
          }
        >
          <p>
            {running
              ? "This takes about 6 seconds. You can leave this page; it keeps running."
              : !p.sources.length
                ? "Pathways are built from your sources. Complete step 2, Read, first."
                : hasFixture
                  ? "Helix will suggest three recipe directions based on your brief and sources."
                  : "This demo only has pathway data for tile and stone adhesives. Your R&D team needs to add directions for this family. Helix will not invent a recipe."}
          </p>
          {running && job ? (
            <div className={s.progress} style={{ width: 240 }} role="progressbar" aria-valuenow={job.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Pathway search progress">
              <span style={{ width: `${job.progress}%` }} />
            </div>
          ) : (
            hasFixture &&
            p.sources.length > 0 && (
              <Button
                variant="primary"
                onClick={() => state.startJob(p.id, "Pathways")}
              >
                Suggest pathways
              </Button>
            )
          )}
        </Empty>
      </div>
    );
  const selected = p.pathways.find((x) => x.id === p.selectedPathway);
  return (
    <div className={s.stack}>
      <Figure
        title="Estimated material cost by pathway"
        takeaway={(() => {
          const cheapest = [...p.pathways].sort((a, b) => a.cost - b.cost)[0];
          return `${cheapest.name} has the lowest estimated cost at ${formatINR(cheapest.cost)}/kg. Estimates are not lab results.`;
        })()}
        note="₹ per kg of dry blend, excluding GST and delivery. Scale starts at ₹0."
        values={{
          headers: ["Pathway", "Estimated cost (₹/kg)", "Overall score (0–100)"],
          rows: p.pathways.map((x) => [x.name, formatINR(x.cost), x.scores[3]]),
        }}
      >
        <BarList
          items={p.pathways.map((x) => ({
            label: x.name,
            value: x.cost,
            display: `${formatINR(x.cost)}/kg`,
            highlight: x.id === p.selectedPathway,
            tag: x.id === p.selectedPathway ? "Selected" : undefined,
          }))}
        />
      </Figure>
      <div className={s.sectionTitle}>
        <h3>
          {p.pathways.length} pathways{" "}
          {selected ? (
            <Badge tone="green">Selected: {selected.name}</Badge>
          ) : (
            <Badge tone="amber">Choose one to continue</Badge>
          )}
        </h3>
        <Button
          small
          disabled={compare.length < 2}
          onClick={() => setShowCompare(true)}
        >
          Compare side by side ({compare.length} of 3)
        </Button>
      </div>
      {compare.length < 2 && (
        <Reason>Tick “Compare” on two or three pathways to see them side by side.</Reason>
      )}
      <div className={s.grid3}>
        {p.pathways.map((pathway, i) => (
          <article
            className={`${c.pathway} ${p.selectedPathway === pathway.id ? c.selected : ""}`}
            key={pathway.id}
          >
            <div className={s.between}>
              <Badge tone={i === 0 ? "violet" : "neutral"}>
                {i === 0 ? "Highest overall score" : `Option ${i + 1}`}
              </Badge>
              <label className={s.check}>
                <input
                  type="checkbox"
                  aria-label={`Compare ${pathway.name}`}
                  checked={compare.includes(pathway.id)}
                  disabled={!compare.includes(pathway.id) && compare.length === 3}
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
            <div className={c.price}>
              {formatINR(pathway.cost)}
              <small> /kg</small> <DataTag kind="estimate" />
            </div>
            <dl className={c.scores}>
              {scoreLabels.map((label, j) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    <span className={c.scoreBar} aria-hidden="true">
                      <span style={{ width: `${pathway.scores[j]}%` }} />
                    </span>
                    {pathway.scores[j]}
                  </dd>
                </div>
              ))}
            </dl>
            <details style={{ marginTop: 14, fontSize: 12 }}>
              <summary>Recipe ranges, estimates and risks</summary>
              <ul>
                {pathway.ranges.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {p.brief.targets.map((t) => (
                <p key={t.propertyId}>
                  {propertyFor(t.propertyId).name}: estimated{" "}
                  {pathway.predictions[t.propertyId] !== undefined
                    ? `${pathway.predictions[t.propertyId]} ${t.unit}`
                    : "— (no estimate)"}{" "}
                  · target {t.operator} {t.value} {t.unit}
                </p>
              ))}
              <p>Equipment: {pathway.equipment}</p>
              <p>Hazards: {pathway.risk}</p>
              <p>
                Sources:{" "}
                {pathway.citations
                  .map(
                    (id) =>
                      p.sources.find((x) => x.id === id)?.reference ||
                      "missing source",
                  )
                  .join(", ")}
              </p>
            </details>
            <footer>
              <Button
                variant={p.selectedPathway === pathway.id ? "primary" : "default"}
                small
                disabled={!canEdit}
                aria-pressed={p.selectedPathway === pathway.id}
                onClick={() => select(pathway)}
              >
                {p.selectedPathway === pathway.id ? (
                  <>
                    <Check size={12} />
                    Selected
                  </>
                ) : (
                  "Select this pathway"
                )}
              </Button>
              <Button
                small
                variant="ghost"
                disabled={!canEdit}
                onClick={() => setVariant(pathway)}
              >
                <SlidersHorizontal size={12} />
                Make a variant
              </Button>
            </footer>
          </article>
        ))}
      </div>
      {!canEdit && (
        <Reason>Only a Chemist or Admin can select pathways. Change your demo role in Settings.</Reason>
      )}
      <p className={s.muted} style={{ fontSize: 12 }}>
        <GitBranch size={12} /> Scores (0–100) are fixed demo ratings, not
        model confidence. Every pathway needs lab testing.
      </p>
      {showCompare && (
        <Modal title="Compare pathways" onClose={() => setShowCompare(false)}>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  {p.pathways
                    .filter((x) => compare.includes(x.id))
                    .map((x) => (
                      <th scope="col" key={x.id} className={s.num}>
                        {x.name}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Estimated cost (₹/kg)</td>
                  {p.pathways
                    .filter((x) => compare.includes(x.id))
                    .map((x) => (
                      <td key={x.id} className={s.num}>
                        {formatINR(x.cost)}
                      </td>
                    ))}
                </tr>
                {p.brief.targets.map((t) => (
                  <tr key={t.propertyId}>
                    <td>
                      {propertyFor(t.propertyId).name} ({t.unit})
                      <small>
                        Target {t.operator} {t.value}
                      </small>
                    </td>
                    {p.pathways
                      .filter((x) => compare.includes(x.id))
                      .map((x) => (
                        <td key={x.id} className={s.num}>
                          {x.predictions[t.propertyId] ?? "—"}
                        </td>
                      ))}
                  </tr>
                ))}
                <tr>
                  <td>Risks</td>
                  {p.pathways
                    .filter((x) => compare.includes(x.id))
                    .map((x) => (
                      <td key={x.id} style={{ whiteSpace: "normal", minWidth: 160 }}>
                        {x.risk}
                      </td>
                    ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className={s.muted} style={{ fontSize: 12, marginTop: 14 }}>
            All values are estimates. “—” means no estimate is available.
          </p>
        </Modal>
      )}
      {variant && (
        <Modal title="Make a pathway variant" onClose={() => setVariant(null)}>
          <div className={s.stack}>
            <p className={s.muted} style={{ fontSize: 13 }}>
              A variant is a copy with a different priority. Estimates stay the
              same until new evidence is added.
            </p>
            <Field label="What should the variant favour?">
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
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
                      rationale: `Favours: ${priority.toLowerCase()}. R&D must re-check the estimates. ${variant.rationale}`,
                    },
                  ],
                }));
                setVariant(null);
                state.notify("Variant created.");
              }}
            >
              Create variant
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
