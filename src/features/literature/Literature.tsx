import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  ExternalLink,
  Pin,
  Upload,
  X,
} from "lucide-react";
import type { Project, Source } from "../../domain/models";
import { Badge, Button, Modal, Notice, s } from "../../components/ui";
import { useWorkspace, uid } from "../../stores/workspace";
import c from "../projects/Project.module.css";
export function Literature({ project: p }: { project: Project }) {
  const state = useWorkspace(),
    [open, setOpen] = useState<Source | null>(null);
  const job = state.jobs.find(
    (j) => j.projectId === p.id && j.stage === "Literature",
  );
  function patch(id: string, changes: Partial<Source>) {
    state.updateProject(p.id, (x) => ({
      ...x,
      sources: x.sources.map((s) => (s.id === id ? { ...s, ...changes } : s)),
      needsReview: x.trials.length > 0 || x.needsReview,
    }));
  }
  return (
    <div className={s.stack}>
      <Notice>
        Demo research simulation · source documents are illustrative fixtures,
        not real papers or patents. No external search or AI extraction is
        connected.
      </Notice>
      <div className={c.sequence}>
        {[
          "Analyse",
          "Identify",
          "Strategy",
          "Search",
          "Cluster",
          "Extract",
        ].map((v, i) => (
          <span
            className={
              p.sources.length || (job && job.progress >= i * 16)
                ? c.litActive
                : ""
            }
            key={v}
          >
            {p.sources.length ? (
              <Check size={12} />
            ) : (
              <span>{String(i + 1).padStart(2, "0")}</span>
            )}
            {v}
            {i < 5 && <ChevronRight size={11} />}
          </span>
        ))}
      </div>
      {job?.status === "Running" && (
        <>
          <div role="status" className={s.skeleton} />
          <p className={s.muted}>
            Running a deterministic 6-second demo fixture. This job continues if
            you leave the page.
          </p>
          <div className={s.progress}>
            <span style={{ width: `${job.progress}%` }} />
          </div>
        </>
      )}
      {job?.status === "Failed" && (
        <Notice warning>
          {job.error}
          <Button small onClick={() => state.jobAction(job.id, "retry")}>
            Retry simulation
          </Button>
        </Notice>
      )}
      <div className={s.between}>
        <h3>{p.sources.length} sources in your evidence set</h3>
        <div className={s.row}>
          <label className={s.button}>
            <Upload size={14} />
            Add source reference
            <input
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  state.updateProject(p.id, (x) => ({
                    ...x,
                    sources: [
                      ...x.sources,
                      {
                        id: uid(),
                        title: file.name,
                        type: "User-uploaded document",
                        owner: state.user?.name || "Demo user",
                        date: new Date().toISOString().slice(0, 10),
                        summary:
                          "File-name reference only. Document bytes and extraction are not retained by this demo.",
                        excerpt: "No extracted content available.",
                        quality: "Unverified · content not extracted",
                        reference: file.name,
                        pinned: false,
                        excluded: false,
                      },
                    ],
                  }));
              }}
            />
          </label>
          <Button
            variant="primary"
            disabled={job?.status === "Running"}
            onClick={() => state.startJob(p.id, "Literature")}
          >
            <BookOpen size={14} />
            {p.sources.length
              ? "Refresh demo research"
              : "Investigate evidence"}
          </Button>
        </div>
      </div>
      {!p.sources.length && job?.status !== "Running" && (
        <div className={s.empty}>
          <BookOpen size={28} />
          <h3>Build an evidence base for your brief.</h3>
          <p>
            Inputs: brief v{p.revisions.length}, targets, benchmarks, and
            constraints.
            <br />
            Output: a traceable source set and findings for pathway review.
          </p>
        </div>
      )}
      <div className={s.list}>
        {p.sources.map((source) => (
          <article
            className={c.source}
            key={source.id}
            style={source.excluded ? { opacity: 0.55 } : {}}
          >
            <div className={s.between}>
              <div className={s.row}>
                <Badge>{source.type}</Badge>
                <small className={s.muted}>
                  {source.owner} · {source.date}
                </small>
              </div>
              <div className={s.row}>
                <button
                  className={s.textLink}
                  aria-label={`${source.pinned ? "Unpin" : "Pin"} ${source.title}`}
                  onClick={() => patch(source.id, { pinned: !source.pinned })}
                >
                  <Pin
                    size={14}
                    fill={source.pinned ? "currentColor" : "none"}
                  />
                </button>
                <button
                  className={s.textLink}
                  onClick={() =>
                    patch(source.id, { excluded: !source.excluded })
                  }
                >
                  {source.excluded ? "Restore" : "Exclude"}
                </button>
              </div>
            </div>
            <h3 style={{ marginTop: 13 }}>{source.title}</h3>
            <p>{source.summary}</p>
            <div className={s.between}>
              <Badge tone="amber">
                {source.quality.includes("Low")
                  ? "Low confidence"
                  : "Illustrative / unverified"}
              </Badge>
              <Button small variant="ghost" onClick={() => setOpen(source)}>
                Open source
                <ExternalLink size={12} />
              </Button>
            </div>
            {!source.excluded && (
              <details>
                <summary
                  style={{
                    fontSize: 11,
                    cursor: "pointer",
                    color: "var(--accent)",
                    marginTop: 15,
                  }}
                >
                  View finding & supporting excerpt
                </summary>
                <blockquote>“{source.excerpt}”</blockquote>
                <p>
                  <b>Source reports:</b> {source.summary}
                </p>
                <p>
                  <b>Demo inference:</b> Use this source to frame a controlled
                  experiment; it does not establish performance or causality.
                </p>
                <small className={s.muted}>
                  [{source.reference}] · {source.quality}
                </small>
              </details>
            )}
          </article>
        ))}
      </div>
      {p.sources.length > 0 && (
        <Notice warning>
          Missing evidence: no verified papers, patent records, or aged
          durability results are attached. Fixture citations support
          demonstration only.
        </Notice>
      )}
      {open && (
        <Modal title={open.title} onClose={() => setOpen(null)}>
          <div className={s.stack}>
            <Badge tone="amber">{open.type} · illustrative reference</Badge>
            <p>{open.excerpt}</p>
            <p className={s.muted}>{open.quality}</p>
            <small>Document reference: {open.reference}</small>
            <Button onClick={() => setOpen(null)}>
              <X size={14} />
              Close reference
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
