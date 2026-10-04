import { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Button, Notice, SearchBox, s } from "../../components/ui";
import { useWorkspace } from "../../stores/workspace";
import { reports } from "../../services/demo/reports";
export function Reports() {
  const state = useWorkspace(),
    [query, setQuery] = useState("");
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <div className={s.eyebrow} style={{ marginBottom: 10 }}>
            RESEARCH, READY TO SHARE
          </div>
          <h1>Reports & dossiers</h1>
          <p>
            Carry the context with the numbers. Every export includes project
            and revision information.
          </p>
        </div>
        <Badge>Generated from current local records</Badge>
      </div>
      <div className={s.stack}>
        <Notice>
          Excel exports are genuine .xlsx workbooks with separate brief, recipe,
          and results sheets. Dossiers use your browser’s Print / Save as PDF
          flow. All output is labeled as illustrative demo data.
        </Notice>
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search project reports…"
        />
        {state.projects
          .filter((p) =>
            p.brief.name.toLowerCase().includes(query.toLowerCase()),
          )
          .map((p) => (
            <div className={s.panel} key={p.id}>
              <div className={s.between}>
                <div>
                  <h2>{p.brief.name}</h2>
                  <p className={s.muted} style={{ fontSize: 12, marginTop: 8 }}>
                    Brief v{p.revisions.length} · {p.trials.length} recipe
                    revisions · {p.results.length} test records
                  </p>
                </div>
                <Link
                  to={`/projects/${p.id}`}
                  aria-label={`Open ${p.brief.name}`}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </div>
              <div className={`${s.row} ${s.wrap}`} style={{ marginTop: 22 }}>
                <Button onClick={() => reports.workbook(p)}>
                  <FileSpreadsheet size={15} />
                  Trial sheets & results (.xlsx)
                  <Download size={13} />
                </Button>
                <Button onClick={() => reports.print(p)}>
                  <FileText size={15} />
                  Product specification / dossier (PDF)
                </Button>
              </div>
            </div>
          ))}
        {!state.projects.some((p) =>
          p.brief.name.toLowerCase().includes(query.toLowerCase()),
        ) && <div className={s.empty}>No project reports match.</div>}
      </div>
    </>
  );
}
