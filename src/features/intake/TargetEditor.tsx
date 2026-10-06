import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Brief, Target } from "../../domain/models";
import {
  properties,
  propertyFor,
  templateFor,
} from "../../data/property-library";
import {
  Button,
  Empty,
  Field,
  Modal,
  SearchBox,
  s,
} from "../../components/ui";
import { useWorkspace } from "../../stores/workspace";
import c from "./Intake.module.css";

const operatorWords: Record<Target["operator"], string> = {
  "≥": "at least",
  "≤": "at most",
  "=": "exactly",
  Between: "between",
};

function targetError(t: Target): string | null {
  const name = propertyFor(t.propertyId).name;
  if (!t.value.trim()) return `${name}: enter a target value.`;
  if (propertyFor(t.propertyId).kind !== "text" && !Number.isFinite(Number(t.value)))
    return `${name}: the target must be a number.`;
  if (t.operator === "Between") {
    if (!t.max.trim()) return `${name}: enter the upper value of the range.`;
    if (Number(t.max) < Number(t.value))
      return `${name}: the upper value must be at least the lower value.`;
  }
  return null;
}

export function targetErrors(brief: Brief): string[] {
  if (!brief.subcategoryId) return ["Choose a product first."];
  if (!brief.targets.length) return ["Add at least one target."];
  return brief.targets.map(targetError).filter((x): x is string => !!x);
}

