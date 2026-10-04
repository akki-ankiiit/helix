import { useState } from "react";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Modal,
  Notice,
  SearchBox,
  s,
} from "../../components/ui";
import { taxonomy } from "../../data/taxonomy";
import {
  defaultTargets,
  propertyFor,
  templateFor,
} from "../../data/property-library";
import { useWorkspace } from "../../stores/workspace";
export function Templates() {
  const [query, setQuery] = useState(""),
    [cat, setCat] = useState("All categories"),
    [open, setOpen] = useState("");
  const state = useWorkspace(),
    navigate = useNavigate();
  const families = taxonomy
    .flatMap((c) => c.subcategories.map((sub) => ({ ...sub, category: c })))
    .filter(
      (sub) =>
        sub.name.toLowerCase().includes(query.toLowerCase()) &&
        (cat === "All categories" || sub.category.id === cat),
    );
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <div className={s.eyebrow} style={{ marginBottom: 10 }}>
            A CONSIDERED STARTING POINT
          </div>
          <h1>Formulation templates</h1>
          <p>
            Category-specific property sets, application forms, and draft test
            plans.
          </p>
        </div>
        <Badge tone="amber">33 draft templates · R&D review required</Badge>
      </div>
      <div className={s.stack}>
        <Notice warning>
          No template is scientifically validated. Standard metadata is stored
          separately from project targets. Missing official limits are never
          inferred.
        </Notice>
        <div className={s.between}>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search templates…"
          />
          <select
            aria-label="Template category"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            <option>All categories</option>
            {taxonomy.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className={s.grid3}>
          {families.map((sub) => {
            const template = templateFor(sub.id);
            return (
              <article className={s.panel} key={sub.id}>
                <div className={s.between}>
                  <Layers3 size={19} color="var(--accent)" />
                  <Badge tone="amber">Draft · v{template.version}</Badge>
                </div>
                <h2 style={{ fontSize: 16, marginTop: 22 }}>{sub.name}</h2>
                <p className={s.muted} style={{ fontSize: 11, marginTop: 8 }}>
                  {sub.category.name}
                </p>
                <p className={s.muted} style={{ fontSize: 12, marginTop: 18 }}>
                  {template.propertyIds.length} editable property targets
                  <br />
                  {template.standard?.identifier || "Standard not configured"} ·
                  unverified
                </p>
                <div className={s.row} style={{ marginTop: 22 }}>
                  <Button small onClick={() => setOpen(sub.id)}>
                    View template
                  </Button>
                  <Button
                    small
                    variant="ghost"
                    onClick={() => {
                      state.newDraft();
                      state.setDraft({
                        categoryId: sub.category.id,
                        subcategoryId: sub.id,
                        targets: defaultTargets(sub.id),
                      });
                      navigate("/projects/new/use-case");
                    }}
                  >
                    Use template
                    <ArrowUpRight size={13} />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
        {!families.length && (
          <div className={s.empty}>No templates match your search.</div>
        )}
      </div>
      {open && (
        <Modal
          title={
            taxonomy.flatMap((c) => c.subcategories).find((s) => s.id === open)
              ?.name || "Template"
          }
          onClose={() => setOpen("")}
        >
          <div className={s.stack}>
            <Notice warning>
              Version 1 · Draft · initial configurable template. No reviewed
              version exists.
            </Notice>
            {templateFor(open).propertyIds.map((id) => (
              <div key={id} className={s.listItem}>
                <div>
                  <h3>{propertyFor(id).name}</h3>
                  <p>
                    {propertyFor(id).unit} · {propertyFor(id).method}
                  </p>
                </div>
                <Badge>3 specimens</Badge>
              </div>
            ))}
            <p className={s.muted}>
              Use-case form adapts by family. Test age defaults are explicit in
              the project plan and need R&D confirmation.
            </p>
            <details className={s.details}>
              <summary>Standard metadata & version history</summary>
              <p>
                {templateFor(open).standard
                  ? Object.entries(templateFor(open).standard!)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")
                  : "Identifier, edition, test method, and source: not configured. Verification: R&D confirmation required."}
              </p>
              <p>
                v1 · initial prototype draft. Future reviewed revisions require
                a connected R&D governance process.
              </p>
            </details>
          </div>
        </Modal>
      )}
    </>
  );
}
