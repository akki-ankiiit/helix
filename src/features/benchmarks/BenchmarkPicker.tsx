import { useState } from "react";
import { Check, Plus, Upload, FileText } from "lucide-react";
import {
  Badge,
  Button,
  Field,
  Modal,
  Notice,
  SearchBox,
  s,
} from "../../components/ui";
import { useWorkspace, uid } from "../../stores/workspace";
import type { Benchmark } from "../../domain/models";
import { properties, propertyFor } from "../../data/property-library";
import { documents } from "../../services/demo";
export function BenchmarkPicker({
  selected = [],
  onChange,
  library = false,
}: {
  selected?: string[];
  onChange?: (ids: string[]) => void;
  library?: boolean;
}) {
  const state = useWorkspace();
  const [query, setQuery] = useState(""),
    [method, setMethod] = useState("Library"),
    [modal, setModal] = useState(false),
    [busy, setBusy] = useState(false),
    [review, setReview] = useState(false),
    [file, setFile] = useState(""),
    [error, setError] = useState(""),
    [record, setRecord] = useState<Benchmark>({
      id: "",
      name: "",
      manufacturer: "",
      version: "1",
      date: new Date().toISOString().slice(0, 10),
      provenance: "User-entered",
      values: {},
      notes: "",
    }),
    [prop, setProp] = useState("slip"),
    [value, setValue] = useState("");
  function toggle(id: string) {
    if (selected.includes(id)) onChange?.(selected.filter((x) => x !== id));
    else if (selected.length < 3) onChange?.([...selected, id]);
    else
      state.notify(
        "A brief can include up to three benchmarks. Remove one before adding another.",
      );
  }
  async function fixture() {
    setBusy(true);
    await documents.extractFixture();
    setRecord({
      id: "",
      name: "Uploaded fixture · Reference A",
      manufacturer: "Helix illustrative supplier",
      version: "Demo extraction v1",
      date: "2026-09-01",
      provenance: "Unverified extraction",
      values: { slip: 0.4, "open-time": 30 },
      notes: `Demo fixture only. ${file ? `Selected file “${file}” was not parsed.` : "No document was parsed."} Reviewed for transcription, not scientific verification.`,
    });
    setBusy(false);
    setReview(true);
    setModal(true);
  }
  function save() {
    if (!record.name.trim() || !record.manufacturer.trim()) {
      setError("Product name and manufacturer are required.");
      return;
    }
    const b = { ...record, id: uid() };
    state.addBenchmark(b);
    if (onChange && selected.length < 3) onChange([...selected, b.id]);
    setModal(false);
    setReview(false);
    setError("");
    state.notify("Benchmark saved with its provenance.");
  }
  return (
    <div className={s.stack}>
      <div className={s.between}>
        <div className={s.tabs}>
          {["Library", "Upload TDS", "Manual values"].map((m) => (
            <button
              className={m === method ? s.active : ""}
              key={m}
              onClick={() => setMethod(m)}
            >
              {m}
            </button>
          ))}
        </div>
        {!library && <Badge>{selected.length} / 3 selected</Badge>}
      </div>
      {method === "Library" && (
        <>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search benchmark products…"
          />
          <div className={s.list}>
            {state.benchmarks
              .filter((b) =>
                `${b.name} ${b.manufacturer} ${b.provenance}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((b) => (
                <div
                  key={b.id}
                  className={s.listItem}
                  style={
                    selected.includes(b.id)
                      ? {
                          borderColor: "var(--accent)",
                          background: "var(--accent-soft)",
                        }
                      : {}
                  }
                >
                  <FileText size={21} color="var(--muted)" />
                  <div style={{ flex: 1 }}>
                    <h3>{b.name}</h3>
                    <p>
                      {b.manufacturer} · {b.version} · {b.date}
                    </p>
                    <div className={s.row} style={{ marginTop: 8 }}>
                      <Badge
                        tone={b.provenance === "Lab-tested" ? "green" : "amber"}
                      >
                        {b.provenance}
                      </Badge>
                      <small className={s.muted}>Illustrative demo</small>
                    </div>
                    <details style={{ marginTop: 10, fontSize: 11 }}>
                      <summary>Values & provenance</summary>
                      <p>{b.notes}</p>
                      {Object.entries(b.values).map(([id, v]) => (
                        <p key={id}>
                          {propertyFor(id)?.name || id}: {v}{" "}
                          {propertyFor(id)?.unit} · {propertyFor(id)?.method}
                        </p>
                      ))}
                    </details>
                  </div>
                  {onChange && (
                    <Button
                      small
                      onClick={() => toggle(b.id)}
                      disabled={
                        !selected.includes(b.id) && selected.length >= 3
                      }
                    >
                      {selected.includes(b.id) ? (
                        <Check size={14} />
                      ) : (
                        <Plus size={14} />
                      )}{" "}
                      {selected.includes(b.id) ? "Selected" : "Select"}
                    </Button>
                  )}
                </div>
              ))}
          </div>
          {!state.benchmarks.some((b) =>
            `${b.name} ${b.manufacturer} ${b.provenance}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          ) && <div className={s.empty}>No benchmark products match.</div>}
        </>
      )}
      {method === "Upload TDS" && (
        <>
          <Notice warning>
            Extraction is a labeled simulation. Selected files are not parsed.
            Load the supplied fixture, then review each value before adding it.
          </Notice>
          <div
            className={s.empty}
            style={{
              border: "1px dashed var(--border)",
              borderRadius: 10,
              padding: 32,
            }}
          >
            <Upload size={24} />
            <h3>Technical data sheet</h3>
            <input
              type="file"
              accept=".pdf,.txt,.docx"
              aria-label="Select technical data sheet"
              onChange={(e) => setFile(e.target.files?.[0]?.name || "")}
            />
            {file && <small>{file} · reference only, not extracted</small>}
            <Button disabled={busy} onClick={fixture}>
              {busy ? "Loading fixture…" : "Load demo extraction fixture"}
            </Button>
          </div>
          {busy && <div className={s.skeleton} />}
        </>
      )}
      {method === "Manual values" && (
        <>
          <Notice>
            User-entered values retain their provenance. Only label actual
            measured results as laboratory evidence in a connected production
            system.
          </Notice>
          <Button
            onClick={() => {
              setRecord({
                id: "",
                name: "",
                manufacturer: "",
                version: "1",
                date: new Date().toISOString().slice(0, 10),
                provenance: "User-entered",
                values: {},
                notes: "",
              });
              setReview(false);
              setModal(true);
            }}
          >
            <Plus size={14} />
            Enter benchmark values
          </Button>
        </>
      )}
      {modal && (
        <Modal
          title={review ? "Review demo extraction" : "New benchmark record"}
          onClose={() => setModal(false)}
        >
          <div className={s.stack}>
            {review && (
              <Notice warning>
                Unverified extraction · supplied illustrative fixture.
                Confirming does not establish scientific validity.
              </Notice>
            )}
            <div className={s.formGrid}>
              {(["name", "manufacturer", "version", "date"] as const).map(
                (key) => (
                  <Field
                    key={key}
                    label={
                      {
                        name: "Product name",
                        manufacturer: "Manufacturer",
                        version: "Document version",
                        date: "Document date",
                      }[key]
                    }
                  >
                    <input
                      value={record[key]}
                      type={key === "date" ? "date" : "text"}
                      onChange={(e) =>
                        setRecord({ ...record, [key]: e.target.value })
                      }
                    />
                  </Field>
                ),
              )}
            </div>
            <Field label="Evidence type">
              <select
                value={record.provenance}
                onChange={(e) =>
                  setRecord({
                    ...record,
                    provenance: e.target.value as Benchmark["provenance"],
                  })
                }
              >
                {(review
                  ? ["Unverified extraction"]
                  : ["User-entered", "TDS", "MSDS/SDS", "Lab-tested"]
                ).map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            {Object.entries(record.values).map(([id, v]) => (
              <Field
                key={id}
                label={`${propertyFor(id).name} · ${propertyFor(id).unit}`}
                hint={propertyFor(id).method}
              >
                <input
                  type="number"
                  step="any"
                  value={v}
                  onChange={(e) =>
                    setRecord({
                      ...record,
                      values: {
                        ...record.values,
                        [id]: Number(e.target.value),
                      },
                    })
                  }
                />
              </Field>
            ))}
            <div className={s.row}>
              <select
                aria-label="Benchmark property"
                value={prop}
                onChange={(e) => setProp(e.target.value)}
              >
                {properties
                  .filter((p) => p.kind !== "text")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
              </select>
              <input
                aria-label="Benchmark value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{ width: 85 }}
              />
              <Button
                small
                disabled={value === "" || !Number.isFinite(Number(value))}
                onClick={() => {
                  setRecord({
                    ...record,
                    values: { ...record.values, [prop]: Number(value) },
                  });
                  setValue("");
                }}
              >
                Add
              </Button>
            </div>
            <Field label="Source / provenance notes">
              <textarea
                value={record.notes}
                onChange={(e) =>
                  setRecord({ ...record, notes: e.target.value })
                }
              />
            </Field>
            {error && (
              <p role="alert" className={s.error}>
                {error}
              </p>
            )}
          </div>
          <div className={s.modalActions}>
            <Button onClick={() => setModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              {review ? "Confirm reviewed values" : "Save benchmark"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