export function TargetEditor({
  brief,
  onChange,
  showErrors = false,
}: {
  brief: Brief;
  onChange: (patch: Partial<Brief>) => void;
  showErrors?: boolean;
}) {
  const state = useWorkspace();
  const plain = state.user?.mode === "Non-scientist";
  const [add, setAdd] = useState(false),
    [query, setQuery] = useState(""),
    [group, setGroup] = useState("All groups");
  const standard = templateFor(brief.subcategoryId).standard;
  function update(index: number, patch: Partial<Target>) {
    onChange({
      targets: brief.targets.map((t, i) =>
        i === index ? { ...t, ...patch } : t,
      ),
    });
  }
  const available = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (group === "All groups" || p.group === group) &&
      !brief.targets.some((t) => t.propertyId === p.id),
  );
  return (
    <div className={s.stack}>
      <p className={c.helper}>
        {plain
          ? "Say what a good result looks like for each test. “Must” targets have to pass before the recipe can be approved."
          : "Each target is a test result the product must reach. “Must” targets have to pass before approval."}{" "}
        These are your project targets, not official limits
        {standard ? ` (${standard.identifier} is listed for reference only)` : ""}.
      </p>
      <div className={s.sectionTitle}>
        <h3>{plain ? "What does success look like?" : "Targets"}</h3>
        <Button small onClick={() => setAdd(true)}>
          <Plus size={13} />
          Add a test
        </Button>
      </div>
      {!brief.targets.length ? (
        <Empty title="No targets yet">
          <p>Add at least one test result the product must reach.</p>
          <Button small variant="primary" onClick={() => setAdd(true)}>
            <Plus size={13} /> Add a test
          </Button>
        </Empty>
      ) : (
        <div className={c.targetList}>
          {brief.targets.map((t, i) => {
            const p = propertyFor(t.propertyId);
            const error = showErrors ? targetError(t) : null;
            const benchmarks = brief.benchmarkIds
              .map((id) => state.benchmarks.find((b) => b.id === id))
              .filter((b) => b?.values[t.propertyId] !== undefined);
            return (
              <div
                className={`${c.targetCard} ${error ? c.targetInvalid : ""}`}
                key={t.propertyId}
              >
                <div className={c.targetHead}>
                  <div>
                    <b>{plain ? p.plain : p.name}</b>
                    {plain && p.plain !== p.name && <small>{p.name}</small>}
                    <small>
                      {p.group}
                      {benchmarks.length > 0 &&
                        ` · Benchmark: ${benchmarks.map((b) => `${b!.values[t.propertyId]} ${t.unit}`).join(", ")}`}
                    </small>
                  </div>
                  <Button
                    variant="ghost"
                    small
                    aria-label={`Remove ${p.name}`}
                    onClick={() =>
                      onChange({
                        targets: brief.targets.filter((_, j) => j !== i),
                        objectives: brief.objectives.filter(
                          (id) => id !== t.propertyId,
                        ),
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                <div className={c.targetFields}>
                  <Field label="Rule">
                    <select
                      aria-label={`${p.name} operator`}
                      value={t.operator}
                      onChange={(e) =>
                        update(i, {
                          operator: e.target.value as Target["operator"],
                        })
                      }
                    >
                      {(["≥", "≤", "=", "Between"] as const).map((o) => (
                        <option key={o} value={o}>
                          {o === "Between" ? "Between" : `${o} ${operatorWords[o]}`}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label={t.operator === "Between" ? "From" : "Target"}
                    unit={t.unit !== "—" ? t.unit : undefined}
                    required
                  >
                    <input
                      type={p.kind === "text" ? "text" : "number"}
                      step="any"
                      inputMode="decimal"
                      aria-label={`${p.name} target`}
                      value={t.value}
                      onChange={(e) => update(i, { value: e.target.value })}
                    />
                  </Field>
                  {t.operator === "Between" && (
                    <Field label="To" unit={t.unit !== "—" ? t.unit : undefined} required>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        aria-label={`${p.name} upper target`}
                        value={t.max}
                        onChange={(e) => update(i, { max: e.target.value })}
                      />
                    </Field>
                  )}
                  <Field label="Priority">
                    <select
                      aria-label={`${p.name} priority`}
                      value={t.priority}
                      onChange={(e) =>
                        update(i, {
                          priority: e.target.value as Target["priority"],
                        })
                      }
                    >
                      {["Must", "Important", "Nice to have"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                {error && (
                  <p className={s.error} role="alert">
                    {error}
                  </p>
                )}
                {!plain && (
                  <details className={c.methodDetails}>
                    <summary>Test method and conditions</summary>
                    <div className={s.formGrid}>
                      <Field label="Test method" hint="Results are only compared when the method matches.">
                        <input
                          aria-label={`${p.name} method`}
                          value={t.method}
                          onChange={(e) => update(i, { method: e.target.value })}
                        />
                      </Field>
                      <Field label="Conditions" hint="For example: curing age and temperature.">
                        <input
                          aria-label={`${p.name} condition`}
                          value={t.condition}
                          onChange={(e) =>
                            update(i, { condition: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
      {brief.targets.length > 0 && (
        <fieldset className={c.fieldset}>
          <legend>
            Rank your top three priorities{" "}
            <span className={s.optional}>Optional</span>
          </legend>
          <p className={c.helper}>
            When trials trade one result against another, Helix favours these
            in order.
          </p>
          <div className={s.list}>
            {[0, 1, 2].map((index) => (
              <div className={c.rank} key={index}>
                <span aria-hidden="true">{index + 1}</span>
                <select
                  aria-label={`Priority ${index + 1}`}
                  value={brief.objectives[index] || ""}
                  onChange={(e) => {
                    const arr = [...brief.objectives];
                    arr[index] = e.target.value;
                    onChange({ objectives: arr });
                  }}
                >
                  <option value="">Not ranked</option>
                  {brief.targets
                    .filter(
                      (t) =>
                        !brief.objectives.includes(t.propertyId) ||
                        brief.objectives[index] === t.propertyId,
                    )
                    .map((t) => (
                      <option key={t.propertyId} value={t.propertyId}>
                        {plain
                          ? propertyFor(t.propertyId).plain
                          : propertyFor(t.propertyId).name}
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>
        </fieldset>
      )}
      {add && (
        <Modal title="Add a test" onClose={() => setAdd(false)}>
          <div className={s.stack}>
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder="Search tests, e.g. slip or strength"
            />
            <Field label="Group">
              <select value={group} onChange={(e) => setGroup(e.target.value)}>
                {["All groups", ...new Set(properties.map((p) => p.group))].map(
                  (g) => (
                    <option key={g}>{g}</option>
                  ),
                )}
              </select>
            </Field>
            <div className={s.list} style={{ maxHeight: 350, overflow: "auto" }}>
              {available.map((p) => (
                <div className={s.listItem} key={p.id}>
                  <div>
                    <h3>{p.name}</h3>
                    <p>
                      {p.group} · unit: {p.unit}
                    </p>
                  </div>
                  <Button
                    small
                    onClick={() => {
                      onChange({
                        targets: [
                          ...brief.targets,
                          {
                            propertyId: p.id,
                            operator: p.kind === "text" ? "=" : "≥",
                            value: "",
                            max: "",
                            priority: "Important",
                            unit: p.unit,
                            method: p.method,
                            condition: "Project conditioning · 23 °C",
                          },
                        ],
                      });
                      setAdd(false);
                    }}
                  >
                    Add
                  </Button>
                </div>
              ))}
              {!available.length && (
                <p className={s.empty}>No tests match. Try another word.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
