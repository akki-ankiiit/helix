import { useState } from "react";
import * as XLSX from "xlsx";
import { Download, Upload, Pencil, Plus, FileText } from "lucide-react";
import type { RawMaterial } from "../../domain/models";
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
const columns = [
  "name",
  "function",
  "grade",
  "supplier",
  "price",
  "currency",
  "stock",
  "min",
  "max",
] as const;
export function RawMaterials() {
  const state = useWorkspace();
  const [query, setQuery] = useState(""),
    [stock, setStock] = useState("All stock"),
    [edit, setEdit] = useState<RawMaterial | null>(null),
    [error, setError] = useState(""),
    [rows, setRows] = useState<Record<string, unknown>[]>([]),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [preview, setPreview] = useState(false),
    [modal, setModal] = useState(false);
  const canEdit = ["Chemist", "Admin"].includes(state.user?.role || "");
  function template() {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet([
        {
          name: "Example filler",
          function: "Mineral filler",
          grade: "Fine",
          supplier: "Demo supplier",
          price: 0.08,
          currency: "USD",
          stock: "Available",
          min: 0,
          max: 30,
        },
      ]),
      "Materials",
    );
    XLSX.writeFile(book, "Helix-material-import-template.xlsx");
  }
  async function readFile(file?: File) {
    if (!file) return;
    try {
      const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        book.Sheets[book.SheetNames[0]],
        { defval: "" },
      );
      if (!data.length)
        throw new Error("The first worksheet has no data rows.");
      if (data.length > 1000)
        throw new Error("Demo import supports up to 1,000 rows.");
      setRows(data);
      setMapping(
        Object.fromEntries(
          columns.map((c) => [
            c,
            Object.keys(data[0]).find((h) => h.toLowerCase() === c) || "",
          ]),
        ),
      );
      setModal(true);
      setPreview(false);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const parsed = rows.map((row, i) => {
    const val = (key: string) => String(row[mapping[key]] ?? "").trim();
    const price = val("price") === "" ? null : Number(val("price"));
    const min = Number(val("min")),
      max = Number(val("max"));
    const errs: string[] = [];
    if (!val("name")) errs.push("Name required");
    if (!val("supplier")) errs.push("Supplier required");
    if (price !== null && (!Number.isFinite(price) || price < 0))
      errs.push("Invalid price");
    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min < 0 ||
      max > 100 ||
      min > max
    )
      errs.push("Invalid min/max");
    if (val("currency") !== "USD") errs.push("Demo pricing supports USD only");
    return {
      row: i + 1,
      errors: errs,
      material: {
        id: uid(),
        name: val("name"),
        function: val("function"),
        grade: val("grade"),
        supplier: val("supplier"),
        price,
        currency: val("currency"),
        stock: val("stock") || "Unknown",
        min,
        max,
        priceDate: new Date().toISOString().slice(0, 10),
        approved: false,
        sds: "Supplier SDS required",
        alternatives: [],
      } as RawMaterial,
    };
  });
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <div className={s.eyebrow} style={{ marginBottom: 10 }}>
            THE BUILDING BLOCKS
          </div>
          <h1>Raw materials</h1>
          <p>
            A shared source of truth for grades, suppliers, prices, and limits.
          </p>
        </div>
        <div className={s.row}>
          <Button onClick={template}>
            <Download size={14} />
            Import template
          </Button>
          <label className={s.button} style={!canEdit ? { opacity: 0.45 } : {}}>
            <Upload size={14} />
            Import .xlsx
            <input
              type="file"
              accept=".xlsx"
              disabled={!canEdit}
              style={{ display: "none" }}
              onChange={(e) => {
                readFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <Button
            variant="primary"
            disabled={!canEdit}
            onClick={() =>
              setEdit({
                id: uid(),
                name: "",
                function: "",
                grade: "",
                supplier: "",
                price: null,
                currency: "USD",
                stock: "Available",
                approved: false,
                min: 0,
                max: 100,
                priceDate: new Date().toISOString().slice(0, 10),
                sds: "Supplier SDS required",
                alternatives: [],
              })
            }
          >
            <Plus size={14} />
            New material
          </Button>
        </div>
      </div>
      <div className={s.stack}>
        <Notice>
          Illustrative master data. Prices are estimates in USD/kg, not live
          supplier quotations. Missing prices produce incomplete costs. Import
          uses the first worksheet of the documented .xlsx template.
        </Notice>
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        <div className={s.between}>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search materials, grades, suppliers…"
          />
          <select
            aria-label="Stock filter"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          >
            {["All stock", "Available", "Limited", "Unknown"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Material / function</th>
                <th>Grade</th>
                <th>Supplier</th>
                <th>Unit price</th>
                <th>Stock</th>
                <th>Approval / limits</th>
                <th>SDS / alternatives</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.materials
                .filter(
                  (m) =>
                    `${m.name} ${m.grade} ${m.supplier}`
                      .toLowerCase()
                      .includes(query.toLowerCase()) &&
                    (stock === "All stock" || m.stock === stock),
                )
                .map((m) => (
                  <tr key={m.id}>
                    <td>
                      <b>{m.name}</b>
                      <small>{m.function}</small>
                    </td>
                    <td>{m.grade}</td>
                    <td>{m.supplier}</td>
                    <td>
                      {m.price === null ? (
                        <Badge tone="amber">Missing price</Badge>
                      ) : (
                        `${m.currency} ${m.price.toFixed(2)}/kg`
                      )}
                      <small>{m.priceDate}</small>
                    </td>
                    <td>
                      <Badge tone={m.stock === "Available" ? "green" : "amber"}>
                        {m.stock}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone={m.approved ? "green" : "amber"}>
                        {m.approved ? "Fixture-approved" : "Review needed"}
                      </Badge>
                      <small>
                        {m.min}–{m.max} wt %
                      </small>
                    </td>
                    <td>
                      <Button
                        small
                        variant="ghost"
                        onClick={() =>
                          state.notify(
                            `${m.sds}. Alternatives: ${m.alternatives.join(", ") || "none configured"}.`,
                          )
                        }
                      >
                        <FileText size={12} />
                        Handling reference
                      </Button>
                    </td>
                    <td>
                      <Button
                        small
                        variant="ghost"
                        disabled={!canEdit}
                        aria-label={`Edit ${m.name}`}
                        onClick={() => {
                          setEdit({ ...m });
                          setError("");
                        }}
                      >
                        <Pencil size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!state.materials.some(
          (m) =>
            `${m.name} ${m.grade} ${m.supplier}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (stock === "All stock" || m.stock === stock),
        ) && (
          <div className={s.empty}>No raw materials match these filters.</div>
        )}
      </div>
      {edit && (
        <Modal title="Material master record" onClose={() => setEdit(null)}>
          <div className={s.formGrid}>
            {(
              [
                "name",
                "function",
                "grade",
                "supplier",
                "stock",
                "priceDate",
              ] as const
            ).map((key) => (
              <Field key={key} label={key[0].toUpperCase() + key.slice(1)}>
                <input
                  value={edit[key]}
                  type={key === "priceDate" ? "date" : "text"}
                  onChange={(e) => setEdit({ ...edit, [key]: e.target.value })}
                />
              </Field>
            ))}
            <Field
              label="Price · USD/kg"
              hint="Leave empty to retain an incomplete-cost state."
            >
              <input
                type="number"
                min="0"
                step="0.01"
                value={edit.price ?? ""}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    price:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Minimum · wt %">
              <input
                type="number"
                value={edit.min}
                onChange={(e) =>
                  setEdit({ ...edit, min: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Maximum · wt %">
              <input
                type="number"
                value={edit.max}
                onChange={(e) =>
                  setEdit({ ...edit, max: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="SDS reference">
              <input
                value={edit.sds}
                onChange={(e) => setEdit({ ...edit, sds: e.target.value })}
              />
            </Field>
            <Field label="Alternative material names · comma-separated">
              <input
                value={edit.alternatives.join(", ")}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    alternatives: e.target.value
                      .split(",")
                      .map((x) => x.trim()),
                  })
                }
              />
            </Field>
          </div>
          {error && <p className={s.error}>{error}</p>}
          <div className={s.modalActions}>
            <Button onClick={() => setEdit(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (
                  !edit.name.trim() ||
                  !edit.supplier.trim() ||
                  edit.min < 0 ||
                  edit.max > 100 ||
                  edit.min > edit.max ||
                  (edit.price !== null && edit.price < 0)
                ) {
                  setError(
                    "Name and supplier are required; valid limits are 0–100%, and price cannot be negative.",
                  );
                  return;
                }
                state.setMaterials(
                  state.materials.some((m) => m.id === edit.id)
                    ? state.materials.map((m) => (m.id === edit.id ? edit : m))
                    : [...state.materials, edit],
                );
                state.projects
                  .filter((p) => p.trials.some((t) => edit.id in t.percentages))
                  .forEach((p) =>
                    state.updateProject(p.id, (x) => ({
                      ...x,
                      needsReview: true,
                    })),
                  );
                setEdit(null);
                state.notify(
                  "Material saved. Dependent cost analysis marked for review.",
                );
              }}
            >
              Save material
            </Button>
          </div>
        </Modal>
      )}
      {modal && (
        <Modal
          title="Map and validate material import"
          onClose={() => setModal(false)}
        >
          <div className={s.stack}>
            <Notice>
              Imported records are unapproved. Map columns, inspect every row,
              then apply. Blank prices remain missing.
            </Notice>
            <div className={s.formGrid}>
              {columns.map((key) => (
                <Field key={key} label={key}>
                  <select
                    value={mapping[key]}
                    onChange={(e) => {
                      setMapping({ ...mapping, [key]: e.target.value });
                      setPreview(false);
                    }}
                  >
                    <option value="">Not mapped</option>
                    {Object.keys(rows[0] || {}).map((h) => (
                      <option key={h}>{h}</option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
            <Button onClick={() => setPreview(true)}>
              Validate & preview {rows.length} rows
            </Button>
            {preview && (
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Material</th>
                      <th>Price USD/kg</th>
                      <th>Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((r) => (
                      <tr key={r.row}>
                        <td>{r.row}</td>
                        <td>{r.material.name}</td>
                        <td>{r.material.price ?? "Missing"}</td>
                        <td>
                          {r.errors.length ? (
                            <span className={s.error}>
                              {r.errors.join("; ")}
                            </span>
                          ) : (
                            <Badge tone="green">Valid</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className={s.modalActions}>
            <Button onClick={() => setModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!preview || parsed.some((r) => r.errors.length)}
              onClick={() => {
                state.setMaterials([
                  ...state.materials,
                  ...parsed.map((r) => r.material),
                ]);
                setModal(false);
                state.notify(
                  `${parsed.length} material records imported for review.`,
                );
              }}
            >
              Import validated rows
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
