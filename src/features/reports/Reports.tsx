import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { Badge, Button, Empty, SearchBox, Status, s } from "../../components/ui";
import { useAllProjects } from "../../planner/store";
import { planStatus, planSummary } from "../../planner/calc";
import { downloadReport, downloadWorkbook, printReport } from "../../planner/report";
import { formatDate } from "../../lib/format";
import { useWorkspace } from "../../stores/workspace";

export function Reports() {
  const all = useAllProjects();
  const notify = useWorkspace((x) => x.notify);
  const [query, setQuery] = useState("");
  const list = all.filter((p) =>
    `${p.id} ${p.title} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <h1>Reports</h1>
          <p>
            Download the final plan for any project with a generated plan. Reports match the project's Create screen.
          </p>
        </div>
      </div>
      <div className={s.stack}>
        <p className={s.muted} style={{ fontSize: 13 }}>
          <b>Report (.html):</b> statuses, formulation and batch tables, mixing and processing plan, test matrix, cost, recommendations, assumptions, gaps and sources; it opens in any browser and can be printed to PDF.{" "}
          <b>Workbook (.xlsx):</b> the same figures on separate sheets.
        </p>
        <SearchBox value={query} onChange={setQuery} placeholder="Search by project or category" />
        {list.map((p) => {
          const st = planStatus(p);
          return (
            <article className={s.panel} key={p.id}>
              <div className={s.between}>
                <div>
                  <h2 style={{ fontSize: 17 }}>
                    <Link to={`/projects/${p.id}/create`}>
                      {p.id} · {p.title || "Untitled project"}
                    </Link>
                  </h2>
                  <p className={s.muted} style={{ fontSize: 13, marginTop: 4 }}>
                    {p.plan ? `${planSummary(p).headline} · plan v${p.plan.version}, ${formatDate(p.plan.generatedAt)}` : "No plan generated yet — finish Review, then generate it in Create."}
                  </p>
                </div>
                <div className={s.row}>
                  <Status value={st} />
                  {p.reference && <Badge tone="violet">Reference sample</Badge>}
                </div>
              </div>
              <div className={`${s.row} ${s.wrap}`} style={{ marginTop: 16 }}>
                {p.plan ? (
                  <>
                    <Button onClick={() => downloadReport(p)}>
                      <Download size={14} /> Download report
                    </Button>
                    <Button variant="ghost" onClick={() => { if (!printReport(p)) notify("Your browser blocked the report window. Allow pop-ups, or use “Download report”."); }}>
                      <Printer size={14} /> Print or save as PDF
                    </Button>
                    <Button variant="ghost" onClick={() => downloadWorkbook(p)}>
                      <FileSpreadsheet size={14} /> Workbook (.xlsx)
                    </Button>
                  </>
                ) : (
                  <Link className={s.button} to={`/projects/${p.id}`}>
                    Continue project
                  </Link>
                )}
              </div>
            </article>
          );
        })}
        {!list.length && (
          <Empty title="No reports match your search">
            <p>Try a different word.</p>
          </Empty>
        )}
      </div>
    </>
  );
}
