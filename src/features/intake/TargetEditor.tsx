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
  Field,
  Modal,
  Notice,
  SearchBox,
  s,
} from "../../components/ui";
import { useWorkspace } from "../../stores/workspace";
import c from "./Intake.module.css";
export function TargetEditor({
  brief,
  onChange,
}: {
  brief: Brief;
  onChange: (patch: Partial<Brief>) => void;
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
  return (
    <div className={s.stack}>
      <Notice warning>
        Draft property template · R&D confirmation required.{" "}
        {standard
          ? `${standard.identifier} (${standard.edition}) is an unverified reference.`
          : "No standard reference is configured."}{" "}
        Values below are project targets, not official limits.
      </Notice>
      <div className={s.between}>
        <h3>{plain ? "What does success look like?" : "Property targets"}</h3>
        <Button small onClick={() => setAdd(true)}>
          <Plus size={13} />
          Add property
        </Button>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Property / test method</th>
              <th>Unit</th>
              <th>Standard limit / source</th>
              <th>Benchmark</th>
              <th>Operator</th>
              <th>Target</th>
              <th>Priority</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {brief.targets.map((t, i) => {
              const p = propertyFor(t.propertyId);
              return (
                <tr key={t.propertyId}>
                  <td style={{ whiteSpace: "normal", minWidth: 170 }}>
                    <b>{plain ? p.plain : p.name}</b>
                    <small>{p.method}</small>
                    <details>
                      <summary
                        style={{
                          fontSize: 10,
                          color: "var(--accent)",
                          cursor: "pointer",
                          marginTop: 5,
                        }}
                      >
                        Method & conditions
                      </summary>
                      <input
                        aria-label={`${p.name} method`}
                        value={t.method}
                        onChange={(e) => update(i, { method: e.target.value })}
                      />
                      <input
                        aria-label={`${p.name} condition`}
                        value={t.condition}
                        onChange={(e) =>
                          update(i, { condition: e.target.value })
                        }
                      />
                    </details>
                  </td>
                  <td>{t.unit}</td>
                  <td>
                    <span style={{ fontSize: 10, color: "var(--amber)" }}>
                      Not verified
                    </span>
                    <small>No official limit entered</small>
                  </td>
                  <td>
                    {brief.benchmarkIds
                      .map((id) => state.benchmarks.find((b) => b.id === id))
                      .filter((b) => b?.values[t.propertyId] !== undefined)
                      .map((b) => (
                        <div key={b!.id}>
                          {b!.values[t.propertyId]} {t.unit}
                          <small>{b!.provenance} · fixture</small>
                        </div>
                      ))}
                  </td>
                  <td>
                    <select
                      aria-label={`${p.name} operator`}
                      value={t.operator}
                      onChange={(e) =>
                        update(i, {
                          operator: e.target.value as Target["operator"],
                        })
                      }
                    >
                      {["≥", "≤", "=", "Between"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      style={{ width: 76 }}
                      type={p.kind === "text" ? "text" : "number"}
                      step="any"
                      aria-label={`${p.name} target`}
                      value={t.value}
                      onChange={(e) => update(i, { value: e.target.value })}
                    />
                    {t.operator === "Between" && (
                      <>
                        <span> to </span>
                        <input
                          style={{ width: 76 }}
                          type="number"
                          step="any"
                          aria-label={`${p.name} upper target`}
                          value={t.max}
                          onChange={(e) => update(i, { max: e.target.value })}
                        />
                      </>
                    )}
                  </td>
                  <td>
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
                  </td>
                  <td>
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
                      <Trash2 size={13} />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div>
        <h3>Rank your top three objectives</h3>
        <p className={s.muted} style={{ fontSize: 12, margin: "8px 0 18px" }}>
          What should guide the next formulation decision? Order matters.
        </p>
        <div className={s.list}>
          {[0, 1, 2].map((index) => (
            <div className={c.rank} key={index}>
              <span>{index + 1}</span>
              <select
                aria-label={`Optimization objective ${index + 1}`}
                value={brief.objectives[index] || ""}
                onChange={(e) => {
                  const arr = [...brief.objectives];
                  arr[index] = e.target.value;
                  onChange({ objectives: arr });
                }}
              >
                <option value="">Select an objective</option>
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
      </div>
      {add && (
        <Modal title="Property library" onClose={() => setAdd(false)}>
          <div className={s.stack}>
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder="Search properties…"
            />
            <Field label="Property group">
              <select value={group} onChange={(e) => setGroup(e.target.value)}>
                {["All groups", ...new Set(properties.map((p) => p.group))].map(
                  (g) => (
                    <option key={g}>{g}</option>
                  ),
                )}
              </select>
            </Field>
            <div
              className={s.list}
              style={{ maxHeight: 350, overflow: "auto" }}
            >
              {properties
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(query.toLowerCase()) &&
                    (group === "All groups" || p.group === group) &&
                    !brief.targets.some((t) => t.propertyId === p.id),
                )
                .map((p) => (
                  <div className={s.listItem} key={p.id}>
                    <div>
                      <h3>{p.name}</h3>
                      <p>
                        {p.group} · {p.unit}
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
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
