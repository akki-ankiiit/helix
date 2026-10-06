import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Copy, Download, LayoutGrid, List, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Empty, Modal, SearchBox, Status, s } from "../../components/ui";
import type { Project } from "../../planner/model";
import { planStatus, validationStatus, type PlanStatus } from "../../planner/calc";
import { categories } from "../../planner/model";
import { categoryIcons } from "./Steps";
import { usePlanner, useAllProjects } from "../../planner/store";
import { downloadReport } from "../../planner/report";
import { useWorkspace } from "../../stores/workspace";
import { SourcesModal } from "./ui";
import c from "./planner.module.css";

type Sort = "id" | "title" | "updated";

export function ProjectList() {
  const all = useAllProjects();
  const navigate = useNavigate();
  const { create, duplicate, remove } = usePlanner();
  const notify = useWorkspace((x) => x.notify);
  const [query, setQuery] = useState(""),
    [type, setType] = useState("All types"),
    [status, setStatus] = useState("All statuses"),
    [owner, setOwner] = useState("All projects"),
    [sort, setSort] = useState<Sort>("id"),
    [view, setView] = useState<"cards" | "table">("cards"),
    [sources, setSources] = useState<Project | null>(null),
    [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .map((p) => ({ p, status: planStatus(p) as PlanStatus, approach: p.approaches.find((a) => a.id === p.selectedApproachId)?.name }))
      .filter(({ p, status: st }) =>
        (!q || `${p.title} ${p.category} ${p.focus} ${p.id}`.toLowerCase().includes(q)) &&
        (type === "All types" || p.category === type) &&
        (status === "All statuses" || st === status) &&
        (owner === "All projects" || (owner === "Reference projects" ? p.reference : !p.reference)),
      )
      .sort((a, b) =>
        sort === "title"
          ? a.p.title.localeCompare(b.p.title)
          : sort === "updated"
            ? b.p.updated.localeCompare(a.p.updated)
            : a.p.id.localeCompare(b.p.id, undefined, { numeric: true }),
      );
  }, [all, query, type, status, owner, sort]);

  function newProject() {
    const id = create();
    navigate(`/projects/${id}/type`);
  }
  function copy(p: Project) {
    const id = duplicate(p.id);
    if (!id) return;
    notify(`Copy ${id} created from ${p.id}. Changes are saved to the copy; ${p.id} stays unchanged.`, { to: `/projects/${id}/type`, label: "Open copy" });
    navigate(`/projects/${id}/type`);
  }
  const filtered = query || type !== "All types" || status !== "All statuses" || owner !== "All projects";

  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <h1>Projects</h1>
          <p>
            Construction-chemical formulation projects — tile cleaners, tile adhesives, epoxy grouts and adhesives, and waterproofing. Each follows seven steps: Type → Data Sources → Describe → Literature → Pathways → Review → Create. Open a reference sample to see a completed development plan, or start your own.
          </p>
        </div>
        <Button variant="primary" onClick={newProject}>
          <Plus size={16} /> New project
        </Button>
      </div>
      <div className={c.toolbar}>
        <SearchBox value={query} onChange={setQuery} placeholder="Search by project, category or focus" />
        <select aria-label="Filter by product category" value={type} onChange={(e) => setType(e.target.value)}>
          {["All types", ...categories].map((x) => <option key={x} value={x}>{x === "All types" ? "All categories" : x}</option>)}
        </select>
        <select aria-label="Filter by plan status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {["All statuses", "Completed", "Ready to create", "In progress", "Plan out of date", "Draft"].map((x) => <option key={x}>{x}</option>)}
        </select>
        <select aria-label="Filter by owner" value={owner} onChange={(e) => setOwner(e.target.value)}>
          {["All projects", "Reference projects", "My projects"].map((x) => <option key={x} value={x}>{x === "Reference projects" ? "Reference samples" : x}</option>)}
        </select>
        <select aria-label="Sort projects" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="id">Sort: ID</option>
          <option value="title">Sort: Name</option>
          <option value="updated">Sort: Last updated</option>
        </select>
        <div className={s.tabs} role="group" aria-label="View">
          <button className={view === "cards" ? s.active : ""} aria-pressed={view === "cards"} aria-label="Card view" onClick={() => setView("cards")}>
            <LayoutGrid size={15} />
          </button>
          <button className={view === "table" ? s.active : ""} aria-pressed={view === "table"} aria-label="Table view" onClick={() => setView("table")}>
            <List size={15} />
          </button>
        </div>
      </div>
      <p className={s.muted} style={{ fontSize: 13, margin: "4px 0 16px" }} aria-live="polite">
        Showing {rows.length} of {all.length} projects.
      </p>
      {!rows.length ? (
        <div className={s.panel}>
          <Empty title={filtered ? "No projects match" : "No projects yet"}>
            <p>{filtered ? "Try another word or clear the filters." : "Create a project to get started."}</p>
            {filtered ? (
              <Button onClick={() => { setQuery(""); setType("All types"); setStatus("All statuses"); setOwner("All projects"); }}>Clear filters</Button>
            ) : (
              <Button variant="primary" onClick={newProject}><Plus size={14} /> New project</Button>
            )}
          </Empty>
        </div>
      ) : view === "cards" ? (
        <ul className={c.cardGrid}>
          {rows.map(({ p, status: st }) => {
            const Icon = p.category ? categoryIcons[p.category] : Plus;
            return (
              <li key={p.id} className={c.projectCard}>
                <div className={c.cardTop}>
                  <span className={c.cardIcon} aria-hidden="true"><Icon size={18} /></span>
                  <Status value={st} />
                </div>
                <span className={c.cardId}>{p.id} · {p.category || "No category yet"}</span>
                <h2>{p.title || "Untitled project"}</h2>
                <p className={c.cardPurpose}>{p.objective ? truncate(p.objective, 150) : "No objective yet."}</p>
                <dl className={c.cardMeta}>
                  <div><dt>Development focus</dt><dd>{p.focus || "—"}</dd></div>
                  <div><dt>Validation</dt><dd>{validationStatus(p)}</dd></div>
                </dl>
                {p.reference && <Badge tone="violet">Reference sample</Badge>}
                {p.createdFrom && <small className={s.muted}>Copy of {p.createdFrom}</small>}
                <Link to={`/projects/${p.id}`} className={`${s.button} ${s.primary} ${c.cardAction}`}>
                  View project <span className={s.srOnly}>{p.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <p className={s.scrollHint}>Scroll sideways to see all columns →</p>
          <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Projects table">
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Product category</th>
                  <th scope="col">Selected approach</th>
                  <th scope="col" className={s.num}>Ingredients</th>
                  <th scope="col">Plan status</th>
                  <th scope="col">Experimental validation</th>
                  <th scope="col">Final report</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ p, status: st, approach }) => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: "normal", minWidth: 180 }}>
                      <Link to={`/projects/${p.id}`} className={c.tableLink}><b>{p.title || "Untitled project"}</b></Link>
                      <small>{p.id}{p.reference ? " · Reference sample" : p.createdFrom ? ` · copy of ${p.createdFrom}` : ""}</small>
                    </td>
                    <td>{p.category || "—"}</td>
                    <td style={{ whiteSpace: "normal", minWidth: 160 }}>{approach || "—"}</td>
                    <td className={s.num}>{p.ingredients.length || "—"}</td>
                    <td><Status value={st} /></td>
                    <td style={{ whiteSpace: "normal", minWidth: 120 }}>{validationStatus(p)}</td>
                    <td>
                      {p.plan ? (
                        <Button small variant="ghost" onClick={() => downloadReport(p)} aria-label={`Download report for ${p.title}`}>
                          <Download size={13} /> Download
                        </Button>
                      ) : (
                        <span className={s.muted}>Not generated</span>
                      )}
                    </td>
                    <td>
                      <div className={c.rowActions}>
                        <Link to={`/projects/${p.id}`} className={`${s.button} ${s.small}`}>View project</Link>
                        <Link to={`/projects/${p.id}/create`} className={`${s.button} ${s.small} ${s.ghost}`}>View results</Link>
                        <Button small variant="ghost" onClick={() => setSources(p)}><BookOpen size={13} /> Sources</Button>
                        <Button small variant="ghost" onClick={() => copy(p)}><Copy size={13} /> {p.reference ? "Use as starting point" : "Duplicate"}</Button>
                        {!p.reference && (
                          <Button small variant="ghost" aria-label={`Delete ${p.title || p.id}`} onClick={() => setConfirmDelete(p)}><Trash2 size={13} /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className={s.muted} style={{ fontSize: 12, marginTop: 18 }}>
        Reference samples are built in and read-only. Your projects and copies are saved in this browser only.
      </p>
      {sources && <SourcesModal p={sources} onClose={() => setSources(null)} />}
      {confirmDelete && (
        <Modal title={`Delete ${confirmDelete.id}?`} onClose={() => setConfirmDelete(null)}>
          <p className={s.muted}>“{confirmDelete.title || "Untitled project"}” will be removed from this browser. This cannot be undone. Reference projects are not affected.</p>
          <div className={s.modalActions}>
            <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { remove(confirmDelete.id); notify(`${confirmDelete.id} deleted.`); setConfirmDelete(null); }}>Delete project</Button>
          </div>
        </Modal>
      )}
    </>
  );
}

const truncate = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);
